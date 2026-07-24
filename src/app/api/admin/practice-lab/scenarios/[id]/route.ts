import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/api-auth";
import { validateRubricWeights } from "@/lib/practice-lab/scoring";
import { createScenarioSnapshot } from "@/lib/practice-lab/scenario-utils";
import type { Prisma } from "@/generated/prisma/client";

const rubricCriterionSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string(),
  weight: z.number().int().min(0).max(100),
  scoringGuidance: z.string(),
  positiveIndicators: z.string(),
  negativeIndicators: z.string(),
  sortOrder: z.number().int().default(0),
});

const criticalErrorSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string(),
  scoreEffect: z.number().int().default(0),
  automaticFailure: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

const updateSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string(),
  category: z.enum([
    "PARENT_CONVERSATIONS",
    "INSTRUCTOR_COACHING",
    "SUPERVISOR_FEEDBACK",
    "COWORKER_COMMUNICATION",
  ]),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  estimatedMinutes: z.number().int().min(1),
  employeeRole: z.string().min(1),
  aiCharacterName: z.string().min(1),
  aiCharacterRole: z.string().min(1),
  aiCharacterDescription: z.string(),
  startingEmotionalState: z.string().default(""),
  conversationStyle: z.string().default(""),
  situationBackground: z.string(),
  openingMessage: z.string(),
  roleplayInstructions: z.string(),
  hiddenCharacterInformation: z.string(),
  escalationInstructions: z.string(),
  deescalationConditions: z.string(),
  successConditions: z.string(),
  prohibitedAssistantBehaviors: z.string(),
  policyContext: z.string().default(""),
  modeAvailability: z.enum(["TEXT_ONLY", "VOICE_ONLY", "TEXT_AND_VOICE"]),
  passingScore: z.number().int().min(0).max(100),
  maximumDurationMinutes: z.number().int().min(1),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  rubricCriteria: z.array(rubricCriterionSchema).min(1),
  criticalErrors: z.array(criticalErrorSchema).default([]),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(["ADMINISTRATOR"]);
  if ("error" in authResult) return authResult.error;

  const { id } = await params;

  const scenario = await prisma.practiceScenario.findUnique({
    where: { id },
    include: {
      rubricCriteria: { orderBy: { sortOrder: "asc" } },
      criticalErrors: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!scenario) {
    return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
  }

  return NextResponse.json({ scenario });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(["ADMINISTRATOR"]);
  if ("error" in authResult) return authResult.error;

  const { id } = await params;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const weightValidation = validateRubricWeights(
    parsed.data.rubricCriteria.map((c) => c.weight)
  );
  if (!weightValidation.valid) {
    return NextResponse.json({ error: weightValidation.error }, { status: 400 });
  }

  const existing = await prisma.practiceScenario.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
  }

  const { rubricCriteria, criticalErrors, ...scenarioData } = parsed.data;

  const scenario = await prisma.$transaction(async (tx) => {
    const currentSnapshot = await tx.practiceScenario.findUnique({
      where: { id },
      include: { rubricCriteria: true, criticalErrors: true },
    });

    if (currentSnapshot) {
      await tx.practiceScenarioVersion.upsert({
        where: {
          scenarioId_version: {
            scenarioId: id,
            version: currentSnapshot.version,
          },
        },
        update: { snapshot: createScenarioSnapshot(currentSnapshot) as unknown as Prisma.InputJsonValue },
        create: {
          scenarioId: id,
          version: currentSnapshot.version,
          snapshot: createScenarioSnapshot(currentSnapshot) as unknown as Prisma.InputJsonValue,
        },
      });
    }

    await tx.practiceRubricCriterion.deleteMany({ where: { scenarioId: id } });
    await tx.practiceCriticalError.deleteMany({ where: { scenarioId: id } });

    return tx.practiceScenario.update({
      where: { id },
      data: {
        ...scenarioData,
        version: { increment: 1 },
        updatedById: authResult.user.id,
        rubricCriteria: { create: rubricCriteria },
        criticalErrors: { create: criticalErrors },
      },
      include: {
        rubricCriteria: true,
        criticalErrors: true,
      },
    });
  });

  await prisma.auditLog.create({
    data: {
      userId: authResult.user.id,
      action: "SCENARIO_UPDATED",
      entityType: "PracticeScenario",
      entityId: id,
      details: { title: scenario.title, version: scenario.version },
    },
  });

  return NextResponse.json({ scenario });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(["ADMINISTRATOR"]);
  if ("error" in authResult) return authResult.error;

  const { id } = await params;

  const scenario = await prisma.practiceScenario.update({
    where: { id },
    data: { status: "ARCHIVED", updatedById: authResult.user.id },
  });

  await prisma.auditLog.create({
    data: {
      userId: authResult.user.id,
      action: "SCENARIO_ARCHIVED",
      entityType: "PracticeScenario",
      entityId: id,
    },
  });

  return NextResponse.json({ scenario });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/api-auth";
import { validateRubricWeights } from "@/lib/practice-lab/scoring";

const rubricCriterionSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  weight: z.number().int().min(0).max(100),
  scoringGuidance: z.string(),
  positiveIndicators: z.string(),
  negativeIndicators: z.string(),
  sortOrder: z.number().int().default(0),
});

const criticalErrorSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  scoreEffect: z.number().int().default(0),
  automaticFailure: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

const scenarioSchema = z.object({
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
  passingScore: z.number().int().min(0).max(100).default(70),
  maximumDurationMinutes: z.number().int().min(1).default(15),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  rubricCriteria: z.array(rubricCriterionSchema).min(1),
  criticalErrors: z.array(criticalErrorSchema).default([]),
});

export async function GET() {
  const authResult = await requireRole(["ADMINISTRATOR"]);
  if ("error" in authResult) return authResult.error;

  const scenarios = await prisma.practiceScenario.findMany({
    include: {
      rubricCriteria: { orderBy: { sortOrder: "asc" } },
      criticalErrors: { orderBy: { sortOrder: "asc" } },
      _count: { select: { attempts: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ scenarios });
}

export async function POST(request: Request) {
  const authResult = await requireRole(["ADMINISTRATOR"]);
  if ("error" in authResult) return authResult.error;

  const body = await request.json();
  const parsed = scenarioSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const weightValidation = validateRubricWeights(
    parsed.data.rubricCriteria.map((c) => c.weight)
  );
  if (!weightValidation.valid) {
    return NextResponse.json({ error: weightValidation.error }, { status: 400 });
  }

  const existing = await prisma.practiceScenario.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (existing) {
    return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
  }

  const { rubricCriteria, criticalErrors, ...scenarioData } = parsed.data;

  const scenario = await prisma.practiceScenario.create({
    data: {
      ...scenarioData,
      createdById: authResult.user.id,
      updatedById: authResult.user.id,
      rubricCriteria: { create: rubricCriteria },
      criticalErrors: { create: criticalErrors },
    },
    include: {
      rubricCriteria: true,
      criticalErrors: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: authResult.user.id,
      action: "SCENARIO_CREATED",
      entityType: "PracticeScenario",
      entityId: scenario.id,
      details: { title: scenario.title },
    },
  });

  return NextResponse.json({ scenario }, { status: 201 });
}

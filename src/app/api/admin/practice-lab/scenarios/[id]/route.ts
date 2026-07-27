import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/api-auth";
import { createScenarioSnapshot } from "@/lib/practice-lab/scenario-utils";
import { scenarioInputSchema } from "@/lib/practice-lab/scenario-input";
import type { Prisma } from "@/generated/prisma/client";

const MANAGER_ROLES = ["ADMINISTRATOR", "SUPERADMIN"] as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole([...MANAGER_ROLES]);
  if ("error" in authResult) return authResult.error;

  const { id } = await params;
  const scenario = await prisma.practiceScenario.findUnique({ where: { id } });
  if (!scenario) {
    return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
  }

  return NextResponse.json({ scenario });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole([...MANAGER_ROLES]);
  if ("error" in authResult) return authResult.error;

  const { id } = await params;
  const parsed = scenarioInputSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const existing = await prisma.practiceScenario.findUnique({
    where: { id },
    include: { rubricCriteria: true, criticalErrors: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
  }

  const duplicateSlug = await prisma.practiceScenario.findFirst({
    where: { slug: parsed.data.slug, id: { not: id } },
  });
  if (duplicateSlug) {
    return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
  }

  const scenario = await prisma.$transaction(async (tx) => {
    await tx.practiceScenarioVersion.upsert({
      where: {
        scenarioId_version: {
          scenarioId: id,
          version: existing.version,
        },
      },
      update: {
        snapshot: createScenarioSnapshot(existing) as unknown as Prisma.InputJsonValue,
      },
      create: {
        scenarioId: id,
        version: existing.version,
        snapshot: createScenarioSnapshot(existing) as unknown as Prisma.InputJsonValue,
      },
    });

    return tx.practiceScenario.update({
      where: { id },
      data: {
        ...parsed.data,
        passingScore: 0,
        version: { increment: 1 },
        updatedById: authResult.user.id,
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
  const authResult = await requireRole(["SUPERADMIN"]);
  if ("error" in authResult) return authResult.error;

  const { id } = await params;
  const existing = await prisma.practiceScenario.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
  }

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
      details: { title: scenario.title, removedFromLibrary: true },
    },
  });

  return NextResponse.json({ scenario });
}

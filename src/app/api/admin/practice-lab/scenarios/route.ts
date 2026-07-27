import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/api-auth";
import { scenarioInputSchema } from "@/lib/practice-lab/scenario-input";

const MANAGER_ROLES = ["ADMINISTRATOR", "SUPERADMIN"] as const;

export async function GET() {
  const authResult = await requireRole([...MANAGER_ROLES]);
  if ("error" in authResult) return authResult.error;

  const scenarios = await prisma.practiceScenario.findMany({
    include: { _count: { select: { attempts: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({
    scenarios,
    canRemove: authResult.user.role === "SUPERADMIN",
  });
}

export async function POST(request: Request) {
  const authResult = await requireRole([...MANAGER_ROLES]);
  if ("error" in authResult) return authResult.error;

  const parsed = scenarioInputSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const existing = await prisma.practiceScenario.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (existing) {
    return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
  }

  const scenario = await prisma.practiceScenario.create({
    data: {
      ...parsed.data,
      passingScore: 0,
      createdById: authResult.user.id,
      updatedById: authResult.user.id,
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

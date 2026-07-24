import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { isPracticeLabEnabled } from "@/lib/practice-lab/config";
import { toPublicScenario } from "@/lib/practice-lab/scenario-utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;

  if (!isPracticeLabEnabled()) {
    return NextResponse.json({ error: "Practice Lab is not enabled" }, { status: 503 });
  }

  const { slug } = await params;

  const scenario = await prisma.practiceScenario.findUnique({
    where: { slug },
    include: {
      rubricCriteria: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!scenario || scenario.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
  }

  const attempts = await prisma.practiceAttempt.findMany({
    where: {
      userId: authResult.user.id,
      scenarioId: scenario.id,
      isPreview: false,
    },
    select: {
      id: true,
      mode: true,
      status: true,
      startedAt: true,
      endedAt: true,
      overallScore: true,
      passed: true,
      durationSeconds: true,
    },
    orderBy: { startedAt: "desc" },
    take: 10,
  });

  const activeAttempt = await prisma.practiceAttempt.findFirst({
    where: {
      userId: authResult.user.id,
      scenarioId: scenario.id,
      status: "IN_PROGRESS",
    },
  });

  return NextResponse.json({
    scenario: toPublicScenario(scenario),
    attempts: attempts.map((a) => ({
      ...a,
      startedAt: a.startedAt.toISOString(),
      endedAt: a.endedAt?.toISOString() ?? null,
    })),
    activeAttemptId: activeAttempt?.id ?? null,
  });
}

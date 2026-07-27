import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { isPracticeLabEnabled } from "@/lib/practice-lab/config";
import { toPublicScenario } from "@/lib/practice-lab/scenario-utils";
import type { ScenarioLibraryItem } from "@/types/practice-lab";

export async function GET() {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;

  if (!isPracticeLabEnabled()) {
    return NextResponse.json({ error: "Practice Lab is not enabled" }, { status: 503 });
  }

  const user = authResult.user;

  const publishedScenarios = await prisma.practiceScenario.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { title: "asc" },
  });

  const assignments = await prisma.practiceAssignment.findMany({
    where: {
      OR: [{ assignedToUserId: user.id }, { teamId: user.teamId ?? undefined }],
    },
    include: { scenario: true },
  });

  const assignmentMap = new Map(assignments.map((a) => [a.scenarioId, a]));

  const attempts = await prisma.practiceAttempt.findMany({
    where: { userId: user.id, isPreview: false, status: "COMPLETED" },
    select: { scenarioId: true },
  });

  const attemptStats = new Map<string, { count: number }>();

  for (const attempt of attempts) {
    const current = attemptStats.get(attempt.scenarioId) ?? {
      count: 0,
    };
    current.count += 1;
    attemptStats.set(attempt.scenarioId, current);
  }

  const items: ScenarioLibraryItem[] = publishedScenarios.map((scenario) => {
    const assignment = assignmentMap.get(scenario.id);
    const stats = attemptStats.get(scenario.id);
    const publicScenario = toPublicScenario(scenario);

    return {
      ...publicScenario,
      isAssigned: !!assignment,
      isRequired: assignment?.required ?? false,
      dueDate: assignment?.dueDate?.toISOString() ?? null,
      attemptCount: stats?.count ?? 0,
      completed: (stats?.count ?? 0) > 0,
      assignmentId: assignment?.id ?? null,
    };
  });

  const assigned = items.filter((i) => i.isAssigned);
  const optional = items.filter((i) => !i.isAssigned);

  return NextResponse.json({ assigned, optional });
}

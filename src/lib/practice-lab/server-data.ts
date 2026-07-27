import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPracticeLabEnabled } from "@/lib/practice-lab/config";
import { toPublicScenario } from "@/lib/practice-lab/scenario-utils";
import type { ScenarioLibraryItem } from "@/types/practice-lab";

export async function getScenarioLibrary(userId: string, teamId: string | null) {
  if (!isPracticeLabEnabled()) {
    return { assigned: [], optional: [] };
  }

  const publishedScenarios = await prisma.practiceScenario.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { title: "asc" },
  });

  const assignments = await prisma.practiceAssignment.findMany({
    where: {
      OR: [{ assignedToUserId: userId }, ...(teamId ? [{ teamId }] : [])],
    },
  });

  const assignmentMap = new Map(assignments.map((a) => [a.scenarioId, a]));

  const attempts = await prisma.practiceAttempt.findMany({
    where: { userId, isPreview: false, status: "COMPLETED" },
    select: { scenarioId: true },
    orderBy: { startedAt: "desc" },
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

  return {
    assigned: items.filter((i) => i.isAssigned),
    optional: items.filter((i) => !i.isAssigned),
  };
}

export async function getScenarioDetail(slug: string, userId: string) {
  const scenario = await prisma.practiceScenario.findUnique({
    where: { slug },
  });

  if (!scenario || scenario.status !== "PUBLISHED") return null;

  const attempts = await prisma.practiceAttempt.findMany({
    where: { userId, scenarioId: scenario.id, isPreview: false },
    select: {
      id: true,
      mode: true,
      status: true,
      startedAt: true,
      endedAt: true,
      durationSeconds: true,
    },
    orderBy: { startedAt: "desc" },
    take: 10,
  });

  const activeAttempt = await prisma.practiceAttempt.findFirst({
    where: { userId, scenarioId: scenario.id, status: "IN_PROGRESS" },
  });

  const assignment = await prisma.practiceAssignment.findFirst({
    where: { scenarioId: scenario.id, assignedToUserId: userId },
  });

  return {
    scenario: toPublicScenario(scenario),
    attempts,
    activeAttemptId: activeAttempt?.id ?? null,
    assignmentId: assignment?.id ?? null,
  };
}

export async function requireSessionUser() {
  const session = await auth();
  if (!session?.user) return null;
  return session.user;
}

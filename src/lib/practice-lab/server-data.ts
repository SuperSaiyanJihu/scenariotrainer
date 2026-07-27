import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPracticeLabEnabled } from "@/lib/practice-lab/config";
import { toPublicScenario } from "@/lib/practice-lab/scenario-utils";
import type { ScenarioLibraryItem } from "@/types/practice-lab";
import type { UserRole } from "@/generated/prisma/client";

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

/**
 * "What should I do next?" summary for an individual employee's dashboard.
 */
export async function getEmployeeDashboardStats(userId: string, teamId: string | null) {
  const { assigned } = await getScenarioLibrary(userId, teamId);
  const requiredIncomplete = assigned
    .filter((s) => s.isRequired && !s.completed)
    .sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  const now = new Date();
  const overdueCount = requiredIncomplete.filter((s) => s.dueDate && new Date(s.dueDate) < now).length;

  return {
    hasAnyAssignments: assigned.length > 0,
    requiredIncomplete,
    overdueCount,
    nextScenario: requiredIncomplete[0] ?? null,
  };
}

/**
 * "What needs my attention?" summary for supervisor/admin dashboards.
 * Reuses getScenarioLibrary per team member so completion logic never
 * diverges from what the employee themselves sees.
 */
export async function getManagerDashboardStats(role: UserRole, userId: string) {
  const teamMembers =
    role === "SUPERVISOR"
      ? await prisma.user.findMany({
          where: { supervisorId: userId, isActive: true },
          select: { id: true, name: true, teamId: true },
        })
      : await prisma.user.findMany({
          where: { isActive: true, role: { in: ["EMPLOYEE", "SUPERVISOR"] } },
          select: { id: true, name: true, teamId: true },
        });

  const membersNeedingAttention: { id: string; name: string; incompleteCount: number }[] = [];
  let totalIncomplete = 0;

  for (const member of teamMembers) {
    const { assigned } = await getScenarioLibrary(member.id, member.teamId);
    const incomplete = assigned.filter((s) => s.isRequired && !s.completed).length;
    if (incomplete > 0) {
      totalIncomplete += incomplete;
      membersNeedingAttention.push({ id: member.id, name: member.name, incompleteCount: incomplete });
    }
  }

  const recentCompletions = teamMembers.length
    ? await prisma.practiceAttempt.count({
        where: {
          userId: { in: teamMembers.map((m) => m.id) },
          status: "COMPLETED",
          isPreview: false,
          endedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      })
    : 0;

  return {
    teamSize: teamMembers.length,
    membersNeedingAttention: membersNeedingAttention
      .sort((a, b) => b.incompleteCount - a.incompleteCount)
      .slice(0, 5),
    totalIncomplete,
    recentCompletions,
  };
}

/** Publish-queue visibility for admins: how much of the library is live vs. still in draft. */
export async function getAdminLibraryStats() {
  const [published, draft] = await Promise.all([
    prisma.practiceScenario.count({ where: { status: "PUBLISHED" } }),
    prisma.practiceScenario.count({ where: { status: "DRAFT" } }),
  ]);
  return { published, draft };
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/api-auth";
import { getSupervisedUserIds } from "@/lib/practice-lab/authorization";

export async function GET() {
  const authResult = await requireRole(["SUPERVISOR", "ADMINISTRATOR", "SUPERADMIN"]);
  if ("error" in authResult) return authResult.error;

  const user = authResult.user;
  let userIds: string[] | undefined;

  if (user.role === "SUPERVISOR") {
    userIds = await getSupervisedUserIds(user.id);
  }

  const attempts = await prisma.practiceAttempt.findMany({
    where: {
      isPreview: false,
      status: "COMPLETED",
      ...(userIds ? { userId: { in: userIds } } : {}),
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      scenario: { select: { id: true, title: true, slug: true } },
    },
    orderBy: { endedAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    attempts: attempts.map((a) => ({
      id: a.id,
      user: a.user,
      scenario: a.scenario,
      mode: a.mode,
      startedAt: a.startedAt.toISOString(),
      endedAt: a.endedAt?.toISOString() ?? null,
      durationSeconds: a.durationSeconds,
    })),
  });
}

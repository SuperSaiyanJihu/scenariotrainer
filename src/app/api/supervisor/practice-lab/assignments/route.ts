import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/api-auth";
import { getSupervisedUserIds } from "@/lib/practice-lab/authorization";

const assignmentSchema = z.object({
  scenarioId: z.string().min(1),
  assignedToUserId: z.string().optional(),
  teamId: z.string().optional(),
  required: z.boolean().default(true),
  dueDate: z.string().datetime().optional(),
  maximumAttempts: z.number().int().min(1).optional(),
});

export async function GET() {
  const authResult = await requireRole(["SUPERVISOR", "ADMINISTRATOR", "SUPERADMIN"]);
  if ("error" in authResult) return authResult.error;

  const user = authResult.user;
  let userFilter: string[] | undefined;

  if (user.role === "SUPERVISOR") {
    userFilter = await getSupervisedUserIds(user.id);
  }

  const assignments = await prisma.practiceAssignment.findMany({
    where:
      user.role === "ADMINISTRATOR" || user.role === "SUPERADMIN"
        ? {}
        : {
            OR: [
              { assignedToUserId: { in: userFilter ?? [] } },
              { assignedById: user.id },
              ...(user.teamId ? [{ teamId: user.teamId }] : []),
            ],
          },
    include: {
      scenario: { select: { id: true, title: true, slug: true, status: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      team: { select: { id: true, name: true } },
      assignedBy: { select: { id: true, name: true } },
      _count: { select: { attempts: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ assignments });
}

export async function POST(request: Request) {
  const authResult = await requireRole(["SUPERVISOR", "ADMINISTRATOR", "SUPERADMIN"]);
  if ("error" in authResult) return authResult.error;

  const body = await request.json();
  const parsed = assignmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  if (!parsed.data.assignedToUserId && !parsed.data.teamId) {
    return NextResponse.json(
      { error: "Assign to a user or a team" },
      { status: 400 }
    );
  }

  const scenario = await prisma.practiceScenario.findUnique({
    where: { id: parsed.data.scenarioId },
  });
  if (!scenario || scenario.status === "ARCHIVED") {
    return NextResponse.json({ error: "Scenario not available" }, { status: 400 });
  }

  if (authResult.user.role === "SUPERVISOR" && parsed.data.assignedToUserId) {
    const supervised = await getSupervisedUserIds(authResult.user.id);
    if (!supervised.includes(parsed.data.assignedToUserId)) {
      return NextResponse.json(
        { error: "You can only assign scenarios to your team members" },
        { status: 403 }
      );
    }
  }

  const assignment = await prisma.practiceAssignment.create({
    data: {
      scenarioId: parsed.data.scenarioId,
      assignedToUserId: parsed.data.assignedToUserId,
      teamId: parsed.data.teamId,
      required: parsed.data.required,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      maximumAttempts: parsed.data.maximumAttempts,
      assignedById: authResult.user.id,
    },
    include: {
      scenario: { select: { id: true, title: true, slug: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: authResult.user.id,
      action: "ASSIGNMENT_CREATED",
      entityType: "PracticeAssignment",
      entityId: assignment.id,
      details: {
        scenarioId: assignment.scenarioId,
        assignedToUserId: assignment.assignedToUserId,
        teamId: assignment.teamId,
      },
    },
  });

  return NextResponse.json({ assignment }, { status: 201 });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { isPracticeLabEnabled, isVoiceEnabled, practiceLabConfig } from "@/lib/practice-lab/config";
import { createScenarioSnapshot } from "@/lib/practice-lab/scenario-utils";
import { logPracticeEvent } from "@/lib/practice-lab/logger";
import type { Prisma } from "@/generated/prisma/client";

const startSchema = z.object({
  scenarioId: z.string(),
  mode: z.enum(["TEXT", "VOICE"]),
  assignmentId: z.string().optional(),
  isPreview: z.boolean().optional(),
});

export async function POST(request: Request) {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;

  if (!isPracticeLabEnabled()) {
    return NextResponse.json({ error: "Practice Lab is not enabled" }, { status: 503 });
  }

  const body = await request.json();
  const parsed = startSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { scenarioId, mode, assignmentId, isPreview } = parsed.data;

  if (mode === "VOICE" && !isVoiceEnabled()) {
    return NextResponse.json({ error: "Voice mode is not enabled" }, { status: 403 });
  }

  const user = authResult.user;

  if (isPreview && user.role !== "ADMINISTRATOR") {
    return NextResponse.json({ error: "Only administrators can preview scenarios" }, { status: 403 });
  }

  const scenario = await prisma.practiceScenario.findUnique({
    where: { id: scenarioId },
    include: {
      rubricCriteria: { orderBy: { sortOrder: "asc" } },
      criticalErrors: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!scenario) {
    return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
  }

  if (!isPreview && scenario.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Scenario is not available" }, { status: 403 });
  }

  if (
    mode === "TEXT" &&
    scenario.modeAvailability === "VOICE_ONLY"
  ) {
    return NextResponse.json({ error: "Text mode not available for this scenario" }, { status: 400 });
  }

  if (
    mode === "VOICE" &&
    scenario.modeAvailability === "TEXT_ONLY"
  ) {
    return NextResponse.json({ error: "Voice mode not available for this scenario" }, { status: 400 });
  }

  const existingActive = await prisma.practiceAttempt.findFirst({
    where: {
      userId: user.id,
      scenarioId,
      status: "IN_PROGRESS",
    },
  });

  if (existingActive) {
    return NextResponse.json({ attemptId: existingActive.id, existing: true });
  }

  if (!isPreview && assignmentId) {
    const assignment = await prisma.practiceAssignment.findFirst({
      where: { id: assignmentId, scenarioId },
    });

    if (assignment?.maximumAttempts) {
      const attemptCount = await prisma.practiceAttempt.count({
        where: {
          userId: user.id,
          assignmentId,
          isPreview: false,
          status: { in: ["COMPLETED", "FAILED"] },
        },
      });
      if (attemptCount >= assignment.maximumAttempts) {
        return NextResponse.json({ error: "Maximum attempts reached" }, { status: 403 });
      }
    }
  }

  const snapshot = createScenarioSnapshot(scenario);

  const attempt = await prisma.$transaction(async (tx) => {
    const newAttempt = await tx.practiceAttempt.create({
      data: {
        scenarioId,
        scenarioVersion: scenario.version,
        scenarioSnapshot: snapshot as unknown as Prisma.InputJsonValue,
        userId: user.id,
        assignmentId: isPreview ? null : assignmentId,
        mode,
        status: "IN_PROGRESS",
        isPreview: isPreview ?? false,
      },
    });

    await tx.practiceMessage.create({
      data: {
        attemptId: newAttempt.id,
        speaker: "CHARACTER",
        content: scenario.openingMessage,
        sequence: 1,
      },
    });

    return newAttempt;
  });

  logPracticeEvent("attempt_created", {
    attemptId: attempt.id,
    scenarioId,
    userId: user.id,
    mode,
    isPreview: isPreview ?? false,
  });

  return NextResponse.json({
    attemptId: attempt.id,
    openingMessage: scenario.openingMessage,
    characterName: scenario.aiCharacterName,
    characterRole: scenario.aiCharacterRole,
    scenarioTitle: scenario.title,
    maxDurationMinutes: scenario.maximumDurationMinutes,
    maxTurns: practiceLabConfig.maxTextTurns,
    isPreview: isPreview ?? false,
  });
}

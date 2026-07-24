import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { practiceLabConfig } from "@/lib/practice-lab/config";
import { generateCharacterResponse } from "@/lib/practice-lab/roleplay";
import { canAccessAttempt, getNextSequence } from "@/lib/practice-lab/authorization";
import { parseScenarioSnapshot } from "@/lib/practice-lab/scenario-utils";

const messageSchema = z.object({
  content: z.string().min(1).max(practiceLabConfig.maxInputLength),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;

  const { id } = await params;
  const body = await request.json();
  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  const attempt = await prisma.practiceAttempt.findUnique({
    where: { id },
    include: { messages: { orderBy: { sequence: "asc" } } },
  });

  if (!attempt) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }

  if (attempt.userId !== authResult.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (attempt.status !== "IN_PROGRESS" || attempt.mode !== "TEXT") {
    return NextResponse.json({ error: "Attempt is not active for text" }, { status: 400 });
  }

  const employeeTurns = attempt.messages.filter((m) => m.speaker === "EMPLOYEE").length;
  if (employeeTurns >= practiceLabConfig.maxTextTurns) {
    return NextResponse.json({ error: "Maximum turns reached" }, { status: 400 });
  }

  const elapsedMinutes =
    (Date.now() - attempt.startedAt.getTime()) / 60000;
  const snapshot = parseScenarioSnapshot(attempt.scenarioSnapshot);
  if (elapsedMinutes >= snapshot.maximumDurationMinutes) {
    return NextResponse.json({ error: "Maximum duration reached" }, { status: 400 });
  }

  const nextSeq = getNextSequence(attempt.messages.map((m) => m.sequence));

  await prisma.practiceMessage.create({
    data: {
      attemptId: id,
      speaker: "EMPLOYEE",
      content: parsed.data.content,
      sequence: nextSeq,
    },
  });

  const updatedMessages = await prisma.practiceMessage.findMany({
    where: { attemptId: id },
    orderBy: { sequence: "asc" },
  });

  const history = updatedMessages.map((m) => ({
    speaker: m.speaker,
    content: m.content,
  }));

  const response = await generateCharacterResponse(snapshot, history, id);

  if (!response.success) {
    return NextResponse.json({ error: response.error }, { status: 502 });
  }

  const characterSeq = nextSeq + 1;
  const characterMessage = await prisma.practiceMessage.create({
    data: {
      attemptId: id,
      speaker: "CHARACTER",
      content: response.content,
      sequence: characterSeq,
    },
  });

  await prisma.practiceAttempt.update({
    where: { id },
    data: { roleplayModel: response.model },
  });

  return NextResponse.json({
    message: {
      id: characterMessage.id,
      speaker: "CHARACTER",
      content: characterMessage.content,
      sequence: characterMessage.sequence,
    },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;

  const { id } = await params;

  const attempt = await prisma.practiceAttempt.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { sequence: "asc" } },
      evaluation: { include: { criterionScores: true } },
      reflections: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!attempt) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }

  const canAccess = await canAccessAttempt(authResult.user, attempt.userId);
  if (!canAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const snapshot = parseScenarioSnapshot(attempt.scenarioSnapshot);

  return NextResponse.json({
    attempt: {
      id: attempt.id,
      mode: attempt.mode,
      status: attempt.status,
      startedAt: attempt.startedAt.toISOString(),
      endedAt: attempt.endedAt?.toISOString() ?? null,
      overallScore: attempt.overallScore,
      passed: attempt.passed,
      durationSeconds: attempt.durationSeconds,
      isPreview: attempt.isPreview,
      reflectionCompletedAt: attempt.reflectionCompletedAt?.toISOString() ?? null,
      evaluationRetryCount: attempt.evaluationRetryCount,
    },
    scenario: {
      title: snapshot.title,
      characterName: snapshot.aiCharacterName,
      characterRole: snapshot.aiCharacterRole,
      passingScore: snapshot.passingScore,
      maximumDurationMinutes: snapshot.maximumDurationMinutes,
    },
    messages: attempt.messages.map((m) => ({
      id: m.id,
      speaker: m.speaker,
      content: m.content,
      sequence: m.sequence,
      createdAt: m.createdAt.toISOString(),
    })),
    evaluation: attempt.evaluation,
    reflections: attempt.reflections,
  });
}

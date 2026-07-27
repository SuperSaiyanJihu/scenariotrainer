import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { generateCoachingFeedback } from "@/lib/practice-lab/evaluation";
import { parseScenarioSnapshot } from "@/lib/practice-lab/scenario-utils";
import type { Prisma } from "@/generated/prisma/client";

const reflectionSchema = z.object({
  reflections: z
    .array(
      z.object({
        id: z.string(),
        response: z.string().trim().min(1).max(2000),
      })
    )
    .length(3),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;

  const { id } = await params;
  const parsed = reflectionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please answer all three reflection questions." },
      { status: 400 }
    );
  }

  const attempt = await prisma.practiceAttempt.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { sequence: "asc" } },
      evaluation: true,
      reflections: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!attempt || attempt.userId !== authResult.user.id) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }
  if (attempt.status !== "COMPLETED" || !attempt.evaluation) {
    return NextResponse.json(
      { error: "The conversation must be completed first." },
      { status: 400 }
    );
  }

  const responsesById = new Map(
    parsed.data.reflections.map((reflection) => [reflection.id, reflection.response])
  );
  if (
    attempt.reflections.length !== 3 ||
    attempt.reflections.some((reflection) => !responsesById.has(reflection.id))
  ) {
    return NextResponse.json({ error: "Invalid reflection data." }, { status: 400 });
  }

  const coachingResult = await generateCoachingFeedback(
    parseScenarioSnapshot(attempt.scenarioSnapshot),
    attempt.messages.map((message) => ({
      sequence: message.sequence,
      speaker: message.speaker,
      content: message.content,
    })),
    attempt.reflections.map((reflection) => ({
      question: reflection.question,
      response: responsesById.get(reflection.id)!,
    })),
    id
  );

  if (!coachingResult.success) {
    return NextResponse.json(
      { error: coachingResult.error },
      { status: coachingResult.error.includes("not configured") ? 503 : 502 }
    );
  }

  const { coaching, model } = coachingResult;
  await prisma.$transaction(async (tx) => {
    for (const reflection of attempt.reflections) {
      await tx.practiceReflection.update({
        where: { id: reflection.id },
        data: {
          employeeResponse: responsesById.get(reflection.id)!,
          aiFollowUp: null,
        },
      });
    }

    await tx.practiceEvaluation.update({
      where: { id: attempt.evaluation!.id },
      data: {
        overallSummary: coaching.coachResponse,
        strengths: coaching.whatWentWell as Prisma.InputJsonValue,
        opportunities: coaching.whatCouldImprove as Prisma.InputJsonValue,
        suggestedLanguage: coaching.suggestions as unknown as Prisma.InputJsonValue,
        criticalErrors: [],
        evidence: [],
        nextPracticeFocus: coaching.nextPracticeFocus,
      },
    });

    await tx.practiceAttempt.update({
      where: { id },
      data: {
        reflectionCompletedAt: new Date(),
        evaluationModel: model,
      },
    });
  });

  return NextResponse.json({ success: true });
}

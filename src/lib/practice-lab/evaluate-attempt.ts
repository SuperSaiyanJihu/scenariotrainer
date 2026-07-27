import { prisma } from "@/lib/db";
import { practiceLabConfig } from "@/lib/practice-lab/config";
import { logPracticeEvent } from "@/lib/practice-lab/logger";

const REFLECTION_PROMPTS = [
  {
    question: "What do you think went well in that conversation?",
    purpose: "Notice the choices you want to keep using.",
  },
  {
    question: "What did not go as well as you wanted?",
    purpose: "Identify a moment that felt difficult or less effective.",
  },
  {
    question: "What would you change or do better next time?",
    purpose: "Turn the practice into a concrete next step.",
  },
] as const;

export async function prepareAttemptReflection(
  attemptId: string,
  userId: string
): Promise<{ success: true } | { success: false; error: string; status: number }> {
  const attempt = await prisma.practiceAttempt.findUnique({
    where: { id: attemptId },
    include: {
      messages: { orderBy: { sequence: "asc" } },
      evaluation: true,
    },
  });

  if (!attempt || attempt.userId !== userId) {
    return { success: false, error: "Attempt not found", status: 404 };
  }

  if (attempt.status === "COMPLETED" && attempt.evaluation) {
    return { success: true };
  }

  if (!attempt.messages.some((message) => message.speaker === "EMPLOYEE")) {
    return { success: false, error: "Cannot complete an empty conversation", status: 400 };
  }

  const endedAt = attempt.endedAt ?? new Date();
  const durationSeconds = Math.round(
    (endedAt.getTime() - attempt.startedAt.getTime()) / 1000
  );

  await prisma.$transaction(async (tx) => {
    if (attempt.evaluation) {
      await tx.practiceCriterionScore.deleteMany({
        where: { evaluationId: attempt.evaluation.id },
      });
      await tx.practiceEvaluation.delete({ where: { id: attempt.evaluation.id } });
    }

    await tx.practiceReflection.deleteMany({ where: { attemptId } });

    await tx.practiceEvaluation.create({
      data: {
        attemptId,
        overallSummary:
          "Take a moment to reflect on the conversation. Your AI coach will respond after you answer the three questions below.",
        strengths: [],
        opportunities: [],
        suggestedLanguage: [],
        criticalErrors: [],
        evidence: [],
        nextPracticeFocus: "",
      },
    });

    await tx.practiceReflection.createMany({
      data: REFLECTION_PROMPTS.map((prompt, index) => ({
        attemptId,
        question: prompt.question,
        purpose: prompt.purpose,
        sortOrder: index,
      })),
    });

    await tx.practiceAttempt.update({
      where: { id: attemptId },
      data: {
        status: "COMPLETED",
        endedAt,
        durationSeconds,
        overallScore: null,
        passed: null,
        evaluationModel: null,
        evaluatorVersion: practiceLabConfig.coachVersion,
      },
    });
  });

  logPracticeEvent("attempt_completed", { attemptId });
  return { success: true };
}

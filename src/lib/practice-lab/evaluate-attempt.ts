import { prisma } from "@/lib/db";
import { runEvaluation } from "@/lib/practice-lab/evaluation";
import { practiceLabConfig } from "@/lib/practice-lab/config";
import { logPracticeEvent } from "@/lib/practice-lab/logger";
import { parseScenarioSnapshot } from "@/lib/practice-lab/scenario-utils";
import type { Prisma } from "@/generated/prisma/client";

export async function performAttemptEvaluation(
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

  if (attempt.evaluationRetryCount >= practiceLabConfig.evaluationRetryLimit) {
    return { success: false, error: "Evaluation retry limit reached", status: 429 };
  }

  const employeeMessages = attempt.messages.filter((m) => m.speaker === "EMPLOYEE");
  if (employeeMessages.length === 0) {
    return { success: false, error: "Cannot evaluate an empty conversation", status: 400 };
  }

  await prisma.practiceAttempt.update({
    where: { id: attemptId },
    data: { status: "EVALUATING" },
  });

  const snapshot = parseScenarioSnapshot(attempt.scenarioSnapshot);
  const transcript = attempt.messages.map((m) => ({
    sequence: m.sequence,
    speaker: m.speaker,
    content: m.content,
  }));

  const result = await runEvaluation(snapshot, transcript, attemptId);

  if (!result.success) {
    await prisma.practiceAttempt.update({
      where: { id: attemptId },
      data: {
        status: "FAILED",
        evaluationRetryCount: { increment: 1 },
      },
    });
    return { success: false, error: result.error, status: 502 };
  }

  const { evaluation, model } = result;
  const endedAt = attempt.endedAt ?? new Date();
  const durationSeconds = Math.round((endedAt.getTime() - attempt.startedAt.getTime()) / 1000);

  await prisma.$transaction(async (tx) => {
    if (attempt.evaluation) {
      await tx.practiceCriterionScore.deleteMany({
        where: { evaluationId: attempt.evaluation!.id },
      });
      await tx.practiceEvaluation.delete({ where: { id: attempt.evaluation!.id } });
    }

    await tx.practiceReflection.deleteMany({ where: { attemptId } });

    await tx.practiceEvaluation.create({
      data: {
        attemptId,
        overallSummary: evaluation.overallSummary,
        strengths: evaluation.strengths as unknown as Prisma.InputJsonValue,
        opportunities: evaluation.opportunities as unknown as Prisma.InputJsonValue,
        suggestedLanguage: evaluation.suggestedLanguage as unknown as Prisma.InputJsonValue,
        criticalErrors: evaluation.criticalErrors as unknown as Prisma.InputJsonValue,
        evidence: evaluation.criterionScores.flatMap((c) => c.evidence) as unknown as Prisma.InputJsonValue,
        nextPracticeFocus: evaluation.nextPracticeFocus,
        criterionScores: {
          create: evaluation.criterionScores.map((cs) => {
            const criterion = snapshot.rubricCriteria.find((c) => c.id === cs.criterionId);
            const weight = criterion?.weight ?? 0;
            const weightedScore = (cs.score * weight) / 100;
            return {
              rubricCriterionId: cs.criterionId,
              criterionNameSnapshot: cs.criterionName,
              weightSnapshot: weight,
              rawScore: cs.score,
              weightedScore,
              feedback: cs.feedback,
              evidence: cs.evidence as unknown as Prisma.InputJsonValue,
            };
          }),
        },
      },
    });

    await tx.practiceReflection.createMany({
      data: evaluation.reflectionQuestions.map((rq, i) => ({
        attemptId,
        question: rq.question,
        purpose: rq.purpose,
        sortOrder: i,
      })),
    });

    await tx.practiceAttempt.update({
      where: { id: attemptId },
      data: {
        status: "COMPLETED",
        endedAt,
        durationSeconds,
        overallScore: evaluation.overallScore,
        passed: evaluation.passed,
        evaluationModel: model,
        evaluatorVersion: practiceLabConfig.evaluatorVersion,
      },
    });
  });

  logPracticeEvent("attempt_completed", {
    attemptId,
    overallScore: evaluation.overallScore,
    passed: evaluation.passed,
  });

  return { success: true };
}

import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/practice-lab/server-data";
import { canAccessAttempt } from "@/lib/practice-lab/authorization";
import { FeedbackView } from "@/components/practice-lab/feedback-view";
import { parseScenarioSnapshot } from "@/lib/practice-lab/scenario-utils";

export default async function FeedbackPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireSessionUser();
  if (!user) redirect("/login");

  const { id } = await params;

  const attempt = await prisma.practiceAttempt.findUnique({
    where: { id },
    include: {
      evaluation: { include: { criterionScores: true } },
      reflections: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!attempt) notFound();

  const canAccess = await canAccessAttempt(user, attempt.userId);
  if (!canAccess) notFound();

  const snapshot = parseScenarioSnapshot(attempt.scenarioSnapshot);

  if (!attempt.evaluation && attempt.status !== "FAILED") {
    redirect(`/practice-lab/attempts/${id}`);
  }

  if (!attempt.evaluation) {
    return (
      <FeedbackView
        attemptId={id}
        scenarioSlug={snapshot.slug}
        scenarioTitle={snapshot.title}
        overallScore={0}
        passed={false}
        passingScore={snapshot.passingScore}
        overallSummary=""
        strengths={[]}
        opportunities={[]}
        suggestedLanguage={[]}
        criticalErrors={[]}
        nextPracticeFocus=""
        criterionScores={[]}
        reflections={[]}
        reflectionCompleted={false}
        status="FAILED"
      />
    );
  }

  const evaluation = attempt.evaluation;

  return (
    <FeedbackView
      attemptId={id}
      scenarioSlug={snapshot.slug}
      scenarioTitle={snapshot.title}
      overallScore={attempt.overallScore ?? 0}
      passed={attempt.passed ?? false}
      passingScore={snapshot.passingScore}
      overallSummary={evaluation.overallSummary}
      strengths={evaluation.strengths as Array<{ title: string; explanation: string }>}
      opportunities={evaluation.opportunities as Array<{ title: string; explanation: string; betterApproach: string }>}
      suggestedLanguage={evaluation.suggestedLanguage as Array<{ situation: string; suggestion: string }>}
      criticalErrors={evaluation.criticalErrors as Array<{ criticalErrorId: string; detected: boolean; explanation: string }>}
      nextPracticeFocus={evaluation.nextPracticeFocus}
      criterionScores={evaluation.criterionScores}
      reflections={attempt.reflections}
      reflectionCompleted={!!attempt.reflectionCompletedAt}
      status={attempt.status}
    />
  );
}

import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/practice-lab/server-data";
import { canAccessAttempt } from "@/lib/practice-lab/authorization";
import { FeedbackView } from "@/components/practice-lab/feedback-view";
import { parseScenarioSnapshot } from "@/lib/practice-lab/scenario-utils";

interface CoachingSuggestion {
  title: string;
  suggestion: string;
  implementation: string;
}

export default async function FeedbackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireSessionUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const attempt = await prisma.practiceAttempt.findUnique({
    where: { id },
    include: {
      evaluation: true,
      reflections: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!attempt) notFound();
  if (!(await canAccessAttempt(user, attempt.userId))) notFound();
  if (!attempt.evaluation) redirect(`/practice-lab/attempts/${id}`);

  const snapshot = parseScenarioSnapshot(attempt.scenarioSnapshot);
  const evaluation = attempt.evaluation;

  return (
    <FeedbackView
      attemptId={id}
      scenarioSlug={snapshot.slug}
      scenarioTitle={snapshot.title}
      coachResponse={evaluation.overallSummary}
      whatWentWell={evaluation.strengths as string[]}
      whatCouldImprove={evaluation.opportunities as string[]}
      suggestions={evaluation.suggestedLanguage as unknown as CoachingSuggestion[]}
      nextPracticeFocus={evaluation.nextPracticeFocus}
      reflections={attempt.reflections}
      reflectionCompleted={!!attempt.reflectionCompletedAt}
    />
  );
}

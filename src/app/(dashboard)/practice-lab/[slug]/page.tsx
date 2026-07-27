import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ChevronLeft, Clock, MessageSquareText, Mic, ShieldCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCategory, formatDuration, getInitials } from "@/lib/utils";
import { categoryIcon, difficultyMeta } from "@/lib/practice-lab/ui-meta";
import { getScenarioDetail, requireSessionUser } from "@/lib/practice-lab/server-data";
import { ScenarioStartButtons } from "@/components/practice-lab/scenario-start-buttons";

export const dynamic = "force-dynamic";

export default async function ScenarioDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await requireSessionUser();
  if (!user) redirect("/login");

  const { slug } = await params;
  const data = await getScenarioDetail(slug, user.id);
  if (!data) notFound();

  const { scenario, attempts, activeAttemptId, assignmentId } = data;
  const CategoryIcon = categoryIcon[scenario.category];
  const difficulty = difficultyMeta[scenario.difficulty];

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-up">
      <div>
        <Link
          href="/practice-lab"
          className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-brand-600"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Practice Lab
        </Link>
        <div className="mt-3 flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <CategoryIcon className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-900">
              {scenario.title}
            </h1>
            <p className="mt-1 text-zinc-500">{scenario.description}</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scenario Overview</CardTitle>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-xs text-zinc-500">
            <Badge variant="secondary">{formatCategory(scenario.category)}</Badge>
            <span className="inline-flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${difficulty.dotClassName}`} />
              {difficulty.label}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatDuration(scenario.estimatedMinutes)}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Your Role</h3>
            <p className="mt-1 text-zinc-700">{scenario.employeeRole}</p>
          </div>
          <div className="flex items-start gap-3 rounded-xl bg-zinc-50 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
              {getInitials(scenario.aiCharacterName)}
            </span>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">You will speak with</h3>
              <p className="mt-1 font-medium text-zinc-900">
                {scenario.aiCharacterName} · {scenario.aiCharacterRole}
              </p>
              <p className="mt-1 text-sm text-zinc-600">{scenario.aiCharacterDescription}</p>
            </div>
          </div>
          <div className="flex items-start gap-2 text-sm text-zinc-500">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            This is a practice conversation. There are no grades or pass/fail results.
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">Start Practicing</h2>
        <ScenarioStartButtons
          scenarioId={scenario.id}
          assignmentId={assignmentId}
          modeAvailability={scenario.modeAvailability}
          activeAttemptId={activeAttemptId}
        />
      </div>

      {attempts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Previous Attempts</CardTitle>
            <CardDescription>Your practice history for this scenario</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {attempts.map((attempt) => {
                const ModeIcon = attempt.mode === "VOICE" ? Mic : MessageSquareText;
                return (
                  <div
                    key={attempt.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500">
                        <ModeIcon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-zinc-900">
                          {attempt.startedAt.toLocaleDateString()}
                        </p>
                        <p className="text-xs text-zinc-500">{attempt.status.replace(/_/g, " ").toLowerCase()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {attempt.status === "COMPLETED" && (
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/practice-lab/attempts/${attempt.id}/feedback`}>
                            Review Feedback
                          </Link>
                        </Button>
                      )}
                      {attempt.status === "IN_PROGRESS" && (
                        <Button asChild size="sm">
                          <Link href={`/practice-lab/attempts/${attempt.id}`}>Resume</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCategory, formatDifficulty, formatDuration, formatScore } from "@/lib/utils";
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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/practice-lab" className="text-sm text-sky-600 hover:underline">
          ← Back to Practice Lab
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{scenario.title}</h1>
        <p className="mt-2 text-slate-600">{scenario.description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scenario Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{formatCategory(scenario.category)}</Badge>
            <Badge variant="secondary">{formatDifficulty(scenario.difficulty)}</Badge>
            <Badge variant="secondary">{formatDuration(scenario.estimatedMinutes)}</Badge>
            <Badge variant="secondary">Pass: {scenario.passingScore}%</Badge>
          </div>
          <div>
            <h3 className="font-medium">Your Role</h3>
            <p className="text-slate-600">{scenario.employeeRole}</p>
          </div>
          <div>
            <h3 className="font-medium">You will speak with</h3>
            <p className="text-slate-600">
              {scenario.aiCharacterName} — {scenario.aiCharacterRole}
            </p>
            <p className="mt-1 text-sm text-slate-500">{scenario.aiCharacterDescription}</p>
          </div>
          <div>
            <h3 className="font-medium">Skills Evaluated</h3>
            <ul className="mt-1 list-inside list-disc text-sm text-slate-600">
              {scenario.rubricCriteria.map((c) => (
                <li key={c.id}>{c.name} ({c.weight}%)</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <ScenarioStartButtons
        scenarioId={scenario.id}
        assignmentId={assignmentId}
        modeAvailability={scenario.modeAvailability}
        activeAttemptId={activeAttemptId}
      />

      {attempts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Previous Attempts</CardTitle>
            <CardDescription>Your practice history for this scenario</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {attempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between rounded-md border border-slate-200 p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {attempt.startedAt.toLocaleDateString()} — {attempt.mode}
                    </p>
                    <p className="text-xs text-slate-500">{attempt.status}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {attempt.overallScore != null && (
                      <span className="text-sm font-semibold">{formatScore(attempt.overallScore)}</span>
                    )}
                    {attempt.status === "COMPLETED" && (
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/practice-lab/attempts/${attempt.id}/feedback`}>Review Feedback</Link>
                      </Button>
                    )}
                    {attempt.status === "IN_PROGRESS" && (
                      <Button asChild size="sm">
                        <Link href={`/practice-lab/attempts/${attempt.id}`}>Resume</Link>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

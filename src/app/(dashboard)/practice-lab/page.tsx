import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCategory, formatDifficulty, formatDuration } from "@/lib/utils";
import { getScenarioLibrary, requireSessionUser } from "@/lib/practice-lab/server-data";
import type { ScenarioLibraryItem } from "@/types/practice-lab";

export const dynamic = "force-dynamic";

function ScenarioCard({ scenario }: { scenario: ScenarioLibraryItem }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-lg">{scenario.title}</CardTitle>
            <CardDescription className="mt-1">{scenario.description}</CardDescription>
          </div>
          {scenario.completed && <Badge variant="success">Practiced</Badge>}
          {scenario.isRequired && !scenario.completed && <Badge variant="warning">Required</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2 text-sm text-slate-600">
          <Badge variant="secondary">{formatCategory(scenario.category)}</Badge>
          <Badge variant="secondary">{formatDifficulty(scenario.difficulty)}</Badge>
          <span>{formatDuration(scenario.estimatedMinutes)}</span>
        </div>
        <div className="text-center text-sm">
          <div>
            <p className="font-semibold">{scenario.attemptCount}</p>
            <p className="text-slate-500">Completed practices</p>
          </div>
        </div>
        <Button asChild className="w-full">
          <Link href={`/practice-lab/${scenario.slug}`}>View Scenario</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default async function PracticeLabPage() {
  const user = await requireSessionUser();
  if (!user) redirect("/login");

  const { assigned, optional } = await getScenarioLibrary(user.id, user.teamId);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Practice Lab</h1>
        <p className="text-slate-700">
          Rehearse realistic workplace conversations, reflect, and receive conversational coaching.
        </p>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Assigned Scenarios</h2>
        {assigned.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-slate-600">
              No assigned scenarios right now. Check optional scenarios below.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {assigned.map((s) => (
              <ScenarioCard key={s.id} scenario={s} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Optional Scenarios</h2>
        {optional.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-slate-600">
              No optional scenarios available.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {optional.map((s) => (
              <ScenarioCard key={s.id} scenario={s} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock, Star, ArrowRight, Inbox } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCategory, formatDuration } from "@/lib/utils";
import { categoryIcon, difficultyMeta } from "@/lib/practice-lab/ui-meta";
import { getScenarioLibrary, requireSessionUser } from "@/lib/practice-lab/server-data";
import type { ScenarioLibraryItem } from "@/types/practice-lab";

export const dynamic = "force-dynamic";

function ScenarioCard({ scenario }: { scenario: ScenarioLibraryItem }) {
  const Icon = categoryIcon[scenario.category];
  const difficulty = difficultyMeta[scenario.difficulty];

  return (
    <Card className="group flex flex-col transition-all hover:-translate-y-0.5 hover:shadow-card-hover">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Icon className="h-5 w-5" />
          </span>
          <div className="flex flex-wrap justify-end gap-1.5">
            {scenario.completed && (
              <Badge variant="success">
                <CheckCircle2 className="h-3 w-3" /> Practiced
              </Badge>
            )}
            {scenario.isRequired && !scenario.completed && (
              <Badge variant="warning">
                <Star className="h-3 w-3" /> Required
              </Badge>
            )}
          </div>
        </div>
        <CardTitle className="mt-1">{scenario.title}</CardTitle>
        <CardDescription className="line-clamp-2">{scenario.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-500">
          <span className="inline-flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${difficulty.dotClassName}`} />
            {difficulty.label}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {formatDuration(scenario.estimatedMinutes)}
          </span>
          <Badge variant="secondary">{formatCategory(scenario.category)}</Badge>
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-zinc-100 pt-4">
          <p className="text-xs text-zinc-500">
            <span className="font-semibold text-zinc-900">{scenario.attemptCount}</span> completed
          </p>
          <Button asChild size="sm">
            <Link href={`/practice-lab/${scenario.slug}`}>
              View <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="border-dashed bg-transparent shadow-none">
      <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
          <Inbox className="h-5 w-5" />
        </span>
        <p className="text-sm text-zinc-500">{message}</p>
      </CardContent>
    </Card>
  );
}

export default async function PracticeLabPage() {
  const user = await requireSessionUser();
  if (!user) redirect("/login");

  const { assigned, optional } = await getScenarioLibrary(user.id, user.teamId);

  return (
    <div className="space-y-10 animate-fade-up">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-900">Practice Lab</h1>
        <p className="mt-1 text-zinc-500">
          Rehearse realistic workplace conversations, reflect, and receive conversational coaching.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Assigned Scenarios</h2>
        {assigned.length === 0 ? (
          <EmptyState message="No assigned scenarios right now. Check optional scenarios below." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {assigned.map((s) => (
              <ScenarioCard key={s.id} scenario={s} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Optional Scenarios</h2>
        {optional.length === 0 ? (
          <EmptyState message="No optional scenarios available." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {optional.map((s) => (
              <ScenarioCard key={s.id} scenario={s} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

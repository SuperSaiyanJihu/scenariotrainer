"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Target,
  RotateCcw,
  Loader2,
  Quote,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Reflection {
  id: string;
  question: string;
  purpose: string;
  employeeResponse: string | null;
}

interface CoachingSuggestion {
  title: string;
  suggestion: string;
  implementation: string;
}

interface FeedbackViewProps {
  attemptId: string;
  scenarioSlug: string;
  scenarioTitle: string;
  coachResponse: string;
  whatWentWell: string[];
  whatCouldImprove: string[];
  suggestions: CoachingSuggestion[];
  nextPracticeFocus: string;
  reflections: Reflection[];
  reflectionCompleted: boolean;
}

export function FeedbackView(props: FeedbackViewProps) {
  const router = useRouter();
  const [responses, setResponses] = useState<Record<string, string>>(
    Object.fromEntries(
      props.reflections.map((reflection) => [
        reflection.id,
        reflection.employeeResponse ?? "",
      ])
    )
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submitReflections() {
    setSubmitting(true);
    setError("");

    const reflections = props.reflections.map((reflection) => ({
      id: reflection.id,
      response: responses[reflection.id]?.trim() ?? "",
    }));

    const response = await fetch(
      `/api/practice-lab/attempts/${props.attemptId}/reflection`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reflections }),
      }
    );
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Your AI coach could not respond. Please try again.");
      setSubmitting(false);
      return;
    }

    router.refresh();
    setSubmitting(false);
  }

  const allAnswered = props.reflections.every(
    (reflection) => responses[reflection.id]?.trim()
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-up">
      <div>
        <Link
          href="/practice-lab"
          className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-brand-600"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Practice Lab
        </Link>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-zinc-900">
          {props.scenarioTitle}
        </h1>
        <p className="mt-1 text-zinc-500">Conversation debrief</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Let&apos;s reflect first</CardTitle>
          <CardDescription>
            There are no grades or scores. Think through the conversation in your own
            words, then your AI coach will offer three practical suggestions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {props.reflections.map((reflection, index) => (
            <div key={reflection.id} className="space-y-2">
              <Label className="text-zinc-900">
                {index + 1}. {reflection.question}
              </Label>
              <p className="text-xs text-zinc-500">{reflection.purpose}</p>
              <Textarea
                value={responses[reflection.id] ?? ""}
                onChange={(event) =>
                  setResponses({
                    ...responses,
                    [reflection.id]: event.target.value,
                  })
                }
                disabled={props.reflectionCompleted}
                rows={3}
              />
            </div>
          ))}

          {!props.reflectionCompleted && (
            <>
              {error && <p className="text-sm text-rose-600">{error}</p>}
              <Button onClick={submitReflections} disabled={submitting || !allAnswered}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Talking with your coach...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Get My Coaching Suggestions
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {props.reflectionCompleted && (
        <>
          <Card className="border-brand-100 bg-gradient-to-br from-brand-50 to-white">
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
                  <Sparkles className="h-4 w-4" />
                </span>
                <CardTitle>Your coach&apos;s response</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap leading-relaxed text-zinc-700">{props.coachResponse}</p>
            </CardContent>
          </Card>

          {(props.whatWentWell.length > 0 || props.whatCouldImprove.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>What to carry forward</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-3">
                  <h3 className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" /> What went well
                  </h3>
                  <ul className="space-y-2.5">
                    {props.whatWentWell.map((item) => (
                      <li key={item} className="flex gap-2 text-sm leading-relaxed text-zinc-700">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-3">
                  <h3 className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700">
                    <TrendingUp className="h-4 w-4" /> What could go better
                  </h3>
                  <ul className="space-y-2.5">
                    {props.whatCouldImprove.map((item) => (
                      <li key={item} className="flex gap-2 text-sm leading-relaxed text-zinc-700">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Three suggestions for next time</CardTitle>
              <CardDescription>Simple ideas you can put into practice</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {props.suggestions.map((suggestion, index) => (
                <div key={`${suggestion.title}-${index}`} className="rounded-xl bg-zinc-50 p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-zinc-900">{suggestion.title}</p>
                      <p className="mt-1 text-sm text-zinc-600">{suggestion.suggestion}</p>
                      <div className="mt-2.5 flex items-start gap-2 rounded-lg bg-white px-3 py-2 text-sm text-brand-700 shadow-soft">
                        <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        {suggestion.implementation}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {props.nextPracticeFocus && (
            <Card className="border-none bg-zinc-900 text-white shadow-glow">
              <CardHeader>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                    <Target className="h-4 w-4" />
                  </span>
                  <CardTitle className="text-white">Your next practice focus</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-white/80">{props.nextPracticeFocus}</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <div className="flex gap-3">
        <Button asChild>
          <Link href={`/practice-lab/${props.scenarioSlug}`}>
            <RotateCcw className="h-4 w-4" /> Practice Again
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/practice-lab">Return to Practice Lab</Link>
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/practice-lab" className="text-sm text-slate-600 hover:underline">
          Back to Practice Lab
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{props.scenarioTitle}</h1>
        <p className="text-slate-700">Conversation debrief</p>
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
          {props.reflections.map((reflection) => (
            <div key={reflection.id} className="space-y-2">
              <Label>{reflection.question}</Label>
              <p className="text-xs text-slate-600">{reflection.purpose}</p>
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
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button
                onClick={submitReflections}
                disabled={submitting || !allAnswered}
              >
                {submitting ? "Talking with your coach..." : "Get My Coaching Suggestions"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {props.reflectionCompleted && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Your coach&apos;s response</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-slate-700">{props.coachResponse}</p>
            </CardContent>
          </Card>

          {(props.whatWentWell.length > 0 || props.whatCouldImprove.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>What to carry forward</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5 sm:grid-cols-2">
                <div>
                  <h3 className="font-medium text-emerald-700">What went well</h3>
                  <ul className="mt-2 space-y-2 text-sm text-slate-700">
                    {props.whatWentWell.map((item) => (
                      <li key={item}>- {item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-amber-700">What could go better</h3>
                  <ul className="mt-2 space-y-2 text-sm text-slate-700">
                    {props.whatCouldImprove.map((item) => (
                      <li key={item}>- {item}</li>
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
            <CardContent className="space-y-4">
              {props.suggestions.map((suggestion, index) => (
                <div key={`${suggestion.title}-${index}`} className="rounded-lg bg-slate-50 p-4">
                  <p className="font-medium">
                    {index + 1}. {suggestion.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-700">{suggestion.suggestion}</p>
                  <p className="mt-2 text-sm text-sky-700">
                    Try it: {suggestion.implementation}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {props.nextPracticeFocus && (
            <Card>
              <CardHeader>
                <CardTitle>Your next practice focus</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700">{props.nextPracticeFocus}</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <div className="flex gap-3">
        <Button asChild>
          <Link href={`/practice-lab/${props.scenarioSlug}`}>Practice Again</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/practice-lab">Return to Practice Lab</Link>
        </Button>
      </div>
    </div>
  );
}

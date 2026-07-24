"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatScore } from "@/lib/utils";

interface CriterionScore {
  criterionNameSnapshot: string;
  weightSnapshot: number;
  rawScore: number;
  feedback: string;
  evidence: unknown;
}

interface Reflection {
  id: string;
  question: string;
  purpose: string;
  employeeResponse: string | null;
  aiFollowUp: string | null;
}

interface FeedbackViewProps {
  attemptId: string;
  scenarioSlug: string;
  scenarioTitle: string;
  overallScore: number;
  passed: boolean;
  passingScore: number;
  overallSummary: string;
  strengths: Array<{ title: string; explanation: string }>;
  opportunities: Array<{ title: string; explanation: string; betterApproach: string }>;
  suggestedLanguage: Array<{ situation: string; suggestion: string }>;
  criticalErrors: Array<{ criticalErrorId: string; detected: boolean; explanation: string }>;
  nextPracticeFocus: string;
  criterionScores: CriterionScore[];
  reflections: Reflection[];
  reflectionCompleted: boolean;
  status: string;
}

export function FeedbackView(props: FeedbackViewProps) {
  const router = useRouter();
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [submitted, setSubmitted] = useState(props.reflectionCompleted);

  async function submitReflections() {
    setSubmitting(true);
    const reflections = props.reflections
      .filter((r) => responses[r.id]?.trim())
      .map((r) => ({ id: r.id, response: responses[r.id] }));

    await fetch(`/api/practice-lab/attempts/${props.attemptId}/reflection`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reflections }),
    });

    setSubmitted(true);
    setSubmitting(false);
  }

  async function retryEvaluation() {
    setRetrying(true);
    const res = await fetch(`/api/practice-lab/attempts/${props.attemptId}/retry-evaluation`, {
      method: "POST",
    });
    if (res.ok) {
      router.refresh();
    }
    setRetrying(false);
  }

  if (props.status === "FAILED") {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-slate-600">Evaluation could not be completed.</p>
          <Button onClick={retryEvaluation} disabled={retrying} className="mt-4">
            {retrying ? "Retrying..." : "Retry Evaluation"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const detectedErrors = props.criticalErrors.filter((e) => e.detected);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/practice-lab" className="text-sm text-sky-600 hover:underline">
          ← Back to Practice Lab
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{props.scenarioTitle}</h1>
        <p className="text-slate-600">Your practice feedback</p>
      </div>

      <Card>
        <CardContent className="flex items-center justify-between py-6">
          <div>
            <p className="text-4xl font-bold">{formatScore(props.overallScore)}</p>
            <p className="text-slate-500">Overall Score (pass: {props.passingScore}%)</p>
          </div>
          <Badge variant={props.passed ? "success" : "warning"} className="text-base px-4 py-1">
            {props.passed ? "Passed" : "Needs More Practice"}
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-700">{props.overallSummary}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rubric Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {props.criterionScores.map((cs) => (
            <div key={cs.criterionNameSnapshot} className="border-b border-slate-100 pb-3 last:border-0">
              <div className="flex justify-between">
                <span className="font-medium">{cs.criterionNameSnapshot}</span>
                <span className="text-sm text-slate-500">{cs.weightSnapshot}% · {cs.rawScore}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{cs.feedback}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {props.strengths.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>What You Did Well</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {props.strengths.map((s, i) => (
              <div key={i}>
                <p className="font-medium">{s.title}</p>
                <p className="text-sm text-slate-600">{s.explanation}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {props.opportunities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Opportunities to Improve</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {props.opportunities.map((o, i) => (
              <div key={i}>
                <p className="font-medium">{o.title}</p>
                <p className="text-sm text-slate-600">{o.explanation}</p>
                <p className="mt-1 text-sm text-sky-700">Try: {o.betterApproach}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {detectedErrors.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">Critical Errors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {detectedErrors.map((e, i) => (
              <p key={i} className="text-sm text-red-600">{e.explanation}</p>
            ))}
          </CardContent>
        </Card>
      )}

      {props.suggestedLanguage.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Suggested Language</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {props.suggestedLanguage.map((s, i) => (
              <div key={i}>
                <p className="text-sm font-medium text-slate-500">{s.situation}</p>
                <p className="text-slate-700">&ldquo;{s.suggestion}&rdquo;</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Next Practice Focus</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-700">{props.nextPracticeFocus}</p>
        </CardContent>
      </Card>

      {props.reflections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Reflection</CardTitle>
            <CardDescription>Take a moment to reflect on your practice</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {props.reflections.map((r) => (
              <div key={r.id} className="space-y-2">
                <Label>{r.question}</Label>
                {submitted && r.employeeResponse ? (
                  <div>
                    <p className="text-sm text-slate-700">{r.employeeResponse}</p>
                    {r.aiFollowUp && (
                      <p className="mt-2 text-sm text-sky-700">{r.aiFollowUp}</p>
                    )}
                  </div>
                ) : (
                  <Textarea
                    value={responses[r.id] ?? ""}
                    onChange={(e) => setResponses({ ...responses, [r.id]: e.target.value })}
                    disabled={submitted}
                    rows={3}
                  />
                )}
              </div>
            ))}
            {!submitted && (
              <Button onClick={submitReflections} disabled={submitting}>
                {submitting ? "Saving..." : "Save Reflections"}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button asChild>
          <Link href={`/practice-lab/${props.scenarioSlug}`}>Try Again</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/practice-lab">Return to Practice Lab</Link>
        </Button>
      </div>
    </div>
  );
}

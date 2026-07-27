"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquareText, Mic, Loader2, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ScenarioStartButtonsProps {
  scenarioId: string;
  assignmentId: string | null;
  modeAvailability: string;
  activeAttemptId: string | null;
}

export function ScenarioStartButtons({
  scenarioId,
  assignmentId,
  modeAvailability,
  activeAttemptId,
}: ScenarioStartButtonsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"TEXT" | "VOICE" | null>(null);
  const [error, setError] = useState("");

  const textAvailable = modeAvailability !== "VOICE_ONLY";
  const voiceAvailable = modeAvailability !== "TEXT_ONLY";

  async function startPractice(mode: "TEXT" | "VOICE") {
    if (activeAttemptId) {
      router.push(`/practice-lab/attempts/${activeAttemptId}`);
      return;
    }

    setLoading(mode);
    setError("");

    try {
      const res = await fetch("/api/practice-lab/attempts/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioId,
          mode,
          assignmentId: assignmentId ?? undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to start practice");
        return;
      }

      router.push(`/practice-lab/attempts/${data.attemptId}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  if (activeAttemptId) {
    return (
      <Button
        onClick={() => router.push(`/practice-lab/attempts/${activeAttemptId}`)}
        className="w-full"
        size="lg"
      >
        <PlayCircle className="h-4 w-4" /> Resume Practice
      </Button>
    );
  }

  const modes = [
    {
      key: "TEXT" as const,
      icon: MessageSquareText,
      title: "Text practice",
      description: "Type your responses at your own pace.",
      available: textAvailable,
    },
    {
      key: "VOICE" as const,
      icon: Mic,
      title: "Voice practice",
      description: "Speak live with an AI voice character.",
      available: voiceAvailable,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {modes
          .filter((mode) => mode.available)
          .map((mode) => (
            <button
              key={mode.key}
              type="button"
              onClick={() => startPractice(mode.key)}
              disabled={loading !== null}
              className={cn(
                "flex flex-col items-start gap-2 rounded-xl border border-zinc-200 bg-white p-4 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card disabled:pointer-events-none disabled:opacity-50"
              )}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                {loading === mode.key ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <mode.icon className="h-4 w-4" />
                )}
              </span>
              <span className="font-display text-sm font-semibold text-zinc-900">
                {loading === mode.key ? "Starting..." : mode.title}
              </span>
              <span className="text-xs text-zinc-500">{mode.description}</span>
            </button>
          ))}
      </div>
      {error && <p className="text-sm text-rose-600" role="alert">{error}</p>}
    </div>
  );
}

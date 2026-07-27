"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

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
      <Button onClick={() => router.push(`/practice-lab/attempts/${activeAttemptId}`)} className="w-full">
        Resume Practice
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      {textAvailable && (
        <Button
          onClick={() => startPractice("TEXT")}
          disabled={loading !== null}
          className="w-full"
          size="lg"
        >
          {loading === "TEXT" ? "Starting..." : "Start Practice (Text)"}
        </Button>
      )}
      {voiceAvailable && (
        <Button
          onClick={() => startPractice("VOICE")}
          disabled={loading !== null}
          variant="outline"
          className="w-full"
          size="lg"
        >
          {loading === "VOICE" ? "Starting..." : "Start Practice (Voice)"}
        </Button>
      )}
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
    </div>
  );
}

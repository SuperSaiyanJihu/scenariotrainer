"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatScore } from "@/lib/utils";

interface AttemptResult {
  id: string;
  user: { name: string; email: string };
  scenario: { title: string };
  mode: string;
  overallScore: number | null;
  passed: boolean | null;
  startedAt: string;
  durationSeconds: number | null;
}

export default function SupervisorPracticeLabPage() {
  const [attempts, setAttempts] = useState<AttemptResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/supervisor/practice-lab/attempts")
      .then((r) => r.json())
      .then((data) => {
        setAttempts(data.attempts ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Team Practice Results</h1>
        <p className="text-slate-600">Review completion status and scores for your team</p>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading results...</p>
      ) : attempts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-slate-500">
            No completed practice attempts from your team yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {attempts.map((a) => (
            <Card key={a.id}>
              <CardHeader className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{a.user.name}</CardTitle>
                    <p className="text-sm text-slate-500">{a.scenario.title} · {a.mode}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{formatScore(a.overallScore)}</span>
                    {a.passed != null && (
                      <Badge variant={a.passed ? "success" : "warning"}>
                        {a.passed ? "Passed" : "Needs Practice"}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

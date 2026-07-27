"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface AttemptResult {
  id: string;
  user: { name: string; email: string };
  scenario: { title: string };
  mode: string;
  startedAt: string;
  durationSeconds: number | null;
}

interface TeamUser {
  id: string;
  name: string;
  email: string;
}

interface ScenarioOption {
  id: string;
  title: string;
  status: string;
}

interface Assignment {
  id: string;
  required: boolean;
  dueDate: string | null;
  scenario: { title: string };
  assignedTo: { name: string; email: string } | null;
}

export default function SupervisorPracticeLabPage() {
  const [attempts, setAttempts] = useState<AttemptResult[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [scenarios, setScenarios] = useState<ScenarioOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState("");
  const [assignSuccess, setAssignSuccess] = useState("");
  const [form, setForm] = useState({
    scenarioId: "",
    assignedToUserId: "",
    required: true,
    dueDate: "",
  });

  async function loadData() {
    const [attemptsRes, assignmentsRes, teamRes, scenariosRes] = await Promise.all([
      fetch("/api/supervisor/practice-lab/attempts"),
      fetch("/api/supervisor/practice-lab/assignments"),
      fetch("/api/supervisor/practice-lab/team"),
      fetch("/api/practice-lab/scenarios"),
    ]);

    const attemptsData = await attemptsRes.json();
    const assignmentsData = await assignmentsRes.json();
    const teamData = await teamRes.json();
    const scenariosData = await scenariosRes.json();

    setAttempts(attemptsData.attempts ?? []);
    setAssignments(assignmentsData.assignments ?? []);
    setUsers(teamData.users ?? []);

    const published = [
      ...(scenariosData.assigned ?? []),
      ...(scenariosData.optional ?? []),
    ].map((s: ScenarioOption & { id: string; title: string }) => ({
      id: s.id,
      title: s.title,
      status: "PUBLISHED",
    }));
    setScenarios(published);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function createAssignment(e: React.FormEvent) {
    e.preventDefault();
    setAssigning(true);
    setAssignError("");
    setAssignSuccess("");

    const res = await fetch("/api/supervisor/practice-lab/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scenarioId: form.scenarioId,
        assignedToUserId: form.assignedToUserId,
        required: form.required,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
      }),
    });

    const data = await res.json();
    setAssigning(false);

    if (!res.ok) {
      setAssignError(data.error ?? "Failed to assign scenario");
      return;
    }

    setAssignSuccess("Scenario assigned successfully");
    setForm({ scenarioId: "", assignedToUserId: "", required: true, dueDate: "" });
    await loadData();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Team Practice Activity</h1>
        <p className="text-slate-600">Review completion status and assign practice scenarios</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assign Scenario</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createAssignment} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="scenario">Scenario</Label>
              <select
                id="scenario"
                className="flex h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
                value={form.scenarioId}
                onChange={(e) => setForm({ ...form, scenarioId: e.target.value })}
                required
              >
                <option value="">Select scenario</option>
                {scenarios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee">Team Member</Label>
              <select
                id="employee"
                className="flex h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
                value={form.assignedToUserId}
                onChange={(e) => setForm({ ...form, assignedToUserId: e.target.value })}
                required
              >
                <option value="">Select team member</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date (optional)</Label>
              <input
                id="dueDate"
                type="date"
                className="flex h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.required}
                  onChange={(e) => setForm({ ...form, required: e.target.checked })}
                />
                Required assignment
              </label>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={assigning}>
                {assigning ? "Assigning..." : "Assign Scenario"}
              </Button>
              {assignError && <p className="mt-2 text-sm text-red-600">{assignError}</p>}
              {assignSuccess && <p className="mt-2 text-sm text-emerald-600">{assignSuccess}</p>}
            </div>
          </form>
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Current Assignments</h2>
        {loading ? (
          <p className="text-slate-500">Loading...</p>
        ) : assignments.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-slate-500">
              No assignments yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {assignments.map((a) => (
              <Card key={a.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium">{a.scenario.title}</p>
                    <p className="text-sm text-slate-500">
                      {a.assignedTo?.name ?? "Team"} · {a.required ? "Required" : "Optional"}
                      {a.dueDate ? ` · Due ${new Date(a.dueDate).toLocaleDateString()}` : ""}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Completed Attempts</h2>
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
                      <p className="text-sm text-slate-500">
                        {a.scenario.title} · {a.mode}
                      </p>
                    </div>
                    <span className="text-sm text-emerald-700">Completed</span>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

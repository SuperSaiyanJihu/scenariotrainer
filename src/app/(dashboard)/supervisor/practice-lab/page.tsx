"use client";

import { useEffect, useState } from "react";
import {
  Users2,
  CalendarDays,
  CheckCircle2,
  Loader2,
  ClipboardList,
  MessageSquareText,
  Mic,
  UserPlus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";

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
    <div className="space-y-8 animate-fade-up">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-900">Team Practice Activity</h1>
        <p className="mt-1 text-zinc-500">Review completion status and assign practice scenarios</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <UserPlus className="h-4 w-4" />
            </span>
            <CardTitle>Assign Scenario</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={createAssignment} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="scenario">Scenario</Label>
              <Select
                id="scenario"
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
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee">Team Member</Label>
              <Select
                id="employee"
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
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date (optional)</Label>
              <Input
                id="dueDate"
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 sm:mt-6">
              <span className="text-sm font-medium text-zinc-700">Required assignment</span>
              <Switch
                checked={form.required}
                onCheckedChange={(checked) => setForm({ ...form, required: checked })}
              />
            </div>
            <div className="flex items-center gap-3 sm:col-span-2">
              <Button type="submit" disabled={assigning}>
                {assigning ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                {assigning ? "Assigning..." : "Assign Scenario"}
              </Button>
              {assignError && <p className="text-sm text-rose-600">{assignError}</p>}
              {assignSuccess && (
                <p className="inline-flex items-center gap-1 text-sm text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" /> {assignSuccess}
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Current Assignments</h2>
        {loading ? (
          <div className="flex items-center gap-2 text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading...
          </div>
        ) : assignments.length === 0 ? (
          <Card className="border-dashed bg-transparent shadow-none">
            <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
                <ClipboardList className="h-5 w-5" />
              </span>
              <p className="text-sm text-zinc-500">No assignments yet.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="divide-y divide-zinc-100 p-0">
              {assignments.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-zinc-900">{a.scenario.title}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-500">
                      {a.assignedTo?.name ?? "Team"}
                      {a.dueDate && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" /> Due {new Date(a.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>
                  <Badge variant={a.required ? "warning" : "secondary"} className="shrink-0">
                    {a.required ? "Required" : "Optional"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Completed Attempts</h2>
        {loading ? (
          <div className="flex items-center gap-2 text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading results...
          </div>
        ) : attempts.length === 0 ? (
          <Card className="border-dashed bg-transparent shadow-none">
            <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
                <Users2 className="h-5 w-5" />
              </span>
              <p className="text-sm text-zinc-500">No completed practice attempts from your team yet.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="divide-y divide-zinc-100 p-0">
              {attempts.map((a) => {
                const ModeIcon = a.mode === "VOICE" ? Mic : MessageSquareText;
                return (
                  <div key={a.id} className="flex items-center justify-between gap-3 p-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
                        {getInitials(a.user.name)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-zinc-900">{a.user.name}</p>
                        <p className="flex items-center gap-1.5 truncate text-sm text-zinc-500">
                          {a.scenario.title}
                          <ModeIcon className="h-3.5 w-3.5 shrink-0" />
                        </p>
                      </div>
                    </div>
                    <Badge variant="success" className="shrink-0">
                      <CheckCircle2 className="h-3 w-3" /> Completed
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

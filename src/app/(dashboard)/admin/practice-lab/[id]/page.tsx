"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DEFAULT_RUBRIC = [
  { name: "Listening and acknowledgment", description: "", weight: 20, scoringGuidance: "", positiveIndicators: "", negativeIndicators: "", sortOrder: 0 },
  { name: "Clarifying questions and discovery", description: "", weight: 20, scoringGuidance: "", positiveIndicators: "", negativeIndicators: "", sortOrder: 1 },
  { name: "Professionalism and composure", description: "", weight: 15, scoringGuidance: "", positiveIndicators: "", negativeIndicators: "", sortOrder: 2 },
  { name: "Accuracy and policy alignment", description: "", weight: 15, scoringGuidance: "", positiveIndicators: "", negativeIndicators: "", sortOrder: 3 },
  { name: "Ownership and accountability", description: "", weight: 15, scoringGuidance: "", positiveIndicators: "", negativeIndicators: "", sortOrder: 4 },
  { name: "Resolution and clear next step", description: "", weight: 15, scoringGuidance: "", positiveIndicators: "", negativeIndicators: "", sortOrder: 5 },
];

export default function ScenarioBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    category: "PARENT_CONVERSATIONS",
    difficulty: "INTERMEDIATE",
    estimatedMinutes: 10,
    employeeRole: "",
    aiCharacterName: "",
    aiCharacterRole: "",
    aiCharacterDescription: "",
    startingEmotionalState: "",
    conversationStyle: "",
    situationBackground: "",
    openingMessage: "",
    roleplayInstructions: "",
    hiddenCharacterInformation: "",
    escalationInstructions: "",
    deescalationConditions: "",
    successConditions: "",
    prohibitedAssistantBehaviors: "",
    policyContext: "",
    modeAvailability: "TEXT_AND_VOICE",
    passingScore: 70,
    maximumDurationMinutes: 15,
    status: "DRAFT",
    rubricCriteria: DEFAULT_RUBRIC,
    criticalErrors: [] as Array<{ name: string; description: string; scoreEffect: number; automaticFailure: boolean; sortOrder: number }>,
  });

  useEffect(() => {
    params.then(({ id }) => {
      if (id === "new") {
        setIsNew(true);
        return;
      }
      setScenarioId(id);
      fetch(`/api/admin/practice-lab/scenarios/${id}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.scenario) setForm(data.scenario);
        });
    });
  }, [params]);

  function updateField(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(publish = false) {
    setSaving(true);
    setError("");

    const payload = { ...form, status: publish ? "PUBLISHED" : form.status };

    const url = isNew
      ? "/api/admin/practice-lab/scenarios"
      : `/api/admin/practice-lab/scenarios/${scenarioId}`;
    const method = isNew ? "POST" : "PUT";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to save");
      return;
    }

    if (isNew) {
      router.push(`/admin/practice-lab/${data.scenario.id}`);
    } else {
      router.refresh();
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{isNew ? "Create Scenario" : "Edit Scenario"}</h1>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Card>
        <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => updateField("title", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input value={form.slug} onChange={(e) => updateField("slug", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <select
              className="flex h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
              value={form.status}
              onChange={(e) => updateField("status", e.target.value)}
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <select
              className="flex h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
            >
              <option value="PARENT_CONVERSATIONS">Parent Conversations</option>
              <option value="INSTRUCTOR_COACHING">Instructor Coaching</option>
              <option value="SUPERVISOR_FEEDBACK">Supervisor Feedback</option>
              <option value="COWORKER_COMMUNICATION">Coworker Communication</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Difficulty</Label>
            <select
              className="flex h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
              value={form.difficulty}
              onChange={(e) => updateField("difficulty", e.target.value)}
            >
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Estimated Minutes</Label>
            <Input type="number" value={form.estimatedMinutes} onChange={(e) => updateField("estimatedMinutes", parseInt(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Passing Score</Label>
            <Input type="number" value={form.passingScore} onChange={(e) => updateField("passingScore", parseInt(e.target.value))} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Employee Role</Label>
            <Input value={form.employeeRole} onChange={(e) => updateField("employeeRole", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>AI Character</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Character Name</Label>
            <Input value={form.aiCharacterName} onChange={(e) => updateField("aiCharacterName", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Character Role</Label>
            <Input value={form.aiCharacterRole} onChange={(e) => updateField("aiCharacterRole", e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Character Description</Label>
            <Textarea value={form.aiCharacterDescription} onChange={(e) => updateField("aiCharacterDescription", e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Opening Message</Label>
            <Textarea value={form.openingMessage} onChange={(e) => updateField("openingMessage", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Scenario Logic</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[
            ["situationBackground", "Situation Background"],
            ["hiddenCharacterInformation", "Hidden Character Information"],
            ["escalationInstructions", "Escalation Triggers"],
            ["deescalationConditions", "Deescalation Conditions"],
            ["successConditions", "Success Conditions"],
            ["prohibitedAssistantBehaviors", "Prohibited Character Behaviors"],
            ["policyContext", "Policy Context"],
          ].map(([field, label]) => (
            <div key={field} className="space-y-2">
              <Label>{label}</Label>
              <Textarea
                value={String(form[field as keyof typeof form] ?? "")}
                onChange={(e) => updateField(field, e.target.value)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Rubric Criteria (weights must total 100)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {form.rubricCriteria.map((c, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-4 border-b pb-4">
              <Input
                placeholder="Name"
                value={c.name}
                onChange={(e) => {
                  const updated = [...form.rubricCriteria];
                  updated[i] = { ...c, name: e.target.value };
                  updateField("rubricCriteria", updated);
                }}
              />
              <Input
                type="number"
                placeholder="Weight"
                value={c.weight}
                onChange={(e) => {
                  const updated = [...form.rubricCriteria];
                  updated[i] = { ...c, weight: parseInt(e.target.value) };
                  updateField("rubricCriteria", updated);
                }}
              />
              <div className="sm:col-span-2">
                <Textarea
                  placeholder="Description"
                  value={c.description}
                  onChange={(e) => {
                    const updated = [...form.rubricCriteria];
                    updated[i] = { ...c, description: e.target.value };
                    updateField("rubricCriteria", updated);
                  }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={() => handleSave(false)} disabled={saving}>
          {saving ? "Saving..." : "Save Draft"}
        </Button>
        <Button onClick={() => handleSave(true)} disabled={saving} variant="default">
          Publish
        </Button>
        {!isNew && scenarioId && (
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              setError("");
              const res = await fetch("/api/practice-lab/attempts/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  scenarioId,
                  mode: "TEXT",
                  isPreview: true,
                }),
              });
              const data = await res.json();
              setSaving(false);
              if (!res.ok) {
                setError(data.error ?? "Failed to start preview");
                return;
              }
              router.push(`/practice-lab/attempts/${data.attemptId}`);
            }}
          >
            Test Scenario
          </Button>
        )}
      </div>
    </div>
  );
}

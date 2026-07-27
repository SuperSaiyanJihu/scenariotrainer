"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  FileText,
  UserRound,
  Workflow,
  Save,
  UploadCloud,
  PlayCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ScenarioBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
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
    maximumDurationMinutes: 15,
    status: "DRAFT",
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

  async function handlePreview() {
    if (!scenarioId) return;
    setPreviewing(true);
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
    setPreviewing(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to start preview");
      return;
    }
    router.push(`/practice-lab/attempts/${data.attemptId}`);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-up">
      <div>
        <Link
          href="/admin/practice-lab"
          className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-brand-600"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Manage Scenarios
        </Link>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-zinc-900">
          {isNew ? "Create Scenario" : "Edit Scenario"}
        </h1>
      </div>

      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
          {error}
        </p>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <FileText className="h-4 w-4" />
            </span>
            <CardTitle>Basic Information</CardTitle>
          </div>
        </CardHeader>
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
            <Select value={form.status} onChange={(e) => updateField("status", e.target.value)}>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={form.category} onChange={(e) => updateField("category", e.target.value)}>
              <option value="PARENT_CONVERSATIONS">Parent Conversations</option>
              <option value="INSTRUCTOR_COACHING">Instructor Coaching</option>
              <option value="SUPERVISOR_FEEDBACK">Supervisor Feedback</option>
              <option value="COWORKER_COMMUNICATION">Coworker Communication</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Difficulty</Label>
            <Select value={form.difficulty} onChange={(e) => updateField("difficulty", e.target.value)}>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Estimated Minutes</Label>
            <Input
              type="number"
              value={form.estimatedMinutes}
              onChange={(e) => updateField("estimatedMinutes", parseInt(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Maximum Minutes</Label>
            <Input
              type="number"
              value={form.maximumDurationMinutes}
              onChange={(e) => updateField("maximumDurationMinutes", parseInt(e.target.value))}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Employee Role</Label>
            <Input value={form.employeeRole} onChange={(e) => updateField("employeeRole", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <UserRound className="h-4 w-4" />
            </span>
            <CardTitle>AI Character</CardTitle>
          </div>
        </CardHeader>
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
            <Textarea
              value={form.aiCharacterDescription}
              onChange={(e) => updateField("aiCharacterDescription", e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Opening Message</Label>
            <Textarea value={form.openingMessage} onChange={(e) => updateField("openingMessage", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Workflow className="h-4 w-4" />
            </span>
            <CardTitle>Scenario Logic</CardTitle>
          </div>
        </CardHeader>
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

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => handleSave(true)} disabled={saving}>
          <UploadCloud className="h-4 w-4" /> Publish
        </Button>
        <Button onClick={() => handleSave(false)} disabled={saving} variant="outline">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Draft
        </Button>
        {!isNew && scenarioId && (
          <Button type="button" variant="ghost" disabled={previewing} onClick={handlePreview}>
            {previewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
            Test Scenario
          </Button>
        )}
      </div>
    </div>
  );
}

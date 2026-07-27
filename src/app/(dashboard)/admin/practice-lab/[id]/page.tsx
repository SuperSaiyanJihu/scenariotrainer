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
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const REQUIRED_FIELDS: [string, string][] = [
  ["title", "Title"],
  ["slug", "Slug"],
  ["employeeRole", "Employee Role"],
  ["aiCharacterName", "Character Name"],
  ["aiCharacterRole", "Character Role"],
  ["openingMessage", "Opening Message"],
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function RequiredMark() {
  return (
    <span className="text-rose-500" aria-hidden="true">
      {" "}
      *
    </span>
  );
}

export default function ScenarioBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState("");
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    category: "PARENT_CONVERSATIONS",
    difficulty: "INTERMEDIATE",
    estimatedMinutes: 3,
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
    maximumDurationMinutes: 3,
    status: "DRAFT",
  });
  const [brief, setBrief] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [generated, setGenerated] = useState(false);

  async function generateDraft() {
    setGenerating(true);
    setGenerateError("");

    try {
      const res = await fetch("/api/admin/practice-lab/scenarios/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGenerateError(data.error ?? "Generation failed. Try again.");
        return;
      }

      setForm((prev) => ({
        ...prev,
        ...data.scenario,
        slug: slugTouched ? prev.slug : slugify(data.scenario.title ?? ""),
      }));
      setGenerated(true);
      setError("");
    } catch {
      setGenerateError("Generation failed. Check your connection and try again.");
    } finally {
      setGenerating(false);
    }
  }

  useEffect(() => {
    params.then(({ id }) => {
      if (id === "new") {
        setIsNew(true);
        return;
      }
      setScenarioId(id);
      setSlugTouched(true);
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

  function updateTitle(value: string) {
    setForm((prev) => ({
      ...prev,
      title: value,
      slug: isNew && !slugTouched ? slugify(value) : prev.slug,
    }));
  }

  function findMissingFields(): string[] {
    return REQUIRED_FIELDS.filter(([field]) => !String(form[field as keyof typeof form] ?? "").trim()).map(
      ([, label]) => label
    );
  }

  async function persist(publish: boolean) {
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
      setError(data.error ?? "Failed to save. Double-check the fields above and try again.");
      return;
    }

    if (isNew) {
      router.push(`/admin/practice-lab/${data.scenario.id}`);
    } else {
      router.refresh();
    }
  }

  function handleSaveDraft() {
    const missing = findMissingFields();
    if (missing.length > 0) {
      setError(`Fill in required fields before saving: ${missing.join(", ")}.`);
      return;
    }
    persist(false);
  }

  function handlePublishClick() {
    const missing = findMissingFields();
    if (missing.length > 0) {
      setError(`Fill in required fields before publishing: ${missing.join(", ")}.`);
      return;
    }
    setError("");
    setConfirmPublish(true);
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
        <p className="mt-1 text-sm text-zinc-500">
          Fields marked <span className="text-rose-500">*</span> are required. Scenarios stay in Draft and
          are invisible to employees until you publish.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
          {error}
        </p>
      )}

      {isNew && (
        <Card className="border-brand-100 bg-gradient-to-br from-brand-50 to-white">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
                <Sparkles className="h-4 w-4" />
              </span>
              <CardTitle>Draft with AI</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="field-brief">Describe the scenario you want</Label>
              <Textarea
                id="field-brief"
                rows={3}
                placeholder='e.g. "A parent is upset that their child was moved down a level without warning. The instructor needs to explain the decision without sounding defensive."'
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                disabled={generating}
                maxLength={2000}
                aria-describedby="field-brief-hint"
              />
              <p id="field-brief-hint" className="text-xs text-zinc-500">
                The AI fills in every field below — character, hidden information, escalation triggers, and
                policies — sized for a ~3 minute practice. Review and tweak anything before saving.
              </p>
            </div>
            {generateError && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
                {generateError}
              </p>
            )}
            {generated && !generateError && (
              <p className="text-sm text-emerald-700" role="status">
                Draft generated — review the fields below, adjust anything, then save or publish.
              </p>
            )}
            <Button onClick={generateDraft} disabled={generating || brief.trim().length < 10}>
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> {generated ? "Regenerate" : "Generate Scenario"}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
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
            <Label htmlFor="field-title">
              Title
              <RequiredMark />
            </Label>
            <Input
              id="field-title"
              required
              value={form.title}
              onChange={(e) => updateTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="field-slug">
              Slug
              <RequiredMark />
            </Label>
            <Input
              id="field-slug"
              required
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                updateField("slug", e.target.value);
              }}
              aria-describedby="field-slug-hint"
            />
            <p id="field-slug-hint" className="text-xs text-zinc-400">
              Lowercase letters, numbers, and dashes only. Used in the practice URL.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="field-status">Status</Label>
            <Select id="field-status" value={form.status} onChange={(e) => updateField("status", e.target.value)}>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="field-description">Description</Label>
            <Textarea
              id="field-description"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="field-category">Category</Label>
            <Select id="field-category" value={form.category} onChange={(e) => updateField("category", e.target.value)}>
              <option value="PARENT_CONVERSATIONS">Parent Conversations</option>
              <option value="INSTRUCTOR_COACHING">Instructor Coaching</option>
              <option value="SUPERVISOR_FEEDBACK">Supervisor Feedback</option>
              <option value="COWORKER_COMMUNICATION">Coworker Communication</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="field-difficulty">Difficulty</Label>
            <Select
              id="field-difficulty"
              value={form.difficulty}
              onChange={(e) => updateField("difficulty", e.target.value)}
            >
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="field-estimated">Estimated Minutes</Label>
            <Input
              id="field-estimated"
              type="number"
              min={1}
              value={form.estimatedMinutes}
              onChange={(e) => updateField("estimatedMinutes", parseInt(e.target.value) || 1)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="field-max-minutes">Maximum Minutes</Label>
            <Input
              id="field-max-minutes"
              type="number"
              min={1}
              value={form.maximumDurationMinutes}
              onChange={(e) => updateField("maximumDurationMinutes", parseInt(e.target.value) || 1)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="field-mode">Practice Mode</Label>
            <Select
              id="field-mode"
              value={form.modeAvailability}
              onChange={(e) => updateField("modeAvailability", e.target.value)}
            >
              <option value="TEXT_AND_VOICE">Text and Voice</option>
              <option value="TEXT_ONLY">Text only</option>
              <option value="VOICE_ONLY">Voice only</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="field-employee-role">
              Employee Role
              <RequiredMark />
            </Label>
            <Input
              id="field-employee-role"
              required
              value={form.employeeRole}
              onChange={(e) => updateField("employeeRole", e.target.value)}
            />
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
            <Label htmlFor="field-character-name">
              Character Name
              <RequiredMark />
            </Label>
            <Input
              id="field-character-name"
              required
              value={form.aiCharacterName}
              onChange={(e) => updateField("aiCharacterName", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="field-character-role">
              Character Role
              <RequiredMark />
            </Label>
            <Input
              id="field-character-role"
              required
              value={form.aiCharacterRole}
              onChange={(e) => updateField("aiCharacterRole", e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="field-character-description">Character Description</Label>
            <Textarea
              id="field-character-description"
              value={form.aiCharacterDescription}
              onChange={(e) => updateField("aiCharacterDescription", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="field-emotional-state">Starting Emotional State</Label>
            <Textarea
              id="field-emotional-state"
              rows={2}
              placeholder='e.g. "Frustrated and defensive, but willing to listen if treated with respect"'
              value={form.startingEmotionalState}
              onChange={(e) => updateField("startingEmotionalState", e.target.value)}
              aria-describedby="field-emotional-state-hint"
            />
            <p id="field-emotional-state-hint" className="text-xs text-zinc-400">
              How the character feels when the conversation begins.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="field-conversation-style">Conversation Style</Label>
            <Textarea
              id="field-conversation-style"
              rows={2}
              placeholder='e.g. "Short, clipped sentences. Interrupts. Softens only when acknowledged."'
              value={form.conversationStyle}
              onChange={(e) => updateField("conversationStyle", e.target.value)}
              aria-describedby="field-conversation-style-hint"
            />
            <p id="field-conversation-style-hint" className="text-xs text-zinc-400">
              How the character talks: tone, pacing, verbal habits.
            </p>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="field-opening-message">
              Opening Message
              <RequiredMark />
            </Label>
            <Textarea
              id="field-opening-message"
              required
              value={form.openingMessage}
              onChange={(e) => updateField("openingMessage", e.target.value)}
            />
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
              <Label htmlFor={`field-${field}`}>{label}</Label>
              <Textarea
                id={`field-${field}`}
                value={String(form[field as keyof typeof form] ?? "")}
                onChange={(e) => updateField(field, e.target.value)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button onClick={handleSaveDraft} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Draft
        </Button>
        <Button onClick={handlePublishClick} disabled={saving} variant="outline">
          <UploadCloud className="h-4 w-4" /> Publish
        </Button>
        {!isNew && scenarioId && (
          <Button type="button" variant="ghost" disabled={previewing} onClick={handlePreview}>
            {previewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
            Test Scenario
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={confirmPublish}
        onOpenChange={setConfirmPublish}
        title={form.status === "PUBLISHED" ? "Update the published scenario?" : "Publish this scenario?"}
        description="Publishing makes this scenario immediately visible and startable for every employee it's assigned to (or all employees, if optional). Make sure the character, opening message, and logic above are ready."
        confirmLabel={form.status === "PUBLISHED" ? "Update" : "Publish"}
        confirmVariant="default"
        onConfirm={async () => {
          await persist(true);
          setConfirmPublish(false);
        }}
      />
    </div>
  );
}

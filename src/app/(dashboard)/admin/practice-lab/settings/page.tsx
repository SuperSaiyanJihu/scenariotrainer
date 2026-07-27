"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ToggleLeft, ShieldCheck, Loader2, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

interface Settings {
  practiceLabEnabled: boolean;
  practiceLabVoiceEnabled: boolean;
  supervisorCanViewTranscripts: boolean;
  transcriptRetentionDays: number;
}

function SettingRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div>
        <p className="text-sm font-medium text-zinc-900">{label}</p>
        {description && <p className="text-sm text-zinc-500">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/practice-lab/settings")
      .then((r) => r.json())
      .then((data) => setSettings(data.settings));
  }, []);

  async function save() {
    if (!settings) return;
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/admin/practice-lab/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    if (res.ok) {
      setMessage("Settings saved");
    } else {
      const data = await res.json();
      setMessage(data.error ?? "Failed to save");
    }
  }

  if (!settings) {
    return (
      <div className="flex items-center gap-2 text-zinc-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading settings...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-up">
      <div>
        <Link
          href="/admin/practice-lab"
          className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-brand-600"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Manage Scenarios
        </Link>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-zinc-900">
          Practice Lab Settings
        </h1>
        <p className="mt-1 text-zinc-500">Control feature flags and privacy options</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <ToggleLeft className="h-4 w-4" />
            </span>
            <div>
              <CardTitle>Features</CardTitle>
              <CardDescription>Enable or disable Practice Lab capabilities</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 divide-y divide-zinc-100">
          <SettingRow
            label="Practice Lab enabled"
            checked={settings.practiceLabEnabled}
            onCheckedChange={(checked) => setSettings({ ...settings, practiceLabEnabled: checked })}
          />
          <div className="pt-4">
            <SettingRow
              label="Voice mode enabled"
              checked={settings.practiceLabVoiceEnabled}
              onCheckedChange={(checked) => setSettings({ ...settings, practiceLabVoiceEnabled: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div>
              <CardTitle>Privacy</CardTitle>
              <CardDescription>Transcript access and retention</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <SettingRow
            label="Supervisors can view team transcripts"
            checked={settings.supervisorCanViewTranscripts}
            onCheckedChange={(checked) => setSettings({ ...settings, supervisorCanViewTranscripts: checked })}
          />
          <div className="space-y-2 border-t border-zinc-100 pt-5">
            <Label htmlFor="retention">Transcript retention (days)</Label>
            <Input
              id="retention"
              type="number"
              min={1}
              max={3650}
              className="max-w-[160px]"
              value={settings.transcriptRetentionDays}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  transcriptRetentionDays: parseInt(e.target.value || "365", 10),
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : "Save Settings"}
        </Button>
        {message && <p className="text-sm text-zinc-500">{message}</p>}
      </div>
    </div>
  );
}

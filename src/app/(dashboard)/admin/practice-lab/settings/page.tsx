"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface Settings {
  practiceLabEnabled: boolean;
  practiceLabVoiceEnabled: boolean;
  supervisorCanViewTranscripts: boolean;
  transcriptRetentionDays: number;
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
    return <p className="text-slate-500">Loading settings...</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Practice Lab Settings</h1>
        <p className="text-slate-600">Control feature flags and privacy options</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
          <CardDescription>Enable or disable Practice Lab capabilities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={settings.practiceLabEnabled}
              onChange={(e) =>
                setSettings({ ...settings, practiceLabEnabled: e.target.checked })
              }
            />
            Practice Lab enabled
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={settings.practiceLabVoiceEnabled}
              onChange={(e) =>
                setSettings({ ...settings, practiceLabVoiceEnabled: e.target.checked })
              }
            />
            Voice mode enabled
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacy</CardTitle>
          <CardDescription>Transcript access and retention</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={settings.supervisorCanViewTranscripts}
              onChange={(e) =>
                setSettings({ ...settings, supervisorCanViewTranscripts: e.target.checked })
              }
            />
            Supervisors can view team transcripts
          </label>
          <div className="space-y-2">
            <Label htmlFor="retention">Transcript retention (days)</Label>
            <Input
              id="retention"
              type="number"
              min={1}
              max={3650}
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

      <Button onClick={save} disabled={saving}>
        {saving ? "Saving..." : "Save Settings"}
      </Button>
      {message && <p className="text-sm text-slate-600">{message}</p>}
    </div>
  );
}

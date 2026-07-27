"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Settings, Pencil, Copy, Trash2, Loader2, ClipboardList } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { categoryIcon } from "@/lib/practice-lab/ui-meta";
import type { ScenarioCategory } from "@/generated/prisma/client";

interface Scenario {
  id: string;
  title: string;
  slug: string;
  status: string;
  category: ScenarioCategory;
  difficulty: string;
  _count: { attempts: number };
}

export default function AdminPracticeLabPage() {
  const router = useRouter();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [canRemove, setCanRemove] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/practice-lab/scenarios")
      .then((r) => r.json())
      .then((data) => {
        setScenarios(data.scenarios ?? []);
        setCanRemove(data.canRemove === true);
        setLoading(false);
      });
  }, []);

  async function duplicateScenario(id: string) {
    const res = await fetch(`/api/admin/practice-lab/scenarios/${id}/duplicate`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      router.push(`/admin/practice-lab/${data.scenario.id}`);
    }
  }

  async function removeScenario(id: string, title: string) {
    if (!window.confirm(`Remove "${title}" from the Practice Lab library?`)) return;

    setError("");
    const res = await fetch(`/api/admin/practice-lab/scenarios/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not remove scenario");
      return;
    }

    setScenarios((current) =>
      current.map((scenario) =>
        scenario.id === id ? { ...scenario, status: "ARCHIVED" } : scenario
      )
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-900">Manage Scenarios</h1>
          <p className="mt-1 text-zinc-500">Create, edit, and publish Practice Lab scenarios</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/admin/practice-lab/new">
              <Plus className="h-4 w-4" /> Create Scenario
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/practice-lab/settings">
              <Settings className="h-4 w-4" /> Settings
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading scenarios...
        </div>
      ) : scenarios.length === 0 ? (
        <Card className="border-dashed bg-transparent shadow-none">
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
              <ClipboardList className="h-5 w-5" />
            </span>
            <p className="text-sm text-zinc-500">No scenarios yet. Create your first scenario to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {scenarios.map((s) => {
            const Icon = categoryIcon[s.category];
            return (
              <Card key={s.id}>
                <CardHeader className="py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <CardTitle className="text-lg">{s.title}</CardTitle>
                        <CardDescription>{s.slug}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={s.status === "PUBLISHED" ? "success" : "secondary"}>{s.status}</Badge>
                      <span className="hidden text-sm text-zinc-500 sm:inline">{s._count.attempts} attempts</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2 pb-4">
                  <Button asChild size="sm">
                    <Link href={`/admin/practice-lab/${s.id}`}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => duplicateScenario(s.id)}>
                    <Copy className="h-3.5 w-3.5" /> Duplicate
                  </Button>
                  {canRemove && s.status !== "ARCHIVED" && (
                    <Button size="sm" variant="ghost" onClick={() => removeScenario(s.id, s.title)}>
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

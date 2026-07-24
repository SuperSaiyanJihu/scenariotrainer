"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Scenario {
  id: string;
  title: string;
  slug: string;
  status: string;
  category: string;
  difficulty: string;
  _count: { attempts: number };
}

export default function AdminPracticeLabPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/practice-lab/scenarios")
      .then((r) => r.json())
      .then((data) => {
        setScenarios(data.scenarios ?? []);
        setLoading(false);
      });
  }, []);

  async function duplicateScenario(id: string) {
    const res = await fetch(`/api/admin/practice-lab/scenarios/${id}/duplicate`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      window.location.href = `/admin/practice-lab/${data.scenario.id}`;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Scenarios</h1>
          <p className="text-slate-600">Create, edit, and publish Practice Lab scenarios</p>
        </div>
        <Button asChild>
          <Link href="/admin/practice-lab/new">Create Scenario</Link>
        </Button>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading scenarios...</p>
      ) : scenarios.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-slate-500">
            No scenarios yet. Create your first scenario to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {scenarios.map((s) => (
            <Card key={s.id}>
              <CardHeader className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{s.title}</CardTitle>
                    <CardDescription>{s.slug}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={s.status === "PUBLISHED" ? "success" : "secondary"}>
                      {s.status}
                    </Badge>
                    <span className="text-sm text-slate-500">{s._count.attempts} attempts</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex gap-2 pb-4">
                <Button asChild size="sm">
                  <Link href={`/admin/practice-lab/${s.id}`}>Edit</Link>
                </Button>
                <Button size="sm" variant="outline" onClick={() => duplicateScenario(s.id)}>
                  Duplicate
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

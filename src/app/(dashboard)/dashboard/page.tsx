import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome, {session.user.name}</h1>
        <p className="text-slate-600">Excel Aquatics Performance Pulse</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Practice Lab</CardTitle>
            <CardDescription>
              Rehearse difficult workplace conversations with AI characters and receive coaching feedback.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/practice-lab">Go to Practice Lab</Link>
            </Button>
          </CardContent>
        </Card>

        {session.user.role === "ADMINISTRATOR" && (
          <Card>
            <CardHeader>
              <CardTitle>Manage Scenarios</CardTitle>
              <CardDescription>Create and publish practice scenarios for your team.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href="/admin/practice-lab">Admin Console</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {(session.user.role === "SUPERVISOR" || session.user.role === "ADMINISTRATOR") && (
          <Card>
            <CardHeader>
              <CardTitle>Team Results</CardTitle>
              <CardDescription>Review practice completion and scores for your team.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href="/supervisor/practice-lab">View Results</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

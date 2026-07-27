import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, MessagesSquare, ClipboardList, Users2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const firstName = session.user.name.split(" ")[0];
  const isSupervisor = ["SUPERVISOR", "ADMINISTRATOR", "SUPERADMIN"].includes(session.user.role);
  const isAdmin = ["ADMINISTRATOR", "SUPERADMIN"].includes(session.user.role);

  return (
    <div className="space-y-8 animate-fade-up">
      <div>
        <p className="text-sm font-medium text-brand-600">Welcome back</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-zinc-900">
          Hi, {firstName}
        </h1>
        <p className="mt-2 max-w-xl text-zinc-500">
          Jump into Practice Lab to rehearse a conversation, or catch up on your team&apos;s progress.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="group relative overflow-hidden border-brand-100 bg-gradient-to-br from-brand-600 to-brand-700 text-white shadow-glow transition-transform hover:-translate-y-0.5">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "22px 22px",
            }}
          />
          <CardHeader className="relative">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
              <MessagesSquare className="h-5 w-5" />
            </span>
            <CardTitle className="mt-2 text-white">Practice Lab</CardTitle>
            <CardDescription className="text-white/70">
              Rehearse difficult conversations with AI characters and get coaching feedback.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <Button asChild variant="secondary" className="bg-white text-brand-700 hover:bg-white/90">
              <Link href="/practice-lab">
                Go to Practice Lab <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {isAdmin && (
          <Card className="transition-transform hover:-translate-y-0.5 hover:shadow-card-hover">
            <CardHeader>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
                <ClipboardList className="h-5 w-5" />
              </span>
              <CardTitle className="mt-2">Manage Scenarios</CardTitle>
              <CardDescription>Create and publish practice scenarios for your team.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href="/admin/practice-lab">
                  Admin Console <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {isSupervisor && (
          <Card className="transition-transform hover:-translate-y-0.5 hover:shadow-card-hover">
            <CardHeader>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
                <Users2 className="h-5 w-5" />
              </span>
              <CardTitle className="mt-2">Team Activity</CardTitle>
              <CardDescription>Review practice completion for your team.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href="/supervisor/practice-lab">
                  View Results <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

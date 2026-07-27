import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  MessagesSquare,
  ClipboardList,
  Users2,
  AlertTriangle,
  CheckCircle2,
  FileEdit,
  Clock,
  PartyPopper,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/utils";
import { categoryIcon } from "@/lib/practice-lab/ui-meta";
import {
  getEmployeeDashboardStats,
  getManagerDashboardStats,
  getAdminLibraryStats,
} from "@/lib/practice-lab/server-data";

export const dynamic = "force-dynamic";

function StatTile({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  tone?: "default" | "warning" | "success";
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            tone === "warning"
              ? "bg-amber-50 text-amber-600"
              : tone === "success"
                ? "bg-emerald-50 text-emerald-600"
                : "bg-zinc-100 text-zinc-600"
          }`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="font-display text-xl font-semibold leading-none text-zinc-900">{value}</p>
          <p className="mt-1 text-xs text-zinc-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = session.user;

  const firstName = user.name.split(" ")[0];
  const isSupervisor = ["SUPERVISOR", "ADMINISTRATOR", "SUPERADMIN"].includes(user.role);
  const isAdmin = ["ADMINISTRATOR", "SUPERADMIN"].includes(user.role);

  const [employeeStats, managerStats, libraryStats] = await Promise.all([
    getEmployeeDashboardStats(user.id, user.teamId),
    isSupervisor ? getManagerDashboardStats(user.role, user.id) : null,
    isAdmin ? getAdminLibraryStats() : null,
  ]);

  const { nextScenario, overdueCount, requiredIncomplete, hasAnyAssignments } = employeeStats;
  const NextIcon = nextScenario ? categoryIcon[nextScenario.category] : MessagesSquare;

  return (
    <div className="space-y-8 animate-fade-up">
      <div>
        <p className="text-sm font-medium text-brand-600">Welcome back</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-zinc-900">
          Hi, {firstName}
        </h1>
      </div>

      {nextScenario ? (
        <Card className="group relative overflow-hidden border-brand-100 bg-gradient-to-br from-brand-600 to-brand-700 text-white shadow-glow">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "22px 22px",
            }}
          />
          <CardHeader className="relative">
            <div className="flex items-center justify-between gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                <NextIcon className="h-5 w-5" />
              </span>
              {overdueCount > 0 ? (
                <Badge className="bg-white/15 text-white">
                  <AlertTriangle className="h-3 w-3" /> {overdueCount} overdue
                </Badge>
              ) : (
                <Badge className="bg-white/15 text-white">Next up</Badge>
              )}
            </div>
            <CardTitle className="mt-2 text-white">{nextScenario.title}</CardTitle>
            <CardDescription className="text-white/70">
              {requiredIncomplete.length > 1
                ? `${requiredIncomplete.length} required scenarios remaining — start with this one.`
                : "Your last required scenario — you're almost caught up."}
            </CardDescription>
          </CardHeader>
          <CardContent className="relative flex flex-wrap items-center gap-3">
            <Button asChild variant="secondary" className="bg-white text-brand-700 hover:bg-white/90">
              <Link href={`/practice-lab/${nextScenario.slug}`}>
                Start practicing <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <span className="inline-flex items-center gap-1 text-sm text-white/70">
              <Clock className="h-3.5 w-3.5" /> {formatDuration(nextScenario.estimatedMinutes)}
            </span>
          </CardContent>
        </Card>
      ) : hasAnyAssignments ? (
        <Card className="border-emerald-100 bg-emerald-50/60">
          <CardContent className="flex items-center gap-3 py-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <PartyPopper className="h-5 w-5" />
            </span>
            <div>
              <p className="font-medium text-zinc-900">You&apos;re all caught up</p>
              <p className="text-sm text-zinc-600">
                No required practice remaining. Browse optional scenarios in Practice Lab any time.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed bg-transparent shadow-none">
          <CardContent className="flex items-center gap-3 py-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <MessagesSquare className="h-5 w-5" />
            </span>
            <div>
              <p className="font-medium text-zinc-900">No practice assigned yet</p>
              <p className="text-sm text-zinc-500">
                Once your supervisor assigns a scenario, it will show up here. You can also explore Practice
                Lab on your own.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {managerStats && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Team overview</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile label="Team members" value={managerStats.teamSize} icon={Users2} />
            <StatTile
              label="Need attention"
              value={managerStats.totalIncomplete}
              icon={AlertTriangle}
              tone={managerStats.totalIncomplete > 0 ? "warning" : "default"}
            />
            <StatTile
              label="Completed this week"
              value={managerStats.recentCompletions}
              icon={CheckCircle2}
              tone="success"
            />
            {libraryStats && (
              <StatTile label="Scenarios in draft" value={libraryStats.draft} icon={FileEdit} />
            )}
          </div>

          {managerStats.membersNeedingAttention.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Needs attention</CardTitle>
                <CardDescription>Team members with incomplete required practice</CardDescription>
              </CardHeader>
              <CardContent className="divide-y divide-zinc-100 p-0">
                {managerStats.membersNeedingAttention.map((member) => (
                  <div key={member.id} className="flex items-center justify-between px-6 py-3">
                    <span className="text-sm font-medium text-zinc-900">{member.name}</span>
                    <Badge variant="warning">
                      {member.incompleteCount} incomplete
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="transition-transform hover:-translate-y-0.5 hover:shadow-card-hover">
          <CardHeader>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <MessagesSquare className="h-5 w-5" />
            </span>
            <CardTitle className="mt-2">Practice Lab</CardTitle>
            <CardDescription>Browse and rehearse any scenario, required or optional.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/practice-lab">
                Browse scenarios <ArrowRight className="h-4 w-4" />
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
              <CardDescription>Review practice completion and assign scenarios.</CardDescription>
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

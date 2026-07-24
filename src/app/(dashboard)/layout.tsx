import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/practice-lab", label: "Practice Lab" },
  { href: "/supervisor/practice-lab", label: "Team Results", roles: ["SUPERVISOR", "ADMINISTRATOR"] },
  { href: "/admin/practice-lab", label: "Manage Scenarios", roles: ["ADMINISTRATOR"] },
  { href: "/admin/practice-lab/settings", label: "Settings", roles: ["ADMINISTRATOR"] },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user;
  const visibleItems = navItems.filter((item) => !item.roles || item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-lg font-bold text-sky-700">
              Performance Pulse
            </Link>
            <nav className="hidden gap-1 sm:flex">
              {visibleItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-600 sm:inline">{user.name}</span>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="inline-flex h-8 items-center rounded-md border border-slate-300 bg-white px-3 text-xs font-medium hover:bg-slate-50"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { navItems } from "@/lib/nav-config";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user;

  return (
    <div className="min-h-screen pb-24 sm:pb-0">
      <a
        href="#main-content"
        className="skip-link rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
      >
        Skip to content
      </a>
      <AppHeader user={user} />
      <main id="main-content" className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {children}
      </main>
      <MobileBottomNav items={navItems} role={user.role} />
    </div>
  );
}

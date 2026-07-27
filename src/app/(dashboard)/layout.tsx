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
      <AppHeader user={user} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
      <MobileBottomNav items={navItems} role={user.role} />
    </div>
  );
}

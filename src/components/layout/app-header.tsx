"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  MessagesSquare,
  Users,
  LayoutGrid,
  Settings,
  LogOut,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getInitials, formatRole } from "@/lib/utils";
import { navItems, type NavIconKey } from "@/lib/nav-config";

const iconMap: Record<NavIconKey, LucideIcon> = {
  home: Home,
  practice: MessagesSquare,
  team: Users,
  manage: LayoutGrid,
  settings: Settings,
};

export function AppHeader({
  user,
}: {
  user: { name: string; email: string; role: string };
}) {
  const pathname = usePathname();
  const visibleItems = navItems.filter((item) => !item.roles || item.roles.includes(user.role));

  return (
    <header
      className="sticky top-0 z-30 border-b border-zinc-200/70 bg-white/85 backdrop-blur-xl"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow">
              <Sparkles className="h-[18px] w-[18px]" strokeWidth={2.25} />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight text-zinc-900">
              ScenarioTrainer
            </span>
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            {visibleItems.map((item) => {
              const Icon = iconMap[item.icon];
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-brand-50 text-brand-700"
                      : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2.5 sm:flex">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
              {getInitials(user.name)}
            </span>
            <div className="leading-tight">
              <p className="text-sm font-medium text-zinc-900">{user.name}</p>
              <p className="text-xs text-zinc-400">{formatRole(user.role)}</p>
            </div>
          </div>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              aria-label="Sign out"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 sm:h-auto sm:w-auto sm:gap-1.5 sm:rounded-lg sm:border sm:border-zinc-200 sm:bg-white sm:px-3 sm:py-2 sm:text-xs sm:font-medium sm:shadow-soft sm:hover:border-zinc-300"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

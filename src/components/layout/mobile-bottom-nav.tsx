"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  MessagesSquare,
  Users,
  LayoutGrid,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavIconKey, NavItem } from "@/lib/nav-config";

const iconMap: Record<NavIconKey, LucideIcon> = {
  home: Home,
  practice: MessagesSquare,
  team: Users,
  manage: LayoutGrid,
  settings: Settings,
};

export function MobileBottomNav({
  items,
  role,
}: {
  items: NavItem[];
  role: string;
}) {
  const pathname = usePathname();
  const visible = items.filter((item) => !item.roles || item.roles.includes(role)).slice(0, 5);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200/70 bg-white/90 backdrop-blur-xl sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <div className="grid" style={{ gridTemplateColumns: `repeat(${visible.length}, minmax(0, 1fr))` }}>
        {visible.map((item) => {
          const Icon = iconMap[item.icon];
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-inset"
            >
              <span
                className={cn(
                  "flex h-8 w-11 items-center justify-center rounded-full transition-colors",
                  active ? "bg-brand-50 text-brand-700" : "text-zinc-400"
                )}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.4 : 2} />
              </span>
              <span className={active ? "text-brand-700" : "text-zinc-500"}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

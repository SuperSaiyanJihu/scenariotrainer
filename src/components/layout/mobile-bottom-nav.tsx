"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  roles?: string[];
}

export function MobileBottomNav({
  items,
  role,
}: {
  items: NavItem[];
  role: string;
}) {
  const pathname = usePathname();
  const visible = items.filter((item) => !item.roles || item.roles.includes(role)).slice(0, 4);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <div className="grid grid-cols-4">
        {visible.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-2 py-2 text-[11px] font-medium",
                active ? "text-slate-900" : "text-slate-600"
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  active ? "bg-sky-600" : "bg-transparent"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

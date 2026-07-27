"use client";

import { SessionProvider } from "next-auth/react";
import { AppShell } from "@/components/layout/app-shell";

export function DashboardProviders({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name: string; email: string; role: string };
}) {
  return (
    <SessionProvider>
      <AppShell user={user}>{children}</AppShell>
    </SessionProvider>
  );
}

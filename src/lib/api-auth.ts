import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { UserRole } from "@/generated/prisma/client";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { user: session.user };
}

export async function requireRole(roles: UserRole[]) {
  const result = await requireAuth();
  if ("error" in result) return result;
  if (!roles.includes(result.user.role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return result;
}

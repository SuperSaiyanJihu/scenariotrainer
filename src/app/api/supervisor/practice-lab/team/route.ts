import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/api-auth";
import { getSupervisedUserIds } from "@/lib/practice-lab/authorization";

export async function GET() {
  const authResult = await requireRole(["SUPERVISOR", "ADMINISTRATOR", "SUPERADMIN"]);
  if ("error" in authResult) return authResult.error;

  const user = authResult.user;

  if (user.role === "ADMINISTRATOR" || user.role === "SUPERADMIN") {
    const users = await prisma.user.findMany({
      where: { isActive: true, role: { in: ["EMPLOYEE", "SUPERVISOR"] } },
      select: { id: true, name: true, email: true, role: true, teamId: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ users });
  }

  const supervisedIds = await getSupervisedUserIds(user.id);
  const users = await prisma.user.findMany({
    where: { id: { in: supervisedIds }, isActive: true },
    select: { id: true, name: true, email: true, role: true, teamId: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ users });
}

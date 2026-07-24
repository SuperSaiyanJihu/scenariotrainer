import type { UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

export { deduplicateVoiceTranscriptEvents, getNextSequence } from "@/lib/practice-lab/transcript";

export interface AuthUser {
  id: string;
  role: UserRole;
  teamId: string | null;
}

export async function canAccessAttempt(user: AuthUser, attemptUserId: string): Promise<boolean> {
  if (user.id === attemptUserId) return true;
  if (user.role === "ADMINISTRATOR") return true;

  if (user.role === "SUPERVISOR") {
    const report = await prisma.user.findFirst({
      where: { id: attemptUserId, supervisorId: user.id },
    });
    return !!report;
  }

  return false;
}

export async function canViewTranscript(user: AuthUser, attemptUserId: string): Promise<boolean> {
  if (user.id === attemptUserId) return true;
  if (user.role === "ADMINISTRATOR") return true;

  if (user.role === "SUPERVISOR") {
    const settings = await prisma.appSettings.findUnique({ where: { id: "default" } });
    if (!settings?.supervisorCanViewTranscripts) return false;

    const report = await prisma.user.findFirst({
      where: { id: attemptUserId, supervisorId: user.id },
    });
    return !!report;
  }

  return false;
}

export function canManageScenarios(role: UserRole): boolean {
  return role === "ADMINISTRATOR";
}

export function canAssignScenarios(role: UserRole): boolean {
  return role === "ADMINISTRATOR" || role === "SUPERVISOR";
}

export async function getSupervisedUserIds(supervisorId: string): Promise<string[]> {
  const reports = await prisma.user.findMany({
    where: { supervisorId, isActive: true },
    select: { id: true },
  });
  return reports.map((r) => r.id);
}

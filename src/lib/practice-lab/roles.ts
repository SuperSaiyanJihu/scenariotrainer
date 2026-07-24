import type { UserRole } from "@/generated/prisma/client";

export function canManageScenarios(role: UserRole): boolean {
  return role === "ADMINISTRATOR";
}

export function canAssignScenarios(role: UserRole): boolean {
  return role === "ADMINISTRATOR" || role === "SUPERVISOR";
}

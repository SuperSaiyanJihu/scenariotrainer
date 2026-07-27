import type { UserRole } from "@/generated/prisma/client";

export function canManageScenarios(role: UserRole): boolean {
  return role === "ADMINISTRATOR" || role === "SUPERADMIN";
}

export function canAssignScenarios(role: UserRole): boolean {
  return (
    role === "ADMINISTRATOR" ||
    role === "SUPERADMIN" ||
    role === "SUPERVISOR"
  );
}

export function canRemoveScenarios(role: UserRole): boolean {
  return role === "SUPERADMIN";
}

import { describe, it, expect } from "vitest";
import {
  canManageScenarios,
  canAssignScenarios,
  canRemoveScenarios,
} from "@/lib/practice-lab/roles";

describe("authorization helpers", () => {
  it("allows administrators and superadmins to manage scenarios", () => {
    expect(canManageScenarios("ADMINISTRATOR")).toBe(true);
    expect(canManageScenarios("SUPERADMIN")).toBe(true);
    expect(canManageScenarios("SUPERVISOR")).toBe(false);
    expect(canManageScenarios("EMPLOYEE")).toBe(false);
  });

  it("allows administrators and supervisors to assign scenarios", () => {
    expect(canAssignScenarios("ADMINISTRATOR")).toBe(true);
    expect(canAssignScenarios("SUPERADMIN")).toBe(true);
    expect(canAssignScenarios("SUPERVISOR")).toBe(true);
    expect(canAssignScenarios("EMPLOYEE")).toBe(false);
  });

  it("allows only superadmins to remove scenarios from the library", () => {
    expect(canRemoveScenarios("SUPERADMIN")).toBe(true);
    expect(canRemoveScenarios("ADMINISTRATOR")).toBe(false);
    expect(canRemoveScenarios("SUPERVISOR")).toBe(false);
  });
});

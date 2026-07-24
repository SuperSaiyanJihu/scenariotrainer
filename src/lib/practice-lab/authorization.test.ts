import { describe, it, expect } from "vitest";
import { canManageScenarios, canAssignScenarios } from "@/lib/practice-lab/roles";

describe("authorization helpers", () => {
  it("allows only administrators to manage scenarios", () => {
    expect(canManageScenarios("ADMINISTRATOR")).toBe(true);
    expect(canManageScenarios("SUPERVISOR")).toBe(false);
    expect(canManageScenarios("EMPLOYEE")).toBe(false);
  });

  it("allows administrators and supervisors to assign scenarios", () => {
    expect(canAssignScenarios("ADMINISTRATOR")).toBe(true);
    expect(canAssignScenarios("SUPERVISOR")).toBe(true);
    expect(canAssignScenarios("EMPLOYEE")).toBe(false);
  });
});

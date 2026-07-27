import { describe, expect, it } from "vitest";
import {
  getCoachingJsonSchema,
  validateCoachingOutput,
} from "@/lib/practice-lab/evaluation-schema";
import {
  buildCoachingInstructions,
  buildRoleplaySystemPrompt,
} from "@/lib/practice-lab/prompts";
import type { ScenarioSnapshot } from "@/types/practice-lab";

const mockScenario: ScenarioSnapshot = {
  id: "1",
  title: "Test",
  slug: "test",
  description: "Test",
  category: "PARENT_CONVERSATIONS",
  difficulty: "INTERMEDIATE",
  estimatedMinutes: 10,
  employeeRole: "Staff",
  aiCharacterName: "Parent",
  aiCharacterRole: "Concerned parent",
  aiCharacterDescription: "Frustrated parent",
  startingEmotionalState: "Frustrated",
  conversationStyle: "Direct",
  situationBackground: "Child not progressing",
  openingMessage: "Hello",
  roleplayInstructions: "Stay in character",
  hiddenCharacterInformation: "Secret info",
  escalationInstructions: "Dismissive behavior",
  deescalationConditions: "Active listening",
  successConditions: "Clear next step",
  prohibitedAssistantBehaviors: "No coaching during role-play",
  policyContext: "Excel Aquatics policy",
  modeAvailability: "TEXT_AND_VOICE",
  passingScore: 0,
  maximumDurationMinutes: 15,
  version: 1,
  rubricCriteria: [],
  criticalErrors: [],
};

describe("conversational coaching", () => {
  it("accepts exactly three actionable suggestions", () => {
    const result = validateCoachingOutput({
      coachResponse: "Thanks for reflecting honestly.",
      whatWentWell: ["You acknowledged the concern."],
      whatCouldImprove: ["Ask one more clarifying question."],
      suggestions: [
        { title: "Pause", suggestion: "Slow down.", implementation: "Count to two." },
        { title: "Ask", suggestion: "Use an open question.", implementation: "Start with what." },
        { title: "Close", suggestion: "Name the next step.", implementation: "Confirm who follows up." },
      ],
      nextPracticeFocus: "Clarifying questions",
    });

    expect(result.success).toBe(true);
  });

  it("rejects grading fields and fewer than three suggestions", () => {
    const result = validateCoachingOutput({
      coachResponse: "You scored 90.",
      overallScore: 90,
      whatWentWell: [],
      whatCouldImprove: [],
      suggestions: [],
      nextPracticeFocus: "Listening",
    });

    expect(result.success).toBe(false);
  });

  it("requires exactly three suggestions in the JSON schema", () => {
    const schema = getCoachingJsonSchema();
    expect(schema.properties.suggestions.minItems).toBe(3);
    expect(schema.properties.suggestions.maxItems).toBe(3);
  });

  it("keeps role-play and coaching prompts separated", () => {
    const roleplay = buildRoleplaySystemPrompt(mockScenario);
    const coaching = buildCoachingInstructions(mockScenario);

    expect(roleplay).toContain("untrusted conversation content");
    expect(roleplay).toContain("Stay fully in character");
    expect(coaching).toContain("coaching, not grading");
    expect(coaching).toContain("exactly three");
  });
});

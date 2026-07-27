import { describe, expect, it } from "vitest";
import { buildCoachingInput } from "@/lib/practice-lab/prompts";
import { validateCoachingOutput } from "@/lib/practice-lab/evaluation-schema";

describe("coaching flow integration", () => {
  it("includes the transcript and all three reflections in the coaching input", () => {
    const input = buildCoachingInput(
      [
        { sequence: 1, speaker: "CHARACTER", content: "I am concerned." },
        { sequence: 2, speaker: "EMPLOYEE", content: "Tell me more." },
      ],
      [
        { question: "What went well?", response: "I listened." },
        { question: "What did not go well?", response: "I rushed." },
        { question: "What would you change?", response: "I would pause." },
      ]
    );

    expect(input).toContain("[2] EMPLOYEE: Tell me more.");
    expect(input).toContain("I listened.");
    expect(input).toContain("I rushed.");
    expect(input).toContain("I would pause.");
  });

  it("treats a valid mocked OpenAI coaching response as conversational feedback", () => {
    const result = validateCoachingOutput({
      coachResponse: "You created space for the parent to explain their concern.",
      whatWentWell: ["You invited more detail."],
      whatCouldImprove: ["Slow the transition into solutions."],
      suggestions: [
        {
          title: "Reflect first",
          suggestion: "Acknowledge the concern before solving.",
          implementation: "Use one sentence that names what you heard.",
        },
        {
          title: "Ask one open question",
          suggestion: "Gather context before proposing a next step.",
          implementation: "Try: What have you noticed most?",
        },
        {
          title: "Confirm the follow-up",
          suggestion: "End with a clear shared action.",
          implementation: "Name who will follow up and when.",
        },
      ],
      nextPracticeFocus: "Acknowledgment before problem-solving",
    });

    expect(result.success).toBe(true);
    expect(result.data?.suggestions).toHaveLength(3);
    expect(result.data).not.toHaveProperty("overallScore");
    expect(result.data).not.toHaveProperty("passed");
  });
});

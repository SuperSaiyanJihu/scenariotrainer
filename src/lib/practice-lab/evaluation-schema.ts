import { z } from "zod";

export const coachingSuggestionSchema = z.object({
  title: z.string().min(1),
  suggestion: z.string().min(1),
  implementation: z.string().min(1),
});

export const coachingOutputSchema = z.object({
  coachResponse: z.string().min(1),
  whatWentWell: z.array(z.string().min(1)).max(3),
  whatCouldImprove: z.array(z.string().min(1)).max(3),
  suggestions: z.array(coachingSuggestionSchema).length(3),
  nextPracticeFocus: z.string().min(1),
});

export type ValidatedCoachingOutput = z.infer<typeof coachingOutputSchema>;

export function validateCoachingOutput(data: unknown): {
  success: boolean;
  data?: ValidatedCoachingOutput;
  error?: string;
} {
  const result = coachingOutputSchema.safeParse(data);
  if (!result.success) {
    return { success: false, error: result.error.message };
  }
  return { success: true, data: result.data };
}

export function getCoachingJsonSchema() {
  return {
    type: "object" as const,
    properties: {
      coachResponse: { type: "string" },
      whatWentWell: {
        type: "array",
        items: { type: "string" },
        maxItems: 3,
      },
      whatCouldImprove: {
        type: "array",
        items: { type: "string" },
        maxItems: 3,
      },
      suggestions: {
        type: "array",
        minItems: 3,
        maxItems: 3,
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            suggestion: { type: "string" },
            implementation: { type: "string" },
          },
          required: ["title", "suggestion", "implementation"],
          additionalProperties: false,
        },
      },
      nextPracticeFocus: { type: "string" },
    },
    required: [
      "coachResponse",
      "whatWentWell",
      "whatCouldImprove",
      "suggestions",
      "nextPracticeFocus",
    ],
    additionalProperties: false,
  };
}

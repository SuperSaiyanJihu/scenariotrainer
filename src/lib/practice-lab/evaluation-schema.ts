import { z } from "zod";

export const evidenceSchema = z.object({
  sequence: z.number().int().min(0),
  quote: z.string(),
  explanation: z.string(),
});

export const criterionScoreSchema = z.object({
  criterionId: z.string(),
  criterionName: z.string(),
  score: z.number().min(0).max(100),
  feedback: z.string(),
  evidence: z.array(evidenceSchema),
});

export const strengthSchema = z.object({
  title: z.string(),
  explanation: z.string(),
  evidenceSequences: z.array(z.number().int()),
});

export const opportunitySchema = z.object({
  title: z.string(),
  explanation: z.string(),
  betterApproach: z.string(),
  evidenceSequences: z.array(z.number().int()),
});

export const criticalErrorResultSchema = z.object({
  criticalErrorId: z.string(),
  detected: z.boolean(),
  explanation: z.string(),
  evidenceSequences: z.array(z.number().int()),
});

export const suggestedLanguageSchema = z.object({
  situation: z.string(),
  suggestion: z.string(),
});

export const reflectionQuestionSchema = z.object({
  question: z.string(),
  purpose: z.string(),
});

export const evaluationOutputSchema = z.object({
  overallScore: z.number().min(0).max(100),
  passed: z.boolean(),
  overallSummary: z.string(),
  criterionScores: z.array(criterionScoreSchema),
  strengths: z.array(strengthSchema),
  opportunities: z.array(opportunitySchema),
  criticalErrors: z.array(criticalErrorResultSchema),
  suggestedLanguage: z.array(suggestedLanguageSchema),
  reflectionQuestions: z.array(reflectionQuestionSchema).min(1).max(6),
  nextPracticeFocus: z.string(),
});

export type ValidatedEvaluationOutput = z.infer<typeof evaluationOutputSchema>;

export function validateEvaluationOutput(data: unknown): {
  success: boolean;
  data?: ValidatedEvaluationOutput;
  error?: string;
} {
  const result = evaluationOutputSchema.safeParse(data);
  if (!result.success) {
    return { success: false, error: result.error.message };
  }
  return { success: true, data: result.data };
}

export function getEvaluationJsonSchema() {
  return {
    type: "object" as const,
    properties: {
      overallScore: { type: "number" },
      passed: { type: "boolean" },
      overallSummary: { type: "string" },
      criterionScores: {
        type: "array",
        items: {
          type: "object",
          properties: {
            criterionId: { type: "string" },
            criterionName: { type: "string" },
            score: { type: "number" },
            feedback: { type: "string" },
            evidence: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  sequence: { type: "number" },
                  quote: { type: "string" },
                  explanation: { type: "string" },
                },
                required: ["sequence", "quote", "explanation"],
                additionalProperties: false,
              },
            },
          },
          required: ["criterionId", "criterionName", "score", "feedback", "evidence"],
          additionalProperties: false,
        },
      },
      strengths: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            explanation: { type: "string" },
            evidenceSequences: { type: "array", items: { type: "number" } },
          },
          required: ["title", "explanation", "evidenceSequences"],
          additionalProperties: false,
        },
      },
      opportunities: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            explanation: { type: "string" },
            betterApproach: { type: "string" },
            evidenceSequences: { type: "array", items: { type: "number" } },
          },
          required: ["title", "explanation", "betterApproach", "evidenceSequences"],
          additionalProperties: false,
        },
      },
      criticalErrors: {
        type: "array",
        items: {
          type: "object",
          properties: {
            criticalErrorId: { type: "string" },
            detected: { type: "boolean" },
            explanation: { type: "string" },
            evidenceSequences: { type: "array", items: { type: "number" } },
          },
          required: ["criticalErrorId", "detected", "explanation", "evidenceSequences"],
          additionalProperties: false,
        },
      },
      suggestedLanguage: {
        type: "array",
        items: {
          type: "object",
          properties: {
            situation: { type: "string" },
            suggestion: { type: "string" },
          },
          required: ["situation", "suggestion"],
          additionalProperties: false,
        },
      },
      reflectionQuestions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            question: { type: "string" },
            purpose: { type: "string" },
          },
          required: ["question", "purpose"],
          additionalProperties: false,
        },
      },
      nextPracticeFocus: { type: "string" },
    },
    required: [
      "overallScore",
      "passed",
      "overallSummary",
      "criterionScores",
      "strengths",
      "opportunities",
      "criticalErrors",
      "suggestedLanguage",
      "reflectionQuestions",
      "nextPracticeFocus",
    ],
    additionalProperties: false,
  };
}

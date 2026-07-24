import OpenAI from "openai";
import { practiceLabConfig } from "./config";
import {
  buildEvaluatorSystemPrompt,
  buildEvaluatorUserPrompt,
} from "./prompts";
import {
  getEvaluationJsonSchema,
  validateEvaluationOutput,
} from "./evaluation-schema";
import {
  calculateWeightedScores,
  determinePassStatus,
} from "./scoring";
import type { ScenarioSnapshot, EvaluationOutput } from "@/types/practice-lab";
import { logPracticeEvent } from "./logger";

function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function runEvaluation(
  scenario: ScenarioSnapshot,
  transcript: Array<{ sequence: number; speaker: string; content: string }>,
  attemptId: string
): Promise<{ success: true; evaluation: EvaluationOutput; model: string } | { success: false; error: string }> {
  const client = getOpenAIClient();
  if (!client) {
    return { success: false, error: "OpenAI API key is not configured" };
  }

  const model = practiceLabConfig.evaluationModel;
  const startTime = Date.now();

  logPracticeEvent("evaluation_started", { attemptId, scenarioId: scenario.id, model });

  try {
    const response = await client.responses.create({
      model,
      input: [
        { role: "system", content: buildEvaluatorSystemPrompt(scenario) },
        { role: "user", content: buildEvaluatorUserPrompt(transcript) },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "practice_evaluation",
          strict: true,
          schema: getEvaluationJsonSchema(),
        },
      },
    });

    const latency = Date.now() - startTime;
    const outputText = response.output_text;

    if (!outputText) {
      logPracticeEvent("evaluation_failed", { attemptId, error: "empty_response", latency });
      return { success: false, error: "Evaluator returned empty response" };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(outputText);
    } catch {
      logPracticeEvent("evaluation_failed", { attemptId, error: "invalid_json", latency });
      return { success: false, error: "Evaluator returned invalid JSON" };
    }

    const validation = validateEvaluationOutput(parsed);
    if (!validation.success || !validation.data) {
      logPracticeEvent("evaluation_failed", { attemptId, error: validation.error, latency });
      return { success: false, error: validation.error ?? "Schema validation failed" };
    }

    const validCriterionIds = new Set(scenario.rubricCriteria.map((c) => c.id));
    const validCriticalErrorIds = new Set(scenario.criticalErrors.map((e) => e.id));

    for (const score of validation.data.criterionScores) {
      if (!validCriterionIds.has(score.criterionId)) {
        return { success: false, error: `Invalid criterion ID: ${score.criterionId}` };
      }
    }

    for (const error of validation.data.criticalErrors) {
      if (!validCriticalErrorIds.has(error.criticalErrorId)) {
        return { success: false, error: `Invalid critical error ID: ${error.criticalErrorId}` };
      }
    }

    const { overallScore, weightedScores } = calculateWeightedScores(
      scenario.rubricCriteria.map((c) => ({ id: c.id, name: c.name, weight: c.weight })),
      validation.data.criterionScores.map((s) => ({
        criterionId: s.criterionId,
        score: s.score,
      }))
    );

    const hasAutomaticFailure = validation.data.criticalErrors.some((ce) => {
      const def = scenario.criticalErrors.find((e) => e.id === ce.criticalErrorId);
      return def?.automaticFailure && ce.detected;
    });

    const passed = determinePassStatus(overallScore, scenario.passingScore, hasAutomaticFailure);

    const evaluation: EvaluationOutput = {
      ...validation.data,
      overallScore,
      passed,
      criterionScores: validation.data.criterionScores.map((cs) => {
        const weighted = weightedScores.find((w) => w.criterionId === cs.criterionId);
        return {
          ...cs,
          criterionName: weighted?.criterionName ?? cs.criterionName,
          score: weighted?.rawScore ?? cs.score,
        };
      }),
    };

    logPracticeEvent("evaluation_completed", {
      attemptId,
      scenarioId: scenario.id,
      model,
      latency,
      overallScore,
      passed,
    });

    return { success: true, evaluation, model };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Evaluation failed";
    logPracticeEvent("evaluation_failed", { attemptId, error: message });
    return { success: false, error: message };
  }
}

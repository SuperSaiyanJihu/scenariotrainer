import OpenAI from "openai";
import { practiceLabConfig } from "./config";
import {
  buildCoachingInstructions,
  buildCoachingInput,
} from "./prompts";
import {
  getCoachingJsonSchema,
  validateCoachingOutput,
} from "./evaluation-schema";
import type { CoachingOutput, ScenarioSnapshot } from "@/types/practice-lab";
import { logPracticeEvent } from "./logger";

function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 60_000 });
}

export async function generateCoachingFeedback(
  scenario: ScenarioSnapshot,
  transcript: Array<{ sequence: number; speaker: string; content: string }>,
  reflections: Array<{ question: string; response: string }>,
  attemptId: string
): Promise<
  | { success: true; coaching: CoachingOutput; model: string }
  | { success: false; error: string }
> {
  const client = getOpenAIClient();
  if (!client) {
    return { success: false, error: "OpenAI API key is not configured" };
  }

  const model = practiceLabConfig.coachingModel;
  const startTime = Date.now();
  logPracticeEvent("coaching_started", { attemptId, scenarioId: scenario.id, model });

  try {
    const response = await client.responses.create({
      model,
      reasoning: { effort: "low" },
      instructions: buildCoachingInstructions(scenario),
      input: buildCoachingInput(transcript, reflections),
      text: {
        format: {
          type: "json_schema",
          name: "practice_coaching",
          strict: true,
          schema: getCoachingJsonSchema(),
        },
      },
    });

    if (!response.output_text) {
      return { success: false, error: "Coach returned an empty response" };
    }

    const parsed = JSON.parse(response.output_text) as unknown;
    const validation = validateCoachingOutput(parsed);
    if (!validation.success || !validation.data) {
      return { success: false, error: validation.error ?? "Invalid coaching response" };
    }

    logPracticeEvent("coaching_completed", {
      attemptId,
      scenarioId: scenario.id,
      model,
      latency: Date.now() - startTime,
    });

    return { success: true, coaching: validation.data, model };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Coaching feedback failed";
    logPracticeEvent("coaching_failed", { attemptId, error: message });
    return { success: false, error: message };
  }
}

import OpenAI from "openai";
import { practiceLabConfig } from "./config";
import { buildRoleplayMessages } from "./prompts";
import type { ScenarioSnapshot } from "@/types/practice-lab";
import { logPracticeEvent } from "./logger";

function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 60000 });
}

export async function generateCharacterResponse(
  scenario: ScenarioSnapshot,
  conversationHistory: Array<{ speaker: string; content: string }>,
  attemptId: string
): Promise<{ success: true; content: string; model: string } | { success: false; error: string }> {
  const client = getOpenAIClient();
  if (!client) {
    return { success: false, error: "OpenAI API key is not configured" };
  }

  const model = practiceLabConfig.roleplayModel;
  const startTime = Date.now();

  try {
    const messages = buildRoleplayMessages(scenario, conversationHistory);

    const response = await client.responses.create({
      model,
      input: messages.map((m) => ({ role: m.role, content: m.content })),
      max_output_tokens: 500,
    });

    const content = response.output_text?.trim();
    if (!content) {
      return { success: false, error: "Character returned empty response" };
    }

    logPracticeEvent("roleplay_response", {
      attemptId,
      scenarioId: scenario.id,
      model,
      latency: Date.now() - startTime,
    });

    return { success: true, content, model };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Role-play generation failed";
    logPracticeEvent("roleplay_failed", { attemptId, error: message });
    return { success: false, error: message };
  }
}

export async function generateReflectionFollowUp(
  question: string,
  response: string
): Promise<string | null> {
  const client = getOpenAIClient();
  if (!client) return null;

  try {
    const result = await client.responses.create({
      model: practiceLabConfig.evaluationModel,
      input: [
        {
          role: "system",
          content:
            "You are a supportive workplace coach. Provide a brief, encouraging follow-up (2-3 sentences) to the employee's reflection. Do not rescore or criticize harshly.",
        },
        {
          role: "user",
          content: `Reflection question: ${question}\nEmployee response: ${response}`,
        },
      ],
      max_output_tokens: 200,
    });

    return result.output_text?.trim() ?? null;
  } catch {
    return null;
  }
}

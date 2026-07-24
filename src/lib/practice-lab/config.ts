export const practiceLabConfig = {
  enabled: process.env.PRACTICE_LAB_ENABLED !== "false",
  voiceEnabled: process.env.PRACTICE_LAB_VOICE_ENABLED !== "false",
  maxTextTurns: parseInt(process.env.PRACTICE_LAB_MAX_TEXT_TURNS ?? "40", 10),
  maxSessionMinutes: parseInt(process.env.PRACTICE_LAB_MAX_SESSION_MINUTES ?? "15", 10),
  evaluationRetryLimit: parseInt(process.env.PRACTICE_LAB_EVALUATION_RETRY_LIMIT ?? "3", 10),
  maxInputLength: 2000,
  roleplayModel: process.env.OPENAI_ROLEPLAY_MODEL ?? "gpt-4o-mini",
  evaluationModel: process.env.OPENAI_EVALUATION_MODEL ?? "gpt-4o-mini",
  realtimeModel: process.env.OPENAI_REALTIME_MODEL ?? "gpt-4o-realtime-preview",
  evaluatorVersion: "1.0",
  rateLimitPerMinute: 30,
} as const;

export function isPracticeLabEnabled(): boolean {
  return practiceLabConfig.enabled;
}

export function isVoiceEnabled(): boolean {
  return practiceLabConfig.enabled && practiceLabConfig.voiceEnabled;
}

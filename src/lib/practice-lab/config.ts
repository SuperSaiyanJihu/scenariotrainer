export const practiceLabConfig = {
  enabled: process.env.PRACTICE_LAB_ENABLED !== "false",
  voiceEnabled: process.env.PRACTICE_LAB_VOICE_ENABLED !== "false",
  maxTextTurns: parseInt(process.env.PRACTICE_LAB_MAX_TEXT_TURNS ?? "40", 10),
  maxSessionMinutes: parseInt(process.env.PRACTICE_LAB_MAX_SESSION_MINUTES ?? "15", 10),
  maxInputLength: 2000,
  roleplayModel: process.env.OPENAI_ROLEPLAY_MODEL ?? "gpt-5.6",
  coachingModel:
    process.env.OPENAI_COACHING_MODEL ??
    process.env.OPENAI_EVALUATION_MODEL ??
    "gpt-5.6",
  realtimeModel: process.env.OPENAI_REALTIME_MODEL ?? "gpt-realtime-2.1",
  coachVersion: "2.0",
  rateLimitPerMinute: 30,
} as const;

export function isPracticeLabEnabled(): boolean {
  return practiceLabConfig.enabled;
}

export function isVoiceEnabled(): boolean {
  return practiceLabConfig.enabled && practiceLabConfig.voiceEnabled;
}

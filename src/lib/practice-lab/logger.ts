type LogEvent =
  | "attempt_created"
  | "attempt_completed"
  | "coaching_started"
  | "coaching_completed"
  | "coaching_failed"
  | "roleplay_response"
  | "roleplay_failed"
  | "voice_session_started"
  | "voice_session_ended"
  | "voice_connection_failed";

export function logPracticeEvent(
  event: LogEvent,
  data: Record<string, unknown>
): void {
  const entry = {
    timestamp: new Date().toISOString(),
    module: "practice-lab",
    event,
    ...data,
  };

  if (process.env.NODE_ENV === "test") return;

  console.log(JSON.stringify(entry));
}

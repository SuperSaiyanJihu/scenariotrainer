import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { isVoiceEnabled, practiceLabConfig } from "@/lib/practice-lab/config";
import { buildRealtimeInstructions } from "@/lib/practice-lab/prompts";
import { logPracticeEvent } from "@/lib/practice-lab/logger";
import { parseScenarioSnapshot } from "@/lib/practice-lab/scenario-utils";
import { checkRateLimit } from "@/lib/practice-lab/rate-limit";
import { createHash } from "crypto";

const transcriptSchema = z.object({
  messages: z.array(
    z.object({
      speaker: z.enum(["EMPLOYEE", "CHARACTER"]),
      content: z.string().min(1),
      clientId: z.string().optional(),
      audioDurationMs: z.number().optional(),
    })
  ),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;

  if (!isVoiceEnabled()) {
    return NextResponse.json({ error: "Voice mode is not enabled" }, { status: 403 });
  }

  const { id } = await params;

  const attempt = await prisma.practiceAttempt.findUnique({
    where: { id },
    include: { messages: true },
  });

  if (!attempt || attempt.userId !== authResult.user.id) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }

  if (attempt.mode !== "VOICE" || attempt.status !== "IN_PROGRESS") {
    return NextResponse.json({ error: "Invalid voice attempt" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = transcriptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid transcript" }, { status: 400 });
  }

  const seen = new Set<string>();
  const deduped = parsed.data.messages.filter((m) => {
    const key = m.clientId ?? `${m.speaker}-${m.content}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  let sequence = 1;
  await prisma.$transaction(async (tx) => {
    await tx.practiceMessage.deleteMany({ where: { attemptId: id } });
    for (const msg of deduped) {
      await tx.practiceMessage.create({
        data: {
          attemptId: id,
          speaker: msg.speaker,
          content: msg.content,
          sequence,
          audioDurationMs: msg.audioDurationMs,
          metadata: msg.clientId ? { clientId: msg.clientId } : undefined,
        },
      });
      sequence += 1;
    }
  });

  return NextResponse.json({ success: true, messageCount: deduped.length });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;

  if (!isVoiceEnabled()) {
    return NextResponse.json({ error: "Voice mode is not enabled" }, { status: 403 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OpenAI is not configured" }, { status: 503 });
  }

  const { id } = await params;

  const rate = checkRateLimit(`voice-session:${authResult.user.id}`, 5);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many voice session requests. Please wait a moment." },
      { status: 429 }
    );
  }

  const attempt = await prisma.practiceAttempt.findUnique({ where: { id } });

  if (!attempt || attempt.userId !== authResult.user.id) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }

  if (attempt.mode !== "VOICE" || attempt.status !== "IN_PROGRESS") {
    return NextResponse.json({ error: "Invalid voice attempt" }, { status: 400 });
  }

  const snapshot = parseScenarioSnapshot(attempt.scenarioSnapshot);
  const instructions = buildRealtimeInstructions(snapshot);
  const safetyIdentifier = createHash("sha256")
    .update(authResult.user.id)
    .digest("hex");

  try {
    const response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
        "OpenAI-Safety-Identifier": safetyIdentifier,
      },
      body: JSON.stringify({
        session: {
          type: "realtime",
          model: practiceLabConfig.realtimeModel,
          instructions,
          audio: {
            input: { turn_detection: { type: "server_vad" } },
            output: { voice: "marin" },
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logPracticeEvent("voice_connection_failed", { attemptId: id, error: errorText });
      return NextResponse.json({ error: "Failed to create voice session" }, { status: 502 });
    }

    const data = await response.json();
    const clientSecret = data.value ?? data.client_secret?.value;

    if (!clientSecret) {
      return NextResponse.json({ error: "Invalid session response" }, { status: 502 });
    }

    logPracticeEvent("voice_session_started", { attemptId: id });

    return NextResponse.json({
      clientSecret,
      expiresAt: data.expires_at,
      model: practiceLabConfig.realtimeModel,
      characterName: snapshot.aiCharacterName,
      openingMessage: snapshot.openingMessage,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Voice session failed";
    logPracticeEvent("voice_connection_failed", { attemptId: id, error: message });
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

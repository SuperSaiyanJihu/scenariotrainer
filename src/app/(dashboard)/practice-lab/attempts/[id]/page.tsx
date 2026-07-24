import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/practice-lab/server-data";
import { TextConversation } from "@/components/practice-lab/text-conversation";
import { VoiceConversation } from "@/components/practice-lab/voice-conversation";
import { parseScenarioSnapshot } from "@/lib/practice-lab/scenario-utils";

export default async function AttemptPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ fallback?: string }>;
}) {
  const user = await requireSessionUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const { fallback } = await searchParams;

  const attempt = await prisma.practiceAttempt.findUnique({
    where: { id },
    include: { messages: { orderBy: { sequence: "asc" } } },
  });

  if (!attempt || attempt.userId !== user.id) notFound();

  if (attempt.status !== "IN_PROGRESS") {
    redirect(`/practice-lab/attempts/${id}/feedback`);
  }

  const snapshot = parseScenarioSnapshot(attempt.scenarioSnapshot);

  if (attempt.mode === "VOICE" && fallback !== "text") {
    return (
      <VoiceConversation
        attemptId={id}
        characterName={snapshot.aiCharacterName}
        characterRole={snapshot.aiCharacterRole}
        scenarioTitle={snapshot.title}
        maxDurationMinutes={snapshot.maximumDurationMinutes}
        startedAt={attempt.startedAt.toISOString()}
      />
    );
  }

  return (
    <TextConversation
      attemptId={id}
      initialMessages={attempt.messages.map((m) => ({
        id: m.id,
        speaker: m.speaker,
        content: m.content,
        sequence: m.sequence,
      }))}
      characterName={snapshot.aiCharacterName}
      characterRole={snapshot.aiCharacterRole}
      scenarioTitle={snapshot.title}
      maxDurationMinutes={snapshot.maximumDurationMinutes}
      startedAt={attempt.startedAt.toISOString()}
      isPreview={attempt.isPreview}
    />
  );
}

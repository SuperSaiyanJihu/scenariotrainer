import { prisma } from "@/lib/db";
import { logPracticeEvent } from "@/lib/practice-lab/logger";

/**
 * Soft-purge old transcripts according to AppSettings.transcriptRetentionDays.
 * Keeps attempt completion metadata; removes message content beyond retention.
 */
export async function enforceTranscriptRetention(): Promise<{ purgedAttempts: number }> {
  const settings = await prisma.appSettings.findUnique({ where: { id: "default" } });
  const retentionDays = settings?.transcriptRetentionDays ?? 365;
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  const oldAttempts = await prisma.practiceAttempt.findMany({
    where: {
      endedAt: { lt: cutoff },
      status: { in: ["COMPLETED", "FAILED", "ABANDONED"] },
      messages: { some: {} },
    },
    select: { id: true },
    take: 100,
  });

  for (const attempt of oldAttempts) {
    await prisma.practiceMessage.deleteMany({ where: { attemptId: attempt.id } });
  }

  if (oldAttempts.length > 0) {
    logPracticeEvent("attempt_completed", {
      retentionPurge: true,
      purgedAttempts: oldAttempts.length,
      retentionDays,
    });
  }

  return { purgedAttempts: oldAttempts.length };
}

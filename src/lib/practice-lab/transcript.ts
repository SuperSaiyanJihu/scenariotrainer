export function deduplicateVoiceTranscriptEvents<T extends { id: string; sequence: number }>(
  events: T[]
): T[] {
  const seen = new Set<string>();
  return events
    .filter((e) => {
      const key = `${e.sequence}-${e.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.sequence - b.sequence);
}

export function getNextSequence(existingSequences: number[]): number {
  if (existingSequences.length === 0) return 1;
  return Math.max(...existingSequences) + 1;
}

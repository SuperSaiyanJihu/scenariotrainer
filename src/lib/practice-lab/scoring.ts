export interface RubricCriterionInput {
  id: string;
  name: string;
  weight: number;
}

export interface CriterionScoreInput {
  criterionId: string;
  score: number;
}

export function validateRubricWeights(weights: number[]): { valid: boolean; total: number; error?: string } {
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (weights.some((w) => w < 0 || w > 100)) {
    return { valid: false, total, error: "Each weight must be between 0 and 100" };
  }
  if (total !== 100) {
    return { valid: false, total, error: `Rubric weights must total 100 (currently ${total})` };
  }
  return { valid: true, total };
}

export function calculateWeightedScores(
  criteria: RubricCriterionInput[],
  rawScores: CriterionScoreInput[]
): {
  overallScore: number;
  weightedScores: Array<{
    criterionId: string;
    criterionName: string;
    weight: number;
    rawScore: number;
    weightedScore: number;
  }>;
} {
  const scoreMap = new Map(rawScores.map((s) => [s.criterionId, s.score]));
  const weightedScores = criteria.map((criterion) => {
    const rawScore = Math.max(0, Math.min(100, scoreMap.get(criterion.id) ?? 0));
    const weightedScore = (rawScore * criterion.weight) / 100;
    return {
      criterionId: criterion.id,
      criterionName: criterion.name,
      weight: criterion.weight,
      rawScore,
      weightedScore,
    };
  });

  const overallScore = Math.round(
    weightedScores.reduce((sum, item) => sum + item.weightedScore, 0)
  );

  return { overallScore, weightedScores };
}

export function determinePassStatus(
  overallScore: number,
  passingScore: number,
  hasAutomaticFailure: boolean
): boolean {
  if (hasAutomaticFailure) return false;
  return overallScore >= passingScore;
}

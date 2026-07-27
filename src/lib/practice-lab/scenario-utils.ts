import type { PracticeScenario, PracticeRubricCriterion, PracticeCriticalError } from "@/generated/prisma/client";
import type { ScenarioSnapshot } from "@/types/practice-lab";

export function createScenarioSnapshot(
  scenario: PracticeScenario & {
    rubricCriteria: PracticeRubricCriterion[];
    criticalErrors: PracticeCriticalError[];
  }
): ScenarioSnapshot {
  return {
    id: scenario.id,
    title: scenario.title,
    slug: scenario.slug,
    description: scenario.description,
    category: scenario.category,
    difficulty: scenario.difficulty,
    estimatedMinutes: scenario.estimatedMinutes,
    employeeRole: scenario.employeeRole,
    aiCharacterName: scenario.aiCharacterName,
    aiCharacterRole: scenario.aiCharacterRole,
    aiCharacterDescription: scenario.aiCharacterDescription,
    startingEmotionalState: scenario.startingEmotionalState,
    conversationStyle: scenario.conversationStyle,
    situationBackground: scenario.situationBackground,
    openingMessage: scenario.openingMessage,
    roleplayInstructions: scenario.roleplayInstructions,
    hiddenCharacterInformation: scenario.hiddenCharacterInformation,
    escalationInstructions: scenario.escalationInstructions,
    deescalationConditions: scenario.deescalationConditions,
    successConditions: scenario.successConditions,
    prohibitedAssistantBehaviors: scenario.prohibitedAssistantBehaviors,
    policyContext: scenario.policyContext,
    modeAvailability: scenario.modeAvailability,
    passingScore: scenario.passingScore,
    maximumDurationMinutes: scenario.maximumDurationMinutes,
    version: scenario.version,
    rubricCriteria: scenario.rubricCriteria.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      weight: c.weight,
      scoringGuidance: c.scoringGuidance,
      positiveIndicators: c.positiveIndicators,
      negativeIndicators: c.negativeIndicators,
      sortOrder: c.sortOrder,
    })),
    criticalErrors: scenario.criticalErrors.map((e) => ({
      id: e.id,
      name: e.name,
      description: e.description,
      scoreEffect: e.scoreEffect,
      automaticFailure: e.automaticFailure,
      sortOrder: e.sortOrder,
    })),
  };
}

export function parseScenarioSnapshot(snapshot: unknown): ScenarioSnapshot {
  return snapshot as ScenarioSnapshot;
}

export function toPublicScenario(
  scenario: PracticeScenario
) {
  return {
    id: scenario.id,
    title: scenario.title,
    slug: scenario.slug,
    description: scenario.description,
    category: scenario.category,
    difficulty: scenario.difficulty,
    estimatedMinutes: scenario.estimatedMinutes,
    employeeRole: scenario.employeeRole,
    aiCharacterName: scenario.aiCharacterName,
    aiCharacterRole: scenario.aiCharacterRole,
    aiCharacterDescription: scenario.aiCharacterDescription,
    modeAvailability: scenario.modeAvailability,
    status: scenario.status,
  };
}

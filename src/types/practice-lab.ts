import type {
  AttemptMode,
  AttemptStatus,
  ScenarioCategory,
  ScenarioDifficulty,
  ScenarioStatus,
  ModeAvailability,
} from "@/generated/prisma/client";

export interface ScenarioSnapshot {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: ScenarioCategory;
  difficulty: ScenarioDifficulty;
  estimatedMinutes: number;
  employeeRole: string;
  aiCharacterName: string;
  aiCharacterRole: string;
  aiCharacterDescription: string;
  startingEmotionalState: string;
  conversationStyle: string;
  situationBackground: string;
  openingMessage: string;
  roleplayInstructions: string;
  hiddenCharacterInformation: string;
  escalationInstructions: string;
  deescalationConditions: string;
  successConditions: string;
  prohibitedAssistantBehaviors: string;
  policyContext: string;
  modeAvailability: ModeAvailability;
  passingScore: number;
  maximumDurationMinutes: number;
  version: number;
  rubricCriteria: Array<{
    id: string;
    name: string;
    description: string;
    weight: number;
    scoringGuidance: string;
    positiveIndicators: string;
    negativeIndicators: string;
    sortOrder: number;
  }>;
  criticalErrors: Array<{
    id: string;
    name: string;
    description: string;
    scoreEffect: number;
    automaticFailure: boolean;
    sortOrder: number;
  }>;
}

export interface CoachingSuggestion {
  title: string;
  suggestion: string;
  implementation: string;
}

export interface CoachingOutput {
  coachResponse: string;
  whatWentWell: string[];
  whatCouldImprove: string[];
  suggestions: CoachingSuggestion[];
  nextPracticeFocus: string;
}

export interface PublicScenario {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: ScenarioCategory;
  difficulty: ScenarioDifficulty;
  estimatedMinutes: number;
  employeeRole: string;
  aiCharacterName: string;
  aiCharacterRole: string;
  aiCharacterDescription: string;
  modeAvailability: ModeAvailability;
  status: ScenarioStatus;
}

export interface ScenarioLibraryItem extends PublicScenario {
  isAssigned: boolean;
  isRequired: boolean;
  dueDate: string | null;
  attemptCount: number;
  completed: boolean;
  assignmentId: string | null;
}

export interface AttemptSummary {
  id: string;
  mode: AttemptMode;
  status: AttemptStatus;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
}

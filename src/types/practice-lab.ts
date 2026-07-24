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

export interface EvidenceItem {
  sequence: number;
  quote: string;
  explanation: string;
}

export interface StrengthItem {
  title: string;
  explanation: string;
  evidenceSequences: number[];
}

export interface OpportunityItem {
  title: string;
  explanation: string;
  betterApproach: string;
  evidenceSequences: number[];
}

export interface CriticalErrorResult {
  criticalErrorId: string;
  detected: boolean;
  explanation: string;
  evidenceSequences: number[];
}

export interface SuggestedLanguageItem {
  situation: string;
  suggestion: string;
}

export interface ReflectionQuestionItem {
  question: string;
  purpose: string;
}

export interface EvaluationOutput {
  overallScore: number;
  passed: boolean;
  overallSummary: string;
  criterionScores: Array<{
    criterionId: string;
    criterionName: string;
    score: number;
    feedback: string;
    evidence: EvidenceItem[];
  }>;
  strengths: StrengthItem[];
  opportunities: OpportunityItem[];
  criticalErrors: CriticalErrorResult[];
  suggestedLanguage: SuggestedLanguageItem[];
  reflectionQuestions: ReflectionQuestionItem[];
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
  passingScore: number;
  status: ScenarioStatus;
  rubricCriteria: Array<{ id: string; name: string; description: string; weight: number }>;
}

export interface ScenarioLibraryItem extends PublicScenario {
  isAssigned: boolean;
  isRequired: boolean;
  dueDate: string | null;
  attemptCount: number;
  bestScore: number | null;
  mostRecentScore: number | null;
  passed: boolean;
  assignmentId: string | null;
}

export interface AttemptSummary {
  id: string;
  mode: AttemptMode;
  status: AttemptStatus;
  startedAt: string;
  endedAt: string | null;
  overallScore: number | null;
  passed: boolean | null;
  durationSeconds: number | null;
}

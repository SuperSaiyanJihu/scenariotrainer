-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('EMPLOYEE', 'SUPERVISOR', 'ADMINISTRATOR');

-- CreateEnum
CREATE TYPE "ScenarioStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ScenarioCategory" AS ENUM ('PARENT_CONVERSATIONS', 'INSTRUCTOR_COACHING', 'SUPERVISOR_FEEDBACK', 'COWORKER_COMMUNICATION');

-- CreateEnum
CREATE TYPE "ScenarioDifficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "ModeAvailability" AS ENUM ('TEXT_ONLY', 'VOICE_ONLY', 'TEXT_AND_VOICE');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "AttemptMode" AS ENUM ('TEXT', 'VOICE');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'EVALUATING', 'COMPLETED', 'FAILED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "MessageSpeaker" AS ENUM ('EMPLOYEE', 'CHARACTER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('SCENARIO_CREATED', 'SCENARIO_UPDATED', 'SCENARIO_PUBLISHED', 'SCENARIO_ARCHIVED', 'SCENARIO_DUPLICATED', 'ASSIGNMENT_CREATED', 'SETTINGS_UPDATED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'EMPLOYEE',
    "supervisorId" TEXT,
    "teamId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "practiceLabEnabled" BOOLEAN NOT NULL DEFAULT true,
    "practiceLabVoiceEnabled" BOOLEAN NOT NULL DEFAULT true,
    "supervisorCanViewTranscripts" BOOLEAN NOT NULL DEFAULT false,
    "transcriptRetentionDays" INTEGER NOT NULL DEFAULT 365,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeScenario" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "ScenarioCategory" NOT NULL,
    "difficulty" "ScenarioDifficulty" NOT NULL,
    "estimatedMinutes" INTEGER NOT NULL,
    "employeeRole" TEXT NOT NULL,
    "aiCharacterName" TEXT NOT NULL,
    "aiCharacterRole" TEXT NOT NULL,
    "aiCharacterDescription" TEXT NOT NULL,
    "startingEmotionalState" TEXT NOT NULL DEFAULT '',
    "conversationStyle" TEXT NOT NULL DEFAULT '',
    "situationBackground" TEXT NOT NULL,
    "openingMessage" TEXT NOT NULL,
    "roleplayInstructions" TEXT NOT NULL,
    "hiddenCharacterInformation" TEXT NOT NULL,
    "escalationInstructions" TEXT NOT NULL,
    "deescalationConditions" TEXT NOT NULL,
    "successConditions" TEXT NOT NULL,
    "prohibitedAssistantBehaviors" TEXT NOT NULL,
    "policyContext" TEXT NOT NULL DEFAULT '',
    "modeAvailability" "ModeAvailability" NOT NULL DEFAULT 'TEXT_AND_VOICE',
    "passingScore" INTEGER NOT NULL DEFAULT 70,
    "maximumDurationMinutes" INTEGER NOT NULL DEFAULT 15,
    "status" "ScenarioStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PracticeScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeScenarioVersion" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PracticeScenarioVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeRubricCriterion" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,
    "scoringGuidance" TEXT NOT NULL,
    "positiveIndicators" TEXT NOT NULL,
    "negativeIndicators" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PracticeRubricCriterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeCriticalError" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "scoreEffect" INTEGER NOT NULL DEFAULT 0,
    "automaticFailure" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PracticeCriticalError_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeAssignment" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "assignedToUserId" TEXT,
    "teamId" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "dueDate" TIMESTAMP(3),
    "minimumPassingScore" INTEGER,
    "maximumAttempts" INTEGER,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'ASSIGNED',
    "assignedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PracticeAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeAttempt" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "scenarioVersion" INTEGER NOT NULL,
    "scenarioSnapshot" JSONB NOT NULL,
    "userId" TEXT NOT NULL,
    "assignmentId" TEXT,
    "mode" "AttemptMode" NOT NULL,
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "isPreview" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "durationSeconds" INTEGER,
    "overallScore" INTEGER,
    "passed" BOOLEAN,
    "evaluatorVersion" TEXT NOT NULL DEFAULT '1.0',
    "roleplayModel" TEXT,
    "evaluationModel" TEXT,
    "modelMetadata" JSONB,
    "reflectionCompletedAt" TIMESTAMP(3),
    "evaluationRetryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PracticeAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeMessage" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "speaker" "MessageSpeaker" NOT NULL,
    "content" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "audioDurationMs" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PracticeMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeEvaluation" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "overallSummary" TEXT NOT NULL,
    "strengths" JSONB NOT NULL,
    "opportunities" JSONB NOT NULL,
    "suggestedLanguage" JSONB NOT NULL,
    "criticalErrors" JSONB NOT NULL,
    "evidence" JSONB NOT NULL,
    "nextPracticeFocus" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PracticeEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeCriterionScore" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "rubricCriterionId" TEXT,
    "criterionNameSnapshot" TEXT NOT NULL,
    "weightSnapshot" INTEGER NOT NULL,
    "rawScore" INTEGER NOT NULL,
    "weightedScore" DOUBLE PRECISION NOT NULL,
    "feedback" TEXT NOT NULL,
    "evidence" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PracticeCriterionScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeReflection" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT '',
    "employeeResponse" TEXT,
    "aiFollowUp" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PracticeReflection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "PracticeScenario_slug_key" ON "PracticeScenario"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PracticeScenarioVersion_scenarioId_version_key" ON "PracticeScenarioVersion"("scenarioId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "PracticeMessage_attemptId_sequence_key" ON "PracticeMessage"("attemptId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "PracticeEvaluation_attemptId_key" ON "PracticeEvaluation"("attemptId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeScenario" ADD CONSTRAINT "PracticeScenario_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeScenario" ADD CONSTRAINT "PracticeScenario_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeScenarioVersion" ADD CONSTRAINT "PracticeScenarioVersion_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "PracticeScenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeRubricCriterion" ADD CONSTRAINT "PracticeRubricCriterion_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "PracticeScenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeCriticalError" ADD CONSTRAINT "PracticeCriticalError_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "PracticeScenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeAssignment" ADD CONSTRAINT "PracticeAssignment_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "PracticeScenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeAssignment" ADD CONSTRAINT "PracticeAssignment_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeAssignment" ADD CONSTRAINT "PracticeAssignment_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeAssignment" ADD CONSTRAINT "PracticeAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeAttempt" ADD CONSTRAINT "PracticeAttempt_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "PracticeScenario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeAttempt" ADD CONSTRAINT "PracticeAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeAttempt" ADD CONSTRAINT "PracticeAttempt_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "PracticeAssignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeMessage" ADD CONSTRAINT "PracticeMessage_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "PracticeAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeEvaluation" ADD CONSTRAINT "PracticeEvaluation_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "PracticeAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeCriterionScore" ADD CONSTRAINT "PracticeCriterionScore_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "PracticeEvaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeCriterionScore" ADD CONSTRAINT "PracticeCriterionScore_rubricCriterionId_fkey" FOREIGN KEY ("rubricCriterionId") REFERENCES "PracticeRubricCriterion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeReflection" ADD CONSTRAINT "PracticeReflection_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "PracticeAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

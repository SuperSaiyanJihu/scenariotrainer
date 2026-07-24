import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DEFAULT_RUBRIC = [
  { name: "Listening and acknowledgment", description: "Demonstrates active listening and validates concerns", weight: 20, scoringGuidance: "Score based on whether the employee truly heard and acknowledged the concern before responding.", positiveIndicators: "Paraphrasing, validating feelings, not interrupting, showing empathy", negativeIndicators: "Interrupting, dismissing concerns, jumping to solutions too quickly", sortOrder: 0 },
  { name: "Clarifying questions and discovery", description: "Asks effective questions to understand the situation", weight: 20, scoringGuidance: "Score based on quality and timing of clarifying questions.", positiveIndicators: "Open-ended questions, specific follow-ups, gathering relevant details", negativeIndicators: "Yes/no only questions, no questions asked, irrelevant questions", sortOrder: 1 },
  { name: "Professionalism and composure", description: "Maintains calm, professional demeanor throughout", weight: 15, scoringGuidance: "Score based on tone, language, and emotional regulation.", positiveIndicators: "Calm tone, respectful language, patience under pressure", negativeIndicators: "Defensive, argumentative, condescending, or unprofessional language", sortOrder: 2 },
  { name: "Accuracy and policy alignment", description: "Provides accurate information aligned with policies", weight: 15, scoringGuidance: "Score based on factual accuracy and policy adherence.", positiveIndicators: "Accurate program information, appropriate policy references", negativeIndicators: "Incorrect information, unauthorized promises, policy violations", sortOrder: 3 },
  { name: "Ownership and accountability", description: "Takes appropriate ownership without blaming others", weight: 15, scoringGuidance: "Score based on accountability and avoiding blame.", positiveIndicators: "Taking responsibility, avoiding blame, unified front", negativeIndicators: "Blaming instructors, swimmers, or colleagues; deflecting responsibility", sortOrder: 4 },
  { name: "Resolution and clear next step", description: "Identifies concrete, appropriate next steps", weight: 15, scoringGuidance: "Score based on clarity and appropriateness of proposed next steps.", positiveIndicators: "Specific follow-up actions, clear timelines, mutual agreement", negativeIndicators: "Vague promises, no next step, unrealistic commitments", sortOrder: 5 },
];

const DEFAULT_CRITICAL_ERRORS = [
  { name: "Criticizing another employee to a parent", description: "Speaking negatively about an instructor or colleague to a parent", scoreEffect: 0, automaticFailure: true, sortOrder: 0 },
  { name: "Sharing private employee information", description: "Disclosing confidential employee details", scoreEffect: 0, automaticFailure: true, sortOrder: 1 },
  { name: "Arguing with or insulting the parent", description: "Becoming argumentative or using disrespectful language", scoreEffect: 0, automaticFailure: true, sortOrder: 2 },
  { name: "Making an unauthorized promise", description: "Promising something outside their authority", scoreEffect: 0, automaticFailure: true, sortOrder: 3 },
  { name: "Guaranteeing an uncontrollable outcome", description: "Guaranteeing results they cannot control", scoreEffect: 0, automaticFailure: false, sortOrder: 4 },
  { name: "Ending without identifying a next step", description: "Concluding without a clear follow-up action", scoreEffect: 0, automaticFailure: false, sortOrder: 5 },
];

const SCENARIOS = [
  {
    title: "Parent Says Swimmer Is Not Progressing",
    slug: "parent-swimmer-not-progressing",
    description: "Practice responding to a concerned parent who believes their swimmer hasn't shown progress over several months.",
    category: "PARENT_CONVERSATIONS" as const,
    difficulty: "INTERMEDIATE" as const,
    estimatedMinutes: 10,
    employeeRole: "Front desk staff or aquatics supervisor",
    aiCharacterName: "Sarah Mitchell",
    aiCharacterRole: "Parent of an enrolled swimmer",
    aiCharacterDescription: "Sarah is a dedicated parent who wants the best for her 8-year-old daughter Emma. She is frustrated but respectful, and becomes more upset with generic reassurances.",
    startingEmotionalState: "Frustrated and concerned, but willing to listen if taken seriously",
    conversationStyle: "Direct but not aggressive; speaks from a parent's perspective",
    situationBackground: "Emma has been in Level 2 for about 4 months. Sarah feels she hasn't moved up and has noticed other children advancing faster. She enrolled Emma to build confidence and swimming skills.",
    openingMessage: "Hi, I need to talk to someone about my daughter Emma's progress. She's been in the same level for months and I honestly don't see her getting any better. What's going on?",
    roleplayInstructions: "Stay in character as a concerned parent seeking answers.",
    hiddenCharacterInformation: "Emma practices at home in a small pool but struggles with breathing technique. Sarah compared Emma to a neighbor's child who advanced faster. She would calm down if someone asks about Emma's specific challenges and offers a concrete review.",
    escalationInstructions: "Dismissive responses, generic reassurance without specifics, blaming Emma or the instructor, interrupting",
    deescalationConditions: "Listen without interrupting, acknowledge her concern, ask specific questions about Emma's experience, offer a concrete review or follow-up step",
    successConditions: "Parent feels heard, understands next steps, and agrees to a follow-up plan such as a progress review with the instructor",
    prohibitedAssistantBehaviors: "Do not coach the employee. Do not resolve instantly. Do not become abusive or unrealistic.",
    policyContext: "Excel Aquatics progress is individualized. Staff should not guarantee advancement timelines. Progress reviews can be scheduled with instructors.",
    passingScore: 70,
    maximumDurationMinutes: 15,
  },
  {
    title: "Parent Requests an Instructor Switch",
    slug: "parent-instructor-switch",
    description: "Practice handling a parent who wants to change their child's instructor immediately.",
    category: "PARENT_CONVERSATIONS" as const,
    difficulty: "INTERMEDIATE" as const,
    estimatedMinutes: 10,
    employeeRole: "Aquatics supervisor or program coordinator",
    aiCharacterName: "David Chen",
    aiCharacterRole: "Parent of a young swimmer",
    aiCharacterDescription: "David is polite but firm. He believes the current instructor isn't a good fit and wants action today.",
    startingEmotionalState: "Concerned and determined, slightly guarded about the full reason",
    conversationStyle: "Measured and factual, opens up when asked good questions",
    situationBackground: "David's 6-year-old son Lucas has been with Instructor Mike for two sessions. David wants a switch but hasn't fully explained why yet.",
    openingMessage: "I'd like to request a different instructor for my son Lucas. I don't think his current instructor is the right fit. Can we make that change?",
    roleplayInstructions: "Stay in character as a parent advocating for their child.",
    hiddenCharacterInformation: "Lucas seems anxious before lessons and told David he doesn't want to go. David worried about saying something negative about Mike. He would accept observation and follow-up if his concerns are validated.",
    escalationInstructions: "Immediately defending the instructor, dismissing concerns, promising an instant switch without process",
    deescalationConditions: "Ask about specific observations, validate concerns, explain reasonable process, offer observation or follow-up",
    successConditions: "Parent feels understood and agrees to a reasonable next step such as observation or supervisor follow-up",
    prohibitedAssistantBehaviors: "Do not criticize Mike. Do not promise immediate switch without checking availability.",
    policyContext: "Instructor changes follow availability and supervisor approval. Staff protect employee privacy and maintain a unified front.",
    passingScore: 70,
    maximumDurationMinutes: 15,
  },
  {
    title: "Instructor Deviates From Curriculum",
    slug: "instructor-curriculum-deviation",
    description: "Practice giving constructive feedback to an instructor who is not following the Excel Aquatics curriculum.",
    category: "INSTRUCTOR_COACHING" as const,
    difficulty: "ADVANCED" as const,
    estimatedMinutes: 12,
    employeeRole: "Aquatics supervisor",
    aiCharacterName: "Jordan Taylor",
    aiCharacterRole: "Swim instructor",
    aiCharacterDescription: "Jordan is experienced and confident in their teaching style. They believe their personal approach works better than the standard curriculum.",
    startingEmotionalState: "Mildly defensive but open to respectful conversation",
    conversationStyle: "Professional, may push back with reasoning",
    situationBackground: "During observations, you've noticed Jordan skipping prescribed skill progressions and using their own drills. Swimmers in their class show inconsistent skill development.",
    openingMessage: "You wanted to talk? I have a class starting soon. Is this about the observation?",
    roleplayInstructions: "Stay in character as an instructor who needs coaching, not criticism.",
    hiddenCharacterInformation: "Jordan had success with a previous employer using different methods. They feel the curriculum is too rigid for some swimmers. They respond well to specific examples and being asked for their perspective.",
    escalationInstructions: "Vague criticism, public-sounding reprimand tone, attacking Jordan's competence, not listening to their perspective",
    deescalationConditions: "Private respectful tone, specific observable examples, ask for their perspective, connect to swimmer outcomes, confirm next steps",
    successConditions: "Instructor acknowledges the concern and commits to following curriculum with specific changes",
    prohibitedAssistantBehaviors: "Do not be condescending. Do not threaten without cause.",
    policyContext: "Excel Aquatics curriculum ensures consistency across locations. Supervisors address issues privately and support instructor development.",
    passingScore: 70,
    maximumDurationMinutes: 15,
  },
  {
    title: "Supervisor Gives Feedback to Another Supervisor",
    slug: "supervisor-peer-feedback",
    description: "Practice addressing a disagreement with a fellow supervisor about a staffing decision.",
    category: "SUPERVISOR_FEEDBACK" as const,
    difficulty: "ADVANCED" as const,
    estimatedMinutes: 12,
    employeeRole: "Aquatics supervisor",
    aiCharacterName: "Alex Rivera",
    aiCharacterRole: "Fellow aquatics supervisor",
    aiCharacterDescription: "Alex made a scheduling decision you question. They are competent but may feel second-guessed.",
    startingEmotionalState: "Slightly guarded, professional",
    conversationStyle: "Direct, values respect and shared goals",
    situationBackground: "Alex moved an instructor to a different shift without consulting you, affecting your team's coverage. Staff are confused about who to report to.",
    openingMessage: "Hey, you said you wanted to chat? I saw your message about the schedule change.",
    roleplayInstructions: "Stay in character as a fellow supervisor who may defend their decision.",
    hiddenCharacterInformation: "Alex made the change because of a family emergency request from the instructor. They didn't communicate because it was last-minute. They respond well to curiosity and shared goals.",
    escalationInstructions: "Blaming, assigning bad motives, gossiping about staff, public-sounding criticism",
    deescalationConditions: "Private setting, ask for context, explain impact clearly, focus on standards and outcomes, agree on next steps",
    successConditions: "Both supervisors align on communication expectations and next steps for staff clarity",
    prohibitedAssistantBehaviors: "Do not become hostile. Do not gossip about staff.",
    policyContext: "Supervisors maintain a unified front with staff. Schedule changes affecting multiple teams require communication.",
    passingScore: 70,
    maximumDurationMinutes: 15,
  },
];

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  await prisma.appSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", practiceLabEnabled: true, practiceLabVoiceEnabled: true, supervisorCanViewTranscripts: false, transcriptRetentionDays: 365 },
  });

  const team = await prisma.team.upsert({
    where: { id: "team-main" },
    update: {},
    create: { id: "team-main", name: "Excel Aquatics - Main", description: "Primary aquatics team" },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@goswimexcel.com" },
    update: {},
    create: { email: "admin@goswimexcel.com", name: "Admin User", passwordHash, role: "ADMINISTRATOR", teamId: team.id },
  });

  const supervisor = await prisma.user.upsert({
    where: { email: "supervisor@goswimexcel.com" },
    update: {},
    create: { email: "supervisor@goswimexcel.com", name: "Supervisor User", passwordHash, role: "SUPERVISOR", teamId: team.id },
  });

  await prisma.user.upsert({
    where: { email: "employee@goswimexcel.com" },
    update: {},
    create: { email: "employee@goswimexcel.com", name: "Employee User", passwordHash, role: "EMPLOYEE", teamId: team.id, supervisorId: supervisor.id },
  });

  for (const scenarioData of SCENARIOS) {
    const existing = await prisma.practiceScenario.findUnique({ where: { slug: scenarioData.slug } });
    if (existing) continue;

    const scenario = await prisma.practiceScenario.create({
      data: {
        ...scenarioData,
        modeAvailability: "TEXT_AND_VOICE",
        status: "PUBLISHED",
        version: 1,
        createdById: admin.id,
        updatedById: admin.id,
        rubricCriteria: { create: DEFAULT_RUBRIC },
        criticalErrors: { create: scenarioData.category === "PARENT_CONVERSATIONS" ? DEFAULT_CRITICAL_ERRORS : DEFAULT_CRITICAL_ERRORS.filter((e) => !e.name.toLowerCase().includes("parent")) },
      },
      include: { rubricCriteria: true, criticalErrors: true },
    });

    const employee = await prisma.user.findUnique({ where: { email: "employee@goswimexcel.com" } });
    if (employee) {
      await prisma.practiceAssignment.create({
        data: { scenarioId: scenario.id, assignedToUserId: employee.id, assignedById: admin.id, required: true, dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      });
    }
  }

  console.log("Seed completed");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });

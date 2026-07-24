# Practice Lab — Developer Documentation

## Architecture

Performance Pulse is a Next.js 15 application with App Router, using:

- **Frontend**: React 19, Tailwind CSS, Radix UI primitives
- **Backend**: Next.js API routes (server-side)
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: NextAuth.js v5 with JWT sessions and role-based access
- **AI**: OpenAI Responses API (text role-play + evaluation), Realtime API (voice)

## Data Model

Core Practice Lab entities:

| Model | Purpose |
|-------|---------|
| `PracticeScenario` | Scenario definition with character, logic, and settings |
| `PracticeRubricCriterion` | Weighted evaluation criteria (must total 100%) |
| `PracticeCriticalError` | Automatic-failure error definitions |
| `PracticeAssignment` | Scenario assignments to users/teams |
| `PracticeAttempt` | Individual practice session with scenario snapshot |
| `PracticeMessage` | Transcript messages (employee, character, system) |
| `PracticeEvaluation` | Structured evaluation results |
| `PracticeCriterionScore` | Per-criterion scores with evidence |
| `PracticeReflection` | Post-evaluation reflection Q&A |

## Text Role-Play Lifecycle

1. Employee selects scenario and mode (text)
2. Server validates authorization, creates attempt with scenario snapshot
3. Opening message saved as first character message
4. Employee sends message → server calls OpenAI Responses API with protected system prompt
5. Character response saved to transcript
6. Employee clicks "End Conversation"
7. Attempt status → `EVALUATING`
8. Separate evaluator call with structured output schema
9. Application code calculates weighted scores and pass/fail
10. Results saved; employee views feedback and completes reflection

## Voice Role-Play Lifecycle

1. Employee selects voice mode
2. Server creates attempt and returns opening message
3. Browser requests ephemeral credential from `/api/practice-lab/attempts/[id]/voice`
4. Server calls OpenAI `client_secrets` endpoint (no permanent key exposed)
5. Browser establishes WebRTC connection via OpenAI Realtime API
6. Live transcript captured via data channel events
7. On end: transcript synced to server, same evaluator runs
8. Standard feedback and reflection flow

## Prompt Separation

Three distinct prompt contexts:

1. **Role-play system prompt** — Character behavior, hidden info, escalation rules. Protected server-side. Includes injection resistance instructions.
2. **Evaluator system prompt** — Rubric, critical errors, policy context. Never sent to role-play model.
3. **Transcript** — Treated as untrusted evidence by evaluator.

## Evaluation Schema

Validated with Zod (`src/lib/practice-lab/evaluation-schema.ts`). OpenAI structured outputs via Responses API `text.format` with `json_schema` and `strict: true`.

Weighted scores calculated in application code (`src/lib/practice-lab/scoring.ts`), not by the model.

## Security Model

- OpenAI API key server-side only
- Ephemeral voice credentials (short-lived, no permanent key in browser)
- Authorization on every API route
- Role-based transcript access (supervisor scope respected)
- Scenario snapshots preserve historical interpretability
- Audit logging for admin changes
- Rate limiting via turn/duration/retry limits
- Input length limits (2000 chars per message)

## Environment Variables

See `.env.example`. Models configurable without code changes.

## Testing

Unit tests in `src/lib/practice-lab/scoring.test.ts` cover:
- Rubric weight validation
- Weighted score calculation
- Pass/fail determination
- Evaluation schema validation
- Prompt injection boundaries
- Voice event deduplication

External AI calls are not made in tests.

## Adding Rubric Criteria

Administrators add criteria via the scenario builder. Weights must total 100%. Each criterion needs:
- Name, description, weight
- Scoring guidance, positive/negative indicators

## Changing Models Safely

Update environment variables:
```
OPENAI_ROLEPLAY_MODEL=gpt-4o-mini
OPENAI_EVALUATION_MODEL=gpt-4o-mini
OPENAI_REALTIME_MODEL=gpt-4o-realtime-preview
```

Test with admin preview before deploying to production.

## Known Limitations

- Voice requires browser WebRTC and microphone support
- Realtime API transcript events depend on OpenAI event format
- Evaluation requires OpenAI API key (no offline mode)
- Supervisor transcript access controlled by `supervisorCanViewTranscripts` setting

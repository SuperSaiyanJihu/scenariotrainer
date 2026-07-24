# Performance Pulse — Practice Lab

Excel Aquatics employee training platform with AI-powered conversation practice.

## Features

- **Practice Lab** — Text and voice role-play with AI characters
- **Rubric-based evaluation** — Separate evaluator with structured feedback
- **Administrator scenario builder** — Create and publish scenarios without code changes
- **Supervisor reporting** — View team completion and scores
- **Role-based access** — Employee, Supervisor, Administrator

## Quick Start (Local)

### Prerequisites

- Node.js 20+
- Docker (for PostgreSQL) or local PostgreSQL
- OpenAI API key

### Setup

```bash
# Start PostgreSQL
docker compose up -d

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your OPENAI_API_KEY and AUTH_SECRET

# Run migrations and seed
npm run db:migrate
npm run db:seed

# Start development server
npm run dev
```

Open http://localhost:3000

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Administrator | admin@goswimexcel.com | password123 |
| Supervisor | supervisor@goswimexcel.com | password123 |
| Employee | employee@goswimexcel.com | password123 |

## Environment Variables

See `.env.example` for all variables. Key settings:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | NextAuth secret (generate with `openssl rand -base64 32`) |
| `OPENAI_API_KEY` | OpenAI API key (server-side only) |
| `OPENAI_ROLEPLAY_MODEL` | Model for character responses |
| `OPENAI_EVALUATION_MODEL` | Model for evaluation |
| `OPENAI_REALTIME_MODEL` | Model for voice sessions |
| `PRACTICE_LAB_ENABLED` | Feature flag |
| `PRACTICE_LAB_VOICE_ENABLED` | Voice mode flag |

## Railway Deployment

1. Create a new Railway project
2. Add a PostgreSQL database service
3. Add the app service from this repository
4. Set environment variables from `.env.example`
5. Set `DATABASE_URL` from the PostgreSQL service
6. Generate and set `AUTH_SECRET`
7. Set `NEXTAUTH_URL` to your Railway app URL
8. Deploy — migrations run automatically via `railway.json`

## Testing

```bash
npm test          # Unit tests
npm run test:e2e  # End-to-end tests (requires running app)
npm run lint      # ESLint
npm run build     # Production build
```

## Documentation

- [Developer Guide](docs/DEVELOPER.md)
- [Administrator Guide](docs/ADMINISTRATOR.md)

## Architecture

Next.js 15 full-stack application with:
- Prisma ORM + PostgreSQL
- NextAuth.js authentication
- OpenAI Responses API (role-play + evaluation)
- OpenAI Realtime API (voice via WebRTC)

See [docs/DEVELOPER.md](docs/DEVELOPER.md) for detailed architecture documentation.

# Project Setup Guide

Fastest guide to get the LLM Capability Replay project running.

## Prerequisites

- **Node.js**: v18 or higher
- **pnpm**: v8 or higher
- **Docker**: For PostgreSQL database
- **OpenAI API key**: Required for LLM discovery
- **Access to target application**: Required for live discovery/replay

## Installation

```bash
pnpm install
```

## Environment

Copy the example environment file:
```bash
cp apps/api/.env.example apps/api/.env
```

Configure the following environment variables in `apps/api/.env`:

```bash
# Required for LLM discovery
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-4

# Target application URL
MARINER_PRO_URL=https://your-target-application.com

# Discovery configuration
DISCOVERY_MAX_STEPS=20
DISCOVERY_TIMEOUT=300000

# Optional: Run browser in headed mode for live visibility
HEADLESS=false

# Database (PostgreSQL via Docker Compose)
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/llm_capability_replay?schema=public"

# API configuration
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
```

**Important:**
- `OPENAI_API_KEY` is required for LLM discovery
- `MARINER_PRO_URL` should point to your target application
- `HEADLESS=false` can be set to run browser in visible mode for demonstration
- Do not commit real API keys or credentials

## Database

The project uses PostgreSQL via Docker Compose.

Start the database:
```bash
docker-compose up -d
```

The database runs on port 5433.

Stop the database:
```bash
docker-compose down
```

Run Prisma migrations:
```bash
pnpm --filter api db:migrate
```

## Run API

Start the API server:
```bash
pnpm --filter api dev
```

The API will be available at `http://localhost:3000`

## Run Tests

Run all tests:
```bash
pnpm --filter api test
```

Run tests in watch mode:
```bash
pnpm --filter api test:watch
```

## Build

TypeScript build:
```bash
pnpm --filter api build
```

## Lint

ESLint:
```bash
pnpm --filter api lint
```

## Run LLM Discovery

Manual command for real LLM-driven discovery:
```bash
pnpm --filter api discovery:demo --goal "Find Auxiliary Engine course and open the Construction section"
```

This requires:
- Valid `OPENAI_API_KEY` in `.env`
- Valid `MARINER_PRO_URL` in `.env`

Evidence is written to `evidence/discovery-YYYYMMDD-HHMMSS/`

## Run Deterministic Replay

Manual command for deterministic replay:
```bash
pnpm --filter api replay --artifact mariner-pro
```

Or load from a file:
```bash
pnpm --filter api replay --artifact path/to/artifact.json
```

Evidence is written to `evidence/replay-YYYYMMDD-HHMMSS/`

## Run Human Handoff Demo

Manual command for human-in-the-loop handoff:
```bash
pnpm --filter api handoff:demo --artifact mariner-pro
```

Evidence is written to `evidence/replay-YYYYMMDD-HHMMSS/`

## Troubleshooting

**Database not running:**
```bash
docker-compose up -d
```

**Missing API key:**
- Ensure `OPENAI_API_KEY` is set in `apps/api/.env`
- Do not use placeholder values

**Missing target URL:**
- Ensure `MARINER_PRO_URL` is set in `apps/api/.env`
- Use a real accessible URL for testing

**Browser launch problems:**
- Ensure Playwright browsers are installed:
  ```bash
  npx playwright install
  ```

**Port already in use:**
- Check if port 3000 is in use: `lsof -i :3000` (macOS/Linux) or `netstat -ano | findstr :3000` (Windows)
- Change `PORT` in `.env` if needed

**Prisma migration errors:**
- Ensure database is running: `docker-compose up -d`
- Regenerate Prisma client: `pnpm --filter api db:generate`

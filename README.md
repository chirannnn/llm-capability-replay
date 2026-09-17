# LLM Capability Replay

LLM discovers UI workflows once; deterministic replay runs them afterward — no model in the loop.

## Phase 1 Status

Foundation phase complete. Basic infrastructure set up including:
- Monorepo structure with apps/api and apps/web
- Express API with /health and /ready endpoints
- PostgreSQL schema with Prisma
- Pino logging
- Environment validation with Zod
- Docker Compose for PostgreSQL

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Start PostgreSQL:
```bash
docker-compose up -d
```

3. Copy environment variables:
```bash
cp apps/api/.env.example apps/api/.env
```

4. Run Prisma migrations:
```bash
pnpm db:migrate
```

5. Start API:
```bash
pnpm dev
```

## Health Checks

- `GET http://localhost:3000/health` - Basic health check
- `GET http://localhost:3000/ready` - Readiness check

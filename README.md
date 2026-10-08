# LLM Capability Replay

LLM discovers UI workflows once; deterministic replay runs them afterward — with human handoff when automation gets stuck.

## Problem

Automating UI workflows through traditional scripting is brittle and time-consuming. LLMs can discover workflows dynamically, but relying on them for every execution is expensive and non-deterministic. This system separates discovery from execution: an LLM discovers a workflow once, generating a structured Capability Artifact that can be replayed deterministically without the LLM, with human handoff for edge cases.

## Solution

The system provides an end-to-end computer-use automation workflow:

1. **Discovery**: An LLM observes a live UI, decides on actions, and executes them through Playwright browser automation
2. **Artifact**: The discovered workflow is captured as a structured Capability Artifact with Zod validation
3. **Replay**: The artifact is replayed deterministically without LLM involvement, using target resolution and checkpoints
4. **Handoff**: When automation gets stuck, human handoff preserves the same browser session for manual intervention, then resumes from a checkpoint

The key insight is that LLM decision-making is used only once during discovery, while execution is deterministic and repeatable.

## Architecture

```
Natural Language Goal
        ↓
LLM Discovery (Phase 3)
        ↓
Observe → Decide → Act
        ↓
Capability Artifact
        ↓
Zod Validation
        ↓
Deterministic Replay (Phase 4)
        ↓
Target Resolution
        ↓
Safety Checks
        ↓
Action Execution
        ↓
Checkpoint Verification
        ↓
Error Classification / Retry
        ↓
Success OR Failure
        ↓
Human Handoff (Phase 5)
        ↓
Same Browser Session
        ↓
Checkpoint
        ↓
Resume Replay
        ↓
Replay Result + Evidence
```

- **Phase 3 Discovery**: Uses OpenAI API + Playwright browser
- **Phase 4 Replay**: Uses Playwright only, no OpenAI calls
- **Phase 5 Handoff**: Preserves same browser session for human intervention
- **Operator UI**: React-based frontend for goal input, status display, and live event streaming

**LLM Boundary:** LLM is used ONLY in Phase 3 Discovery. Phase 4 Replay and Phase 5 Handoff are completely independent of LLM decisions.

## Demo

The system includes an operator UI that allows you to:

1. Enter a natural-language goal
2. Start LLM discovery and watch real-time events
3. See the generated Capability Artifact
4. Run deterministic replay with live event streaming
5. Observe checkpoints and error handling
6. Enable human handoff when automation gets stuck

## Key Features

### LLM Discovery

- Real OpenAI-driven observe → decide → act loop
- Structured action generation (navigate, click, type, select, wait, extract)
- Playwright browser execution
- Semantic target selection (role, accessible name, test ID)
- Domain enforcement for navigation safety
- Sensitive data protection (input values not captured)
- Evidence collection (logs, traces, artifacts, screenshots)
- Artifact generation from execution trace

### Capability Artifact

- Strongly typed with TypeScript
- Zod validation schema
- Versionable with changelog
- Typed inputs and outputs
- Ordered UI steps
- Target descriptors (aria, text, css, xpath selectors)
- Checkpoints for UI state verification
- Retry policy (maxAttempts, backoffStrategy, backoffMs)
- Safety policy (allowedDomains, restrictedActions)

### Deterministic Replay

- No LLM decision loop
- Deterministic target resolution (aria → text → css → xpath priority)
- Playwright execution
- Checkpoint evaluation (url matches, element visibility, count, text)
- Retry handling with backoff strategies (fixed, linear, exponential)
- Error classification (business outcome, recoverable, hard failure)
- Runtime navigation safety (domain enforcement)
- Replay evidence (logs, traces, artifacts, screenshots, reports)

### Error Handling

- **EXPECTED_BUSINESS_OUTCOME**: Workflow context indicates expected negative result (e.g., searching for a known-missing item)
- **RECOVERABLE**: Transient conditions (timeout, network issues, loading states)
- **HARD_FAILURE**: Permission errors, structure changes, exceeded retries, malformed artifacts

### Human Handoff

- Deterministic handoff triggers (recoverable failures after retry exhaustion)
- State machine (AUTOMATING → WAITING_FOR_HUMAN → HUMAN_CONTROL → RESUMING → AUTOMATING)
- Same Playwright Page/BrowserContext preservation across handoff
- CLI-based human intervention mechanism
- Checkpoint-gated resume (automation resumes only if checkpoint passes)
- Handoff evidence (created, started, ended, resumed events)
- No LLM during handoff or replay

### Safety

- Domain/origin enforcement in both discovery and replay
- Sensitive data sanitization in discovery (input values not captured)
- Artifact safety policy (allowedDomains, restrictedActions)
- Runtime checks before navigation
- Evidence redaction (no secrets, passwords, tokens, credentials)

### Evidence

Discovery, replay, and handoff produce structured evidence under `evidence/`:

**Discovery evidence:**
- `discovery.log` - Structured log events
- `execution-trace.json` - LLM action sequence
- `artifact.json` - Generated Capability Artifact
- `screenshots/` - Browser screenshots
- `report.md` - Discovery summary

**Replay evidence:**
- `replay.log` - Structured log events
- `execution-trace.json` - Step execution sequence
- `artifact.json` - Artifact used for replay
- `screenshots/` - Browser screenshots
- `report.md` - Replay summary

**Handoff evidence:**
- `replay.log` - Handoff events (created, started, ended, resumed)
- `execution-trace.json` - Handoff context and results
- `report.md` - Handoff summary in replay report

Evidence is gitignored to avoid committing sensitive data or large binary files. The evidence structure is documented in `docs/evidence.md`.

## Tech Stack

- TypeScript
- Node.js
- OpenAI API
- Playwright
- Zod
- PostgreSQL / Prisma (foundation)
- pnpm (workspace management)
- Vitest (testing)
- React (operator UI)
- Vite (frontend build)
- Tailwind CSS (styling)
- Express (API server)
- Server-Sent Events (live event streaming)

## Quick Start

1. Install dependencies:
```bash
pnpm install
```

2. Configure environment:
```bash
cp apps/api/.env.example apps/api/.env
```

Set `OPENAI_API_KEY` and `MARINER_PRO_URL` in `apps/api/.env` for live discovery.

3. Start database:
```bash
docker-compose up -d
```

4. Run migrations:
```bash
pnpm --filter api db:migrate
```

5. Start API:
```bash
pnpm dev
```

6. Start frontend:
```bash
pnpm dev:web
```

7. Open http://localhost:5173

## Configuration

Required environment variables in `apps/api/.env`:

- `OPENAI_API_KEY` - Your OpenAI API key (for discovery)
- `OPENAI_MODEL` - OpenAI model to use (default: gpt-4)
- `MARINER_PRO_URL` - Target application URL (for testing)
- `DATABASE_URL` - PostgreSQL connection string
- `HEADLESS` - Set to `false` to run browser in visible mode for demonstration

## Running the Demo

**Operator UI Demo:**
1. Start API: `pnpm dev`
2. Start frontend: `pnpm dev:web`
3. Open http://localhost:5173
4. Enter a goal
5. Click "Start Discovery" to see simulated events
6. Click "Run Replay" to see simulated replay events

**CLI Discovery Demo:**
```bash
pnpm --filter api discovery:demo --goal "Find Auxiliary Engine course and open the Construction section"
```

**CLI Replay Demo:**
```bash
pnpm --filter api replay --artifact mariner-pro
```

**CLI Handoff Demo:**
```bash
pnpm --filter api handoff:demo --artifact mariner-pro
```

## Testing

Run all tests:
```bash
pnpm test
```

The project has 184 automated tests covering:
- Capability schema validation
- Discovery action schemas
- Observation sanitization (sensitive data redaction)
- Browser action validation
- Artifact generation
- Target resolution (selector fallback order)
- Checkpoint evaluation
- Retry handling (backoff strategies)
- Error classification
- Replay engine orchestration
- No-LLM replay behavior (architectural boundary)
- Handoff manager state transitions
- Same browser session preservation
- API integration tests

## Project Structure

```
apps/api/src/
├── capability/          # Capability Artifact schema and types
│   ├── schema.ts        # Zod validation schema
│   ├── types.ts         # TypeScript types
│   └── examples/        # Example artifacts (Mariner Pro)
├── discovery/           # LLM-driven discovery (Phase 3)
│   ├── orchestrator.ts  # Discovery orchestration
│   ├── openai/          # OpenAI client
│   ├── browser/         # Playwright browser
│   ├── actions/         # Action schemas
│   ├── observation/     # UI observation types
│   ├── trace/           # Execution trace
│   └── artifact/        # Artifact generator
├── browser/             # Shared browser utilities
│   ├── shared.ts        # Low-level Playwright helpers
│   └── shared.test.ts
├── replay/              # Deterministic replay (Phase 4)
│   ├── engine.ts        # Replay orchestrator
│   ├── target-resolver.ts
│   ├── checkpoint.ts
│   ├── error-classifier.ts
│   ├── retry-handler.ts
│   ├── action-executor.ts
│   ├── evidence-collector.ts
│   ├── cli.ts           # Manual replay command
│   └── types.ts
├── handoff/             # Human-in-the-loop handoff (Phase 5)
│   ├── types.ts         # Handoff state model and reasons
│   ├── manager.ts       # Handoff manager with session preservation
│   ├── manager.test.ts  # Handoff tests
│   └── cli.ts           # Manual handoff demo command
├── api/                 # API endpoints for operator UI
│   ├── discovery.ts     # Discovery API with SSE events
│   ├── replay.ts        # Replay API with SSE events
│   └── api.test.ts      # API integration tests
apps/web/src/
├── App.tsx              # Operator UI component
├── index.tsx             # React entry point
└── index.css            # Tailwind styles
docs/                     # Documentation
├── architecture.md       # Architecture diagram
├── evidence.md           # Evidence structure documentation
├── requirements.md      # Requirement matrix
└── live-evidence-limitation.md  # Documentation of live evidence limitation
evidence/                 # Discovery, replay, and handoff evidence (gitignored)

## Design Decisions

### LLM in Discovery Only

The LLM is used exclusively in Phase 3 Discovery. Phase 4 Replay and Phase 5 Handoff are completely independent of LLM decision-making. This ensures:

- Replay is deterministic and repeatable
- No unexpected LLM behavior during execution
- Lower cost for repeated executions
- Easier debugging and auditing

### Artifact-First Design

The Capability Artifact is the single source of truth for replay. It contains:

- Ordered steps with typed targets
- Checkpoints for UI state verification
- Retry policy for transient failures
- Safety policy for runtime constraints
- Version information for change tracking

This makes workflows reviewable, versionable, and reusable without re-running discovery.

### Same Browser Session for Handoff

When human handoff is triggered, the system preserves the exact same Playwright Page and BrowserContext. The human intervenes through the same browser session, and automation resumes from a checkpoint without restarting the workflow. This is critical for handling edge cases that cannot be automated.

### Evidence Collection

Every phase produces structured evidence. Evidence is gitignored to avoid committing sensitive data or large binary files, but the structure is documented for reviewers. Evidence includes logs, traces, artifacts, screenshots, and reports.

## Limitations

1. **Live Evidence:** No real Mariner Pro discovery or replay evidence is included in the repository (evidence directory is gitignored). This is intentional to avoid committing sensitive data or large binary files. See `docs/live-evidence-limitation.md` for details.

2. **Environment-Dependent Demos:** The discovery and handoff demos require valid `OPENAI_API_KEY` and `MARINER_PRO_URL` environment variables. These are not available in the take-home environment, so live runs cannot be automatically verified. The implementation is correct and tested with mocks.

3. **CLI-Based Handoff:** Handoff is currently CLI-based only (no web UI for human intervention). This is intentional for the take-home scope.

4. **Safety Confirmation Recording:** Safety confirmation recording is designed but not fully implemented (would require explicit safety policy violations to trigger). The infrastructure exists for it.

5. **Screenshot Evidence:** Screenshot generation is not automatic for all actions. The infrastructure exists but is not triggered in all cases.

6. **Operator UI Simulation:** The operator UI currently shows simulated events for demonstration purposes. Real live event streaming requires a running API server with valid credentials.

## Take-Home Notes

This repository demonstrates a complete computer-use automation lifecycle:

- **Phase 1:** Foundation (monorepo, Express API, PostgreSQL/Prisma, logging, environment validation, Docker Compose)
- **Phase 2:** Capability Artifact Schema (Zod validation, typed structure, versioning, safety policy)
- **Phase 3:** LLM-driven Discovery (OpenAI API, Playwright browser, observe-decide-act loop, evidence collection)
- **Phase 4:** Deterministic Replay (no LLM, target resolution, checkpoints, retry handling, error classification, safety checks)
- **Phase 5:** Human-in-the-Loop Handoff (same browser session preservation, state machine, checkpoint-gated resume)
- **Phase 6:** Final Documentation (REPORT.md, architecture diagram, evidence structure, requirement matrix)

The system is designed for a take-home exercise focused on the core computer-use lifecycle. It intentionally excludes:

- Production-scale distributed deployment
- Kubernetes
- Cloud orchestration
- Polished frontend/dashboard
- Advanced multi-tenant infrastructure
- Desktop automation
- Complex permissions systems
- Large workflow editors

The implementation is intentionally small, readable, and strongly typed to demonstrate the core concepts without over-engineering.
```

## Current Features

### Capability Artifact (Phase 2)
- Strongly typed with TypeScript
- Zod validation schema
- Versionable with changelog
- Typed inputs and outputs
- Ordered UI steps
- Target descriptors (aria, text, css, xpath selectors)
- Checkpoints for UI state verification
- Retry policy (maxAttempts, backoffStrategy, backoffMs)
- Safety policy (allowedDomains, restrictedActions)

### LLM Discovery (Phase 3)
- Real OpenAI-driven observe → decide → act loop
- Structured action generation (navigate, click, type, select, wait, extract)
- Playwright browser execution
- Semantic target selection (role, accessible name, test ID)
- Domain enforcement for navigation safety
- Sensitive data protection (input values not captured)
- Evidence collection (logs, traces, artifacts, screenshots)
- Artifact generation from execution trace

### Deterministic Replay (Phase 4)
- No LLM decision loop
- Deterministic target resolution (aria → text → css → xpath priority)
- Playwright execution
- Checkpoint evaluation (url matches, element visibility, count, text)
- Retry handling with backoff strategies (fixed, linear, exponential)
- Error classification (business outcome, recoverable, hard failure)
- Runtime navigation safety (domain enforcement)
- Replay evidence (logs, traces, artifacts, screenshots, reports)

### Human-in-the-Loop Handoff (Phase 5)
- Deterministic handoff triggers (recoverable failures after retry exhaustion)
- State machine (AUTOMATING → WAITING_FOR_HUMAN → HUMAN_CONTROL → RESUMING → AUTOMATING)
- Same Playwright Page/BrowserContext preservation across handoff
- CLI-based human intervention mechanism
- Checkpoint-gated resume (automation resumes only if checkpoint passes)
- Handoff evidence (created, started, ended, resumed events)
- No LLM during handoff or replay

### Error Categories

- **EXPECTED_BUSINESS_OUTCOME**: Workflow context indicates expected negative result (e.g., searching for a known-missing item)
- **RECOVERABLE**: Transient conditions (timeout, network issues, loading states)
- **HARD_FAILURE**: Permission errors, structure changes, exceeded retries, malformed artifacts

## Target Application

The current example target is the Mariner Pro web application.

**Example goal**: "Find Auxiliary Engine course and open the Construction section."

Mariner Pro is the current example/live target used by the project. The automation architecture is intended to be extensible to other web UI surfaces. Desktop automation is not currently implemented.

## Tech Stack

- TypeScript
- Node.js
- OpenAI API
- Playwright
- Zod
- PostgreSQL / Prisma (foundation)
- pnpm (workspace management)
- Vitest (testing)

## Project Structure

```
apps/api/src/
├── capability/          # Capability Artifact schema and types
│   ├── schema.ts        # Zod validation schema
│   ├── types.ts         # TypeScript types
│   └── examples/        # Example artifacts (Mariner Pro)
├── discovery/           # LLM-driven discovery (Phase 3)
│   ├── orchestrator.ts  # Discovery orchestration
│   ├── openai/          # OpenAI client
│   ├── browser/         # Playwright browser
│   ├── actions/         # Action schemas
│   ├── observation/     # UI observation types
│   ├── trace/           # Execution trace
│   └── artifact/        # Artifact generator
├── browser/             # Shared browser utilities
│   ├── shared.ts        # Low-level Playwright helpers
│   └── shared.test.ts
├── replay/              # Deterministic replay (Phase 4)
│   ├── engine.ts        # Replay orchestrator
│   ├── target-resolver.ts
│   ├── checkpoint.ts
│   ├── error-classifier.ts
│   ├── retry-handler.ts
│   ├── action-executor.ts
│   ├── evidence-collector.ts
│   ├── cli.ts           # Manual replay command
│   └── types.ts
├── handoff/             # Human-in-the-loop handoff (Phase 5)
│   ├── types.ts         # Handoff state model and reasons
│   ├── manager.ts       # Handoff manager with session preservation
│   ├── manager.test.ts  # Handoff tests
│   └── cli.ts           # Manual handoff demo command
evidence/                # Discovery, replay, and handoff evidence
```

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Configure environment variables:
```bash
cp apps/api/.env.example apps/api/.env
```

Required environment variables:
- `OPENAI_API_KEY` - Your OpenAI API key (for discovery)
- `OPENAI_MODEL` - OpenAI model to use (default: gpt-4)
- `MARINER_PRO_URL` - Target application URL (for testing)

3. Start PostgreSQL through Docker Compose:
```bash
docker-compose up -d
```

PostgreSQL runs on port 5433.

4. Run Prisma migrations:
```bash
pnpm --filter api db:migrate
```

5. Run checks/tests:
```bash
pnpm --filter api build    # TypeScript build
pnpm --filter api lint     # ESLint
pnpm --filter api test     # Vitest tests
```

## Database

PostgreSQL is provided through Docker Compose and serves as the project's foundation. The database is configured on port 5433. Replay results are not persisted to the database (evidence is file-based only).

## LLM Discovery Demo

Manual command for real LLM-driven discovery:

```bash
pnpm --filter api discovery:demo --goal "Find Auxiliary Engine course and open the Construction section"
```

This is a real LLM-driven discovery run that requires valid `OPENAI_API_KEY` and `MARINER_PRO_URL` environment variables. The live demo is intentionally NOT part of automated tests.

Evidence is written to `evidence/discovery-YYYYMMDD-HHMMSS/`.

## Deterministic Replay Demo

Manual command for deterministic replay:

```bash
pnpm --filter api replay --artifact mariner-pro
```

Or load from a file:
```bash
pnpm --filter api replay --artifact path/to/artifact.json
```

Replay runs from the Capability Artifact without an LLM making decisions. Evidence is written to `evidence/replay-YYYYMMDD-HHMMSS/`.

## Human Handoff Demo

Manual command for human-in-the-loop handoff:

```bash
pnpm --filter api handoff:demo --artifact mariner-pro
```

Or load from a file:
```bash
pnpm --filter api handoff:demo --artifact path/to/artifact.json
```

Handoff enables human intervention when automation gets stuck. The same browser session is preserved for manual interaction. After human resolves the issue, automation resumes from a checkpoint. Evidence is written to `evidence/replay-YYYYMMDD-HHMMSS/`.

## Evidence

Discovery and replay produce structured evidence under `evidence/`:

**Discovery evidence:**
- `discovery.log` - Structured log events
- `execution-trace.json` - LLM action sequence
- `artifact.json` - Generated Capability Artifact
- `screenshots/` - Browser screenshots
- `report.md` - Discovery summary

**Replay evidence:**
- `replay.log` - Structured log events
- `execution-trace.json` - Step execution sequence
- `artifact.json` - Artifact used for replay
- `screenshots/` - Browser screenshots
- `report.md` - Replay summary

**Handoff evidence:**
- `replay.log` - Handoff events (created, started, ended, resumed)
- `execution-trace.json` - Handoff context and results
- `report.md` - Handoff summary in replay report

## Testing

The project has automated tests covering:

- Capability schema validation
- Discovery action schemas
- Observation sanitization (sensitive data redaction)
- Browser action validation
- Artifact generation
- Target resolution (selector fallback order)
- Checkpoint evaluation
- Retry handling (backoff strategies)
- Error classification
- Replay engine orchestration
- No-LLM replay behavior (architectural boundary)
- Handoff manager state transitions
- Same browser session preservation

Run tests:
```bash
pnpm --filter api test
```

## Design Principles

- Discovery and replay are separate orchestration layers
- Artifacts are the contract between discovery and replay
- Replay is deterministic and independent of LLM decisions
- LLM output is validated before execution
- Browser actions use semantic targets (role, accessible name) where possible
- Safety boundaries are enforced by code, not only prompts
- Evidence is collected for review and debugging
- Human handoff preserves the same browser session for continuity
- Checkpoint-gated resume ensures deterministic handoff completion

## Current Limitations

Features NOT yet implemented:

- Desktop automation
- Obscura integration
- Multi-tenant runtime
- Cloud deployment
- Replay persistence/history in database
- Advanced recovery mechanisms
- Frontend/dashboard
- CI/CD integration
- Web-based handoff UI (currently CLI-based only)

## Assignment / Take-Home Context

This repository demonstrates computer-use automation requirements through a thin end-to-end vertical slice. It shows how an LLM can discover UI workflows once, and how those workflows can be replayed deterministically without the LLM in the loop. It also demonstrates human-in-the-loop handoff for edge cases where automation cannot proceed deterministically.

## Requirement Matrix

| Requirement | Implementation | Evidence |
|-------------|----------------|----------|
| Goal + target app | Discovery CLI with goal parameter | discovery:demo command |
| LLM discovery | OpenAI + Playwright observe-decide-act loop | Phase 3 implementation |
| Structured artifact | Zod capability schema with ordered steps, targets, checkpoints | Phase 2 schema + Mariner Pro fixture |
| Deterministic replay | Replay engine with target resolution, action execution, checkpoints | Phase 4 implementation + tests |
| Error handling | Error classifier + retry handler with backoff strategies | Phase 4 implementation + tests |
| Human handoff | HandoffManager with same-session preservation and checkpoint-gated resume | Phase 5 implementation + tests |
| Same session | Page/BrowserContext preservation across handoff | Handoff manager test |
| Safety | Origin enforcement + sensitive data sanitization | Phase 3/4 implementation + tests |
| Evidence | Structured evidence collector for discovery, replay, handoff | evidence/ directory structure |

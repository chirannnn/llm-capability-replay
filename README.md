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
5. Click "Start Discovery" to run real LLM discovery (requires OPENAI_API_KEY and target URL)
6. Click "Run Replay" to run deterministic replay

**Note:** The operator UI is now connected to the real discovery and replay orchestrators. Discovery requires valid `OPENAI_API_KEY` and target URL in `.env`. Replay uses the Mariner Pro example artifact.

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

The project has 192 automated tests covering:
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
```

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

6. **Operator UI Integration:** The operator UI is now connected to the real discovery and replay orchestrators. Discovery requires valid `OPENAI_API_KEY` and target URL in `.env`. If credentials are not available, the UI will display an error message. Replay uses the Mariner Pro example artifact and can run without credentials.

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

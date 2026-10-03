# Architecture

The system is organized into three main phases:

**Phase 3: LLM Discovery**
- Orchestrator manages the observe → decide → act loop
- OpenAI client generates structured actions
- Playwright browser executes actions against live UI
- Observation layer captures visible UI elements
- Execution trace records all actions
- Artifact generator maps trace to Capability Artifact schema

**Phase 4: Deterministic Replay**
- Replay engine loads and validates Capability Artifact
- Target resolver converts selectors to Playwright Locators (aria → text → css → xpath priority)
- Action executor executes 6 action types (navigate, click, type, select, wait, extract)
- Checkpoint evaluator verifies UI state after actions
- Retry handler implements backoff strategies (fixed, linear, exponential)
- Error classifier categorizes failures (business outcome, recoverable, hard failure)
- Evidence collector logs execution, screenshots, and reports

**Phase 5: Human-in-the-Loop Handoff**
- Handoff manager preserves same Playwright Page/BrowserContext
- State machine: AUTOMATING → WAITING_FOR_HUMAN → HUMAN_CONTROL → RESUMING → AUTOMATING
- Deterministic triggers: recoverable failures after retry exhaustion
- CLI-based human intervention mechanism
- Checkpoint-gated resume (automation resumes only if checkpoint passes)
- Evidence collection for handoff events

**Architecture Diagram:**

```
Natural Language Goal
        |
        v
+-------------------+
| LLM Discovery     |
| Observe-Decide-Act|
+---------+---------+
          |
          v
+-------------------+
| Capability        |
| Artifact          |
+---------+---------+
          |
          v
+-------------------+
| Deterministic     |
| Replay Engine     |
+---------+---------+
          |
          v
   Action / Checkpoint
          |
      +---+---+
      |       |
   Success   Failure
              |
              v
       Human Handoff
              |
              v
       Same Browser
              |
              v
         Checkpoint
              |
              v
       Resume Replay
              |
              v
       Result + Evidence
```

**Key Architectural Boundary:**
- LLM is used ONLY for discovery (Phase 3)
- Replay (Phase 4) and Handoff (Phase 5) are completely independent of LLM decisions
- No OpenAI calls exist in replay or handoff code paths
- This boundary is enforced at the module level (no imports from discovery/ or openai/ in replay/handoff)

# Artifact schema

The Capability Artifact is the contract between discovery and replay. It contains:

**Identity & Versioning:**
- `metadata.name`, `metadata.description`, `metadata.tags`, `metadata.category`
- `version.version`, `version.createdBy`, `version.createdAt`, `version.reviewStatus`, `version.changelog`
- `tenant.tenantId`, `tenant.isGlobal`

**Target & Inputs:**
- `target.applicationType`, `target.url`, `target.platform`, `target.authentication`
- `inputs` - typed input parameters for the capability

**Workflow Steps:**
- `steps[]` - ordered array of UI steps
- Each step has: `stepId`, `order`, `description`, `action`, `checkpoint`, `retryPolicy`
- `action` contains: `type`, `selectors[]`, `value`, `timeout`
- `selectors` use 4 types: aria, text, css, xpath (semantic selectors preferred)

**Outputs:**
- `outputs[]` - typed outputs extracted during execution

**Safety:**
- `safety.allowedDomains[]` - navigation domain restrictions
- `safety.restrictedActions[]` - actions requiring approval
- `safety.dataExtractionRules[]` - data extraction policies
- `safety.humanApprovalRequired` - whether human approval is required

**Reviewability:**
- All fields are strongly typed with TypeScript
- Zod schema validates artifacts before execution
- Semantic selectors make artifacts human-readable
- Checkpoints make expected UI states explicit
- Retry policy makes failure handling explicit
- Safety policy makes security boundaries explicit

**Why the artifact is reusable:**
- Structured schema enables deterministic replay without LLM
- Versioning supports capability evolution
- Typed inputs/outputs enable integration
- Semantic selectors are robust to minor UI changes
- Checkpoints provide verification points
- Safety policy enforces runtime boundaries

# Determinism & error handling

**Target Resolution (Deterministic):**
- Selector priority: aria → text → css → xpath
- Semantic selectors (aria, text) preferred over non-semantic (css, xpath)
- No AI selector generation
- Each selector type maps to specific Playwright Locator API
- Fallback order is explicitly coded and tested

**Action Execution (Deterministic):**
- 6 action types: navigate, click, type, select, wait, extract
- Each action has defined Playwright execution
- No LLM decision during action execution
- Timeout values are from artifact

**Checkpoint Evaluation (Deterministic):**
- 4 patterns: url matches, element visibility, element count, element text
- Simple pattern matching (no complex expression language)
- Checkpoint failure triggers replay failure (configurable)
- No AI checkpoint evaluation

**Retry Policy (Deterministic):**
- 3 backoff strategies: fixed, linear, exponential
- `maxAttempts` defines retry limit
- `backoffMs` defines base delay
- `retryableErrors` defines which errors to retry
- Retry happens AFTER error classification (not before)

**Error Classification (Deterministic):**
- 3 categories: EXPECTED_BUSINESS_OUTCOME, RECOVERABLE, HARD_FAILURE
- Classification uses workflow/runtime context, not just error strings
- EXPECTED_BUSINESS_OUTCOME: workflow context indicates expected negative result
- RECOVERABLE: transient conditions (timeout, network, loading)
- HARD_FAILURE: permission, structure change, exceeded retries, malformed artifact
- Default: HARD_FAILURE for safety

**What makes replay deterministic:**
1. No LLM in replay code path (architectural boundary)
2. Artifact is the single source of truth
3. Target resolution uses fixed selector priority
4. Action execution uses defined Playwright APIs
5. Checkpoint evaluation uses simple pattern matching
6. Retry policy uses deterministic backoff strategies
7. Error classification uses rule-based logic
8. No AI selector generation
9. No AI error recovery
10. No AI checkpoint evaluation

# Heterogeneity & multi-tenant

**IMPLEMENTED NOW:**
- Artifact schema includes `tenant` field (tenantId, isGlobal)
- Capability artifacts can be tenant-scoped or global
- Target application type field exists (web)
- Authentication structure exists in target schema
- Safety policy is per-artifact (allowedDomains, restrictedActions)

**FUTURE / PRODUCTION DESIGN:**
The system could support multi-tenancy through:

**Different UI Surfaces:**
- Extend `target.applicationType` to support desktop, mobile
- Platform-specific action executors (Playwright for web, OS automation for desktop)
- Platform-specific target resolvers

**Different Target Strategies:**
- Selector strategies per platform (aria for web, accessibility tree for desktop)
- Action adapters per platform

**Tenant Isolation:**
- Per-tenant artifact storage (database with tenantId)
- Per-tenant safety policies
- Per-tenant audit logs
- Tenant-scoped evidence directories

**Per-Tenant Artifacts:**
- Artifact schema already supports tenantId
- Capability versioning per tenant
- Tenant-specific capability configurations

**Per-Tenant Policies:**
- Safety policy is per-artifact (could be tenant-default)
- Retry policy is per-artifact (could be tenant-default)
- Data extraction rules per-artifact

**Capability/Version Isolation:**
- Artifact versioning already implemented
- Multiple versions of same capability can coexist
- Review status tracks approval workflow

**Current Take-Home Scope:**
- Single-tenant focused (tenant field exists but not enforced at runtime)
- Web-only target type
- File-based artifact storage (not database)
- CLI-based operator interface (not web UI)

# Escalation & handoff

**Deterministic Triggers:**
- REPEATED_RECOVERABLE_FAILURE: recoverable errors after retry exhaustion
- TARGET_NOT_FOUND: selector cannot be resolved (design future extension)
- UNEXPECTED_STATE: UI state does not match expected (design future extension)
- SAFETY_CONFIRMATION_REQUIRED: action requires human approval (design future extension)
- No LLM used to decide whether to escalate

**State Machine:**
```
AUTOMATING
    ↓ (deterministic failure)
WAITING_FOR_HUMAN
    ↓ (human ready)
HUMAN_CONTROL
    ↓ (human completes)
RESUMING
    ↓ (checkpoint passes)
AUTOMATING
```

- States are explicitly tracked in HandoffManager
- State transitions are validated (invalid transitions throw errors)
- State is logged to evidence

**Same Page/BrowserContext:**
- ActionExecutor exposes Page and BrowserContext via getter methods
- HandoffManager initialized with same Page/BrowserContext objects
- Object identity is preserved (no new context/page created)
- Human interacts with exact same browser session automation was using
- After handoff, automation resumes using same Page/BrowserContext
- Test verifies object identity (not just URL matching)

**Human Control:**
- CLI-based operator mechanism (simple for take-home)
- Human prompted with: reason, current URL, goal
- Human can interact with preserved browser session
- Human presses Enter to signal completion
- No web UI (intentionally excluded from take-home scope)

**Checkpoint:**
- Resume condition uses existing Phase 2 checkpoint from artifact
- Checkpoint evaluated using CheckpointEvaluator (deterministic)
- If checkpoint passes: automation resumes
- If checkpoint fails: handoff may trigger again or automation fails
- If no checkpoint: resume allowed by default
- No LLM used to determine if human solved the problem

**Evidence:**
- `logHandoffCreated()` - records reason, currentStep, currentUrl
- `logHandoffStarted()` - records when human control begins
- `logHandoffEnded()` - records humanAction
- `logHandoffResumed()` - records checkpointPassed
- All events logged to replay.log with timestamps
- Handoff context included in execution-trace.json

**No LLM During Handoff/Replay:**
- HandoffManager does not import OpenAI
- HandoffManager does not import discovery orchestrator
- Resume condition uses CheckpointEvaluator (deterministic)
- Architectural boundary preserved (replay/handoff independent of LLM)

# Safety

**Domain/Origin Enforcement:**
- Discovery: Orchestrator stores `targetOrigin` at discovery start
- Discovery: `isAllowedDomain()` checks navigation destination before execution
- Discovery: Rejects navigation outside allowlist with clear error
- Replay: Engine stores `targetOrigin` from artifact
- Replay: `isAllowedDomain()` checks all navigate actions
- Replay: Rejects navigation outside `artifact.safety.allowedDomains`
- Enforcement is runtime code, not just prompts

**Sensitive Data Handling:**
- Discovery: Input values NOT captured into UIObservation (textboxes only capture metadata)
- Discovery: Defense-in-depth sanitization removes sensitive patterns (passwords, API keys, tokens)
- Discovery: 8 focused tests prove sensitive-looking values are redacted
- Replay: No sensitive data collection in evidence
- Handoff: No secrets logged in evidence
- No API keys, passwords, tokens, credentials in evidence

**Artifact Safety Policy:**
- `safety.allowedDomains[]` - restricts navigation domains
- `safety.restrictedActions[]` - actions requiring approval
- `safety.dataExtractionRules[]` - data extraction policies
- `safety.humanApprovalRequired` - requires human approval for sensitive actions
- Policy is validated through Zod schema
- Policy is enforced at runtime by replay engine

**Runtime Checks:**
- Navigate actions checked against allowedDomains before execution
- Target origin enforced in both discovery and replay
- Sensitive data redaction before evidence generation
- Domain enforcement happens BEFORE navigation (not after)

**Human Confirmation Boundaries:**
- Handoff preserves existing safety policy
- If safety confirmation is required, it would be explicitly recorded (designed but not fully implemented)
- Human cannot silently bypass safety policy through handoff
- Same browser session ensures human operates within same domain constraints

**Evidence Redaction:**
- Sensitive data patterns removed from observation before evidence
- No API keys, passwords, tokens in evidence
- No credentials, authentication cookies in evidence
- No unnecessary personal data in evidence

# Cuts

The following features were intentionally excluded from this take-home focused on the core computer-use lifecycle:

**Production-Scale Distributed Deployment:**
- Kubernetes, cloud orchestration, distributed services
- **Why:** Take-home focuses on core computer-use lifecycle, not production infrastructure

**Polished Frontend:**
- Web UI for goal entry, artifact review, handoff management
- **Why:** CLI-based interface is sufficient to demonstrate the core functionality

**Advanced Multi-Tenant Infrastructure:**
- Database-backed tenant isolation, per-tenant routing, tenant-scoped storage
- **Why:** Artifact schema supports tenant field, but runtime enforcement is beyond scope

**Desktop Automation:**
- OS-level automation, accessibility tree navigation, desktop target support
- **Why:** Take-home focuses on web UI automation with Playwright

**Complex Permissions System:**
- Role-based access control, permission grants, audit trails
- **Why:** Safety is enforced through domain enforcement and sanitization, which is sufficient for take-home

**Large Workflow Editor:**
- Visual artifact editor, drag-and-drop workflow construction
- **Why:** Artifacts are JSON-based and human-readable; editor is not required for take-home

**Database-Backed Replay History:**
- Replay result persistence, historical query, analytics
- **Why:** File-based evidence is sufficient for take-home; database is infrastructure

**CI/CD Integration:**
- Automated testing pipeline, deployment automation
- **Why:** Take-home focuses on implementation, not DevOps

**Advanced Recovery Mechanisms:**
- AI-based error recovery, self-healing, adaptive retry
- **Why:** Retry with backoff strategies is sufficient; AI recovery would require LLM in replay

**Cloud Deployment:**
- Cloud provider integration, container orchestration, auto-scaling
- **Why:** Take-home focuses on local execution with Docker Compose for database only

**Obscura Integration:**
- Specific visual understanding system mentioned in requirements
- **Why:** Not required for core computer-use lifecycle demonstration

Each cut was intentional to keep the take-home focused on demonstrating the core computer-use automation workflow: LLM discovery → structured artifact → deterministic replay → human handoff, without getting distracted by production infrastructure or advanced features.

## Evidence

Evidence structure is documented in `docs/evidence.md`. Evidence is organized by timestamp and includes:

- Discovery evidence: logs, traces, artifacts, screenshots, reports
- Replay evidence: logs, traces, artifacts, screenshots, reports
- Handoff evidence: handoff events logged in replay logs

Evidence is excluded from git via .gitignore to avoid committing sensitive data or large binary files.

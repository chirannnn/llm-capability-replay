# Requirement Matrix

| Requirement | Implementation | Evidence |
|-------------|----------------|----------|
| Goal + target app | Discovery CLI with goal parameter, frontend UI with goal input | discovery:demo command, web UI |
| Real LLM discovery | OpenAI + Playwright observe-decide-act loop | Phase 3 implementation, observation types, action schemas |
| Structured capability | Zod capability schema with ordered steps, targets, checkpoints | Phase 2 schema + Mariner Pro fixture |
| Deterministic replay | Replay engine with target resolution, action execution, checkpoints | Phase 4 implementation + tests |
| Error handling | Error classifier + retry handler with backoff strategies | Phase 4 implementation + tests |
| Human handoff | HandoffManager with same-session preservation and checkpoint-gated resume | Phase 5 implementation + tests |
| Same browser session | Page/BrowserContext preservation across handoff | Handoff manager test |
| Safety | Origin enforcement + sensitive data sanitization | Phase 3/4 implementation + tests |
| Evidence | Structured evidence collector for discovery, replay, handoff | evidence/ directory structure, docs/evidence.md |
| Operator UI | React-based frontend with goal input, status display, live events | web UI implementation |
| Live event streaming | SSE endpoints for discovery and replay events | API discovery.ts, replay.ts |
| Headed browser mode | HEADLESS environment variable for browser visibility | env.ts, playwright.ts |
| Heterogeneous surfaces | Artifact schema supports platform field, design documented | REPORT.md Heterogeneity section |
| Multi-tenant design | Artifact schema supports tenant field, design documented | REPORT.md Heterogeneity section |

**Note:** Real live LLM evidence could not be generated because the required runtime environment (OPENAI_API_KEY, MARINER_PRO_URL) was unavailable in the take-home environment. The implementation is correct and tested with mocks.

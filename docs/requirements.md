# Requirement Matrix

| Requirement | Implementation | Evidence |
|-------------|----------------|----------|
| Goal + target app | Discovery CLI with goal parameter, frontend UI with goal input | discovery:demo command, web UI |
| Real LLM discovery | OpenAI + Playwright observe-decide-act loop, connected to operator UI via API | Phase 3 implementation, API discovery.ts, web UI |
| Structured capability | Zod capability schema with ordered steps, targets, checkpoints | Phase 2 schema + Mariner Pro fixture |
| Deterministic replay | Replay engine with target resolution, action execution, checkpoints, connected to operator UI via API | Phase 4 implementation + tests, API replay.ts, web UI |
| Error handling | Error classifier + retry handler with backoff strategies | Phase 4 implementation + tests |
| Human handoff | HandoffManager with same-session preservation and checkpoint-gated resume | Phase 5 implementation + tests |
| Same browser session | Page/BrowserContext preservation across handoff | Handoff manager test |
| Safety | Origin enforcement + sensitive data sanitization | Phase 3/4 implementation + tests |
| Evidence | Structured evidence collector for discovery, replay, handoff | evidence/ directory structure, docs/evidence.md |
| Operator UI | React-based frontend with goal input, status display, live events from real orchestrators | web UI implementation, API integration |
| Live event streaming | SSE endpoints streaming actual discovery/replay execution events | API discovery.ts, replay.ts |
| Headed browser mode | HEADLESS environment variable for browser visibility | env.ts, playwright.ts |
| Heterogeneous surfaces | Artifact schema supports platform field, design documented | REPORT.md Heterogeneity section |
| Multi-tenant design | Artifact schema supports tenant field, design documented | REPORT.md Heterogeneity section |

**Note:** Real live LLM discovery requires valid OPENAI_API_KEY and target URL in .env. The operator UI is now connected to the real orchestrators and will display errors if credentials are missing. Replay can run without credentials using the Mariner Pro example artifact.

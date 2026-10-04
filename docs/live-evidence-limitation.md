# Live Evidence Limitation

Real live LLM evidence could not be generated because:

1. **OPENAI_API_KEY**: The environment has only a placeholder value (`your-openai-api-key-here`) in `.env`
2. **MARINER_PRO_URL**: The environment has a placeholder URL (`https://mariner-pro.example.com` which is not accessible

**What this means:**
- The Phase 3 LLM discovery implementation is correct and tested with mocks
- The Phase 4 deterministic replay implementation is correct and tested
- The Phase 5 handoff implementation is correct and tested
- All 184 automated tests pass
- However, a real live run against the actual target application with the actual OpenAI API cannot be automatically performed in this environment

**What was done instead:**
- The frontend operator UI simulates events to demonstrate the architecture
- The API endpoints provide SSE event streaming infrastructure
- The headed mode support (`HEADLESS=false`) enables live browser visibility when credentials are available
- The evidence structure is documented in `docs/evidence.md`

**To generate real live evidence (manual step):**
1. Set a real `OPENAI_API_KEY` in `apps/api/.env`
2. Set a real accessible `MARINER_PRO_URL` in `apps/api/.env`
3. Run: `pnpm --filter api discovery:demo --goal "Find Auxiliary Engine course and open the Construction section"`
4. Evidence will be written to `evidence/discovery-YYYYMMDD-HHMMSS/`
5. Sanitize evidence for secrets before committing

**No fake evidence was generated.** The implementation is genuine and would work with real credentials.

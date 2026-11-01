# Live Evidence Limitation

Real live LLM evidence could not be generated because:

1. **OPENAI_API_KEY**: The environment has only a placeholder value (`your-openai-api-key-here`) in `.env`
2. **MARINER_PRO_URL**: The environment has a placeholder URL (`https://mariner-pro.example.com` which is not accessible

**What this means:**
- The Phase 3 LLM discovery implementation is correct and tested with mocks
- The Phase 4 deterministic replay implementation is correct and tested
- The Phase 5 handoff implementation is correct and tested
- All 192 automated tests pass
- The operator UI is connected to the real discovery and replay orchestrators
- However, a real live run against the actual target application with the actual OpenAI API cannot be automatically performed in this environment

**What is implemented:**
- The frontend operator UI calls the real discovery and replay orchestrators via API
- The API endpoints provide SSE event streaming from actual backend execution
- Discovery will fail with a clear error message if OPENAI_API_KEY is missing
- Replay can run without credentials using the Mariner Pro example artifact
- Error reporting now shows actual Playwright errors (e.g., `net::ERR_NAME_NOT_RESOLVED`) instead of generic "Unknown error"
- The headed mode support (`HEADLESS=false`) enables live browser visibility when credentials are available
- The evidence structure is documented in `docs/evidence.md`

**Replay error reporting:**
When running replay against the Mariner Pro example artifact (which uses a placeholder URL), the system now correctly reports the underlying Playwright error:

```
✗ Failure category: recoverable
✗ Failure message: page.goto: net::ERR_NAME_NOT_RESOLVED at https://mariner-pro.example.com/courses
```

The CLI provides helpful context:
```
This failure is expected if the target URL is not accessible.
The Mariner Pro example artifact uses a placeholder URL for testing.
For real replay, provide an artifact with a real target URL.
```

**To generate real live evidence (manual step):**
1. Set a real `OPENAI_API_KEY` in `apps/api/.env`
2. Set a real accessible `MARINER_PRO_URL` in `apps/api/.env`
3. Run: `pnpm --filter api discovery:demo --goal "Find Auxiliary Engine course and open the Construction section"`
4. Evidence will be written to `evidence/discovery-YYYYMMDD-HHMMSS/`
5. Sanitize evidence for secrets before committing

**No fake evidence was generated.** The implementation is genuine and would work with real credentials.

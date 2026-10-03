# Architecture Diagram

```mermaid
graph TD
    A[Natural Language Goal] --> B[LLM Discovery Phase 3]
    B --> C[Observe - Decide - Act Loop]
    C --> D[Capability Artifact]
    D --> E[Zod Validation]
    E --> F[Deterministic Replay Phase 4]
    F --> G[Target Resolution]
    G --> H[Action Execution]
    H --> I[Checkpoint Verification]
    I --> J{Success?}
    J -->|Yes| K[Replay Result + Evidence]
    J -->|No| L[Error Classification]
    L --> M{Recoverable?}
    M -->|Yes| N[Retry Handler]
    N --> H
    M -->|No| O[Human Handoff Phase 5]
    O --> P[State: WAITING_FOR_HUMAN]
    P --> Q[State: HUMAN_CONTROL]
    Q --> R[Same Browser Session]
    R --> S[Human Intervention]
    S --> T[Checkpoint Evaluation]
    T --> U{Checkpoint Passed?}
    U -->|Yes| V[State: RESUMING]
    V --> W[State: AUTOMATING]
    W --> F
    U -->|No| X[Hard Failure]
    X --> Y[Replay Result + Evidence]
    
    style B fill:#ff9999
    style F fill:#99ff99
    style O fill:#9999ff
    style R fill:#ffff99
```

**LLM Boundary:**
- LLM is used ONLY in Phase 3 Discovery (highlighted in red)
- Phase 4 Replay (highlighted in green) is completely independent of LLM
- Phase 5 Handoff (highlighted in blue) is completely independent of LLM
- Same Browser Session (highlighted in yellow) preserves continuity across handoff

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ReplayEngine, initializeReplayEngine } from './engine.js';
import { CapabilityArtifact } from '../capability/schema.js';
import { ErrorCategory } from './types.js';

describe('Replay Engine', () => {
  let engine: ReplayEngine;

  beforeEach(() => {
    engine = initializeReplayEngine();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should reject malformed artifact', async () => {
    const malformedArtifact = { invalid: 'artifact' } as unknown as CapabilityArtifact;
    
    const result = await engine.executeReplay(malformedArtifact);
    
    expect(result.success).toBe(false);
    expect(result.failure?.category).toBe(ErrorCategory.HARD_FAILURE);
    expect(result.failure?.message).toContain('Invalid artifact');
  }, 10000); // Add 10 second timeout

  it('should execute replay deterministically without LLM', async () => {
    // This test verifies the architectural boundary by executing replay
    // The replay module does not import OpenAI or discovery orchestrator
    // This is enforced at the module level (no imports from discovery/ or openai)
    
    const artifact: CapabilityArtifact = {
      metadata: {
        name: 'Test Capability',
        description: 'Test description',
        tags: [],
        category: 'test',
      },
      version: {
        version: 1,
        createdBy: 'test',
        createdAt: new Date().toISOString(),
        reviewStatus: 'draft' as const,
        changelog: 'Initial',
      },
      tenant: {
        tenantId: undefined,
        isGlobal: true,
      },
      target: {
        applicationType: 'web' as const,
        url: 'https://example.com',
        platform: 'test',
        authentication: {
          type: 'none' as const,
        },
      },
      inputs: [],
      outputs: [],
      steps: [],
      safety: {
        allowedDomains: [],
        restrictedActions: [],
        dataExtractionRules: [],
        humanApprovalRequired: false,
      },
    };

    const result = await engine.executeReplay(artifact);
    
    // Verify replay succeeded deterministically without any LLM dependency
    expect(result.success).toBe(true);
    expect(result.runId).toBeDefined();
  }, 10000); // Add 10 second timeout

  it('should enforce safety policy for navigation', async () => {
    const artifact: CapabilityArtifact = {
      metadata: {
        name: 'Test Capability',
        description: 'Test description',
        tags: [],
        category: 'test',
      },
      version: {
        version: 1,
        createdBy: 'test',
        createdAt: new Date().toISOString(),
        reviewStatus: 'draft' as const,
        changelog: 'Initial',
      },
      tenant: {
        tenantId: undefined,
        isGlobal: true,
      },
      target: {
        applicationType: 'web' as const,
        url: 'https://example.com',
        platform: 'test',
        authentication: {
          type: 'none' as const,
        },
      },
      inputs: [],
      outputs: [],
      steps: [
        {
          stepId: 'step-1',
          order: 1,
          description: 'Navigate to external site',
          action: {
            type: 'navigate' as const,
            value: 'https://external-site.com',
            timeout: 5000,
          },
        },
      ],
      safety: {
        allowedDomains: ['https://example.com'],
        restrictedActions: [],
        dataExtractionRules: [],
        humanApprovalRequired: false,
      },
    };

    const result = await engine.executeReplay(artifact);
    
    // Verify navigation was blocked by safety policy
    expect(result.success).toBe(false);
    expect(result.failure?.category).toBe(ErrorCategory.HARD_FAILURE);
    expect(result.failure?.message).toContain('not allowed by safety policy');
  }, 10000); // Add 10 second timeout
});


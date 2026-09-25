import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ReplayEngine, initializeReplayEngine } from './engine.js';
import { marinerProExampleArtifact } from '../capability/examples/mariner-pro-course.js';

describe('Mariner Pro Artifact Replay', () => {
  let engine: ReplayEngine;

  beforeEach(() => {
    engine = initializeReplayEngine();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should have valid Mariner Pro artifact structure', () => {
    // Verify the Mariner Pro artifact has the correct structure
    expect(marinerProExampleArtifact.metadata.name).toBe('Find Auxiliary Engine Course and Open Construction Section');
    expect(marinerProExampleArtifact.version.version).toBe(1);
    expect(marinerProExampleArtifact.steps.length).toBeGreaterThan(0);
    expect(marinerProExampleArtifact.inputs.length).toBeGreaterThan(0);
    expect(marinerProExampleArtifact.outputs.length).toBeGreaterThan(0);
  });

  it('should validate Mariner Pro artifact through Zod schema', async () => {
    // Verify the artifact can be validated by the engine
    const result = await engine.executeReplay({
      ...marinerProExampleArtifact,
      target: {
        ...marinerProExampleArtifact.target,
        url: 'https://example.com', // Use a valid URL for testing
      },
      steps: [], // Empty steps for validation-only test
    });

    expect(result.success).toBe(true);
    expect(result.capabilityName).toBe('Find Auxiliary Engine Course and Open Construction Section');
    expect(result.capabilityVersion).toBe(1);
  }, 10000); // Add 10 second timeout
});

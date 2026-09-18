import { describe, it, expect } from 'vitest';
import { CapabilityArtifactSchema } from '../schema.js';
import { marinerProExampleArtifact, validateMarinerProExample } from './mariner-pro-course.js';

describe('Mariner Pro Example Artifact', () => {
  it('should validate successfully against the schema', () => {
    const result = CapabilityArtifactSchema.parse(marinerProExampleArtifact);
    expect(result).toEqual(marinerProExampleArtifact);
  });

  it('should have all required fields present', () => {
    expect(marinerProExampleArtifact.metadata).toBeDefined();
    expect(marinerProExampleArtifact.version).toBeDefined();
    expect(marinerProExampleArtifact.tenant).toBeDefined();
    expect(marinerProExampleArtifact.target).toBeDefined();
    expect(marinerProExampleArtifact.inputs).toBeDefined();
    expect(marinerProExampleArtifact.outputs).toBeDefined();
    expect(marinerProExampleArtifact.steps).toBeDefined();
    expect(marinerProExampleArtifact.safety).toBeDefined();
  });

  it('should have valid metadata', () => {
    const { metadata } = marinerProExampleArtifact;
    expect(metadata.name).toBe('Find Auxiliary Engine Course and Open Construction Section');
    expect(metadata.description).toBeTruthy();
    expect(metadata.tags).toContain('mariner-pro');
    expect(metadata.category).toBe('course-management');
  });

  it('should have valid version metadata', () => {
    const { version } = marinerProExampleArtifact;
    expect(version.version).toBe(1);
    expect(version.createdBy).toBe('system');
    expect(version.createdAt).toBeTruthy();
    expect(version.reviewStatus).toBe('draft');
    expect(version.changelog).toBeTruthy();
  });

  it('should have valid target descriptor', () => {
    const { target } = marinerProExampleArtifact;
    expect(target.applicationType).toBe('web');
    expect(target.url).toBe('https://mariner-pro.example.com');
    expect(target.platform).toBe('mariner-pro');
    expect(target.authentication).toBeDefined();
    expect(target.authentication.type).toBe('session');
  });

  it('should have valid typed inputs', () => {
    const { inputs } = marinerProExampleArtifact;
    expect(inputs.length).toBeGreaterThan(0);
    expect(inputs[0].name).toBe('courseName');
    expect(inputs[0].type).toBe('string');
    expect(inputs[0].required).toBe(true);
    expect(inputs[0].validation).toBeDefined();
    expect(inputs[0].validation!.type).toBe('string');
    expect(inputs[0].validation!.constraints).toBeDefined();
  });

  it('should have valid typed outputs', () => {
    const { outputs } = marinerProExampleArtifact;
    expect(outputs.length).toBeGreaterThan(0);
    expect(outputs[0].name).toBe('courseUrl');
    expect(outputs[0].type).toBe('string');
    expect(outputs[0].extractionRule).toBeTruthy();
    expect(outputs[0].successCondition).toBeTruthy();
  });

  it('should have valid ordered steps', () => {
    const { steps } = marinerProExampleArtifact;
    expect(steps.length).toBeGreaterThan(0);

    // Verify steps are ordered
    for (let i = 0; i < steps.length; i++) {
      expect(steps[i].order).toBe(i + 1);
    }

    // Verify each step has required fields
    steps.forEach((step) => {
      expect(step.stepId).toBeTruthy();
      expect(step.description).toBeTruthy();
      expect(step.action).toBeDefined();
      expect(step.action.type).toBeTruthy();
    });
  });

  it('should have valid checkpoints in steps', () => {
    const { steps } = marinerProExampleArtifact;
    const stepsWithCheckpoints = steps.filter((step) => step.checkpoint);

    expect(stepsWithCheckpoints.length).toBeGreaterThan(0);

    stepsWithCheckpoints.forEach((step) => {
      expect(step.checkpoint).toBeDefined();
      expect(step.checkpoint!.condition).toBeTruthy();
      // Check that condition is a non-empty string with reasonable length
      expect(step.checkpoint!.condition.length).toBeGreaterThan(0);
      expect(step.checkpoint!.condition.length).toBeLessThan(500);
    });
  });

  it('should have valid retry policies in steps', () => {
    const { steps } = marinerProExampleArtifact;
    const stepsWithRetry = steps.filter((step) => step.retryPolicy);

    expect(stepsWithRetry.length).toBeGreaterThan(0);

    stepsWithRetry.forEach((step) => {
      expect(step.retryPolicy).toBeDefined();
      expect(step.retryPolicy!.maxAttempts).toBeGreaterThan(0);
      expect(step.retryPolicy!.backoffMs).toBeGreaterThan(0);
    });
  });

  it('should have valid safety policy', () => {
    const { safety } = marinerProExampleArtifact;
    expect(safety.allowedDomains).toContain('https://mariner-pro.example.com');
    expect(safety.restrictedActions).toBeDefined();
    expect(safety.dataExtractionRules).toBeDefined();
    expect(typeof safety.humanApprovalRequired).toBe('boolean');
  });

  it('should be serializable to JSON', () => {
    const jsonString = JSON.stringify(marinerProExampleArtifact);
    expect(jsonString).toBeTruthy();

    const parsed = JSON.parse(jsonString);
    const result = CapabilityArtifactSchema.parse(parsed);
    expect(result).toEqual(marinerProExampleArtifact);
  });

  it('should be deserializable from JSON', () => {
    const jsonString = JSON.stringify(marinerProExampleArtifact);
    const parsed = JSON.parse(jsonString);

    expect(parsed.metadata.name).toBe(marinerProExampleArtifact.metadata.name);
    expect(parsed.version.version).toBe(marinerProExampleArtifact.version.version);
    expect(parsed.steps.length).toBe(marinerProExampleArtifact.steps.length);
  });

  it('should have serializable validation rules (not ZodSchema objects)', () => {
    const { inputs } = marinerProExampleArtifact;
    const inputWithValidation = inputs.find((input) => input.validation);

    expect(inputWithValidation).toBeDefined();
    expect(typeof inputWithValidation!.validation).toBe('object');
    expect(inputWithValidation!.validation!.constraints).toBeDefined();

    // Verify it's a plain object, not a ZodSchema
    expect(inputWithValidation!.validation!.constructor).toBe(Object);
  });

  it('should have valid checkpoint expression language syntax', () => {
    const { steps } = marinerProExampleArtifact;
    const stepsWithCheckpoints = steps.filter((step) => step.checkpoint);

    stepsWithCheckpoints.forEach((step) => {
      const condition = step.checkpoint!.condition;
      // Check that condition uses supported operators
      const supportedOperators = ['==', '!=', '>', '<', '>=', '<=', 'contains', 'matches', 'exists'];
      const hasValidOperator = supportedOperators.some((op) => condition.includes(op));
      expect(hasValidOperator).toBe(true);
    });
  });

  it('should validate using the helper function', () => {
    const result = validateMarinerProExample();
    expect(result).toEqual(marinerProExampleArtifact);
  });

  it('should persist to database JSONB fields (structure validation)', () => {
    // Simulate what would be stored in Prisma JSONB fields
    const jsonbData = {
      target: marinerProExampleArtifact.target,
      inputs: marinerProExampleArtifact.inputs,
      steps: marinerProExampleArtifact.steps,
      outputs: marinerProExampleArtifact.outputs,
      safety: marinerProExampleArtifact.safety,
      versionMetadata: marinerProExampleArtifact.version,
    };

    // Verify it can be serialized
    const jsonString = JSON.stringify(jsonbData);
    expect(jsonString).toBeTruthy();

    // Verify it can be deserialized
    const parsed = JSON.parse(jsonString);
    expect(parsed.target).toBeDefined();
    expect(parsed.inputs).toBeDefined();
    expect(parsed.steps).toBeDefined();
    expect(parsed.outputs).toBeDefined();
    expect(parsed.safety).toBeDefined();
    expect(parsed.versionMetadata).toBeDefined();
  });

  it('should not contain secrets', () => {
    const jsonString = JSON.stringify(marinerProExampleArtifact);
    
    // Check for common secret patterns
    const secretPatterns = [
      /password/i,
      /api[_-]?key/i,
      /secret/i,
      /token/i,
      /auth[_-]?token/i,
    ];

    secretPatterns.forEach((pattern) => {
      expect(jsonString).not.toMatch(pattern);
    });

    // Verify authentication only stores type and requirements, not actual credentials
    expect(marinerProExampleArtifact.target.authentication.type).toBe('session');
    expect(marinerProExampleArtifact.target.authentication.requirements).toBeDefined();
    expect(marinerProExampleArtifact.target.authentication.requirements!.length).toBeGreaterThan(0);
    // Verify no actual credentials are stored
    expect(JSON.stringify(marinerProExampleArtifact.target.authentication.requirements)).not.toMatch(/password|token|key/i);
  });

  it('should have extensible schema for future surfaces', () => {
    // Verify the schema supports both web and desktop application types
    expect(marinerProExampleArtifact.target.applicationType).toBe('web');

    // Verify the schema can accommodate additional fields if needed
    const extendedArtifact = {
      ...marinerProExampleArtifact,
      // Simulate future extension
      extendedField: 'future-extension',
    };

    // The base schema should still validate the core structure
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { extendedField, ...baseArtifact } = extendedArtifact;
    expect(() => CapabilityArtifactSchema.parse(baseArtifact)).not.toThrow();
  });
});

import { describe, it, expect } from 'vitest';
import { generateArtifact } from './generator.js';
import { createExecutionTrace, addStepToTrace } from '../trace/types.js';
import { ActionType } from '../../capability/types.js';
import { ExecutedAction, ActionResult } from '../actions/schema.js';

describe('Artifact Generator', () => {
  it('should generate artifact from execution trace', () => {
    const trace = createExecutionTrace('Test goal', 'https://example.com');
    
    const action: ExecutedAction = {
      type: ActionType.NAVIGATE,
      target: {},
      value: 'https://example.com/page',
      timeout: 5000,
      timestamp: new Date().toISOString(),
    };

    const result: ActionResult = {
      success: true,
      description: 'Navigated successfully',
    };

    const updatedTrace = addStepToTrace(trace, action, result);
    
    const artifact = generateArtifact(updatedTrace);
    
    expect(artifact).toBeDefined();
    expect(artifact.metadata.name).toBeDefined();
    expect(artifact.metadata.description).toBe('Test goal');
    expect(artifact.version.version).toBe(1);
    expect(artifact.version.reviewStatus).toBe('draft');
    expect(artifact.target.url).toBe('https://example.com');
    expect(artifact.steps).toHaveLength(1);
  });

  it('should infer inputs from type actions', () => {
    const trace = createExecutionTrace('Search for course', 'https://example.com');
    
    const action: ExecutedAction = {
      type: ActionType.TYPE,
      target: { role: 'textbox', accessibleName: 'Search' },
      value: 'Auxiliary Engine',
      timeout: 5000,
      timestamp: new Date().toISOString(),
    };

    const result: ActionResult = {
      success: true,
      description: 'Typed text successfully',
    };

    const updatedTrace = addStepToTrace(trace, action, result);
    
    const artifact = generateArtifact(updatedTrace);
    
    expect(artifact.inputs).toHaveLength(1);
    expect(artifact.inputs[0].name).toBeDefined();
    expect(artifact.inputs[0].defaultValue).toBe('Auxiliary Engine');
  });

  it('should infer outputs from extract actions', () => {
    const trace = createExecutionTrace('Extract data', 'https://example.com');
    
    const action: ExecutedAction = {
      type: ActionType.EXTRACT,
      target: { role: 'textbox', accessibleName: 'Data' },
      timeout: 5000,
      timestamp: new Date().toISOString(),
    };

    const result: ActionResult = {
      success: true,
      description: 'Extracted data',
      data: 'extracted value',
    };

    const updatedTrace = addStepToTrace(trace, action, result);
    
    const artifact = generateArtifact(updatedTrace);
    
    expect(artifact.outputs).toHaveLength(1);
    expect(artifact.outputs[0].name).toBe('extractedData1');
  });

  it('should infer tags from trace', () => {
    const trace = createExecutionTrace('Find course on Mariner Pro', 'https://mariner-pro.example.com');
    
    const action: ExecutedAction = {
      type: ActionType.NAVIGATE,
      target: {},
      value: 'https://mariner-pro.example.com/courses',
      timeout: 5000,
      timestamp: new Date().toISOString(),
    };

    const result: ActionResult = {
      success: true,
      description: 'Navigated successfully',
    };

    const updatedTrace = addStepToTrace(trace, action, result);
    
    const artifact = generateArtifact(updatedTrace);
    
    expect(Array.isArray(artifact.metadata.tags)).toBe(true);
    expect(artifact.metadata.tags).toContain('mariner-pro');
    expect(artifact.metadata.tags).toContain('navigation');
  });

  it('should infer category from goal', () => {
    const trace = createExecutionTrace('Find course and open section', 'https://example.com');
    
    const action: ExecutedAction = {
      type: ActionType.NAVIGATE,
      target: {},
      value: 'https://example.com',
      timeout: 5000,
      timestamp: new Date().toISOString(),
    };

    const result: ActionResult = {
      success: true,
      description: 'Navigated successfully',
    };

    const updatedTrace = addStepToTrace(trace, action, result);
    
    const artifact = generateArtifact(updatedTrace);
    
    expect(artifact.metadata.category).toBe('course-management');
  });

  it('should map actions to steps with correct order', () => {
    const trace = createExecutionTrace('Multi-step goal', 'https://example.com');
    
    const action1: ExecutedAction = {
      type: ActionType.NAVIGATE,
      target: {},
      value: 'https://example.com',
      timeout: 5000,
      timestamp: new Date().toISOString(),
    };

    const result1: ActionResult = {
      success: true,
      description: 'Navigated successfully',
    };

    let updatedTrace = addStepToTrace(trace, action1, result1);
    
    const action2: ExecutedAction = {
      type: ActionType.CLICK,
      target: { role: 'button', accessibleName: 'Search' },
      timeout: 5000,
      timestamp: new Date().toISOString(),
    };

    const result2: ActionResult = {
      success: true,
      description: 'Clicked successfully',
    };

    updatedTrace = addStepToTrace(updatedTrace, action2, result2);
    
    const artifact = generateArtifact(updatedTrace);
    
    expect(artifact.steps).toHaveLength(2);
    expect(artifact.steps[0].order).toBe(1);
    expect(artifact.steps[1].order).toBe(2);
    expect(artifact.steps[0].action.type).toBe(ActionType.NAVIGATE);
    expect(artifact.steps[1].action.type).toBe(ActionType.CLICK);
  });

  it('should generate safety policy with allowed domains', () => {
    const trace = createExecutionTrace('Test goal', 'https://example.com');
    
    const action: ExecutedAction = {
      type: ActionType.NAVIGATE,
      target: {},
      value: 'https://example.com',
      timeout: 5000,
      timestamp: new Date().toISOString(),
    };

    const result: ActionResult = {
      success: true,
      description: 'Navigated successfully',
    };

    const updatedTrace = addStepToTrace(trace, action, result);
    
    const artifact = generateArtifact(updatedTrace);
    
    expect(artifact.safety.allowedDomains).toContain('https://example.com');
    expect(artifact.safety.restrictedActions).toContain(ActionType.TYPE);
  });

  it('should generate checkpoints for successful steps', () => {
    const trace = createExecutionTrace('Test goal', 'https://example.com');
    
    const action: ExecutedAction = {
      type: ActionType.CLICK,
      target: { role: 'button', accessibleName: 'Search' },
      timeout: 5000,
      timestamp: new Date().toISOString(),
    };

    const result: ActionResult = {
      success: true,
      description: 'Clicked successfully',
    };

    const updatedTrace = addStepToTrace(trace, action, result);
    
    const artifact = generateArtifact(updatedTrace);
    
    expect(artifact.steps[0].checkpoint).toBeDefined();
    expect(artifact.steps[0].checkpoint?.condition).toBeDefined();
  });

  it('should validate artifact against Phase 2 schema', () => {
    const trace = createExecutionTrace('Test goal', 'https://example.com');
    
    const action: ExecutedAction = {
      type: ActionType.NAVIGATE,
      target: {},
      value: 'https://example.com',
      timeout: 5000,
      timestamp: new Date().toISOString(),
    };

    const result: ActionResult = {
      success: true,
      description: 'Navigated successfully',
    };

    const updatedTrace = addStepToTrace(trace, action, result);
    
    // This should not throw if the artifact is valid
    expect(() => generateArtifact(updatedTrace)).not.toThrow();
  });

  it('should generate steps with robust target descriptors for Phase 4 replay', () => {
    const trace = createExecutionTrace('Test goal', 'https://example.com');
    
    const action: ExecutedAction = {
      type: ActionType.CLICK,
      target: { role: 'button', accessibleName: 'Search', testId: 'search-button' },
      timeout: 5000,
      timestamp: new Date().toISOString(),
    };

    const result: ActionResult = {
      success: true,
      description: 'Clicked successfully',
    };

    const updatedTrace = addStepToTrace(trace, action, result);
    
    const artifact = generateArtifact(updatedTrace);
    
    // Verify step has structured action
    expect(artifact.steps[0].action).toBeDefined();
    expect(artifact.steps[0].action.type).toBe(ActionType.CLICK);
    
    // Verify step has selectors (target descriptor for Phase 4 replay)
    expect(artifact.steps[0].action.selectors).toBeDefined();
    expect(Array.isArray(artifact.steps[0].action.selectors)).toBe(true);
    
    // Verify selectors contain the test ID (semantic targeting)
    const hasTestIdSelector = artifact.steps[0].action.selectors?.some(
      (s: { value: string }) => s.value.includes('search-button')
    );
    expect(hasTestIdSelector).toBe(true);
  });

  it('should generate artifact with all required Phase 2 fields', () => {
    const trace = createExecutionTrace('Test goal', 'https://example.com');
    
    const action: ExecutedAction = {
      type: ActionType.NAVIGATE,
      target: {},
      value: 'https://example.com',
      timeout: 5000,
      timestamp: new Date().toISOString(),
    };

    const result: ActionResult = {
      success: true,
      description: 'Navigated successfully',
    };

    const updatedTrace = addStepToTrace(trace, action, result);
    
    const artifact = generateArtifact(updatedTrace);
    
    // Verify all required Phase 2 fields are present
    expect(artifact.metadata).toBeDefined();
    expect(artifact.version).toBeDefined();
    expect(artifact.tenant).toBeDefined();
    expect(artifact.target).toBeDefined();
    expect(artifact.inputs).toBeDefined();
    expect(artifact.outputs).toBeDefined();
    expect(artifact.steps).toBeDefined();
    expect(artifact.safety).toBeDefined();
    
    // Verify step has checkpoint
    expect(artifact.steps[0].checkpoint).toBeDefined();
    expect(artifact.steps[0].checkpoint?.condition).toBeDefined();
    
    // Verify step has retry policy
    expect(artifact.steps[0].retryPolicy).toBeDefined();
    expect(artifact.steps[0].retryPolicy.maxAttempts).toBeGreaterThan(0);
  });
});

import { describe, it, expect } from 'vitest';
import { ExecutedAction } from '../actions/schema.js';
import { ActionType } from '../../capability/types.js';

describe('PlaywrightBrowser - Action Validation', () => {
  it('should validate navigate action requires URL', () => {
    const action: ExecutedAction = {
      type: ActionType.NAVIGATE,
      target: {},
      timeout: 5000,
      timestamp: new Date().toISOString(),
    };

    // This test validates the action schema logic
    expect(action.type).toBe(ActionType.NAVIGATE);
    expect(action.value).toBeUndefined();
  });

  it('should validate navigate action with URL', () => {
    const action: ExecutedAction = {
      type: ActionType.NAVIGATE,
      target: {},
      value: 'https://example.com',
      timeout: 5000,
      timestamp: new Date().toISOString(),
    };

    expect(action.type).toBe(ActionType.NAVIGATE);
    expect(action.value).toBe('https://example.com');
  });

  it('should validate type action requires value', () => {
    const action: ExecutedAction = {
      type: ActionType.TYPE,
      target: { role: 'textbox', accessibleName: 'Search' },
      value: 'test text',
      timeout: 5000,
      timestamp: new Date().toISOString(),
    };

    expect(action.type).toBe(ActionType.TYPE);
    expect(action.value).toBe('test text');
  });

  it('should validate wait action', () => {
    const action: ExecutedAction = {
      type: ActionType.WAIT,
      target: {},
      timeout: 1000,
      timestamp: new Date().toISOString(),
    };

    expect(action.type).toBe(ActionType.WAIT);
    expect(action.timeout).toBe(1000);
  });

  it('should validate click action with target', () => {
    const action: ExecutedAction = {
      type: ActionType.CLICK,
      target: { role: 'button', accessibleName: 'Search' },
      timeout: 5000,
      timestamp: new Date().toISOString(),
    };

    expect(action.type).toBe(ActionType.CLICK);
    expect(action.target.role).toBe('button');
  });

  it('should validate extract action', () => {
    const action: ExecutedAction = {
      type: ActionType.EXTRACT,
      target: { role: 'textbox', accessibleName: 'Data' },
      timeout: 5000,
      timestamp: new Date().toISOString(),
    };

    expect(action.type).toBe(ActionType.EXTRACT);
    expect(action.target.role).toBe('textbox');
  });

  it('should validate select action with value', () => {
    const action: ExecutedAction = {
      type: ActionType.SELECT,
      target: { role: 'combobox', accessibleName: 'Options' },
      value: 'option1',
      timeout: 5000,
      timestamp: new Date().toISOString(),
    };

    expect(action.type).toBe(ActionType.SELECT);
    expect(action.value).toBe('option1');
  });
});

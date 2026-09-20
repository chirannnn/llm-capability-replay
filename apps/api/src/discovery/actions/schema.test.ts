import { describe, it, expect } from 'vitest';
import {
  validateLLMAction,
  llmActionToExecuted,
  mapTargetToSelector,
  LLMActionSchema,
  UITargetSchema,
} from './schema.js';
import { ActionType } from '../../capability/types.js';

describe('Action Schema', () => {
  describe('validateLLMAction', () => {
    it('should validate valid LLM action', () => {
      const action = {
        type: 'click',
        target: {
          role: 'button',
          accessibleName: 'Search',
        },
        reasoning: 'Click search button',
      };

      const result = validateLLMAction(action);
      expect(result).toEqual(action);
    });

    it('should reject invalid action type', () => {
      const action = {
        type: 'invalid_type',
        reasoning: 'Test',
      };

      expect(() => validateLLMAction(action)).toThrow();
    });

    it('should reject action without reasoning', () => {
      const action = {
        type: 'click',
      };

      expect(() => validateLLMAction(action)).toThrow();
    });

    it('should accept complete action', () => {
      const action = {
        type: 'complete',
        reasoning: 'Goal achieved',
      };

      const result = validateLLMAction(action);
      expect(result.type).toBe('complete');
    });
  });

  describe('llmActionToExecuted', () => {
    it('should convert LLM action to executed action', () => {
      const llmAction = {
        type: 'click' as const,
        target: {
          role: 'button',
          accessibleName: 'Search',
        },
        reasoning: 'Click search button',
      };

      const executed = llmActionToExecuted(llmAction);

      expect(executed.type).toBe(ActionType.CLICK);
      expect(executed.target).toEqual(llmAction.target);
      expect(executed.timeout).toBe(5000);
      expect(executed.timestamp).toBeDefined();
    });

    it('should use custom timeout if provided', () => {
      const llmAction = {
        type: 'wait' as const,
        timeout: 10000,
        reasoning: 'Wait for page load',
      };

      const executed = llmActionToExecuted(llmAction);

      expect(executed.timeout).toBe(10000);
    });

    it('should handle navigate action with value', () => {
      const llmAction = {
        type: 'navigate' as const,
        value: 'https://example.com',
        reasoning: 'Navigate to example',
      };

      const executed = llmActionToExecuted(llmAction);

      expect(executed.value).toBe('https://example.com');
    });
  });

  describe('mapTargetToSelector', () => {
    it('should map test ID to CSS selector', () => {
      const target = {
        testId: 'search-button',
      };

      const selectors = mapTargetToSelector(target);

      expect(selectors).toEqual([
        { type: 'css', value: '[data-testid="search-button"]' },
      ]);
    });

    it('should map CSS selector directly', () => {
      const target = {
        cssSelector: '#search-button',
      };

      const selectors = mapTargetToSelector(target);

      expect(selectors).toEqual([{ type: 'css', value: '#search-button' }]);
    });

    it('should map accessible name and role to aria selector', () => {
      const target = {
        role: 'button',
        accessibleName: 'Search',
      };

      const selectors = mapTargetToSelector(target);

      expect(selectors).toEqual([{ type: 'aria', value: 'button: Search' }]);
    });

    it('should map visible text and role to text selector', () => {
      const target = {
        role: 'link',
        visibleText: 'Courses',
      };

      const selectors = mapTargetToSelector(target);

      expect(selectors).toEqual([{ type: 'text', value: 'Courses' }]);
    });

    it('should return undefined for empty target', () => {
      const target = {};

      const selectors = mapTargetToSelector(target);

      expect(selectors).toBeUndefined();
    });

    it('should prioritize test ID over other selectors', () => {
      const target = {
        testId: 'search-button',
        cssSelector: '#fallback',
        role: 'button',
        accessibleName: 'Search',
      };

      const selectors = mapTargetToSelector(target);

      expect(selectors).toEqual([
        { type: 'css', value: '[data-testid="search-button"]' },
      ]);
    });
  });

  describe('UITargetSchema', () => {
    it('should validate UI target with test ID', () => {
      const target = {
        testId: 'search-button',
      };

      const result = UITargetSchema.parse(target);
      expect(result).toEqual(target);
    });

    it('should validate UI target with role and accessible name', () => {
      const target = {
        role: 'button',
        accessibleName: 'Search',
      };

      const result = UITargetSchema.parse(target);
      expect(result).toEqual(target);
    });

    it('should validate UI target with all fields', () => {
      const target = {
        role: 'button',
        accessibleName: 'Search',
        visibleText: 'Search Button',
        testId: 'search-button',
        cssSelector: '#search',
      };

      const result = UITargetSchema.parse(target);
      expect(result).toEqual(target);
    });
  });

  describe('LLMActionSchema', () => {
    it('should validate complete action', () => {
      const action = {
        type: 'complete',
        reasoning: 'Goal achieved',
      };

      const result = LLMActionSchema.parse(action);
      expect(result).toEqual(action);
    });

    it('should validate navigate action with URL', () => {
      const action = {
        type: 'navigate',
        value: 'https://example.com',
        reasoning: 'Navigate to example',
      };

      const result = LLMActionSchema.parse(action);
      expect(result).toEqual(action);
    });

    it('should validate type action with target and value', () => {
      const action = {
        type: 'type',
        target: {
          role: 'textbox',
          accessibleName: 'Search',
        },
        value: 'test query',
        reasoning: 'Type search query',
      };

      const result = LLMActionSchema.parse(action);
      expect(result).toEqual(action);
    });
  });
});

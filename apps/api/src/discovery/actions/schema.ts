import { z } from 'zod';
import { ActionType } from '../../capability/types.js';

/**
 * UI Target specification using semantic information
 * Priority: testId > accessibleName + role > visibleText + role > cssSelector
 */
export const UITargetSchema = z.object({
  role: z.string().optional(),
  accessibleName: z.string().optional(),
  visibleText: z.string().optional(),
  testId: z.string().optional(),
  cssSelector: z.string().optional(),
});

export type UITarget = z.infer<typeof UITargetSchema>;

/**
 * LLM Action - what the LLM generates
 */
export const LLMActionSchema = z.object({
  type: z.enum(['navigate', 'click', 'type', 'select', 'wait', 'extract', 'complete']),
  target: UITargetSchema.optional(),
  value: z.string().optional(),
  timeout: z.number().int().positive().optional(),
  reasoning: z.string().min(1),
});

export type LLMAction = z.infer<typeof LLMActionSchema>;

/**
 * Executed Action - what gets recorded in the trace
 */
export const ExecutedActionSchema = z.object({
  type: z.nativeEnum(ActionType),
  target: UITargetSchema,
  value: z.string().optional(),
  timeout: z.number().int().positive(),
  timestamp: z.string(),
  reasoning: z.string().optional(),
});

export type ExecutedAction = z.infer<typeof ExecutedActionSchema>;

/**
 * Action Result
 */
export const ActionResultSchema = z.object({
  success: z.boolean(),
  description: z.string(),
  error: z.string().optional(),
  data: z.any().optional(),
});

export type ActionResult = z.infer<typeof ActionResultSchema>;

/**
 * Validate LLM action
 */
export function validateLLMAction(action: unknown): LLMAction {
  return LLMActionSchema.parse(action);
}

/**
 * Convert LLM action to executed action
 */
export function llmActionToExecuted(action: LLMAction): ExecutedAction {
  return {
    type: action.type as ActionType,
    target: action.target || {},
    value: action.value,
    timeout: action.timeout || 5000,
    timestamp: new Date().toISOString(),
    reasoning: action.reasoning,
  };
}

/**
 * Map UI target to selector for Phase 2 schema
 */
export function mapTargetToSelector(target: UITarget) {
  if (target.testId) {
    return [{ type: 'css' as const, value: `[data-testid="${target.testId}"]` }];
  }
  if (target.cssSelector) {
    return [{ type: 'css' as const, value: target.cssSelector }];
  }
  if (target.accessibleName && target.role) {
    return [{ type: 'aria' as const, value: `${target.role}: ${target.accessibleName}` }];
  }
  if (target.visibleText && target.role) {
    return [{ type: 'text' as const, value: target.visibleText }];
  }
  return undefined;
}

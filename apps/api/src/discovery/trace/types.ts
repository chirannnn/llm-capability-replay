import { ExecutedAction, ActionResult } from '../actions/schema.js';

/**
 * Execution trace - complete record of discovery session
 */
export interface ExecutionTrace {
  goal: string;
  targetUrl: string;
  startTime: string;
  endTime: string;
  steps: TraceStep[];
  completion?: Completion;
}

/**
 * Individual step in the execution trace
 */
export interface TraceStep {
  stepNumber: number;
  action: ExecutedAction;
  result: ActionResult;
  timestamp: string;
  screenshotPath?: string;
}

/**
 * Completion information
 */
export interface Completion {
  success: boolean;
  summary: string;
  timestamp: string;
}

/**
 * Create new execution trace
 */
export function createExecutionTrace(goal: string, targetUrl: string): ExecutionTrace {
  return {
    goal,
    targetUrl,
    startTime: new Date().toISOString(),
    endTime: '',
    steps: [],
  };
}

/**
 * Add step to execution trace
 */
export function addStepToTrace(
  trace: ExecutionTrace,
  action: ExecutedAction,
  result: ActionResult,
  screenshotPath?: string
): ExecutionTrace {
  const step: TraceStep = {
    stepNumber: trace.steps.length + 1,
    action,
    result,
    timestamp: new Date().toISOString(),
    screenshotPath,
  };
  
  return {
    ...trace,
    steps: [...trace.steps, step],
  };
}

/**
 * Mark trace as completed
 */
export function completeTrace(trace: ExecutionTrace, success: boolean, summary: string): ExecutionTrace {
  return {
    ...trace,
    endTime: new Date().toISOString(),
    completion: {
      success,
      summary,
      timestamp: new Date().toISOString(),
    },
  };
}

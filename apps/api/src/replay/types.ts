/**
 * Error classification categories
 */
export enum ErrorCategory {
  EXPECTED_BUSINESS_OUTCOME = 'expected_business_outcome',
  RECOVERABLE = 'recoverable',
  HARD_FAILURE = 'hard_failure',
}

/**
 * Executed step result during replay
 */
export interface ExecutedStep {
  stepId: string;
  order: number;
  status: 'success' | 'failed' | 'skipped';
  action: {
    type: string;
    selectors?: Array<{ type: string; value: string }>;
    value?: string;
    timeout: number;
  };
  result: {
    success: boolean;
    description: string;
    error?: string;
    data?: unknown;
  };
  checkpointResult?: {
    passed: boolean;
    condition: string;
    error?: string;
  };
  retryCount: number;
  startedAt: string;
  completedAt: string;
}

/**
 * Structured replay result
 */
export interface ReplayResult {
  runId: string;
  capabilityName: string;
  capabilityVersion: number;
  success: boolean;
  businessOutcome?: string;
  failure?: {
    category: ErrorCategory;
    message: string;
    stepId: string;
  };
  executedSteps: ExecutedStep[];
  currentStep: number;
  outputs: Record<string, unknown>;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  evidencePath: string;
}

/**
 * Checkpoint evaluation result
 */
export interface CheckpointResult {
  passed: boolean;
  condition: string;
  error?: string;
}

/**
 * Error classification context
 */
export interface ErrorContext {
  stepId: string;
  retryCount: number;
  maxRetries: number;
  isExpectedNegativeResult?: boolean;
  isPermissionError?: boolean;
  isStructureChange?: boolean;
}

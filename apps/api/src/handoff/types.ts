/**
 * Human handoff state for Phase 5
 */

/**
 * Handoff state machine states
 */
export enum HandoffState {
  AUTOMATING = 'AUTOMATING',
  WAITING_FOR_HUMAN = 'WAITING_FOR_HUMAN',
  HUMAN_CONTROL = 'HUMAN_CONTROL',
  RESUMING = 'RESUMING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * Deterministic handoff reasons
 */
export enum HandoffReason {
  TARGET_NOT_FOUND = 'TARGET_NOT_FOUND',
  REPEATED_RECOVERABLE_FAILURE = 'REPEATED_RECOVERABLE_FAILURE',
  UNEXPECTED_STATE = 'UNEXPECTED_STATE',
  SAFETY_CONFIRMATION_REQUIRED = 'SAFETY_CONFIRMATION_REQUIRED',
}

/**
 * Session state for preserving browser context
 */
export interface SessionState {
  browserContextId?: string;
  pageId?: string;
  url: string;
  preserved: boolean;
}

/**
 * Handoff context
 */
export interface HandoffContext {
  runId: string;
  capabilityName: string;
  capabilityVersion: number;
  currentStep: string;
  goal: string;
  currentUrl: string;
  reason: HandoffReason;
  sessionState: SessionState;
  evidencePath: string;
  timestamp: string;
  checkpointCondition?: string;
}

/**
 * Handoff result
 */
export interface HandoffResult {
  accepted: boolean;
  resumedAt?: string;
  checkpointPassed: boolean;
  humanAction?: string;
  safetyConfirmation?: {
    required: boolean;
    approved: boolean;
    action: string;
  };
}

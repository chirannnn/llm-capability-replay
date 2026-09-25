import { ErrorCategory, ErrorContext } from './types.js';

/**
 * Error classifier for deterministic replay
 * Classifies errors using workflow/runtime context
 * Categories: EXPECTED_BUSINESS_OUTCOME, RECOVERABLE, HARD_FAILURE
 */
export class ErrorClassifier {
  /**
   * Classify an error based on error and context
   */
  classify(error: Error, context: ErrorContext): ErrorCategory {
    // Hard failure: permission error
    if (context.isPermissionError) {
      return ErrorCategory.HARD_FAILURE;
    }

    // Hard failure: structure change (selector not found after max retries)
    if (context.isStructureChange) {
      return ErrorCategory.HARD_FAILURE;
    }

    // Hard failure: exceeded max retries
    if (context.retryCount >= context.maxRetries) {
      return ErrorCategory.HARD_FAILURE;
    }

    // Expected business outcome: workflow context indicates expected negative result
    if (context.isExpectedNegativeResult) {
      return ErrorCategory.EXPECTED_BUSINESS_OUTCOME;
    }

    // Recoverable: transient conditions
    const errorMessage = error.message.toLowerCase();
    if (
      errorMessage.includes('timeout') ||
      errorMessage.includes('network') ||
      errorMessage.includes('etimedout') ||
      errorMessage.includes('econnrefused') ||
      errorMessage.includes('econnreset') ||
      errorMessage.includes('loading') ||
      errorMessage.includes('interstitial')
    ) {
      return ErrorCategory.RECOVERABLE;
    }

    // Default to hard failure for safety
    return ErrorCategory.HARD_FAILURE;
  }
}

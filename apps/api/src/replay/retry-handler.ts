import { BackoffStrategy, RetryPolicy } from '../capability/types.js';

/**
 * Retry handler for deterministic replay
 * Minimal implementation of Phase 2 retry policy
 */
export class RetryHandler {
  /**
   * Execute action with retry policy
   */
  async executeWithRetry(
    action: () => Promise<{ success: boolean; description: string; error?: string; data?: unknown }>,
    policy: RetryPolicy
  ): Promise<{ success: boolean; description: string; error?: string; data?: unknown }> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
      try {
        const result = await action();
        if (result.success) {
          return result;
        }

        // Check if error is retryable
        if (result.error && !this.isRetryable(result.error, policy)) {
          break; // Non-retryable error
        }

        lastError = new Error(result.error);

        // Apply backoff
        if (attempt < policy.maxAttempts) {
          await this.applyBackoff(policy.backoffStrategy, policy.backoffMs, attempt);
        }
      } catch (error) {
        lastError = error as Error;

        // Check if error is retryable
        if (!this.isRetryable((error as Error).message, policy)) {
          break;
        }

        if (attempt < policy.maxAttempts) {
          await this.applyBackoff(policy.backoffStrategy, policy.backoffMs, attempt);
        }
      }
    }

    return {
      success: false,
      description: `Failed after ${policy.maxAttempts} attempts`,
      error: lastError?.message || 'Unknown error',
    };
  }

  /**
   * Check if error is retryable
   */
  private isRetryable(error: string, policy: RetryPolicy): boolean {
    // Check against retryableErrors list if provided
    if (policy.retryableErrors && policy.retryableErrors.length > 0) {
      return policy.retryableErrors.some((pattern: string) => error.toLowerCase().includes(pattern.toLowerCase()));
    }
    // Default: consider timeout/network errors retryable
    const errorLower = error.toLowerCase();
    return (
      errorLower.includes('timeout') ||
      errorLower.includes('network') ||
      errorLower.includes('etimedout') ||
      errorLower.includes('econnrefused')
    );
  }

  /**
   * Apply backoff delay
   */
  private async applyBackoff(strategy: BackoffStrategy, baseMs: number, attempt: number): Promise<void> {
    let delayMs = baseMs;

    switch (strategy) {
      case BackoffStrategy.FIXED:
        delayMs = baseMs;
        break;
      case BackoffStrategy.LINEAR:
        delayMs = baseMs * attempt;
        break;
      case BackoffStrategy.EXPONENTIAL:
        delayMs = baseMs * Math.pow(2, attempt - 1);
        break;
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}

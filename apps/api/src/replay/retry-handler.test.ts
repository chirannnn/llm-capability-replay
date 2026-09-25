import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RetryHandler } from './retry-handler.js';
import { BackoffStrategy } from '../capability/types.js';

describe('Retry Handler', () => {
  let handler: RetryHandler;

  beforeEach(() => {
    handler = new RetryHandler();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should succeed on first attempt', async () => {
    const action = vi.fn().mockResolvedValue({ success: true, description: 'Success' });
    const policy = {
      maxAttempts: 3,
      backoffStrategy: BackoffStrategy.FIXED,
      backoffMs: 1, // Use very short delay for tests
    };

    const result = await handler.executeWithRetry(action, policy);

    expect(result.success).toBe(true);
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('should fail after max attempts', async () => {
    const action = vi.fn().mockResolvedValue({ success: false, description: 'Failed', error: 'timeout' });
    const policy = {
      maxAttempts: 2, // Use fewer attempts for faster tests
      backoffStrategy: BackoffStrategy.FIXED,
      backoffMs: 1,
    };

    const result = await handler.executeWithRetry(action, policy);

    expect(result.success).toBe(false);
    expect(action).toHaveBeenCalledTimes(2);
    expect(result.description).toContain('Failed after 2 attempts');
  });

  it('should not retry non-retryable errors', async () => {
    const action = vi.fn().mockResolvedValue({ success: false, description: 'Failed', error: 'permission denied' });
    const policy = {
      maxAttempts: 3,
      backoffStrategy: BackoffStrategy.FIXED,
      backoffMs: 1,
      retryableErrors: ['timeout'],
    };

    const result = await handler.executeWithRetry(action, policy);

    expect(result.success).toBe(false);
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('should use custom retryableErrors list', async () => {
    const action = vi.fn()
      .mockResolvedValueOnce({ success: false, description: 'Failed', error: 'custom error' })
      .mockResolvedValueOnce({ success: true, description: 'Success' });
    const policy = {
      maxAttempts: 3,
      backoffStrategy: BackoffStrategy.FIXED,
      backoffMs: 1,
      retryableErrors: ['custom error'],
    };

    const result = await handler.executeWithRetry(action, policy);

    expect(result.success).toBe(true);
    expect(action).toHaveBeenCalledTimes(2);
  });

  it('should handle thrown errors', async () => {
    const action = vi.fn()
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce({ success: true, description: 'Success' });
    const policy = {
      maxAttempts: 3,
      backoffStrategy: BackoffStrategy.FIXED,
      backoffMs: 1,
    };

    const result = await handler.executeWithRetry(action, policy);

    expect(result.success).toBe(true);
    expect(action).toHaveBeenCalledTimes(2);
  });
});

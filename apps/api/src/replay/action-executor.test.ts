import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ActionExecutor } from './action-executor.js';

describe('ActionExecutor', () => {
  let executor: ActionExecutor;

  beforeEach(async () => {
    executor = new ActionExecutor();
    await executor.initialize();
  });

  afterEach(async () => {
    await executor.close();
  });

  it('should report actual error messages when actions fail', async () => {
    // Try to navigate to an invalid URL
    const result = await executor.executeAction({
      type: 'navigate',
      value: 'https://this-url-does-not-exist-12345.com',
      timeout: 5000,
      selectors: [],
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).not.toBe('Unknown error');
    // The error should contain network-related information
    expect(result.error).toMatch(/net::ERR_NAME_NOT_RESOLVED|ENOTFOUND|getaddrinfo/);
  });
});

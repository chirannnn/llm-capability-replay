import { describe, it, expect } from 'vitest';
import { sanitizeObservation, createObservation } from './types.js';

describe('Observation Sanitization - Sensitive Data', () => {
  it('should redact password-like values', () => {
    const observation = createObservation(
      'https://example.com',
      'Test Page',
      [
        {
          role: 'textbox',
          accessibleName: 'Enter your password',
          visibleText: 'secret123',
        },
      ]
    );

    const sanitized = sanitizeObservation(observation);
    expect(sanitized.visibleElements[0].accessibleName).toBe('[REDACTED]');
  });

  it('should redact API key values', () => {
    const observation = createObservation(
      'https://example.com',
      'Test Page',
      [
        {
          role: 'textbox',
          accessibleName: 'Enter api-key',
          visibleText: 'sk-1234567890',
        },
      ]
    );

    const sanitized = sanitizeObservation(observation);
    expect(sanitized.visibleElements[0].accessibleName).toBe('[REDACTED]');
  });

  it('should redact token values', () => {
    const observation = createObservation(
      'https://example.com',
      'Test Page',
      [
        {
          role: 'textbox',
          visibleText: 'Bearer eyJhbGciOiJIUzI1NiIs',
        },
      ]
    );

    const sanitized = sanitizeObservation(observation);
    expect(sanitized.visibleElements[0].visibleText).toBe('[REDACTED]');
  });

  it('should redact secret values', () => {
    const observation = createObservation(
      'https://example.com',
      'Test Page',
      [
        {
          role: 'textbox',
          accessibleName: 'Secret value',
          visibleText: 'my-secret-key',
        },
      ]
    );

    const sanitized = sanitizeObservation(observation);
    expect(sanitized.visibleElements[0].accessibleName).toBe('[REDACTED]');
  });

  it('should redact credential values', () => {
    const observation = createObservation(
      'https://example.com',
      'Test Page',
      [
        {
          role: 'textbox',
          accessibleName: 'Enter credentials',
          visibleText: 'user:pass',
        },
      ]
    );

    const sanitized = sanitizeObservation(observation);
    expect(sanitized.visibleElements[0].accessibleName).toBe('[REDACTED]');
  });

  it('should redact session ID values', () => {
    const observation = createObservation(
      'https://example.com',
      'Test Page',
      [
        {
          role: 'textbox',
          visibleText: 'session_id=abc123',
        },
      ]
    );

    const sanitized = sanitizeObservation(observation);
    expect(sanitized.visibleElements[0].visibleText).toBe('[REDACTED]');
  });

  it('should not redact non-sensitive values', () => {
    const observation = createObservation(
      'https://example.com',
      'Test Page',
      [
        {
          role: 'button',
          visibleText: 'Search',
        },
        {
          role: 'textbox',
          accessibleName: 'Search query',
          visibleText: 'test query',
        },
      ]
    );

    const sanitized = sanitizeObservation(observation);
    expect(sanitized.visibleElements[0].visibleText).toBe('Search');
    expect(sanitized.visibleElements[1].accessibleName).toBe('Search query');
    expect(sanitized.visibleElements[1].visibleText).toBe('test query');
  });

  it('should preserve URL and title in sanitization', () => {
    const observation = createObservation(
      'https://example.com/page',
      'Test Page',
      []
    );

    const sanitized = sanitizeObservation(observation);
    expect(sanitized.url).toBe('https://example.com/page');
    expect(sanitized.title).toBe('Test Page');
  });
});

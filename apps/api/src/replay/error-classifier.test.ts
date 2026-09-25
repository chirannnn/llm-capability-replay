import { describe, it, expect, beforeEach } from 'vitest';
import { ErrorClassifier } from './error-classifier.js';
import { ErrorCategory, ErrorContext } from './types.js';

describe('Error Classifier', () => {
  let classifier: ErrorClassifier;

  beforeEach(() => {
    classifier = new ErrorClassifier();
  });

  it('should classify permission error as hard failure', () => {
    const error = new Error('Permission denied');
    const context: ErrorContext = {
      stepId: 'step-1',
      retryCount: 0,
      maxRetries: 3,
      isPermissionError: true,
    };
    const category = classifier.classify(error, context);
    expect(category).toBe(ErrorCategory.HARD_FAILURE);
  });

  it('should classify structure change as hard failure', () => {
    const error = new Error('Element not found');
    const context: ErrorContext = {
      stepId: 'step-1',
      retryCount: 0,
      maxRetries: 3,
      isStructureChange: true,
    };
    const category = classifier.classify(error, context);
    expect(category).toBe(ErrorCategory.HARD_FAILURE);
  });

  it('should classify exceeded retries as hard failure', () => {
    const error = new Error('Timeout');
    const context: ErrorContext = {
      stepId: 'step-1',
      retryCount: 3,
      maxRetries: 3,
    };
    const category = classifier.classify(error, context);
    expect(category).toBe(ErrorCategory.HARD_FAILURE);
  });

  it('should classify expected negative result as business outcome', () => {
    const error = new Error('Not found');
    const context: ErrorContext = {
      stepId: 'step-1',
      retryCount: 0,
      maxRetries: 3,
      isExpectedNegativeResult: true,
    };
    const category = classifier.classify(error, context);
    expect(category).toBe(ErrorCategory.EXPECTED_BUSINESS_OUTCOME);
  });

  it('should classify timeout as recoverable', () => {
    const error = new Error('Timeout exceeded');
    const context: ErrorContext = {
      stepId: 'step-1',
      retryCount: 0,
      maxRetries: 3,
    };
    const category = classifier.classify(error, context);
    expect(category).toBe(ErrorCategory.RECOVERABLE);
  });

  it('should classify network error as recoverable', () => {
    const error = new Error('Network connection failed');
    const context: ErrorContext = {
      stepId: 'step-1',
      retryCount: 0,
      maxRetries: 3,
    };
    const category = classifier.classify(error, context);
    expect(category).toBe(ErrorCategory.RECOVERABLE);
  });

  it('should classify ETIMEDOUT as recoverable', () => {
    const error = new Error('ETIMEDOUT');
    const context: ErrorContext = {
      stepId: 'step-1',
      retryCount: 0,
      maxRetries: 3,
    };
    const category = classifier.classify(error, context);
    expect(category).toBe(ErrorCategory.RECOVERABLE);
  });

  it('should classify ECONNREFUSED as recoverable', () => {
    const error = new Error('ECONNREFUSED');
    const context: ErrorContext = {
      stepId: 'step-1',
      retryCount: 0,
      maxRetries: 3,
    };
    const category = classifier.classify(error, context);
    expect(category).toBe(ErrorCategory.RECOVERABLE);
  });

  it('should classify loading condition as recoverable', () => {
    const error = new Error('Page still loading');
    const context: ErrorContext = {
      stepId: 'step-1',
      retryCount: 0,
      maxRetries: 3,
    };
    const category = classifier.classify(error, context);
    expect(category).toBe(ErrorCategory.RECOVERABLE);
  });

  it('should default to hard failure for unknown errors', () => {
    const error = new Error('Unknown error');
    const context: ErrorContext = {
      stepId: 'step-1',
      retryCount: 0,
      maxRetries: 3,
    };
    const category = classifier.classify(error, context);
    expect(category).toBe(ErrorCategory.HARD_FAILURE);
  });

  it('should not classify generic not found as business outcome without context', () => {
    const error = new Error('Element not found');
    const context: ErrorContext = {
      stepId: 'step-1',
      retryCount: 0,
      maxRetries: 3,
    };
    const category = classifier.classify(error, context);
    expect(category).toBe(ErrorCategory.HARD_FAILURE);
  });
});

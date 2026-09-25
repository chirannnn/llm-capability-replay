/**
 * Type definitions for Capability Artifact Schema
 * These types are inferred from Zod schemas in schema.ts
 */

// Review status enum for capability versions
export enum ReviewStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  DEPRECATED = 'deprecated',
}

// Application type enum
export enum ApplicationType {
  WEB = 'web',
  DESKTOP = 'desktop',
}

// Authentication type enum
export enum AuthenticationType {
  NONE = 'none',
  BASIC = 'basic',
  OAUTH = 'oauth',
  SESSION = 'session',
}

// Data type enum for inputs/outputs
export enum DataType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  OBJECT = 'object',
  ARRAY = 'array',
}

// UI action type enum
export enum ActionType {
  CLICK = 'click',
  TYPE = 'type',
  SELECT = 'select',
  WAIT = 'wait',
  EXTRACT = 'extract',
  NAVIGATE = 'navigate',
}

// Backoff strategy enum for retry policy
export enum BackoffStrategy {
  FIXED = 'fixed',
  LINEAR = 'linear',
  EXPONENTIAL = 'exponential',
}

// Retry policy type (for re-export)
export type RetryPolicy = {
  maxAttempts: number;
  backoffStrategy: BackoffStrategy;
  backoffMs: number;
  retryableErrors?: string[];
};

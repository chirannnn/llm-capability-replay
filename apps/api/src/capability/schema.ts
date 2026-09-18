import { z } from 'zod';
import {
  ReviewStatus,
  ApplicationType,
  AuthenticationType,
  DataType,
  ActionType,
  BackoffStrategy,
} from './types.js';

/**
 * Capability Metadata Schema
 * Describes the capability's basic information
 */
export const CapabilityMetadataSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  tags: z.array(z.string().min(1).max(50)).default([]),
  category: z.string().min(1).max(100),
});

export type CapabilityMetadata = z.infer<typeof CapabilityMetadataSchema>;

/**
 * Version Metadata Schema
 * Describes version information and review status
 * Note: Approved versions are immutable by application contract
 */
export const VersionMetadataSchema = z.object({
  version: z.number().int().positive(),
  createdBy: z.string().min(1).max(100),
  createdAt: z.string().datetime(),
  reviewStatus: z.nativeEnum(ReviewStatus),
  changelog: z.string().max(1000),
});

export type VersionMetadata = z.infer<typeof VersionMetadataSchema>;

/**
 * Tenant Information Schema
 * Describes tenant scoping
 */
export const TenantInfoSchema = z.object({
  tenantId: z.string().uuid().optional(),
  isGlobal: z.boolean().default(false),
});

export type TenantInfo = z.infer<typeof TenantInfoSchema>;

/**
 * Authentication Requirements Schema
 * Describes authentication type and requirements (no secrets stored)
 */
export const AuthenticationSchema = z.object({
  type: z.nativeEnum(AuthenticationType),
  requirements: z.array(z.string()).optional(),
});

export type Authentication = z.infer<typeof AuthenticationSchema>;

/**
 * Target Descriptor Schema
 * Describes the target application
 */
export const TargetDescriptorSchema = z.object({
  applicationType: z.nativeEnum(ApplicationType),
  url: z.string().url().optional(),
  platform: z.string().min(1).max(100).optional(),
  authentication: AuthenticationSchema,
});

export type TargetDescriptor = z.infer<typeof TargetDescriptorSchema>;

/**
 * Validation Constraints Schema
 * Serializable JSON validation rules (not ZodSchema objects)
 */
export const ValidationConstraintsSchema = z.object({
  type: z.nativeEnum(DataType),
  constraints: z.record(z.any()).optional(),
});

export type ValidationConstraints = z.infer<typeof ValidationConstraintsSchema>;

/**
 * Typed Input Schema
 * Describes an input parameter with serializable validation rules
 */
export const TypedInputSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.nativeEnum(DataType),
  required: z.boolean(),
  validation: ValidationConstraintsSchema.optional(),
  defaultValue: z.any().optional(),
});

export type TypedInput = z.infer<typeof TypedInputSchema>;

/**
 * Typed Output Schema
 * Describes an output with extraction rules
 */
export const TypedOutputSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.nativeEnum(DataType),
  extractionRule: z.string().min(1),
  successCondition: z.string().optional(),
});

export type TypedOutput = z.infer<typeof TypedOutputSchema>;

/**
 * Selector Schema
 * Describes element selectors for UI actions
 */
export const SelectorSchema = z.object({
  type: z.enum(['css', 'xpath', 'text', 'aria']),
  value: z.string().min(1),
});

export type Selector = z.infer<typeof SelectorSchema>;

/**
 * UI Action Schema
 * Describes a UI action with selectors and timing
 */
export const UIActionSchema = z.object({
  type: z.nativeEnum(ActionType),
  selectors: z.array(SelectorSchema).optional(),
  value: z.string().optional(),
  timeout: z.number().int().positive().optional().default(5000),
  waitCondition: z.string().optional(),
});

export type UIAction = z.infer<typeof UIActionSchema>;

/**
 * Checkpoint Schema
 * Describes validation conditions using expression language
 * Simple, deterministic, serializable expression language
 */
export const CheckpointSchema = z.object({
  condition: z.string().min(1), // Expression language: "element.visible == true"
  successCriteria: z.string().optional(),
  failureHandling: z.enum(['continue', 'retry', 'fail']).default('fail'),
});

export type Checkpoint = z.infer<typeof CheckpointSchema>;

/**
 * Retry Policy Schema
 * Describes retry behavior for steps
 */
export const RetryPolicySchema = z.object({
  maxAttempts: z.number().int().positive().default(3),
  backoffStrategy: z.nativeEnum(BackoffStrategy).default(BackoffStrategy.FIXED),
  backoffMs: z.number().int().positive().default(1000),
  retryableErrors: z.array(z.string()).optional(),
});

export type RetryPolicy = z.infer<typeof RetryPolicySchema>;

/**
 * Step Schema
 * Describes a single step in the capability
 */
export const StepSchema = z.object({
  stepId: z.string().min(1).max(100),
  order: z.number().int().positive(),
  description: z.string().min(1).max(500),
  action: UIActionSchema,
  checkpoint: CheckpointSchema.optional(),
  retryPolicy: RetryPolicySchema.optional(),
});

export type Step = z.infer<typeof StepSchema>;

/**
 * Safety Policy Schema
 * Describes safety constraints for the capability
 */
export const SafetyPolicySchema = z.object({
  allowedDomains: z.array(z.string().url()).default([]),
  restrictedActions: z.array(z.nativeEnum(ActionType)).default([]),
  dataExtractionRules: z.array(z.string()).default([]),
  humanApprovalRequired: z.boolean().default(false),
});

export type SafetyPolicy = z.infer<typeof SafetyPolicySchema>;

/**
 * Capability Artifact Schema
 * Root schema combining all components
 * This is the complete contract between discovery and replay
 */
export const CapabilityArtifactSchema = z.object({
  metadata: CapabilityMetadataSchema,
  version: VersionMetadataSchema,
  tenant: TenantInfoSchema,
  target: TargetDescriptorSchema,
  inputs: z.array(TypedInputSchema),
  outputs: z.array(TypedOutputSchema),
  steps: z.array(StepSchema),
  safety: SafetyPolicySchema,
});

export type CapabilityArtifact = z.infer<typeof CapabilityArtifactSchema>;

/**
 * Validation function for capability artifacts
 */
export function validateCapabilityArtifact(data: unknown): CapabilityArtifact {
  return CapabilityArtifactSchema.parse(data);
}

/**
 * Safe validation function that returns result instead of throwing
 */
export function safeValidateCapabilityArtifact(
  data: unknown
): z.SafeParseReturnType<unknown, CapabilityArtifact> {
  return CapabilityArtifactSchema.safeParse(data);
}

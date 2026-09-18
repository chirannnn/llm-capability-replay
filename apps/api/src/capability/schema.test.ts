import { describe, it, expect } from 'vitest';
import {
  CapabilityMetadataSchema,
  VersionMetadataSchema,
  TenantInfoSchema,
  TargetDescriptorSchema,
  TypedInputSchema,
  TypedOutputSchema,
  UIActionSchema,
  CheckpointSchema,
  RetryPolicySchema,
  StepSchema,
  SafetyPolicySchema,
  CapabilityArtifactSchema,
  validateCapabilityArtifact,
  safeValidateCapabilityArtifact,
} from './schema.js';
import { ReviewStatus, ApplicationType, AuthenticationType, DataType, ActionType, BackoffStrategy } from './types.js';

describe('CapabilityMetadataSchema', () => {
  it('should validate valid metadata', () => {
    const validMetadata = {
      name: 'Test Capability',
      description: 'A test capability',
      tags: ['test', 'example'],
      category: 'test',
    };
    const result = CapabilityMetadataSchema.parse(validMetadata);
    expect(result).toEqual(validMetadata);
  });

  it('should reject invalid metadata with missing name', () => {
    const invalidMetadata = {
      description: 'A test capability',
      tags: ['test'],
      category: 'test',
    };
    expect(() => CapabilityMetadataSchema.parse(invalidMetadata)).toThrow();
  });

  it('should reject metadata with name too long', () => {
    const invalidMetadata = {
      name: 'a'.repeat(201),
      description: 'A test capability',
      tags: ['test'],
      category: 'test',
    };
    expect(() => CapabilityMetadataSchema.parse(invalidMetadata)).toThrow();
  });

  it('should accept default empty tags array', () => {
    const metadata = {
      name: 'Test Capability',
      description: 'A test capability',
      category: 'test',
    };
    const result = CapabilityMetadataSchema.parse(metadata);
    expect(result.tags).toEqual([]);
  });
});

describe('VersionMetadataSchema', () => {
  it('should validate valid version metadata', () => {
    const validVersion = {
      version: 1,
      createdBy: 'test-user',
      createdAt: '2024-01-15T10:00:00Z',
      reviewStatus: ReviewStatus.DRAFT,
      changelog: 'Initial version',
    };
    const result = VersionMetadataSchema.parse(validVersion);
    expect(result).toEqual(validVersion);
  });

  it('should reject invalid version number', () => {
    const invalidVersion = {
      version: 0,
      createdBy: 'test-user',
      createdAt: '2024-01-15T10:00:00Z',
      reviewStatus: ReviewStatus.DRAFT,
      changelog: 'Initial version',
    };
    expect(() => VersionMetadataSchema.parse(invalidVersion)).toThrow();
  });

  it('should reject invalid review status', () => {
    const invalidVersion = {
      version: 1,
      createdBy: 'test-user',
      createdAt: '2024-01-15T10:00:00Z',
      reviewStatus: 'invalid_status' as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      changelog: 'Initial version',
    };
    expect(() => VersionMetadataSchema.parse(invalidVersion)).toThrow();
  });
});

describe('TenantInfoSchema', () => {
  it('should validate valid tenant info with tenantId', () => {
    const validTenant = {
      tenantId: '123e4567-e89b-12d3-a456-426614174000',
      isGlobal: false,
    };
    const result = TenantInfoSchema.parse(validTenant);
    expect(result).toEqual(validTenant);
  });

  it('should validate valid tenant info without tenantId', () => {
    const validTenant = {
      isGlobal: true,
    };
    const result = TenantInfoSchema.parse(validTenant);
    expect(result.tenantId).toBeUndefined();
    expect(result.isGlobal).toBe(true);
  });

  it('should accept default isGlobal as false', () => {
    const tenant = {};
    const result = TenantInfoSchema.parse(tenant);
    expect(result.isGlobal).toBe(false);
  });
});

describe('TargetDescriptorSchema', () => {
  it('should validate valid target descriptor', () => {
    const validTarget = {
      applicationType: ApplicationType.WEB,
      url: 'https://example.com',
      platform: 'test-platform',
      authentication: {
        type: AuthenticationType.NONE,
      },
    };
    const result = TargetDescriptorSchema.parse(validTarget);
    expect(result).toEqual(validTarget);
  });

  it('should validate target without url', () => {
    const validTarget = {
      applicationType: ApplicationType.DESKTOP,
      platform: 'test-platform',
      authentication: {
        type: AuthenticationType.SESSION,
      },
    };
    const result = TargetDescriptorSchema.parse(validTarget);
    expect(result.url).toBeUndefined();
  });

  it('should reject invalid URL', () => {
    const invalidTarget = {
      applicationType: ApplicationType.WEB,
      url: 'not-a-url',
      authentication: {
        type: AuthenticationType.NONE,
      },
    };
    expect(() => TargetDescriptorSchema.parse(invalidTarget)).toThrow();
  });
});

describe('TypedInputSchema', () => {
  it('should validate valid typed input', () => {
    const validInput = {
      name: 'testInput',
      type: DataType.STRING,
      required: true,
      validation: {
        type: DataType.STRING,
        constraints: {
          minLength: 1,
          maxLength: 100,
        },
      },
      defaultValue: 'test',
    };
    const result = TypedInputSchema.parse(validInput);
    expect(result).toEqual(validInput);
  });

  it('should validate input without validation', () => {
    const validInput = {
      name: 'testInput',
      type: DataType.NUMBER,
      required: false,
    };
    const result = TypedInputSchema.parse(validInput);
    expect(result.validation).toBeUndefined();
  });

  it('should reject input with empty name', () => {
    const invalidInput = {
      name: '',
      type: DataType.STRING,
      required: true,
    };
    expect(() => TypedInputSchema.parse(invalidInput)).toThrow();
  });
});

describe('TypedOutputSchema', () => {
  it('should validate valid typed output', () => {
    const validOutput = {
      name: 'testOutput',
      type: DataType.STRING,
      extractionRule: 'document.querySelector(".test")?.textContent',
      successCondition: 'element.count > 0',
    };
    const result = TypedOutputSchema.parse(validOutput);
    expect(result).toEqual(validOutput);
  });

  it('should validate output without success condition', () => {
    const validOutput = {
      name: 'testOutput',
      type: DataType.BOOLEAN,
      extractionRule: 'element.visible',
    };
    const result = TypedOutputSchema.parse(validOutput);
    expect(result.successCondition).toBeUndefined();
  });

  it('should reject output with empty extraction rule', () => {
    const invalidOutput = {
      name: 'testOutput',
      type: DataType.STRING,
      extractionRule: '',
    };
    expect(() => TypedOutputSchema.parse(invalidOutput)).toThrow();
  });
});

describe('UIActionSchema', () => {
  it('should validate valid click action', () => {
    const validAction = {
      type: ActionType.CLICK,
      selectors: [
        {
          type: 'css',
          value: '#test-button',
        },
      ],
      timeout: 5000,
    };
    const result = UIActionSchema.parse(validAction);
    expect(result).toEqual(validAction);
  });

  it('should validate navigate action', () => {
    const validAction = {
      type: ActionType.NAVIGATE,
      value: 'https://example.com',
      timeout: 10000,
    };
    const result = UIActionSchema.parse(validAction);
    expect(result).toEqual(validAction);
  });

  it('should accept default timeout', () => {
    const action = {
      type: ActionType.WAIT,
    };
    const result = UIActionSchema.parse(action);
    expect(result.timeout).toBe(5000);
  });

  it('should reject invalid selector type', () => {
    const invalidAction = {
      type: ActionType.CLICK,
      selectors: [
        {
          type: 'invalid' as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          value: '#test',
        },
      ],
    };
    expect(() => UIActionSchema.parse(invalidAction)).toThrow();
  });
});

describe('CheckpointSchema', () => {
  it('should validate valid checkpoint', () => {
    const validCheckpoint = {
      condition: 'element.visible == true',
      successCriteria: 'Element is visible',
      failureHandling: 'fail' as const,
    };
    const result = CheckpointSchema.parse(validCheckpoint);
    expect(result).toEqual(validCheckpoint);
  });

  it('should accept default failure handling', () => {
    const checkpoint = {
      condition: 'element.count > 0',
    };
    const result = CheckpointSchema.parse(checkpoint);
    expect(result.failureHandling).toBe('fail');
  });

  it('should reject empty condition', () => {
    const invalidCheckpoint = {
      condition: '',
    };
    expect(() => CheckpointSchema.parse(invalidCheckpoint)).toThrow();
  });

  it('should reject invalid failure handling', () => {
    const invalidCheckpoint = {
      condition: 'element.visible == true',
      failureHandling: 'invalid' as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    };
    expect(() => CheckpointSchema.parse(invalidCheckpoint)).toThrow();
  });
});

describe('RetryPolicySchema', () => {
  it('should validate valid retry policy', () => {
    const validPolicy = {
      maxAttempts: 3,
      backoffStrategy: BackoffStrategy.EXPONENTIAL,
      backoffMs: 2000,
      retryableErrors: ['network_error', 'timeout'],
    };
    const result = RetryPolicySchema.parse(validPolicy);
    expect(result).toEqual(validPolicy);
  });

  it('should accept default values', () => {
    const policy = {};
    const result = RetryPolicySchema.parse(policy);
    expect(result.maxAttempts).toBe(3);
    expect(result.backoffStrategy).toBe(BackoffStrategy.FIXED);
    expect(result.backoffMs).toBe(1000);
  });

  it('should reject zero max attempts', () => {
    const invalidPolicy = {
      maxAttempts: 0,
    };
    expect(() => RetryPolicySchema.parse(invalidPolicy)).toThrow();
  });
});

describe('StepSchema', () => {
  it('should validate valid step', () => {
    const validStep = {
      stepId: 'test-step',
      order: 1,
      description: 'Test step description',
      action: {
        type: ActionType.CLICK,
        selectors: [
          {
            type: 'css',
            value: '#test',
          },
        ],
      },
      checkpoint: {
        condition: 'element.visible == true',
      },
      retryPolicy: {
        maxAttempts: 3,
      },
    };
    const result = StepSchema.parse(validStep);
    expect(result).toMatchObject(validStep);
  });

  it('should validate step without optional fields', () => {
    const validStep = {
      stepId: 'test-step',
      order: 1,
      description: 'Test step description',
      action: {
        type: ActionType.WAIT,
        timeout: 5000,
      },
    };
    const result = StepSchema.parse(validStep);
    expect(result.checkpoint).toBeUndefined();
    expect(result.retryPolicy).toBeUndefined();
  });

  it('should reject step with invalid order', () => {
    const invalidStep = {
      stepId: 'test-step',
      order: 0,
      description: 'Test step description',
      action: {
        type: ActionType.WAIT,
      },
    };
    expect(() => StepSchema.parse(invalidStep)).toThrow();
  });
});

describe('SafetyPolicySchema', () => {
  it('should validate valid safety policy', () => {
    const validPolicy = {
      allowedDomains: ['https://example.com'],
      restrictedActions: [ActionType.TYPE],
      dataExtractionRules: ['Only public data'],
      humanApprovalRequired: true,
    };
    const result = SafetyPolicySchema.parse(validPolicy);
    expect(result).toEqual(validPolicy);
  });

  it('should accept default values', () => {
    const policy = {};
    const result = SafetyPolicySchema.parse(policy);
    expect(result.allowedDomains).toEqual([]);
    expect(result.restrictedActions).toEqual([]);
    expect(result.dataExtractionRules).toEqual([]);
    expect(result.humanApprovalRequired).toBe(false);
  });

  it('should reject invalid domain URL', () => {
    const invalidPolicy = {
      allowedDomains: ['not-a-url'],
    };
    expect(() => SafetyPolicySchema.parse(invalidPolicy)).toThrow();
  });
});

describe('CapabilityArtifactSchema', () => {
  it('should validate complete capability artifact', () => {
    const validArtifact = {
      metadata: {
        name: 'Test Capability',
        description: 'A test capability',
        tags: ['test'],
        category: 'test',
      },
      version: {
        version: 1,
        createdBy: 'test-user',
        createdAt: '2024-01-15T10:00:00Z',
        reviewStatus: ReviewStatus.DRAFT,
        changelog: 'Initial version',
      },
      tenant: {
        isGlobal: true,
      },
      target: {
        applicationType: ApplicationType.WEB,
        url: 'https://example.com',
        authentication: {
          type: AuthenticationType.NONE,
        },
      },
      inputs: [
        {
          name: 'testInput',
          type: DataType.STRING,
          required: true,
        },
      ],
      outputs: [
        {
          name: 'testOutput',
          type: DataType.STRING,
          extractionRule: 'element.text',
        },
      ],
      steps: [
        {
          stepId: 'step1',
          order: 1,
          description: 'First step',
          action: {
            type: ActionType.NAVIGATE,
            value: 'https://example.com',
          },
        },
      ],
      safety: {
        allowedDomains: ['https://example.com'],
      },
    };
    const result = CapabilityArtifactSchema.parse(validArtifact);
    expect(result).toMatchObject(validArtifact);
  });

  it('should reject artifact with missing required fields', () => {
    const invalidArtifact = {
      metadata: {
        name: 'Test Capability',
        description: 'A test capability',
        tags: ['test'],
        category: 'test',
      },
      // Missing version, tenant, target, inputs, outputs, steps, safety
    };
    expect(() => CapabilityArtifactSchema.parse(invalidArtifact)).toThrow();
  });

  it('should ensure validation rules are serializable JSON', () => {
    const artifact = {
      metadata: {
        name: 'Test',
        description: 'Test',
        tags: [],
        category: 'test',
      },
      version: {
        version: 1,
        createdBy: 'test',
        createdAt: '2024-01-15T10:00:00Z',
        reviewStatus: ReviewStatus.DRAFT,
        changelog: 'Initial',
      },
      tenant: {
        isGlobal: true,
      },
      target: {
        applicationType: ApplicationType.WEB,
        authentication: {
          type: AuthenticationType.NONE,
        },
      },
      inputs: [
        {
          name: 'test',
          type: DataType.STRING,
          required: true,
          validation: {
            type: DataType.STRING,
            constraints: { minLength: 1 },
          },
        },
      ],
      outputs: [],
      steps: [],
      safety: {},
    };

    const result = CapabilityArtifactSchema.parse(artifact);
    // Verify validation is a plain object, not a ZodSchema
    expect(typeof result.inputs[0].validation).toBe('object');
    expect(result.inputs[0].validation!.constraints).toEqual({ minLength: 1 });
  });
});

describe('validateCapabilityArtifact', () => {
  it('should return parsed artifact for valid data', () => {
    const validArtifact = {
      metadata: {
        name: 'Test',
        description: 'Test',
        tags: [],
        category: 'test',
      },
      version: {
        version: 1,
        createdBy: 'test',
        createdAt: '2024-01-15T10:00:00Z',
        reviewStatus: ReviewStatus.DRAFT,
        changelog: 'Initial',
      },
      tenant: {
        isGlobal: true,
      },
      target: {
        applicationType: ApplicationType.WEB,
        authentication: {
          type: AuthenticationType.NONE,
        },
      },
      inputs: [],
      outputs: [],
      steps: [],
      safety: {},
    };
    const result = validateCapabilityArtifact(validArtifact);
    expect(result).toMatchObject(validArtifact);
  });

  it('should throw for invalid data', () => {
    const invalidArtifact = {};
    expect(() => validateCapabilityArtifact(invalidArtifact)).toThrow();
  });
});

describe('safeValidateCapabilityArtifact', () => {
  it('should return success for valid data', () => {
    const validArtifact = {
      metadata: {
        name: 'Test',
        description: 'Test',
        tags: [],
        category: 'test',
      },
      version: {
        version: 1,
        createdBy: 'test',
        createdAt: '2024-01-15T10:00:00Z',
        reviewStatus: ReviewStatus.DRAFT,
        changelog: 'Initial',
      },
      tenant: {
        isGlobal: true,
      },
      target: {
        applicationType: ApplicationType.WEB,
        authentication: {
          type: AuthenticationType.NONE,
        },
      },
      inputs: [],
      outputs: [],
      steps: [],
      safety: {},
    };
    const result = safeValidateCapabilityArtifact(validArtifact);
    expect(result.success).toBe(true);
  });

  it('should return error for invalid data', () => {
    const invalidArtifact = {};
    const result = safeValidateCapabilityArtifact(invalidArtifact);
    expect(result.success).toBe(false);
  });
});

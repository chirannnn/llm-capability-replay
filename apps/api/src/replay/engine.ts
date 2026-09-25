import { v4 as uuidv4 } from 'uuid';
import { CapabilityArtifact, safeValidateCapabilityArtifact } from '../capability/schema.js';
import { ActionType, BackoffStrategy } from '../capability/types.js';
import { ReplayResult, ExecutedStep, ErrorContext, ErrorCategory } from './types.js';
import { ActionExecutor } from './action-executor.js';
import { CheckpointEvaluator } from './checkpoint.js';
import { ErrorClassifier } from './error-classifier.js';
import { RetryHandler } from './retry-handler.js';
import { initializeReplayEvidenceCollector } from './evidence-collector.js';

/**
 * Replay engine for deterministic execution
 * Executes Capability Artifacts without LLM involvement
 */
export class ReplayEngine {
  private actionExecutor: ActionExecutor;
  private checkpointEvaluator: CheckpointEvaluator;
  private errorClassifier: ErrorClassifier;
  private retryHandler: RetryHandler;
  private targetOrigin: string;

  constructor() {
    this.actionExecutor = new ActionExecutor();
    this.checkpointEvaluator = new CheckpointEvaluator();
    this.errorClassifier = new ErrorClassifier();
    this.retryHandler = new RetryHandler();
    this.targetOrigin = '';
  }

  /**
   * Extract origin from URL
   */
  private extractOrigin(url: string): string {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.host}`;
    } catch {
      return url;
    }
  }

  /**
   * Check if URL belongs to allowed domain
   */
  private isAllowedDomain(url: string, allowedDomains: string[]): boolean {
    if (!allowedDomains || allowedDomains.length === 0) {
      return true; // No restriction if no allowed domains specified
    }
    
    const urlOrigin = this.extractOrigin(url);
    return allowedDomains.some((domain) => {
      const domainOrigin = this.extractOrigin(domain);
      return urlOrigin === domainOrigin || urlOrigin === this.targetOrigin;
    });
  }

  /**
   * Execute a Capability Artifact deterministically
   */
  async executeReplay(
    artifact: CapabilityArtifact,
    inputs: Record<string, unknown> = {}
  ): Promise<ReplayResult> {
    const runId = uuidv4();
    const startedAt = new Date().toISOString();

    // Validate artifact
    const validationResult = safeValidateCapabilityArtifact(artifact);
    if (!validationResult.success) {
      return {
        runId,
        capabilityName: artifact.metadata?.name || 'Unknown',
        capabilityVersion: artifact.version?.version || 1,
        success: false,
        failure: {
          category: ErrorCategory.HARD_FAILURE,
          message: `Invalid artifact: ${validationResult.error.message}`,
          stepId: 'validation',
        },
        executedSteps: [],
        currentStep: 0,
        outputs: {},
        startedAt,
        completedAt: new Date().toISOString(),
        durationMs: 0,
        evidencePath: '',
      };
    }

    const validArtifact = validationResult.data;

    // Set target origin from artifact for safety checks
    if (validArtifact.target.url) {
      this.targetOrigin = this.extractOrigin(validArtifact.target.url);
    }

    // Initialize evidence collector
    const evidenceCollector = initializeReplayEvidenceCollector(runId);
    evidenceCollector.logEvent({ event: 'replay_started', runId, capability: validArtifact.metadata.name, inputs });

    // Initialize browser
    await this.actionExecutor.initialize();

    // Sort steps by order
    const sortedSteps = [...validArtifact.steps].sort((a, b) => a.order - b.order);

    const executedSteps: ExecutedStep[] = [];
    const outputs: Record<string, unknown> = {};
    let currentStep = 0;
    let success = true;
    let failure: { category: ErrorCategory; message: string; stepId: string } | undefined;

    try {
      // Initial navigation if target URL is provided - check safety first
      if (validArtifact.target.url) {
        // Check if initial navigation is allowed
        if (!this.isAllowedDomain(validArtifact.target.url, validArtifact.safety.allowedDomains)) {
          success = false;
          failure = {
            category: ErrorCategory.HARD_FAILURE,
            message: `Navigation to ${validArtifact.target.url} is not allowed by safety policy`,
            stepId: 'initial-navigation',
          };
        } else {
          const navigateResult = await this.actionExecutor.executeAction({
            type: ActionType.NAVIGATE,
            value: validArtifact.target.url,
            timeout: 10000,
          });

          if (!navigateResult.success) {
            success = false;
            failure = {
              category: ErrorCategory.HARD_FAILURE,
              message: navigateResult.error || 'Initial navigation failed',
              stepId: 'initial-navigation',
            };
          }
        }
      }

      // Execute each step
      for (const step of sortedSteps) {
        currentStep = step.order;
        const stepStartedAt = new Date().toISOString();

        evidenceCollector.logEvent({ event: 'step_started', stepId: step.stepId, order: step.order });

        // Substitute input values in action value
        let actionValue = step.action.value;
        if (actionValue && actionValue.startsWith('{{') && actionValue.endsWith('}}')) {
          const inputName = actionValue.slice(2, -2);
          actionValue = inputs[inputName] as string || actionValue;
        }

        const stepAction = {
          ...step.action,
          value: actionValue,
        };

        // Safety check for navigate actions
        if (stepAction.type === ActionType.NAVIGATE && stepAction.value) {
          if (!this.isAllowedDomain(stepAction.value, validArtifact.safety.allowedDomains)) {
            const navError = `Navigation to ${stepAction.value} is not allowed by safety policy`;
            executedSteps.push({
              stepId: step.stepId,
              order: step.order,
              status: 'failed',
              action: stepAction,
              result: {
                success: false,
                description: 'Navigation blocked by safety policy',
                error: navError,
              },
              retryCount: 0,
              startedAt: stepStartedAt,
              completedAt: new Date().toISOString(),
            });
            success = false;
            failure = {
              category: ErrorCategory.HARD_FAILURE,
              message: navError,
              stepId: step.stepId,
            };
            break;
          }
        }

        // Execute action with retry policy
        const retryPolicy = step.retryPolicy || {
          maxAttempts: 3,
          backoffStrategy: BackoffStrategy.FIXED,
          backoffMs: 1000,
        };

        // Execute action (without retry for now)
        const result = await this.actionExecutor.executeAction(stepAction);

        // If action failed, classify error and determine retry behavior
        if (!result.success) {
          const errorContext: ErrorContext = {
            stepId: step.stepId,
            retryCount: 0,
            maxRetries: retryPolicy.maxAttempts,
            isStructureChange: result.error?.includes('not found') || result.error?.includes('Could not find'),
          };

          const error = new Error(result.error || 'Unknown error');
          const category = this.errorClassifier.classify(error, errorContext);

          // EXPECTED_BUSINESS_OUTCOME: return structured business result immediately
          if (category === ErrorCategory.EXPECTED_BUSINESS_OUTCOME) {
            success = false;
            failure = {
              category,
              message: result.error || 'Unknown error',
              stepId: step.stepId,
            };
            executedSteps.push({
              stepId: step.stepId,
              order: step.order,
              status: 'failed',
              action: stepAction,
              result,
              retryCount: 0,
              startedAt: stepStartedAt,
              completedAt: new Date().toISOString(),
            });
            break;
          }

          // HARD_FAILURE: stop immediately
          if (category === ErrorCategory.HARD_FAILURE) {
            success = false;
            failure = {
              category,
              message: result.error || 'Unknown error',
              stepId: step.stepId,
            };
            executedSteps.push({
              stepId: step.stepId,
              order: step.order,
              status: 'failed',
              action: stepAction,
              result,
              retryCount: 0,
              startedAt: stepStartedAt,
              completedAt: new Date().toISOString(),
            });
            break;
          }

          // RECOVERABLE: evaluate retry policy and retry if allowed
          if (category === ErrorCategory.RECOVERABLE) {
            const retryResult = await this.retryHandler.executeWithRetry(
              () => this.actionExecutor.executeAction(stepAction),
              retryPolicy
            );
            
            // Update result with retry attempt
            result.success = retryResult.success;
            result.error = retryResult.error;
            result.description = retryResult.description;
          }
        }

        // Evaluate checkpoint if present
        let checkpointResult;
        if (step.checkpoint && result.success) {
          checkpointResult = await this.checkpointEvaluator.evaluate(
            this.actionExecutor.getPage()!,
            step.checkpoint.condition,
            step.action.selectors
          );

          if (!checkpointResult.passed && step.checkpoint.failureHandling === 'fail') {
            result.success = false;
            result.error = `Checkpoint failed: ${checkpointResult.error || step.checkpoint.condition}`;
          }
        }

        // Record executed step
        const executedStep: ExecutedStep = {
          stepId: step.stepId,
          order: step.order,
          status: result.success ? 'success' : 'failed',
          action: stepAction,
          result,
          checkpointResult,
          retryCount: 0, // Retry handler doesn't expose retry count
          startedAt: stepStartedAt,
          completedAt: new Date().toISOString(),
        };

        executedSteps.push(executedStep);

        // Collect outputs for extract actions
        if (step.action.type === ActionType.EXTRACT && result.data) {
          const outputName = validArtifact.outputs.find((o: { extractionRule: string }) => o.extractionRule.includes(step.action.selectors?.[0]?.value || ''))?.name;
          if (outputName) {
            outputs[outputName] = result.data;
          }
        }

        evidenceCollector.logEvent({
          event: 'step_completed',
          stepId: step.stepId,
          success: result.success,
          error: result.error,
        });

        // Stop on failure
        if (!result.success) {
          success = false;

          // Error was already classified before retry, set failure
          const errorContext: ErrorContext = {
            stepId: step.stepId,
            retryCount: 0, // Will be updated if retry occurred
            maxRetries: retryPolicy.maxAttempts,
            isStructureChange: result.error?.includes('not found') || result.error?.includes('Could not find'),
          };

          const error = new Error(result.error || 'Unknown error');
          const category = this.errorClassifier.classify(error, errorContext);

          failure = {
            category,
            message: result.error || 'Unknown error',
            stepId: step.stepId,
          };

          break;
        }
      }

      // Extract final outputs
      validArtifact.outputs.forEach((output: { extractionRule: string; name: string }) => {
        if (!outputs[output.name]) {
          // Try to extract using extraction rule
          if (output.extractionRule === 'window.location.href') {
            outputs[output.name] = this.actionExecutor.getUrl();
          }
        }
      });

    } catch (error) {
      success = false;
      failure = {
        category: ErrorCategory.HARD_FAILURE,
        message: error instanceof Error ? error.message : 'Unknown error',
        stepId: sortedSteps[currentStep - 1]?.stepId || 'unknown',
      };
    } finally {
      await this.actionExecutor.close();

      const completedAt = new Date().toISOString();
      const durationMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();

      // Save evidence
      evidenceCollector.saveSteps(executedSteps);
      evidenceCollector.saveArtifact(validArtifact);
      evidenceCollector.generateReport({
        runId,
        capabilityName: validArtifact.metadata.name,
        capabilityVersion: validArtifact.version.version,
        success,
        failure,
        executedSteps,
        currentStep,
        outputs,
        startedAt,
        completedAt,
        durationMs,
        evidencePath: evidenceCollector.getSessionPath(),
      });

      evidenceCollector.logEvent({ event: 'replay_completed', runId, success, durationMs });
    }

    return {
      runId,
      capabilityName: validArtifact.metadata.name,
      capabilityVersion: validArtifact.version.version,
      success,
      failure,
      executedSteps,
      currentStep,
      outputs,
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs: new Date().getTime() - new Date(startedAt).getTime(),
      evidencePath: evidenceCollector.getSessionPath(),
    };
  }
}

/**
 * Initialize replay engine
 */
export function initializeReplayEngine(): ReplayEngine {
  return new ReplayEngine();
}

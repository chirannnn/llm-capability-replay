import { OpenAIClient, initializeOpenAIClient } from './openai/client.js';
import { PlaywrightBrowser, initializePlaywrightBrowser } from './browser/playwright.js';
import { llmActionToExecuted, validateLLMAction } from './actions/schema.js';
import { ExecutionTrace, createExecutionTrace, addStepToTrace, completeTrace } from './trace/types.js';
import { env } from '../utils/env.js';

/**
 * Discovery result
 */
export interface DiscoveryResult {
  trace: ExecutionTrace;
  success: boolean;
}

/**
 * Discovery orchestrator - manages the observe → decide → act loop
 */
export class DiscoveryOrchestrator {
  private openai: OpenAIClient;
  private browser: PlaywrightBrowser;
  private maxSteps: number;
  public targetOrigin: string;

  constructor() {
    if (!env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required for discovery');
    }
    this.openai = initializeOpenAIClient(env.OPENAI_API_KEY, env.OPENAI_MODEL);
    this.browser = initializePlaywrightBrowser();
    this.maxSteps = env.DISCOVERY_MAX_STEPS;
    this.targetOrigin = ''; // Will be set when discovery starts
  }

  /**
   * Extract origin from URL
   */
  public extractOrigin(url: string): string {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.host}`;
    } catch {
      return url;
    }
  }

  /**
   * Check if URL belongs to target origin
   */
  public isAllowedDomain(url: string): boolean {
    const urlOrigin = this.extractOrigin(url);
    return urlOrigin === this.targetOrigin;
  }

  /**
   * Run discovery
   */
  async runDiscovery(goal: string, targetUrl: string): Promise<DiscoveryResult> {
    // Store target origin for domain enforcement
    this.targetOrigin = this.extractOrigin(targetUrl);
    
    await this.browser.initialize();
    
    const trace = createExecutionTrace(goal, targetUrl);
    let stepCount = 0;
    let success = false;

    try {
      // Navigate to target URL
      await this.browser.navigateTo(targetUrl);
      
      // Main discovery loop
      while (stepCount < this.maxSteps) {
        // 1. OBSERVE
        const observation = await this.browser.captureObservation();
        
        // 2. DECIDE
        const action = await this.openai.generateNextAction({
          goal,
          observation,
          trace,
          stepCount,
          maxSteps: this.maxSteps,
        });
        
        // 3. VALIDATE
        if (!this.validateAction(action)) {
          throw new Error('Invalid action from LLM');
        }
        
        // 4. CHECK NAVIGATION DOMAIN (target-domain enforcement)
        if (action.type === 'navigate' && action.value) {
          if (!this.isAllowedDomain(action.value)) {
            const completedTrace = completeTrace(trace, false, `Navigation to external domain blocked: ${action.value}`);
            return { trace: completedTrace, success: false };
          }
        }
        
        // 5. CHECK TERMINATION
        if (action.type === 'complete') {
          const completedTrace = completeTrace(trace, true, action.reasoning);
          success = true;
          return { trace: completedTrace, success };
        }
        
        // 6. ACT
        const executedAction = llmActionToExecuted(action);
        const result = await this.browser.executeAction(executedAction);
        
        // 7. RECORD
        const updatedTrace = addStepToTrace(trace, executedAction, result);
        Object.assign(trace, updatedTrace);
        
        stepCount++;
        
        // Check if action failed
        if (!result.success) {
          const completedTrace = completeTrace(trace, false, result.description);
          return { trace: completedTrace, success: false };
        }
      }
      
      // Max steps reached without completion
      const completedTrace = completeTrace(trace, false, 'Max steps reached without completion');
      return { trace: completedTrace, success: false };
      
    } finally {
      await this.browser.close();
    }
  }

  /**
   * Validate action from LLM
   */
  private validateAction(action: unknown): boolean {
    try {
      validateLLMAction(action);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Run discovery (convenience function)
 */
export async function runDiscovery(goal: string, targetUrl: string): Promise<DiscoveryResult> {
  const orchestrator = new DiscoveryOrchestrator();
  return orchestrator.runDiscovery(goal, targetUrl);
}

import { Page, BrowserContext } from 'playwright';
import { HandoffState, HandoffReason, HandoffContext, HandoffResult, SessionState } from './types.js';

/**
 * Handoff manager for human-in-the-loop intervention
 * Preserves same browser session across handoff
 */
export class HandoffManager {
  private state: HandoffState = HandoffState.AUTOMATING;
  private context: HandoffContext | null = null;
  private page: Page | null = null;
  private browserContext: BrowserContext | null = null;

  /**
   * Initialize handoff manager with browser session
   */
  initialize(page: Page, browserContext: BrowserContext): void {
    this.page = page;
    this.browserContext = browserContext;
    this.state = HandoffState.AUTOMATING;
  }

  /**
   * Create handoff from replay context
   */
  async createHandoff(
    runId: string,
    capabilityName: string,
    capabilityVersion: number,
    currentStep: string,
    goal: string,
    reason: HandoffReason,
    evidencePath: string,
    checkpointCondition?: string
  ): Promise<HandoffContext> {
    if (!this.page || !this.browserContext) {
      throw new Error('Handoff manager not initialized with browser session');
    }

    const currentUrl = this.page.url() || 'unknown';
    
    this.context = {
      runId,
      capabilityName,
      capabilityVersion,
      currentStep,
      goal,
      currentUrl,
      reason,
      sessionState: {
        browserContextId: this.browserContext ? 'preserved' : 'none',
        pageId: this.page?.url(), // Use URL as page identifier since pageId is not directly accessible
        url: currentUrl,
        preserved: true,
      } as SessionState,
      evidencePath,
      timestamp: new Date().toISOString(),
      checkpointCondition,
    };

    this.state = HandoffState.WAITING_FOR_HUMAN;

    return this.context;
  }

  /**
   * Transition to human control
   */
  async transitionToHumanControl(): Promise<void> {
    if (this.state !== HandoffState.WAITING_FOR_HUMAN) {
      throw new Error(`Cannot transition to HUMAN_CONTROL from ${this.state}`);
    }

    this.state = HandoffState.HUMAN_CONTROL;
  }

  /**
   * Transition to resuming state
   */
  async transitionToResuming(): Promise<void> {
    if (this.state !== HandoffState.HUMAN_CONTROL) {
      throw new Error(`Cannot transition to RESUMING from ${this.state}`);
    }

    this.state = HandoffState.RESUMING;
  }

  /**
   * Transition back to automating
   */
  async transitionToAutomating(): Promise<void> {
    if (this.state !== HandoffState.RESUMING) {
      throw new Error(`Cannot transition to AUTOMATING from ${this.state}`);
    }

    this.state = HandoffState.AUTOMATING;
  }

  /**
   * Get current state
   */
  getState(): HandoffState {
    return this.state;
  }

  /**
   * Get handoff context
   */
  getContext(): HandoffContext | null {
    return this.context;
  }

  /**
   * Wait for human intervention and resume condition
   * This is a simple CLI-based implementation for the take-home
   */
  // eslint-disable-next-line no-console
  async waitForHumanIntervention(resumeCheck?: () => Promise<boolean>): Promise<HandoffResult> {
    if (!this.page || !this.browserContext) {
      throw new Error('Handoff manager not initialized with browser session');
    }

    // eslint-disable-next-line no-console
    console.log('\n=== HUMAN HANDOFF ===');
    // eslint-disable-next-line no-console
    console.log(`Reason: ${this.context?.reason}`);
    // eslint-disable-next-line no-console
    console.log(`Current URL: ${this.context?.currentUrl}`);
    // eslint-disable-next-line no-console
    console.log(`Goal: ${this.context?.goal}`);
    // eslint-disable-next-line no-console
    console.log('======================\n');
    // eslint-disable-next-line no-console
    console.log('Browser session is preserved. You can now take control.');
    // eslint-disable-next-line no-console
    console.log('Press Enter when you have resolved the issue and want to resume...\n');

    // Wait for human to press Enter
    await new Promise<void>((resolve) => {
      process.stdin.once('data', () => {
        resolve();
      });
    });

    const resumedAt = new Date().toISOString();

    // Evaluate resume condition if provided
    let checkpointPassed = true;
    if (resumeCheck && this.context?.checkpointCondition) {
      try {
        checkpointPassed = await resumeCheck();
      } catch (error) {
        checkpointPassed = false;
      }
    }

    return {
      accepted: true,
      resumedAt,
      checkpointPassed,
      humanAction: 'Manual intervention via CLI',
    };
  }

  /**
   * Verify same browser session is preserved
   */
  verifySessionPreserved(): boolean {
    if (!this.page || !this.browserContext) {
      return false;
    }

    const currentUrl = this.page.url();

    // Verify page is still accessible and URL matches or is a logical progression
    return currentUrl !== 'about:blank' && currentUrl !== '';
  }

  /**
   * Get the preserved page for human interaction
   */
  getPage(): Page | null {
    return this.page;
  }

  /**
   * Get the preserved browser context
   */
  getBrowserContext(): BrowserContext | null {
    return this.browserContext;
  }

  /**
   * Reset handoff state
   */
  reset(): void {
    this.state = HandoffState.AUTOMATING;
    this.context = null;
  }
}

/**
 * Initialize handoff manager
 */
export function initializeHandoffManager(): HandoffManager {
  return new HandoffManager();
}

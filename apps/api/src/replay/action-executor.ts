import { chromium, Browser, Page } from 'playwright';
import { UIAction } from '../capability/schema.js';
import { ActionType } from '../capability/types.js';
import { TargetResolver } from './target-resolver.js';

/**
 * Action executor for deterministic replay
 * Executes UI actions using Playwright
 */
export class ActionExecutor {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private targetResolver: TargetResolver;

  constructor() {
    this.targetResolver = new TargetResolver();
  }

  /**
   * Initialize browser
   */
  async initialize(): Promise<void> {
    this.browser = await chromium.launch({ headless: true });
    this.page = await this.browser.newPage();
  }

  /**
   * Execute a UI action
   */
  async executeAction(action: UIAction): Promise<{
    success: boolean;
    description: string;
    error?: string;
    data?: unknown;
  }> {
    if (!this.page) {
      return {
        success: false,
        description: 'Browser not initialized',
        error: 'Browser not initialized',
      };
    }

    try {
      switch (action.type) {
        case ActionType.NAVIGATE:
          return await this.executeNavigateAction(action);
        case ActionType.CLICK:
          return await this.executeClickAction(action);
        case ActionType.TYPE:
          return await this.executeTypeAction(action);
        case ActionType.SELECT:
          return await this.executeSelectAction(action);
        case ActionType.WAIT:
          return await this.executeWaitAction(action);
        case ActionType.EXTRACT:
          return await this.executeExtractAction(action);
        default:
          return {
            success: false,
            description: `Unknown action type: ${action.type}`,
            error: `Action type ${action.type} not implemented`,
          };
      }
    } catch (error) {
      return {
        success: false,
        description: `Failed to execute ${action.type}`,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Execute navigate action
   */
  private async executeNavigateAction(action: UIAction): Promise<{
    success: boolean;
    description: string;
    error?: string;
  }> {
    if (!action.value) {
      return {
        success: false,
        description: 'Navigate action requires URL',
        error: 'Missing URL value',
      };
    }

    if (!this.page) {
      return {
        success: false,
        description: 'Browser not initialized',
        error: 'Browser not initialized',
      };
    }

    await this.page.goto(action.value, { waitUntil: 'networkidle', timeout: action.timeout });
    return {
      success: true,
      description: `Navigated to ${action.value}`,
    };
  }

  /**
   * Execute click action
   */
  private async executeClickAction(action: UIAction): Promise<{
    success: boolean;
    description: string;
    error?: string;
  }> {
    if (!action.selectors || action.selectors.length === 0) {
      return {
        success: false,
        description: 'Click action requires selectors',
        error: 'Missing selectors',
      };
    }

    if (!this.page) {
      return {
        success: false,
        description: 'Browser not initialized',
        error: 'Browser not initialized',
      };
    }

    const locator = await this.targetResolver.resolve(this.page, action.selectors);
    if (!locator) {
      return {
        success: false,
        description: 'Element not found',
        error: `Could not find element with selectors: ${JSON.stringify(action.selectors)}`,
      };
    }

    await locator.click({ timeout: action.timeout });
    return {
      success: true,
      description: `Clicked on element`,
    };
  }

  /**
   * Execute type action
   */
  private async executeTypeAction(action: UIAction): Promise<{
    success: boolean;
    description: string;
    error?: string;
  }> {
    if (!action.value) {
      return {
        success: false,
        description: 'Type action requires text value',
        error: 'Missing text value',
      };
    }

    if (!action.selectors || action.selectors.length === 0) {
      return {
        success: false,
        description: 'Type action requires selectors',
        error: 'Missing selectors',
      };
    }

    if (!this.page) {
      return {
        success: false,
        description: 'Browser not initialized',
        error: 'Browser not initialized',
      };
    }

    const locator = await this.targetResolver.resolve(this.page, action.selectors);
    if (!locator) {
      return {
        success: false,
        description: 'Element not found',
        error: `Could not find element with selectors: ${JSON.stringify(action.selectors)}`,
      };
    }

    await locator.fill(action.value);
    return {
      success: true,
      description: `Typed text into element`,
    };
  }

  /**
   * Execute select action
   */
  private async executeSelectAction(action: UIAction): Promise<{
    success: boolean;
    description: string;
    error?: string;
  }> {
    if (!action.value) {
      return {
        success: false,
        description: 'Select action requires option value',
        error: 'Missing option value',
      };
    }

    if (!action.selectors || action.selectors.length === 0) {
      return {
        success: false,
        description: 'Select action requires selectors',
        error: 'Missing selectors',
      };
    }

    if (!this.page) {
      return {
        success: false,
        description: 'Browser not initialized',
        error: 'Browser not initialized',
      };
    }

    const locator = await this.targetResolver.resolve(this.page, action.selectors);
    if (!locator) {
      return {
        success: false,
        description: 'Element not found',
        error: `Could not find element with selectors: ${JSON.stringify(action.selectors)}`,
      };
    }

    await locator.selectOption(action.value);
    return {
      success: true,
      description: `Selected option from dropdown`,
    };
  }

  /**
   * Execute wait action
   */
  private async executeWaitAction(action: UIAction): Promise<{
    success: boolean;
    description: string;
    error?: string;
  }> {
    if (!this.page) {
      return {
        success: false,
        description: 'Browser not initialized',
        error: 'Browser not initialized',
      };
    }

    await this.page.waitForTimeout(action.timeout);
    return {
      success: true,
      description: `Waited for ${action.timeout}ms`,
    };
  }

  /**
   * Execute extract action
   */
  private async executeExtractAction(action: UIAction): Promise<{
    success: boolean;
    description: string;
    error?: string;
    data?: unknown;
  }> {
    if (!action.selectors || action.selectors.length === 0) {
      return {
        success: false,
        description: 'Extract action requires selectors',
        error: 'Missing selectors',
      };
    }

    if (!this.page) {
      return {
        success: false,
        description: 'Browser not initialized',
        error: 'Browser not initialized',
      };
    }

    const locator = await this.targetResolver.resolve(this.page, action.selectors);
    if (!locator) {
      return {
        success: false,
        description: 'Element not found',
        error: `Could not find element with selectors: ${JSON.stringify(action.selectors)}`,
      };
    }

    const text = await locator.textContent();
    return {
      success: true,
      description: 'Extracted text from element',
      data: text,
    };
  }

  /**
   * Get current page URL
   */
  getUrl(): string {
    return this.page?.url() || '';
  }

  /**
   * Get page for checkpoint evaluator
   */
  getPage(): Page | null {
    return this.page;
  }

  /**
   * Close browser
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}

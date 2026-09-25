import { chromium, Browser, Page } from 'playwright';
import { ExecutedAction, ActionResult } from '../actions/schema.js';
import { UIObservation, VisibleElement, createObservation } from '../observation/types.js';
import { executeNavigate, executeClick, executeType, executeSelect, executeWait, executeExtract } from '../../browser/shared.js';

/**
 * Playwright browser client for discovery
 */
export class PlaywrightBrowser {
  private browser: Browser | null = null;
  private page: Page | null = null;

  /**
   * Initialize browser
   */
  async initialize(): Promise<void> {
    this.browser = await chromium.launch({ headless: true });
    this.page = await this.browser.newPage();
  }

  /**
   * Navigate to URL
   */
  async navigateTo(url: string): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }
    await this.page.goto(url, { waitUntil: 'networkidle' });
  }

  /**
   * Execute action
   */
  async executeAction(action: ExecutedAction): Promise<ActionResult> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    try {
      switch (action.type) {
        case 'navigate':
          return await this.executeNavigate(action);
        case 'click':
          return await this.executeClick(action);
        case 'type':
          return await this.executeType(action);
        case 'select':
          return await this.executeSelect(action);
        case 'wait':
          return await this.executeWait(action);
        case 'extract':
          return await this.executeExtract(action);
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
  private async executeNavigate(action: ExecutedAction): Promise<ActionResult> {
    return executeNavigate(this.page!, action.value || '', action.timeout);
  }

  /**
   * Execute click action
   */
  private async executeClick(action: ExecutedAction): Promise<ActionResult> {
    return executeClick(this.page!, action.target, action.timeout);
  }

  /**
   * Execute type action
   */
  private async executeType(action: ExecutedAction): Promise<ActionResult> {
    return executeType(this.page!, action.target, action.value || '', action.timeout);
  }

  /**
   * Execute select action
   */
  private async executeSelect(action: ExecutedAction): Promise<ActionResult> {
    return executeSelect(this.page!, action.target, action.value || '', action.timeout);
  }

  /**
   * Execute wait action
   */
  private async executeWait(action: ExecutedAction): Promise<ActionResult> {
    return executeWait(this.page!, action.timeout);
  }

  /**
   * Execute extract action
   */
  private async executeExtract(action: ExecutedAction): Promise<ActionResult> {
    return executeExtract(this.page!, action.target, action.timeout);
  }

  /**
   * Capture observation from current page
   */
  async captureObservation(): Promise<UIObservation> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    const url = this.page.url();
    const title = await this.page.title();
    const visibleElements = await this.captureVisibleElements();

    return createObservation(url, title, visibleElements);
  }

  /**
   * Capture visible elements with semantic information
   * Simple approach - no complex accessibility tree framework
   * Explicitly checks visibility before adding elements
   */
  private async captureVisibleElements(): Promise<VisibleElement[]> {
    if (!this.page) {
      return [];
    }

    const elements: VisibleElement[] = [];

    // Capture buttons (check visibility)
    const buttons = await this.page.getByRole('button').all();
    for (const button of buttons) {
      try {
        if (!(await button.isVisible())) {
          continue; // Skip invisible elements
        }
        const visibleText = await button.textContent();
        const testId = await button.getAttribute('data-testid');
        if (visibleText || testId) {
          elements.push({
            role: 'button',
            visibleText: visibleText || undefined,
            testId: testId || undefined,
          });
        }
      } catch {
        // Skip elements that error on visibility check
      }
    }

    // Capture links (check visibility)
    const links = await this.page.getByRole('link').all();
    for (const link of links) {
      try {
        if (!(await link.isVisible())) {
          continue; // Skip invisible elements
        }
        const visibleText = await link.textContent();
        const testId = await link.getAttribute('data-testid');
        if (visibleText || testId) {
          elements.push({
            role: 'link',
            visibleText: visibleText || undefined,
            testId: testId || undefined,
          });
        }
      } catch {
        // Skip elements that error on visibility check
      }
    }

    // Capture textboxes (check visibility, DO NOT capture input values)
    const textboxes = await this.page.getByRole('textbox').all();
    for (const textbox of textboxes) {
      try {
        if (!(await textbox.isVisible())) {
          continue; // Skip invisible elements
        }
        const accessibleName = await textbox.getAttribute('aria-label');
        const placeholder = await textbox.getAttribute('placeholder');
        const testId = await textbox.getAttribute('data-testid');
        if (accessibleName || placeholder || testId) {
          elements.push({
            role: 'textbox',
            accessibleName: accessibleName || placeholder || undefined,
            testId: testId || undefined,
            // NOTE: Input values are NOT captured for security
          });
        }
      } catch {
        // Skip elements that error on visibility check
      }
    }

    // Capture comboboxes (check visibility)
    const comboboxes = await this.page.getByRole('combobox').all();
    for (const combobox of comboboxes) {
      try {
        if (!(await combobox.isVisible())) {
          continue; // Skip invisible elements
        }
        const accessibleName = await combobox.getAttribute('aria-label');
        const testId = await combobox.getAttribute('data-testid');
        if (accessibleName || testId) {
          elements.push({
            role: 'combobox',
            accessibleName: accessibleName || undefined,
            testId: testId || undefined,
          });
        }
      } catch {
        // Skip elements that error on visibility check
      }
    }

    return elements;
  }

  /**
   * Take screenshot
   */
  async takeScreenshot(path: string): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }
    await this.page.screenshot({ path, fullPage: false });
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

/**
 * Initialize Playwright browser
 */
export function initializePlaywrightBrowser(): PlaywrightBrowser {
  return new PlaywrightBrowser();
}

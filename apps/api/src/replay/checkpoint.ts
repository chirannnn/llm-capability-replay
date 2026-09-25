import { Page, Locator } from 'playwright';
import { Selector } from '../capability/schema.js';
import { CheckpointResult } from './types.js';

/**
 * Checkpoint evaluator for deterministic replay
 * Evaluates Phase 2 checkpoint expressions
 * Simple expression language: url matches, element.visible, element.count, element.text
 */
export class CheckpointEvaluator {
  /**
   * Evaluate a checkpoint condition
   */
  async evaluate(
    page: Page,
    condition: string,
    selectors?: Selector[]
  ): Promise<CheckpointResult> {
    try {
      if (condition.startsWith('url matches')) {
        return this.evaluateUrlMatch(page, condition);
      }
      if (condition.startsWith('element.visible')) {
        return this.evaluateVisibility(page, selectors);
      }
      if (condition.startsWith('element.count')) {
        return this.evaluateCount(page, selectors, condition);
      }
      if (condition.startsWith('element.text')) {
        return this.evaluateText(page, selectors, condition);
      }

      return {
        passed: false,
        condition,
        error: `Unknown checkpoint condition: ${condition}`,
      };
    } catch (error) {
      return {
        passed: false,
        condition,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Evaluate URL match condition
   * Format: url matches "pattern"
   */
  private evaluateUrlMatch(page: Page, condition: string): CheckpointResult {
    const match = condition.match(/url matches "(.*)"/);
    if (!match) {
      return {
        passed: false,
        condition,
        error: 'Invalid url matches format',
      };
    }

    const pattern = match[1];
    const url = page.url();
    const regex = new RegExp(pattern);
    const passed = regex.test(url);

    return { passed, condition };
  }

  /**
   * Evaluate element visibility condition
   * Format: element.visible == true
   */
  private async evaluateVisibility(page: Page, selectors?: Selector[]): Promise<CheckpointResult> {
    if (!selectors || selectors.length === 0) {
      return {
        passed: false,
        condition: 'element.visible == true',
        error: 'No selectors provided for visibility check',
      };
    }

    // Try to find element using selectors
    for (const selector of selectors) {
      try {
        let locator: Locator | null = null;
        switch (selector.type) {
          case 'css': {
            locator = page.locator(selector.value);
            break;
          }
          case 'xpath': {
            locator = page.locator(`xpath=${selector.value}`);
            break;
          }
          case 'text': {
            locator = page.getByText(selector.value);
            break;
          }
          case 'aria': {
            const [role, name] = selector.value.split(': ');
            locator = page.getByRole(role as 'button' | 'link' | 'textbox' | 'combobox', { name });
            break;
          }
        }

        if (locator && await locator.count() > 0) {
          const isVisible = await locator.first().isVisible();
          return { passed: isVisible, condition: 'element.visible == true' };
        }
      } catch {
        // Continue to next selector
      }
    }

    return { passed: false, condition: 'element.visible == true' };
  }

  /**
   * Evaluate element count condition
   * Format: element.count > 0 or element.count == 1
   */
  private async evaluateCount(page: Page, selectors: Selector[] | undefined, condition: string): Promise<CheckpointResult> {
    if (!selectors || selectors.length === 0) {
      return {
        passed: false,
        condition,
        error: 'No selectors provided for count check',
      };
    }

    const match = condition.match(/element.count\s*([><=]+)\s*(\d+)/);
    if (!match) {
      return {
        passed: false,
        condition,
        error: 'Invalid element.count format',
      };
    }

    const operator = match[1];
    const expectedCount = parseInt(match[2], 10);

    // Try to find element using selectors
    for (const selector of selectors) {
      try {
        let locator: Locator | null = null;
        switch (selector.type) {
          case 'css': {
            locator = page.locator(selector.value);
            break;
          }
          case 'xpath': {
            locator = page.locator(`xpath=${selector.value}`);
            break;
          }
          case 'text': {
            locator = page.getByText(selector.value);
            break;
          }
          case 'aria': {
            const [role, name] = selector.value.split(': ');
            locator = page.getByRole(role as 'button' | 'link' | 'textbox' | 'combobox', { name });
            break;
          }
        }

        if (locator) {
          const count = await locator.count();
          let passed = false;
          switch (operator) {
            case '>':
              passed = count > expectedCount;
              break;
            case '>=':
              passed = count >= expectedCount;
              break;
            case '<':
              passed = count < expectedCount;
              break;
            case '<=':
              passed = count <= expectedCount;
              break;
            case '==':
              passed = count === expectedCount;
              break;
          }
          return { passed, condition };
        }
      } catch {
        // Continue to next selector
      }
    }

    return { passed: false, condition };
  }

  /**
   * Evaluate element text condition
   * Format: element.text contains "string"
   */
  private async evaluateText(page: Page, selectors: Selector[] | undefined, condition: string): Promise<CheckpointResult> {
    if (!selectors || selectors.length === 0) {
      return {
        passed: false,
        condition,
        error: 'No selectors provided for text check',
      };
    }

    const match = condition.match(/element.text contains "(.*)"/);
    if (!match) {
      return {
        passed: false,
        condition,
        error: 'Invalid element.text format',
      };
    }

    const expectedText = match[1];

    // Try to find element using selectors
    for (const selector of selectors) {
      try {
        let locator: Locator | null = null;
        switch (selector.type) {
          case 'css': {
            locator = page.locator(selector.value);
            break;
          }
          case 'xpath': {
            locator = page.locator(`xpath=${selector.value}`);
            break;
          }
          case 'text': {
            locator = page.getByText(selector.value);
            break;
          }
          case 'aria': {
            const [role, name] = selector.value.split(': ');
            locator = page.getByRole(role as 'button' | 'link' | 'textbox' | 'combobox', { name });
            break;
          }
        }

        if (locator && await locator.count() > 0) {
          const text = await locator.first().textContent();
          const passed = text ? text.includes(expectedText) : false;
          return { passed, condition };
        }
      } catch {
        // Continue to next selector
      }
    }

    return { passed: false, condition };
  }
}

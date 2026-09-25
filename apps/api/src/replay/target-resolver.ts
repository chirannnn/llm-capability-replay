import { Page, Locator } from 'playwright';
import { Selector } from '../capability/schema.js';

/**
 * Target resolver for deterministic replay
 * Resolves Phase 2 selectors to Playwright Locators
 * Priority: aria → text → css → xpath
 */
export class TargetResolver {
  /**
   * Resolve selectors to a Playwright Locator
   * Tries each selector in priority order
   */
  async resolve(page: Page, selectors: Selector[]): Promise<Locator | null> {
    if (!selectors || selectors.length === 0) {
      return null;
    }

    // Try each selector in priority order
    for (const selector of selectors) {
      const locator = this.resolveSelector(page, selector);
      if (locator && await locator.count() > 0) {
        return locator;
      }
    }

    return null;
  }

  /**
   * Resolve a single selector type
   */
  private resolveSelector(page: Page, selector: Selector): Locator | null {
    switch (selector.type) {
      case 'aria':
        return this.resolveAria(page, selector.value);
      case 'text':
        return page.getByText(selector.value);
      case 'css':
        return page.locator(selector.value);
      case 'xpath':
        return page.locator(`xpath=${selector.value}`);
      default:
        return null;
    }
  }

  /**
   * Resolve ARIA selector
   * Format: "role: accessibleName"
   * Handles accessible names containing ": " by splitting only on first ": "
   */
  private resolveAria(page: Page, ariaValue: string): Locator | null {
    try {
      const firstColonIndex = ariaValue.indexOf(': ');
      if (firstColonIndex === -1) {
        return null;
      }
      const role = ariaValue.slice(0, firstColonIndex);
      const name = ariaValue.slice(firstColonIndex + 2);
      if (!role || !name) {
        return null;
      }
      return page.getByRole(role as 'button' | 'link' | 'textbox' | 'combobox', { name });
    } catch {
      return null;
    }
  }
}

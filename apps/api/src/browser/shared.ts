import { Page, Locator } from 'playwright';

/**
 * Shared browser utilities for discovery and replay
 * Extracted from Phase 3 for reuse in Phase 4
 */

/**
 * Find element using semantic targeting (Locator-based)
 * Priority: testId > accessibleName + role > visibleText + role > cssSelector
 * This is used by both Phase 3 discovery and Phase 4 replay
 */
export async function findElement(
  page: Page,
  target: {
    testId?: string;
    accessibleName?: string;
    role?: string;
    visibleText?: string;
    cssSelector?: string;
  }
): Promise<Locator | null> {
  if (!page) {
    return null;
  }

  // Try test ID first
  if (target.testId) {
    try {
      const locator = page.locator(`[data-testid="${target.testId}"]`);
      if (await locator.count() > 0) {
        return locator;
      }
    } catch {
      // Continue to next strategy
    }
  }

  // Try accessible name + role
  if (target.accessibleName && target.role) {
    try {
      const locator = page.getByRole(target.role as 'button' | 'link' | 'textbox' | 'combobox', { name: target.accessibleName });
      if (await locator.count() > 0) {
        return locator;
      }
    } catch {
      // Continue to next strategy
    }
  }

  // Try visible text + role
  if (target.visibleText && target.role) {
    try {
      const locator = page.getByRole(target.role as 'button' | 'link' | 'textbox' | 'combobox', { name: target.visibleText });
      if (await locator.count() > 0) {
        return locator;
      }
    } catch {
      // Continue to next strategy
    }
  }

  // Try CSS selector as fallback
  if (target.cssSelector) {
    try {
      const locator = page.locator(target.cssSelector);
      if (await locator.count() > 0) {
        return locator;
      }
    } catch {
      // Element not found
    }
  }

  return null;
}

/**
 * Execute navigate action
 */
export async function executeNavigate(
  page: Page,
  url: string,
  _timeout: number
): Promise<{ success: boolean; description: string; error?: string }> {
  if (!url) {
    return {
      success: false,
      description: 'Navigate action requires URL',
      error: 'Missing URL value',
    };
  }

  await page.goto(url, { waitUntil: 'networkidle', timeout: _timeout });
  return {
    success: true,
    description: `Navigated to ${url}`,
  };
}

/**
 * Execute click action
 */
export async function executeClick(
  page: Page,
  target: {
    testId?: string;
    accessibleName?: string;
    role?: string;
    visibleText?: string;
    cssSelector?: string;
  },
  _timeout: number
): Promise<{ success: boolean; description: string; error?: string }> {
  const locator = await findElement(page, target);
  if (!locator) {
    return {
      success: false,
      description: 'Element not found',
      error: `Could not find element with target: ${JSON.stringify(target)}`,
    };
  }

  await locator.click({ timeout: _timeout });
  return {
    success: true,
    description: `Clicked on element`,
  };
}

/**
 * Execute type action
 */
export async function executeType(
  page: Page,
  target: {
    testId?: string;
    accessibleName?: string;
    role?: string;
    visibleText?: string;
    cssSelector?: string;
  },
  value: string,
  _timeout: number
): Promise<{ success: boolean; description: string; error?: string }> {
  if (!value) {
    return {
      success: false,
      description: 'Type action requires text value',
      error: 'Missing text value',
    };
  }

  const locator = await findElement(page, target);
  if (!locator) {
    return {
      success: false,
      description: 'Element not found',
      error: `Could not find element with target: ${JSON.stringify(target)}`,
    };
  }

  await locator.fill(value);
  return {
    success: true,
    description: `Typed text into element`,
  };
}

/**
 * Execute select action
 */
export async function executeSelect(
  page: Page,
  target: {
    testId?: string;
    accessibleName?: string;
    role?: string;
    visibleText?: string;
    cssSelector?: string;
  },
  value: string,
  _timeout: number
): Promise<{ success: boolean; description: string; error?: string }> {
  if (!value) {
    return {
      success: false,
      description: 'Select action requires option value',
      error: 'Missing option value',
    };
  }

  const locator = await findElement(page, target);
  if (!locator) {
    return {
      success: false,
      description: 'Element not found',
      error: `Could not find element with target: ${JSON.stringify(target)}`,
    };
  }

  await locator.selectOption(value);
  return {
    success: true,
    description: `Selected option from dropdown`,
  };
}

/**
 * Execute wait action
 */
export async function executeWait(
  page: Page,
  timeout: number
): Promise<{ success: boolean; description: string; error?: string }> {
  await page.waitForTimeout(timeout);
  return {
    success: true,
    description: `Waited for ${timeout}ms`,
  };
}

/**
 * Execute extract action
 */
export async function executeExtract(
  page: Page,
  target: {
    testId?: string;
    accessibleName?: string;
    role?: string;
    visibleText?: string;
    cssSelector?: string;
  },
  _timeout: number
): Promise<{ success: boolean; description: string; error?: string; data?: unknown }> {
  const locator = await findElement(page, target);
  if (!locator) {
    return {
      success: false,
      description: 'Element not found',
      error: `Could not find element with target: ${JSON.stringify(target)}`,
    };
  }

  const text = await locator.textContent();
  return {
    success: true,
    description: 'Extracted text from element',
    data: text,
  };
}

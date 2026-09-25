import { describe, it, expect, beforeEach } from 'vitest';
import { chromium, Page } from 'playwright';
import { findElement, executeNavigate, executeClick, executeType, executeSelect, executeWait, executeExtract } from './shared.js';

describe('Shared Browser Utilities', () => {
  let page: Page;

  beforeEach(async () => {
    const browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
  });

  it('should find element by testId', async () => {
    await page.setContent('<button data-testid="test-button">Click</button>');
    const locator = await findElement(page, { testId: 'test-button' });
    expect(locator).not.toBeNull();
    const count = await locator!.count();
    expect(count).toBeGreaterThan(0);
  });

  it('should find element by accessible name and role', async () => {
    await page.setContent('<button aria-label="Submit">Click</button>');
    const locator = await findElement(page, { accessibleName: 'Submit', role: 'button' });
    expect(locator).not.toBeNull();
    const count = await locator!.count();
    expect(count).toBeGreaterThan(0);
  });

  it('should find element by visible text and role', async () => {
    await page.setContent('<button>Click Me</button>');
    const locator = await findElement(page, { visibleText: 'Click Me', role: 'button' });
    expect(locator).not.toBeNull();
    const count = await locator!.count();
    expect(count).toBeGreaterThan(0);
  });

  it('should find element by CSS selector', async () => {
    await page.setContent('<button class="btn">Click</button>');
    const locator = await findElement(page, { cssSelector: '.btn' });
    expect(locator).not.toBeNull();
    const count = await locator!.count();
    expect(count).toBeGreaterThan(0);
  });

  it('should return null when element not found', async () => {
    await page.setContent('<div>No button here</div>');
    const locator = await findElement(page, { testId: 'non-existent' });
    expect(locator).toBeNull();
  });

  it('should execute navigate action', async () => {
    const result = await executeNavigate(page, 'https://example.com', 5000);
    expect(result.success).toBe(true);
    expect(result.description).toContain('Navigated');
  });

  it('should fail navigate action without URL', async () => {
    const result = await executeNavigate(page, '', 5000);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Missing URL');
  });

  it('should execute click action', async () => {
    await page.setContent('<button data-testid="test-button">Click</button>');
    const result = await executeClick(page, { testId: 'test-button' }, 5000);
    expect(result.success).toBe(true);
    expect(result.description).toContain('Clicked');
  });

  it('should fail click action when element not found', async () => {
    const result = await executeClick(page, { testId: 'non-existent' }, 5000);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Could not find element');
  });

  it('should execute type action', async () => {
    await page.setContent('<input data-testid="test-input" type="text" />');
    const result = await executeType(page, { testId: 'test-input' }, 'test text', 5000);
    expect(result.success).toBe(true);
    expect(result.description).toContain('Typed');
  });

  it('should fail type action without value', async () => {
    const result = await executeType(page, { testId: 'test-input' }, '', 5000);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Missing text');
  });

  it('should execute select action', async () => {
    await page.setContent('<select data-testid="test-select"><option value="1">Option 1</option></select>');
    const result = await executeSelect(page, { testId: 'test-select' }, '1', 5000);
    expect(result.success).toBe(true);
    expect(result.description).toContain('Selected');
  });

  it('should execute wait action', async () => {
    const result = await executeWait(page, 100);
    expect(result.success).toBe(true);
    expect(result.description).toContain('Waited');
  });

  it('should execute extract action', async () => {
    await page.setContent('<div data-testid="test-div">Extract me</div>');
    const result = await executeExtract(page, { testId: 'test-div' }, 5000);
    expect(result.success).toBe(true);
    expect(result.description).toContain('Extracted');
    expect(result.data).toBe('Extract me');
  });
});

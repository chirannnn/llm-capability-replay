import { describe, it, expect, beforeEach } from 'vitest';
import { chromium, Page } from 'playwright';
import { CheckpointEvaluator } from './checkpoint.js';
import { Selector } from '../capability/schema.js';

describe('Checkpoint Evaluator', () => {
  let page: Page;
  let evaluator: CheckpointEvaluator;

  beforeEach(async () => {
    const browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
    evaluator = new CheckpointEvaluator();
  });

  it('should evaluate URL match checkpoint', async () => {
    await page.goto('https://example.com/page');
    const result = await evaluator.evaluate(page, 'url matches "^https://example.com"');
    expect(result.passed).toBe(true);
    expect(result.condition).toBe('url matches "^https://example.com"');
  });

  it('should fail URL match checkpoint when pattern does not match', async () => {
    await page.goto('https://example.com/page');
    const result = await evaluator.evaluate(page, 'url matches "^https://other"');
    expect(result.passed).toBe(false);
  });

  it('should evaluate element visibility checkpoint', async () => {
    await page.setContent('<button data-testid="test-button">Click</button>');
    const selectors: Selector[] = [{ type: 'css', value: '[data-testid="test-button"]' }];
    const result = await evaluator.evaluate(page, 'element.visible == true', selectors);
    expect(result.passed).toBe(true);
  });

  it('should fail element visibility checkpoint when element not visible', async () => {
    await page.setContent('<button data-testid="test-button" style="display:none">Click</button>');
    const selectors: Selector[] = [{ type: 'css', value: '[data-testid="test-button"]' }];
    const result = await evaluator.evaluate(page, 'element.visible == true', selectors);
    expect(result.passed).toBe(false);
  });

  it('should evaluate element count checkpoint', async () => {
    await page.setContent('<button class="btn">Click</button>');
    const selectors: Selector[] = [{ type: 'css', value: '.btn' }];
    const result = await evaluator.evaluate(page, 'element.count > 0', selectors);
    expect(result.passed).toBe(true);
  });

  it('should evaluate element count checkpoint with equality', async () => {
    await page.setContent('<button class="btn">Click</button>');
    const selectors: Selector[] = [{ type: 'css', value: '.btn' }];
    const result = await evaluator.evaluate(page, 'element.count == 1', selectors);
    expect(result.passed).toBe(true);
  });

  it('should fail element count checkpoint when count does not match', async () => {
    await page.setContent('<button class="btn">Click</button>');
    const selectors: Selector[] = [{ type: 'css', value: '.btn' }];
    const result = await evaluator.evaluate(page, 'element.count > 1', selectors);
    expect(result.passed).toBe(false);
  });

  it('should evaluate element text contains checkpoint', async () => {
    await page.setContent('<div data-testid="test-div">Hello World</div>');
    const selectors: Selector[] = [{ type: 'css', value: '[data-testid="test-div"]' }];
    const result = await evaluator.evaluate(page, 'element.text contains "Hello"', selectors);
    expect(result.passed).toBe(true);
  });

  it('should fail element text contains checkpoint when text not found', async () => {
    await page.setContent('<div data-testid="test-div">Hello World</div>');
    const selectors: Selector[] = [{ type: 'css', value: '[data-testid="test-div"]' }];
    const result = await evaluator.evaluate(page, 'element.text contains "Goodbye"', selectors);
    expect(result.passed).toBe(false);
  });

  it('should return error for unknown checkpoint condition', async () => {
    const result = await evaluator.evaluate(page, 'unknown condition');
    expect(result.passed).toBe(false);
    expect(result.error).toContain('Unknown checkpoint condition');
  });

  it('should return error for malformed URL match format', async () => {
    const result = await evaluator.evaluate(page, 'url matches malformed');
    expect(result.passed).toBe(false);
    expect(result.error).toContain('Invalid url matches format');
  });

  it('should return error when no selectors provided for element checkpoint', async () => {
    const result = await evaluator.evaluate(page, 'element.visible == true');
    expect(result.passed).toBe(false);
    expect(result.error).toContain('No selectors provided');
  });
});

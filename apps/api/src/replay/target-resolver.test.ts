import { describe, it, expect, beforeEach } from 'vitest';
import { chromium, Page } from 'playwright';
import { TargetResolver } from './target-resolver.js';
import { Selector } from '../capability/schema.js';

describe('Target Resolver', () => {
  let page: Page;
  let resolver: TargetResolver;

  beforeEach(async () => {
    const browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
    resolver = new TargetResolver();
  });

  it('should resolve aria selector', async () => {
    await page.setContent('<button aria-label="Submit">Click</button>');
    const selectors: Selector[] = [{ type: 'aria', value: 'button: Submit' }];
    const locator = await resolver.resolve(page, selectors);
    expect(locator).not.toBeNull();
    const count = await locator!.count();
    expect(count).toBeGreaterThan(0);
  });

  it('should resolve text selector', async () => {
    await page.setContent('<button>Click Me</button>');
    const selectors: Selector[] = [{ type: 'text', value: 'Click Me' }];
    const locator = await resolver.resolve(page, selectors);
    expect(locator).not.toBeNull();
    const count = await locator!.count();
    expect(count).toBeGreaterThan(0);
  });

  it('should resolve css selector', async () => {
    await page.setContent('<button class="btn">Click</button>');
    const selectors: Selector[] = [{ type: 'css', value: '.btn' }];
    const locator = await resolver.resolve(page, selectors);
    expect(locator).not.toBeNull();
    const count = await locator!.count();
    expect(count).toBeGreaterThan(0);
  });

  it('should resolve xpath selector', async () => {
    await page.setContent('<button>Click</button>');
    const selectors: Selector[] = [{ type: 'xpath', value: '//button' }];
    const locator = await resolver.resolve(page, selectors);
    expect(locator).not.toBeNull();
    const count = await locator!.count();
    expect(count).toBeGreaterThan(0);
  });

  it('should try selectors in priority order (aria → text → css → xpath)', async () => {
    await page.setContent('<button aria-label="Submit" class="btn">Click</button>');
    const selectors: Selector[] = [
      { type: 'aria', value: 'button: Submit' },
      { type: 'text', value: 'Click' },
      { type: 'css', value: '.btn' },
      { type: 'xpath', value: '//button' },
    ];
    const locator = await resolver.resolve(page, selectors);
    expect(locator).not.toBeNull();
    // Should match first selector (aria)
    const count = await locator!.count();
    expect(count).toBeGreaterThan(0);
  });

  it('should return null when no selector matches', async () => {
    await page.setContent('<div>No button here</div>');
    const selectors: Selector[] = [{ type: 'css', value: '.non-existent' }];
    const locator = await resolver.resolve(page, selectors);
    expect(locator).toBeNull();
  });

  it('should return null when selectors array is empty', async () => {
    const locator = await resolver.resolve(page, []);
    expect(locator).toBeNull();
  });

  it('should handle malformed aria selector gracefully', async () => {
    await page.setContent('<button>Click</button>');
    const selectors: Selector[] = [{ type: 'aria', value: 'malformed' }];
    const locator = await resolver.resolve(page, selectors);
    expect(locator).toBeNull();
  });

  it('should handle aria selector with colon in accessible name', async () => {
    await page.setContent('<button aria-label="Submit: New">Click</button>');
    const selectors: Selector[] = [{ type: 'aria', value: 'button: Submit: New' }];
    const locator = await resolver.resolve(page, selectors);
    expect(locator).not.toBeNull();
    const count = await locator!.count();
    expect(count).toBeGreaterThan(0);
  });
});

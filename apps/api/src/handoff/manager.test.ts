import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { HandoffManager, initializeHandoffManager } from './manager.js';
import { HandoffState, HandoffReason } from './types.js';

describe('Handoff Manager', () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;
  let manager: HandoffManager;

  beforeEach(async () => {
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext();
    page = await context.newPage();
    manager = initializeHandoffManager();
    manager.initialize(page, context);
  });

  afterEach(async () => {
    await page.close();
    await context.close();
    await browser.close();
    vi.restoreAllMocks();
  });

  it('should initialize with automating state', () => {
    expect(manager.getState()).toBe(HandoffState.AUTOMATING);
  });

  it('should create handoff context', async () => {
    await page.goto('https://example.com');
    
    const handoffContext = await manager.createHandoff(
      'run-123',
      'Test Capability',
      1,
      'step-1',
      'Test goal',
      HandoffReason.TARGET_NOT_FOUND,
      '/evidence/test',
      'element.visible == true'
    );

    expect(handoffContext.runId).toBe('run-123');
    expect(handoffContext.capabilityName).toBe('Test Capability');
    expect(handoffContext.reason).toBe(HandoffReason.TARGET_NOT_FOUND);
    expect(handoffContext.sessionState.preserved).toBe(true);
    expect(handoffContext.currentUrl).toBe('https://example.com/');
  });

  it('should transition to waiting for human', async () => {
    await manager.createHandoff(
      'run-123',
      'Test Capability',
      1,
      'step-1',
      'Test goal',
      HandoffReason.TARGET_NOT_FOUND,
      '/evidence/test'
    );

    expect(manager.getState()).toBe(HandoffState.WAITING_FOR_HUMAN);
  });

  it('should transition to human control', async () => {
    await manager.createHandoff(
      'run-123',
      'Test Capability',
      1,
      'step-1',
      'Test goal',
      HandoffReason.TARGET_NOT_FOUND,
      '/evidence/test'
    );

    await manager.transitionToHumanControl();
    expect(manager.getState()).toBe(HandoffState.HUMAN_CONTROL);
  });

  it('should transition to resuming', async () => {
    await manager.createHandoff(
      'run-123',
      'Test Capability',
      1,
      'step-1',
      'Test goal',
      HandoffReason.TARGET_NOT_FOUND,
      '/evidence/test'
    );

    await manager.transitionToHumanControl();
    await manager.transitionToResuming();
    expect(manager.getState()).toBe(HandoffState.RESUMING);
  });

  it('should transition back to automating', async () => {
    await manager.createHandoff(
      'run-123',
      'Test Capability',
      1,
      'step-1',
      'Test goal',
      HandoffReason.TARGET_NOT_FOUND,
      '/evidence/test'
    );

    await manager.transitionToHumanControl();
    await manager.transitionToResuming();
    await manager.transitionToAutomating();
    expect(manager.getState()).toBe(HandoffState.AUTOMATING);
  });

  it('should throw error on invalid state transition', async () => {
    await manager.createHandoff(
      'run-123',
      'Test Capability',
      1,
      'step-1',
      'Test goal',
      HandoffReason.TARGET_NOT_FOUND,
      '/evidence/test'
    );

    await expect(manager.transitionToResuming()).rejects.toThrow('Cannot transition to RESUMING from WAITING_FOR_HUMAN');
  });

  it('should preserve same browser session', async () => {
    await page.goto('https://example.com');
    const originalPage = manager.getPage();
    const originalContext = manager.getBrowserContext();

    await manager.createHandoff(
      'run-123',
      'Test Capability',
      1,
      'step-1',
      'Test goal',
      HandoffReason.TARGET_NOT_FOUND,
      '/evidence/test'
    );

    await manager.transitionToHumanControl();

    // Verify same Page object is returned
    const pageAfterHandoff = manager.getPage();
    const contextAfterHandoff = manager.getBrowserContext();

    expect(pageAfterHandoff).toBe(originalPage);
    expect(contextAfterHandoff).toBe(originalContext);

    // Verify session is still accessible
    expect(manager.verifySessionPreserved()).toBe(true);
    
    // Verify page is still navigable
    await pageAfterHandoff!.evaluate(() => {
      document.body.innerHTML = '<h1>Modified by human</h1>';
    });
    const content = await pageAfterHandoff!.content();
    expect(content).toContain('Modified by human');
  });

  it('should verify session preservation returns false for invalid session', async () => {
    await page.goto('about:blank');
    
    await manager.createHandoff(
      'run-123',
      'Test Capability',
      1,
      'step-1',
      'Test goal',
      HandoffReason.TARGET_NOT_FOUND,
      '/evidence/test'
    );

    expect(manager.verifySessionPreserved()).toBe(false);
  });

  it('should reset handoff state', async () => {
    await manager.createHandoff(
      'run-123',
      'Test Capability',
      1,
      'step-1',
      'Test goal',
      HandoffReason.TARGET_NOT_FOUND,
      '/evidence/test'
    );

    await manager.transitionToHumanControl();
    manager.reset();

    expect(manager.getState()).toBe(HandoffState.AUTOMATING);
    expect(manager.getContext()).toBeNull();
  });

  it('should throw error if not initialized before creating handoff', async () => {
    const uninitializedManager = initializeHandoffManager();
    
    await expect(uninitializedManager.createHandoff(
      'run-123',
      'Test Capability',
      1,
      'step-1',
      'Test goal',
      HandoffReason.TARGET_NOT_FOUND,
      '/evidence/test'
    )).rejects.toThrow('Handoff manager not initialized with browser session');
  });
});

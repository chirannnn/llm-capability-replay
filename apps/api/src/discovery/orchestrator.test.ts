import { describe, it, expect } from 'vitest';
import { DiscoveryOrchestrator } from './orchestrator.js';

describe('DiscoveryOrchestrator - Target Domain Enforcement', () => {
  it('should extract origin from URL', () => {
    const orchestrator = new DiscoveryOrchestrator();
    const origin = orchestrator.extractOrigin('https://example.com/page');
    expect(origin).toBe('https://example.com');
  });

  it('should extract origin with port', () => {
    const orchestrator = new DiscoveryOrchestrator();
    const origin = orchestrator.extractOrigin('https://example.com:8080/page');
    expect(origin).toBe('https://example.com:8080');
  });

  it('should allow navigation to same origin', () => {
    const orchestrator = new DiscoveryOrchestrator();
    orchestrator.targetOrigin = 'https://example.com';
    const isAllowed = orchestrator.isAllowedDomain('https://example.com/page');
    expect(isAllowed).toBe(true);
  });

  it('should reject navigation to different origin', () => {
    const orchestrator = new DiscoveryOrchestrator();
    orchestrator.targetOrigin = 'https://example.com';
    const isAllowed = orchestrator.isAllowedDomain('https://evil.com/page');
    expect(isAllowed).toBe(false);
  });

  it('should reject navigation to subdomain if origin is exact', () => {
    const orchestrator = new DiscoveryOrchestrator();
    orchestrator.targetOrigin = 'https://example.com';
    const isAllowed = orchestrator.isAllowedDomain('https://sub.example.com/page');
    expect(isAllowed).toBe(false);
  });
});

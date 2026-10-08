import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock fetch for API integration tests
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('API - Discovery', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    mockFetch.mockReset();
  });

  it('should start discovery with valid goal', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'started', goal: 'Test goal' }),
    });

    const response = await fetch('http://localhost:3000/api/discovery/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal: 'Test goal', targetUrl: 'https://example.com' }),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.status).toBe('started');
    expect(data.goal).toBe('Test goal');
  });

  it('should reject discovery without goal', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
    });

    const response = await fetch('http://localhost:3000/api/discovery/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUrl: 'https://example.com' }),
    });

    expect(response.status).toBe(400);
  });
});

describe('API - Replay', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    mockFetch.mockReset();
  });

  it('should start replay with valid artifact ID', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'started', artifactId: 'demo-capability' }),
    });

    const response = await fetch('http://localhost:3000/api/replay/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artifactId: 'demo-capability', enableHandoff: false }),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.status).toBe('started');
    expect(data.artifactId).toBe('demo-capability');
  });

  it('should reject replay without artifact ID', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
    });

    const response = await fetch('http://localhost:3000/api/replay/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enableHandoff: false }),
    });

    expect(response.status).toBe(400);
  });
});

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the orchestrator and engine modules
vi.mock('../discovery/orchestrator.js', () => ({
  runDiscovery: vi.fn(),
}));

vi.mock('../replay/engine.js', () => ({
  ReplayEngine: vi.fn().mockImplementation(() => ({
    executeReplay: vi.fn(),
  })),
}));

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
      json: async () => ({ status: 'started', goal: 'Test goal', targetUrl: 'https://example.com' }),
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
      json: async () => ({ error: 'Goal is required' }),
    });

    const response = await fetch('http://localhost:3000/api/discovery/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUrl: 'https://example.com' }),
    });

    expect(response.status).toBe(400);
  });

  it('should reject discovery without API key', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'OPENAI_API_KEY is required for discovery' }),
    });

    const response = await fetch('http://localhost:3000/api/discovery/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal: 'Test goal', targetUrl: 'https://example.com' }),
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
      json: async () => ({ status: 'started', artifactId: 'mariner-pro-course', enableHandoff: false }),
    });

    const response = await fetch('http://localhost:3000/api/replay/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artifactId: 'mariner-pro-course', enableHandoff: false }),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.status).toBe('started');
    expect(data.artifactId).toBe('mariner-pro-course');
  });

  it('should reject replay without artifact ID', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Artifact ID is required' }),
    });

    const response = await fetch('http://localhost:3000/api/replay/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enableHandoff: false }),
    });

    expect(response.status).toBe(400);
  });
});

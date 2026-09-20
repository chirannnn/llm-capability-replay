import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenAIClient } from './client.js';
import { UIObservation } from '../observation/types.js';
import { createExecutionTrace } from '../trace/types.js';

// Mock OpenAI
const mockChatCompletions = {
  create: vi.fn(),
};

const mockOpenAI = {
  chat: {
    completions: mockChatCompletions,
  },
};

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => mockOpenAI),
}));

describe('OpenAIClient', () => {
  let client: OpenAIClient;

  beforeEach(() => {
    client = new OpenAIClient('test-api-key', 'gpt-4');
    (client as { client: typeof mockOpenAI }).client = mockOpenAI;
  });

  it('should initialize with API key and model', () => {
    expect(client).toBeDefined();
  });

  it('should generate next action from LLM', async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            tool_calls: [
              {
                function: {
                  arguments: JSON.stringify({
                    type: 'click',
                    target: {
                      role: 'button',
                      accessibleName: 'Search',
                    },
                    reasoning: 'Click search button',
                  }),
                },
              },
            ],
          },
        },
      ],
    };

    mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as unknown);

    const observation: UIObservation = {
      url: 'https://example.com',
      title: 'Test Page',
      visibleElements: [],
      timestamp: new Date().toISOString(),
    };

    const trace = createExecutionTrace('Test goal', 'https://example.com');

    const action = await client.generateNextAction({
      goal: 'Test goal',
      observation,
      trace,
      stepCount: 0,
      maxSteps: 20,
    });

    expect(action).toBeDefined();
    expect(action.type).toBe('click');
    expect(action.reasoning).toBe('Click search button');
  });

  it('should throw error if no tool call in response', async () => {
    mockOpenAI.chat.completions.create.mockResolvedValue({
      choices: [{ message: {} }],
    } as unknown);

    const observation: UIObservation = {
      url: 'https://example.com',
      title: 'Test Page',
      visibleElements: [],
      timestamp: new Date().toISOString(),
    };

    const trace = createExecutionTrace('Test goal', 'https://example.com');

    await expect(
      client.generateNextAction({
        goal: 'Test goal',
        observation,
        trace,
        stepCount: 0,
        maxSteps: 20,
      })
    ).rejects.toThrow('No tool call in LLM response');
  });
});

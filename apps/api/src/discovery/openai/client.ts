import OpenAI from 'openai';
import { LLMAction, validateLLMAction } from '../actions/schema.js';
import { UIObservation, sanitizeObservation } from '../observation/types.js';
import { ExecutionTrace } from '../trace/types.js';

/**
 * Discovery context for LLM
 */
interface DiscoveryContext {
  goal: string;
  observation: UIObservation;
  trace: ExecutionTrace;
  stepCount: number;
  maxSteps: number;
}

/**
 * OpenAI client for discovery
 */
export class OpenAIClient {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  /**
   * Generate next action from LLM
   */
  async generateNextAction(context: DiscoveryContext): Promise<LLMAction> {
    const systemPrompt = this.buildSystemPrompt(context);
    const userMessage = this.buildUserMessage(context);

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      tools: [this.buildTool()],
      tool_choice: { type: 'function', function: { name: 'execute_action' } },
      temperature: 0.7,
    });

    const toolCall = response.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in LLM response');
    }

    const actionArgs = JSON.parse(toolCall.function.arguments);
    return validateLLMAction(actionArgs);
  }

  /**
   * Build system prompt
   */
  private buildSystemPrompt(context: DiscoveryContext): string {
    return `You are a UI discovery agent. Your goal is to discover how to complete a user's goal on a web application.

Goal: ${context.goal}

Current Progress: Step ${context.stepCount} of ${context.maxSteps}

Available Actions:
- navigate: Navigate to a URL
- click: Click on an element (specify target by role, accessible name, visible text, or test ID)
- type: Type text into an input (specify target by role, accessible name, or test ID)
- select: Select an option from a dropdown
- wait: Wait for a condition or timeout
- extract: Extract data from the page
- complete: Indicate that the goal has been achieved

Target Selection Priority:
1. testId (if available): e.g., data-testid="search-button"
2. accessibleName + role: e.g., role="button", accessibleName="Search"
3. visibleText + role: e.g., role="link", visibleText="Courses"
4. cssSelector (fallback): Use only if no semantic information available

Safety Constraints:
- Only interact with the provided target domain
- No form submissions or delete operations
- No extraction of sensitive user data

Provide your action as a structured function call with reasoning.`;
  }

  /**
   * Build user message with observation
   */
  private buildUserMessage(context: DiscoveryContext): string {
    const sanitized = sanitizeObservation(context.observation);
    
    let message = `Current Page:\n`;
    message += `- URL: ${sanitized.url}\n`;
    message += `- Title: ${sanitized.title}\n\n`;
    
    message += `Visible Elements:\n`;
    sanitized.visibleElements.forEach((element, index) => {
      message += `${index + 1}. Role: ${element.role}`;
      if (element.accessibleName) message += `, Accessible Name: ${element.accessibleName}`;
      if (element.visibleText) message += `, Text: ${element.visibleText}`;
      if (element.testId) message += `, Test ID: ${element.testId}`;
      message += '\n';
    });
    
    if (context.trace.steps.length > 0) {
      message += `\nPrevious Actions:\n`;
      context.trace.steps.slice(-3).forEach((step) => {
        message += `- ${step.action.type}: ${step.action.reasoning}\n`;
        message += `  Result: ${step.result.success ? 'Success' : 'Failed'} - ${step.result.description}\n`;
      });
    }
    
    return message;
  }

  /**
   * Build tool definition
   */
  private buildTool() {
    return {
      type: 'function' as const,
      function: {
        name: 'execute_action',
        description: 'Execute an action on the web page',
        parameters: {
          type: 'object' as const,
          properties: {
            type: {
              type: 'string' as const,
              enum: ['navigate', 'click', 'type', 'select', 'wait', 'extract', 'complete'],
              description: 'The type of action to execute',
            },
            target: {
              type: 'object' as const,
              description: 'Target element specification (semantic)',
              properties: {
                role: { type: 'string', description: 'Semantic role' },
                accessibleName: { type: 'string', description: 'Accessible name' },
                visibleText: { type: 'string', description: 'Visible text' },
                testId: { type: 'string', description: 'Test ID' },
                cssSelector: { type: 'string', description: 'CSS selector (fallback)' },
              },
            },
            value: { type: 'string', description: 'Value for type/select actions' },
            timeout: { type: 'number', description: 'Timeout in milliseconds' },
            reasoning: { type: 'string', description: 'Reasoning for this action' },
          },
          required: ['type', 'reasoning'],
        },
      },
    };
  }
}

/**
 * Initialize OpenAI client
 */
export function initializeOpenAIClient(apiKey: string, model: string): OpenAIClient {
  return new OpenAIClient(apiKey, model);
}

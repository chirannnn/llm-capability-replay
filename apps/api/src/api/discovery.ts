import { Router, Request, Response } from 'express';
import { EventEmitter } from 'events';
import { runDiscovery } from '../discovery/orchestrator.js';
import { generateArtifact } from '../discovery/artifact/generator.js';
import { env } from '../utils/env.js';

const router = Router() as Router;
const discoveryEvents = new EventEmitter();

// SSE endpoint for discovery events
router.get('/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const listener = (event: Record<string, unknown>) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  discoveryEvents.on('discovery-event', listener);

  req.on('close', () => {
    discoveryEvents.removeListener('discovery-event', listener);
  });
});

// Start discovery
router.post('/start', async (req: Request, res: Response): Promise<Response> => {
  const { goal, targetUrl } = req.body;

  if (!goal) {
    return res.status(400).json({ error: 'Goal is required' });
  }

  // Check if OpenAI API key is available
  if (!env.OPENAI_API_KEY) {
    return res.status(400).json({ 
      error: 'OPENAI_API_KEY is required for discovery',
      message: 'Set OPENAI_API_KEY in .env to enable LLM discovery'
    });
  }

  // Use provided targetUrl or default to MARINER_PRO_URL
  const url = targetUrl || env.MARINER_PRO_URL;
  if (!url) {
    return res.status(400).json({ 
      error: 'Target URL is required',
      message: 'Provide targetUrl in request or set MARINER_PRO_URL in .env'
    });
  }

  // Emit discovery started event
  discoveryEvents.emit('discovery-event', {
    type: 'discovery_started',
    timestamp: new Date().toISOString(),
    goal,
    targetUrl: url,
  });

  // Run discovery in background
  runDiscovery(goal, url)
    .then((result) => {
      // Generate artifact from trace
      const artifact = generateArtifact(result.trace);

      discoveryEvents.emit('discovery-event', {
        type: 'completed',
        timestamp: new Date().toISOString(),
        success: result.success,
        capability: artifact,
        stepsCount: result.trace.steps.length,
      });
    })
    .catch((error) => {
      discoveryEvents.emit('discovery-event', {
        type: 'failed',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    });

  return res.json({ status: 'started', goal, targetUrl: url });
});

export { router as discoveryRouter, discoveryEvents };

import { Router, Request, Response } from 'express';
import { EventEmitter } from 'events';

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

  // Emit discovery started event
  discoveryEvents.emit('discovery-event', {
    type: 'discovery_started',
    timestamp: new Date().toISOString(),
    goal,
    targetUrl,
  });

  // In a real implementation, this would trigger the actual discovery orchestrator
  // For now, we'll simulate events for the frontend demo
  setTimeout(() => {
    discoveryEvents.emit('discovery-event', {
      type: 'observation',
      timestamp: new Date().toISOString(),
      step: 1,
      data: 'Observed UI elements',
    });
  }, 1000);

  setTimeout(() => {
    discoveryEvents.emit('discovery-event', {
      type: 'llm_action',
      timestamp: new Date().toISOString(),
      step: 1,
      action: {
        type: 'navigate',
        value: targetUrl,
      },
    });
  }, 2000);

  setTimeout(() => {
    discoveryEvents.emit('discovery-event', {
      type: 'action_completed',
      timestamp: new Date().toISOString(),
      step: 1,
      status: 'success',
    });
  }, 3000);

  setTimeout(() => {
    discoveryEvents.emit('discovery-event', {
      type: 'completed',
      timestamp: new Date().toISOString(),
      capability: {
        id: 'demo-capability',
        version: 1,
        goal,
        steps: [
          {
            stepId: 'step-1',
            order: 1,
            action: { type: 'navigate', value: targetUrl },
          },
        ],
      },
    });
  }, 5000);

  return res.json({ status: 'started', goal, targetUrl });
});

export { router as discoveryRouter, discoveryEvents };

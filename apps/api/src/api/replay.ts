import { Router, Request, Response } from 'express';
import { EventEmitter } from 'events';

const router = Router() as Router;
const replayEvents = new EventEmitter();

// SSE endpoint for replay events
router.get('/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const listener = (event: Record<string, unknown>) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  replayEvents.on('replay-event', listener);

  req.on('close', () => {
    replayEvents.removeListener('replay-event', listener);
  });
});

// Start replay
router.post('/start', async (req: Request, res: Response): Promise<Response> => {
  const { artifactId, enableHandoff } = req.body;

  if (!artifactId) {
    return res.status(400).json({ error: 'Artifact ID is required' });
  }

  // Emit replay started event
  replayEvents.emit('replay-event', {
    type: 'replay_started',
    timestamp: new Date().toISOString(),
    artifactId,
    enableHandoff,
  });

  // Simulate replay events for frontend demo
  setTimeout(() => {
    replayEvents.emit('replay-event', {
      type: 'action_started',
      timestamp: new Date().toISOString(),
      step: 1,
      action: { type: 'navigate' },
    });
  }, 1000);

  setTimeout(() => {
    replayEvents.emit('replay-event', {
      type: 'action_completed',
      timestamp: new Date().toISOString(),
      step: 1,
      status: 'success',
    });
  }, 2000);

  setTimeout(() => {
    replayEvents.emit('replay-event', {
      type: 'checkpoint',
      timestamp: new Date().toISOString(),
      step: 1,
      condition: 'url matches target',
      passed: true,
    });
  }, 2500);

  setTimeout(() => {
    replayEvents.emit('replay-event', {
      type: 'completed',
      timestamp: new Date().toISOString(),
      success: true,
      executedSteps: 1,
    });
  }, 3000);

  return res.json({ status: 'started', artifactId, enableHandoff });
});

export { router as replayRouter, replayEvents };

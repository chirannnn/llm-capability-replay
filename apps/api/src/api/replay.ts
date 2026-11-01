import { Router, Request, Response } from 'express';
import { EventEmitter } from 'events';
import { ReplayEngine } from '../replay/engine.js';
import { safeValidateCapabilityArtifact } from '../capability/schema.js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { marinerProExampleArtifact } from '../capability/examples/mariner-pro-course.js';

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

  // Load artifact
  let artifact;
  try {
    // Try to load from built-in example artifacts
    if (artifactId === 'mariner-pro-course' || artifactId === 'mariner-pro') {
      artifact = marinerProExampleArtifact;
    } else if (artifactId.includes('/') || artifactId.includes('\\')) {
      // Load from file path
      const artifactPath = artifactId;
      const artifactContent = readFileSync(artifactPath, 'utf-8');
      artifact = JSON.parse(artifactContent);
    } else {
      // Try to load from JSON file in examples directory
      const artifactPath = join(process.cwd(), 'apps/api/src/capability/examples', `${artifactId}.json`);
      const artifactContent = readFileSync(artifactPath, 'utf-8');
      artifact = JSON.parse(artifactContent);
    }
  } catch (error) {
    return res.status(404).json({ 
      error: 'Artifact not found',
      message: `Could not load artifact: ${artifactId}`
    });
  }

  // Validate artifact using Zod schema
  const validationResult = safeValidateCapabilityArtifact(artifact);
  if (!validationResult.success) {
    return res.status(400).json({ 
      error: 'Invalid artifact',
      message: validationResult.error.message
    });
  }

  // Emit replay started event
  replayEvents.emit('replay-event', {
    type: 'replay_started',
    timestamp: new Date().toISOString(),
    artifactId,
    enableHandoff,
  });

  // Run replay in background
  const engine = new ReplayEngine(enableHandoff || false);
  
  engine.executeReplay(validationResult.data)
    .then((result) => {
      replayEvents.emit('replay-event', {
        type: 'completed',
        timestamp: new Date().toISOString(),
        success: result.success,
        executedSteps: result.executedSteps.length,
        failure: result.failure,
        outputs: result.outputs,
        evidencePath: result.evidencePath,
      });
    })
    .catch((error) => {
      replayEvents.emit('replay-event', {
        type: 'failed',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    });

  return res.json({ status: 'started', artifactId, enableHandoff });
});

export { router as replayRouter, replayEvents };

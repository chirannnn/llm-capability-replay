#!/usr/bin/env node
/* eslint-disable no-console */
import { initializeReplayEngine } from './engine.js';
import { marinerProExampleArtifact } from '../capability/examples/mariner-pro-course.js';

/**
 * Replay CLI - manual command for deterministic replay
 * This is an explicit manual command for genuine artifact replay
 * Not executed during normal test runs
 */
async function main() {
  const args = process.argv.slice(2);
  const artifactIndex = args.indexOf('--artifact');
  
  if (artifactIndex === -1 || artifactIndex + 1 >= args.length) {
    console.error('Usage: pnpm replay --artifact <artifact-path>');
    console.error('Or use the built-in Mariner Pro example:');
    console.error('pnpm replay --example mariner-pro');
    process.exit(1);
  }
  
  const artifactPath = args[artifactIndex + 1];
  
  console.log('=== REPLAY DEMO ===');
  console.log(`Artifact: ${artifactPath}`);
  console.log('===========================');
  
  try {
    const engine = initializeReplayEngine();
    
    let artifact;
    if (artifactPath === 'mariner-pro') {
      artifact = marinerProExampleArtifact;
      console.log('Using built-in Mariner Pro example artifact');
    } else {
      // Load artifact from file
      const { readFile } = await import('fs/promises');
      const artifactContent = await readFile(artifactPath, 'utf-8');
      artifact = JSON.parse(artifactContent);
      console.log(`Loaded artifact from ${artifactPath}`);
    }
    
    console.log(`Capability: ${artifact.metadata.name}`);
    console.log(`Version: ${artifact.version.version}`);
    console.log(`Steps: ${artifact.steps.length}`);
    console.log('===========================');
    
    const result = await engine.executeReplay(artifact, {
      courseName: 'Auxiliary Engine',
      sectionName: 'Construction',
    });
    
    console.log('===========================');
    console.log(`Replay completed: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`Run ID: ${result.runId}`);
    console.log(`Total steps: ${result.executedSteps.length}`);
    console.log(`Duration: ${result.durationMs}ms`);
    console.log(`Evidence saved to: ${result.evidencePath}`);
    console.log('===========================');
    
    if (result.success) {
      console.log('✓ Replay successful');
      console.log(`✓ Outputs: ${JSON.stringify(result.outputs, null, 2)}`);
    } else {
      console.log('✗ Replay failed');
      console.log(`✗ Failure category: ${result.failure?.category}`);
      console.log(`✗ Failure message: ${result.failure?.message}`);
      console.log(`✗ Failed at step: ${result.failure?.stepId}`);
    }
    
  } catch (error) {
    console.error('Replay failed with error:', error);
    process.exit(1);
  }
}

main();

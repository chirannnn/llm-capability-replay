#!/usr/bin/env node
/* eslint-disable no-console */
import { runDiscovery } from './orchestrator.js';
import { generateArtifact } from './artifact/generator.js';
import { initializeEvidenceCollector } from './evidence/collector.js';
import { env } from '../utils/env.js';

/**
 * Discovery CLI - for testing with mocked OpenAI
 */
async function main() {
  const args = process.argv.slice(2);
  const goalIndex = args.indexOf('--goal');
  
  if (goalIndex === -1 || goalIndex + 1 >= args.length) {
    console.error('Usage: pnpm discovery --goal "your goal here"');
    process.exit(1);
  }
  
  const goal = args[goalIndex + 1];
  const targetUrl = env.MARINER_PRO_URL || 'https://example.com';
  
  console.log(`Starting discovery for goal: ${goal}`);
  console.log(`Target URL: ${targetUrl}`);
  
  try {
    // Run discovery
    const result = await runDiscovery(goal, targetUrl);
    
    // Generate artifact
    const artifact = generateArtifact(result.trace);
    
    // Collect evidence
    const collector = initializeEvidenceCollector('test-session');
    collector.logEvent({ event: 'discovery_started', goal, targetUrl });
    collector.saveTrace(result.trace);
    collector.saveArtifact(artifact);
    collector.generateReport(result.trace, result.success);
    
    console.log(`Discovery completed: ${result.success ? 'Success' : 'Failed'}`);
    console.log(`Evidence saved to: ${collector.getSessionPath()}`);
    console.log(`Artifact validated against Phase 2 schema`);
    
  } catch (error) {
    console.error('Discovery failed:', error);
    process.exit(1);
  }
}

main();

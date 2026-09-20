#!/usr/bin/env node
/* eslint-disable no-console */
import { runDiscovery } from './orchestrator.js';
import { generateArtifact } from './artifact/generator.js';
import { initializeEvidenceCollector } from './evidence/collector.js';
import { env } from '../utils/env.js';

/**
 * Live Discovery Demo - Real OpenAI API, Real URL
 * This is an explicit manual command for genuine LLM discovery
 * Not executed during normal test runs
 */
async function main() {
  const args = process.argv.slice(2);
  const goalIndex = args.indexOf('--goal');
  
  if (goalIndex === -1 || goalIndex + 1 >= args.length) {
    console.error('Usage: pnpm discovery:demo --goal "your goal here"');
    console.error('This command uses real OpenAI API and real MARINER_PRO_URL');
    console.error('Ensure OPENAI_API_KEY and MARINER_PRO_URL are set in .env');
    process.exit(1);
  }
  
  const goal = args[goalIndex + 1];
  
  if (!env.MARINER_PRO_URL) {
    console.error('MARINER_PRO_URL must be set in .env for live discovery');
    process.exit(1);
  }
  
  if (!env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY must be set in .env for live discovery');
    process.exit(1);
  }
  
  console.log('=== LIVE DISCOVERY DEMO ===');
  console.log(`Goal: ${goal}`);
  console.log(`Target URL: ${env.MARINER_PRO_URL}`);
  console.log(`OpenAI Model: ${env.OPENAI_MODEL}`);
  console.log(`Max Steps: ${env.DISCOVERY_MAX_STEPS}`);
  console.log('===========================');
  
  const collector = initializeEvidenceCollector('live-demo');
  
  try {
    // Log start
    collector.logEvent({ 
      event: 'discovery_started', 
      goal, 
      targetUrl: env.MARINER_PRO_URL,
      model: env.OPENAI_MODEL 
    });
    
    // Run discovery
    console.log('Starting discovery loop...');
    const result = await runDiscovery(goal, env.MARINER_PRO_URL);
    
    // Generate artifact
    console.log('Generating Capability Artifact...');
    const artifact = generateArtifact(result.trace);
    
    // Save evidence
    collector.saveTrace(result.trace);
    collector.saveArtifact(artifact);
    collector.generateReport(result.trace, result.success);
    
    console.log('===========================');
    console.log(`Discovery completed: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`Total steps: ${result.trace.steps.length}`);
    console.log(`Evidence saved to: ${collector.getSessionPath()}`);
    console.log(`Artifact validated against Phase 2 schema`);
    console.log('===========================');
    
    if (result.success) {
      console.log('✓ Discovery successful');
      console.log(`✓ Summary: ${result.trace.completion?.summary}`);
    } else {
      console.log('✗ Discovery failed');
      console.log(`✗ Reason: ${result.trace.completion?.summary || 'Unknown'}`);
    }
    
  } catch (error) {
    console.error('Discovery failed with error:', error);
    collector.logEvent({ event: 'discovery_error', error: String(error) });
    process.exit(1);
  }
}

main();

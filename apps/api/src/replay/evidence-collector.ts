import { mkdirSync, writeFileSync, existsSync, appendFileSync } from 'fs';
import { join } from 'path';
import { Page } from 'playwright';
import { ReplayResult, ExecutedStep } from './types.js';
import { CapabilityArtifact } from '../capability/schema.js';

/**
 * Evidence session
 */
export interface EvidenceSession {
  sessionId: string;
  basePath: string;
  screenshotsPath: string;
}

/**
 * Evidence collector for replay
 * Minimal evidence collection consistent with Phase 3
 */
export class ReplayEvidenceCollector {
  private session: EvidenceSession;

  constructor(sessionId: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.session = {
      sessionId,
      basePath: join(process.cwd(), 'evidence', `replay-${timestamp}`),
      screenshotsPath: join(process.cwd(), 'evidence', `replay-${timestamp}`, 'screenshots'),
    };
    this.initializeSession();
  }

  /**
   * Initialize evidence session directory structure
   */
  private initializeSession(): void {
    mkdirSync(this.session.basePath, { recursive: true });
    mkdirSync(this.session.screenshotsPath, { recursive: true });
  }

  /**
   * Log replay event
   */
  logEvent(event: Record<string, unknown>): void {
    const logPath = join(this.session.basePath, 'replay.log');
    const logEntry = JSON.stringify({ ...event, timestamp: new Date().toISOString() }) + '\n';

    if (existsSync(logPath)) {
      appendFileSync(logPath, logEntry);
    } else {
      writeFileSync(logPath, logEntry);
    }
  }

  /**
   * Save executed steps
   */
  saveSteps(steps: ExecutedStep[]): void {
    const stepsPath = join(this.session.basePath, 'execution-trace.json');
    writeFileSync(stepsPath, JSON.stringify(steps, null, 2));
  }

  /**
   * Save artifact used for replay
   */
  saveArtifact(artifact: CapabilityArtifact): void {
    const artifactPath = join(this.session.basePath, 'artifact.json');
    writeFileSync(artifactPath, JSON.stringify(artifact, null, 2));
  }

  /**
   * Capture screenshot
   */
  async captureScreenshot(name: string, page: Page): Promise<void> {
    const screenshotPath = join(this.session.screenshotsPath, `${name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
  }

  /**
   * Generate replay report
   */
  generateReport(result: ReplayResult): void {
    const reportPath = join(this.session.basePath, 'report.md');
    const report = `# Replay Report

**Capability:** ${result.capabilityName}
**Version:** ${result.capabilityVersion}
**Run ID:** ${result.runId}
**Success:** ${result.success ? 'Yes' : 'No'}
**Started At:** ${result.startedAt}
**Completed At:** ${result.completedAt}
**Duration:** ${result.durationMs}ms

${result.businessOutcome ? `**Business Outcome:** ${result.businessOutcome}` : ''}

${result.failure ? `
**Failure:**
- Category: ${result.failure.category}
- Message: ${result.failure.message}
- Step: ${result.failure.stepId}
` : ''}

## Executed Steps

${result.executedSteps.map((step) => `
### Step ${step.order}: ${step.stepId}
- **Status:** ${step.status}
- **Action:** ${step.action.type}
- **Description:** ${step.result.description}
${step.result.error ? `- **Error:** ${step.result.error}` : ''}
${step.checkpointResult ? `- **Checkpoint:** ${step.checkpointResult.passed ? 'Passed' : 'Failed'} (${step.checkpointResult.condition})` : ''}
- **Retries:** ${step.retryCount}
`).join('\n')}

## Outputs

${Object.entries(result.outputs).map(([name, value]) => `- **${name}:** ${JSON.stringify(value)}`).join('\n')}

## Evidence Files

- replay.log
- execution-trace.json
- artifact.json
- screenshots/
  - initial.png
  - final.png
  - step-[N].png
`;

    writeFileSync(reportPath, report);
  }

  /**
   * Get session path
   */
  getSessionPath(): string {
    return this.session.basePath;
  }
}

/**
 * Initialize replay evidence collector
 */
export function initializeReplayEvidenceCollector(sessionId: string): ReplayEvidenceCollector {
  return new ReplayEvidenceCollector(sessionId);
}

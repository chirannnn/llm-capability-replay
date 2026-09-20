/**
 * Simple UI observation format
 * Captures useful semantic information without complex accessibility tree framework
 */

/**
 * Visible element with semantic information
 */
export interface VisibleElement {
  role: string; // button, link, textbox, combobox, etc.
  accessibleName?: string; // aria-label, label, placeholder
  visibleText?: string; // Text content
  testId?: string; // data-testid, test-id, etc.
}

/**
 * UI Observation
 */
export interface UIObservation {
  url: string;
  title: string;
  visibleElements: VisibleElement[];
  timestamp: string;
}

/**
 * Create observation from page state
 */
export function createObservation(
  url: string,
  title: string,
  visibleElements: VisibleElement[]
): UIObservation {
  return {
    url,
    title,
    visibleElements,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Sanitize observation to remove sensitive data before sending to LLM
 */
export function sanitizeObservation(observation: UIObservation): UIObservation {
  // Remove potentially sensitive values from visible text
  const sanitizedElements = observation.visibleElements.map((element) => {
    const sanitized: VisibleElement = { ...element };
    
    // Remove text that looks like sensitive data
    if (sanitized.visibleText) {
      // Mask values that look like passwords, API keys, tokens
      if (isSensitiveValue(sanitized.visibleText)) {
        sanitized.visibleText = '[REDACTED]';
      }
    }
    
    // Remove accessible names that look like sensitive data
    if (sanitized.accessibleName) {
      if (isSensitiveValue(sanitized.accessibleName)) {
        sanitized.accessibleName = '[REDACTED]';
      }
    }
    
    return sanitized;
  });
  
  return {
    ...observation,
    visibleElements: sanitizedElements,
  };
}

/**
 * Check if a value looks like sensitive data
 */
function isSensitiveValue(value: string): boolean {
  const sensitivePatterns = [
    /password/i,
    /api[_-]?key/i,
    /secret/i,
    /token/i,
    /auth[_-]?token/i,
    /bearer/i,
    /credential/i,
    /session[_-]?id/i,
  ];
  
  return sensitivePatterns.some((pattern) => pattern.test(value));
}

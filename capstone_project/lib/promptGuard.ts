/**
 * Detects common prompt injection patterns in user input
 */
export function detectPromptInjection(input: string): { isSuspicious: boolean; reason?: string } {
  if (!input) return { isSuspicious: false };

  const lowerInput = input.toLowerCase();

  const injectionPatterns = [
    { pattern: /ignore previous/i, reason: 'Attempt to bypass previous instructions' },
    { pattern: /system:/i, reason: 'Attempt to impersonate system role' },
    { pattern: /you are now/i, reason: 'Attempt to change AI persona' },
    { pattern: /disregard all/i, reason: 'Attempt to disregard system prompt' },
    { pattern: /forget everything/i, reason: 'Attempt to clear context' },
    { pattern: /your new instructions/i, reason: 'Attempt to inject new system instructions' },
    { pattern: /jailbreak/i, reason: 'Jailbreak keyword detected' },
    { pattern: /bypass/i, reason: 'Attempt to bypass restrictions' },
  ];

  for (const { pattern, reason } of injectionPatterns) {
    if (pattern.test(lowerInput)) {
      return { isSuspicious: true, reason };
    }
  }

  // Check for suspicious encoding or unusually long repeated patterns that might be used for buffer overflow / obfuscation
  if (/(?:%[0-9a-fA-F]{2}){10,}/.test(input) || /(?:base64,)/i.test(input)) {
    return { isSuspicious: true, reason: 'Suspicious encoding detected' };
  }

  return { isSuspicious: false };
}

/**
 * Sanitizes input by stripping out or neutralizing potentially dangerous phrases.
 * This is a basic implementation and does not replace the need for strong system prompt design.
 */
export function sanitizeForLLM(input: string): string {
  if (!input) return '';

  let sanitized = input;

  // Replace common injection phrases with harmless text
  const replacePatterns = [
    /ignore previous( instructions)?/gi,
    /system:/gi,
    /you are now/gi,
    /disregard all/gi,
    /forget everything/gi,
  ];

  for (const pattern of replacePatterns) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }

  return sanitized;
}

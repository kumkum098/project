import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini client with a build-safe placeholder so app startup does not fail
// when deployment env vars are not present at build time.
const apiKey = process.env.GEMINI_API_KEY ?? 'dummy-gemini-api-key';
export const genAI = new GoogleGenerativeAI(apiKey);

export const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

export type TokenUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
};

export type EndpointUsage = {
  requests: number;
  tokens: TokenUsage;
};

// In-memory token usage tracking
let cumulativeUsage = {
  totalRequests: 0,
  totalTokens: 0,
  estimatedCost: 0, // Roughly $0.15 per 1M input tokens, $0.60 per 1M output tokens (adjust based on real pricing)
  endpoints: {} as Record<string, EndpointUsage>,
};

/**
 * Track token usage for an API call
 */
export function trackTokenUsage(endpoint: string, promptTokens: number, completionTokens: number) {
  const totalTokens = promptTokens + completionTokens;
  // Cost estimation logic for gemini-2.0-flash (example prices)
  const cost = (promptTokens / 1_000_000) * 0.15 + (completionTokens / 1_000_000) * 0.60;

  cumulativeUsage.totalRequests += 1;
  cumulativeUsage.totalTokens += totalTokens;
  cumulativeUsage.estimatedCost += cost;

  if (!cumulativeUsage.endpoints[endpoint]) {
    cumulativeUsage.endpoints[endpoint] = {
      requests: 0,
      tokens: { promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCost: 0 },
    };
  }

  const ep = cumulativeUsage.endpoints[endpoint];
  ep.requests += 1;
  ep.tokens.promptTokens += promptTokens;
  ep.tokens.completionTokens += completionTokens;
  ep.tokens.totalTokens += totalTokens;
  ep.tokens.estimatedCost += cost;

  return {
    promptTokens,
    completionTokens,
    totalTokens,
    estimatedCost: cost,
  };
}

/**
 * Get cumulative token usage stats
 */
export function getTokenUsageStats() {
  return cumulativeUsage;
}

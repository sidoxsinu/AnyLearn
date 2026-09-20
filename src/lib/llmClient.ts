// AnyLearn — LLM Client (OpenAI chat completions API + response cache)
// API key is stored in localStorage or provided via env var — no backend needed.

const OPENAI_BASE = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-4o-mini';

export interface LLMOptions {
  temperature?: number;
  model?: string;
}

export type LLMErrorCode = 'missingKey' | 'cacheMiss' | 'invalidResponse' | 'quota';

export class LLMError extends Error {
  public code: LLMErrorCode;
  constructor(code: LLMErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'LLMError';
    this.code = code;
  }
}

// ── Response Cache (localStorage-backed, keyed by SHA-256 of system+user) ────
const CACHE_PREFIX = 'anylearn-cache-';

async function cacheKey(system: string, user: string): Promise<string> {
  const data = new TextEncoder().encode(`${system}\n${user}`);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function cacheRead(key: string): string | null {
  try { return localStorage.getItem(CACHE_PREFIX + key); } catch { return null; }
}

function cacheWrite(key: string, value: string): void {
  try { localStorage.setItem(CACHE_PREFIX + key, value); } catch { /* quota exceeded, ignore */ }
}

// ── OpenAI chat completions call ─────────────────────────────────────────────
async function callOpenAI<T>(
  apiKey: string,
  system: string,
  user: string,
  options: LLMOptions = {}
): Promise<T> {
  const model = options.model ?? DEFAULT_MODEL;
  const temperature = options.temperature ?? 0.4;
  let lastError = '';

  const buildBody = (userText: string) => ({
    model,
    temperature,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: userText },
    ],
  });

  for (let attempt = 0; attempt < 2; attempt++) {
    const userText = attempt === 0
      ? user
      : user + `\n\nReturn valid JSON only. Previous parse error: ${lastError}`;

    const res = await fetch(OPENAI_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(buildBody(userText)),
    });

    if (res.status === 429) throw new LLMError('quota', 'API quota exceeded. Check your OpenAI usage limits.');
    if (!res.ok) throw new LLMError('invalidResponse', `OpenAI HTTP ${res.status}`);

    const envelope = await res.json();
    const text: string | undefined = envelope?.choices?.[0]?.message?.content;
    if (!text) throw new LLMError('invalidResponse', 'OpenAI returned no content.');

    try {
      // Strip markdown code fences if present
      const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
      return JSON.parse(cleaned) as T;
    } catch (e) {
      lastError = String(e);
      if (attempt === 1) throw new LLMError('invalidResponse', `JSON parse failed: ${lastError}`);
    }
  }
  throw new LLMError('invalidResponse', 'Retry exhausted.');
}

// ── Public API ────────────────────────────────────────────────────────────────
export async function generate<T>(
  system: string,
  user: string,
  apiKey: string,
  options: LLMOptions = {}
): Promise<T> {
  if (!apiKey) throw new LLMError('missingKey', 'No OpenAI API key provided.');

  const isDemoMode = typeof window !== 'undefined' &&
    (localStorage.getItem('anylearn-demo-mode') === 'true');

  const key = await cacheKey(system, user);

  if (isDemoMode) {
    const cached = cacheRead(key);
    if (cached) return JSON.parse(cached) as T;
    throw new LLMError('cacheMiss', 'No cached response for demo mode.');
  }

  try {
    const result = await callOpenAI<T>(apiKey, system, user, options);
    // Cache the result for demo/offline use
    cacheWrite(key, JSON.stringify(result));
    return result;
  } catch (err) {
    // Fall back to cache if available
    const cached = cacheRead(key);
    if (cached) return JSON.parse(cached) as T;
    throw err;
  }
}

// API key management (stored in localStorage, with env var fallback)
export const ApiKeyStore = {
  get(): string {
    // Operator-configured env key always wins — prevents stale localStorage
    // Gemini keys from overriding the configured OpenAI key.
    const openaiEnvKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';
    if (openaiEnvKey) return openaiEnvKey;
    // User-supplied key from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('anylearn-gemini-key');
      if (stored) return stored;
    }
    // Legacy Gemini env var fallback
    return process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
  },
  set(key: string): void {
    localStorage.setItem('anylearn-gemini-key', key.trim());
  },
  clear(): void {
    localStorage.removeItem('anylearn-gemini-key');
  },
  has(): boolean {
    return !!this.get();
  },
};

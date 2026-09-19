// AnyLearn — LLM Client (Gemini REST API + response cache)
// API key is stored in localStorage and passed at call time — no backend needed.

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-2.0-flash';

export interface LLMOptions {
  temperature?: number;
  model?: string;
}

export class LLMError extends Error {
  constructor(public code: 'missingKey' | 'cacheMiss' | 'invalidResponse' | 'quota', message: string) {
    super(message);
    this.name = 'LLMError';
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

// ── Gemini REST call ─────────────────────────────────────────────────────────
async function callGemini<T>(
  apiKey: string,
  system: string,
  user: string,
  options: LLMOptions = {}
): Promise<T> {
  const model = options.model ?? DEFAULT_MODEL;
  const temperature = options.temperature ?? 0.4;
  const url = `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`;

  const body = {
    systemInstruction: { role: 'user', parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [{ text: user }] }],
    generationConfig: {
      temperature,
      responseMimeType: 'application/json',
    },
  };

  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        attempt === 0
          ? body
          : {
              ...body,
              contents: [
                {
                  role: 'user',
                  parts: [{ text: user + `\n\nReturn valid JSON only. Previous parse error: ${lastError}` }],
                },
              ],
            }
      ),
    });

    if (res.status === 429) throw new LLMError('quota', 'API quota exceeded. Check your Gemini free tier limits.');
    if (!res.ok) throw new LLMError('invalidResponse', `Gemini HTTP ${res.status}`);

    const envelope = await res.json();
    const text: string | undefined = envelope?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new LLMError('invalidResponse', 'Gemini returned no content.');

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

let lastError = '';

// ── Public API ────────────────────────────────────────────────────────────────
export async function generate<T>(
  system: string,
  user: string,
  apiKey: string,
  options: LLMOptions = {}
): Promise<T> {
  if (!apiKey) throw new LLMError('missingKey', 'No Gemini API key provided.');

  const isDemoMode = typeof window !== 'undefined' &&
    (localStorage.getItem('anylearn-demo-mode') === 'true');

  const key = await cacheKey(system, user);

  if (isDemoMode) {
    const cached = cacheRead(key);
    if (cached) return JSON.parse(cached) as T;
    throw new LLMError('cacheMiss', 'No cached response for demo mode.');
  }

  try {
    const result = await callGemini<T>(apiKey, system, user, options);
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

// API key management (stored in localStorage)
export const ApiKeyStore = {
  get(): string {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('anylearn-gemini-key') ?? '';
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

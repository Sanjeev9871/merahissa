import { assertNoPii } from '../redaction';

/**
 * AI provider adapter.
 *
 * Two jobs:
 *   1. Make swapping providers a config change, not a refactor. Free tiers
 *      change their terms and limits; the day Groq's do, we set AI_PROVIDER
 *      and redeploy. No application code moves.
 *   2. Be the single chokepoint every outbound model call passes through, so
 *      the PII guard cannot be bypassed by someone calling fetch() directly.
 *      Nothing else in the codebase should import an AI SDK.
 *
 * Both supported providers speak the OpenAI chat-completions shape, so one
 * request builder covers them.
 */

export type ProviderName = 'groq' | 'openrouter';

interface ProviderConfig {
  endpoint: string;
  apiKeyEnv: string;
  defaultModel: string;
}

const PROVIDERS: Record<ProviderName, ProviderConfig> = {
  groq: {
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    apiKeyEnv: 'GROQ_API_KEY',
    defaultModel: 'llama-3.3-70b-versatile',
  },
  openrouter: {
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    defaultModel: 'qwen/qwen-2.5-72b-instruct',
  },
};

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompleteOptions {
  messages: Message[];
  /** Free-form label used in the guard's error context and in logs. */
  context: string;
  temperature?: number;
  maxTokens?: number;
  /** Ask the provider for a JSON object. Both providers honour this. */
  json?: boolean;
  signal?: AbortSignal;
}

export class AiError extends Error {
  readonly status: number | null;
  readonly retryable: boolean;

  constructor(message: string, status: number | null, retryable: boolean) {
    super(message);
    this.name = 'AiError';
    this.status = status;
    this.retryable = retryable;
  }
}

function resolveProvider(): { name: ProviderName; config: ProviderConfig; key: string } {
  const name = (process.env.AI_PROVIDER ?? 'groq') as ProviderName;
  const config = PROVIDERS[name];
  if (!config) {
    throw new AiError(`Unknown AI_PROVIDER "${name}"`, null, false);
  }

  const key = process.env[config.apiKeyEnv];
  if (!key) {
    throw new AiError(`${config.apiKeyEnv} is not set`, null, false);
  }

  return { name, config, key };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Free tiers rate-limit per minute, not per month, and a single case needs
 * only 5–10 calls. Exponential backoff with jitter absorbs bursts without a
 * queue for the volumes v1 will see. Honours Retry-After when the provider
 * sends one, because guessing is worse than being told.
 */
async function withRetry<T>(fn: () => Promise<T>, attempts = 4): Promise<T> {
  let lastError: unknown;

  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (e instanceof AiError && !e.retryable) throw e;
      if (i === attempts - 1) break;

      const backoff = Math.min(1000 * 2 ** i, 8000);
      const jitter = Math.random() * 250;
      await sleep(backoff + jitter);
    }
  }

  throw lastError;
}

/**
 * The ONLY function in the codebase that talks to a model.
 *
 * Every message is scanned by assertNoPii before it leaves the process. If a
 * caller has assembled a prompt from unredacted case data, this throws and the
 * case fails into the review queue rather than leaking to a third party.
 */
export async function complete(opts: CompleteOptions): Promise<string> {
  // ---- The guard. Do not move, weaken, or wrap this in a try/catch. -------
  assertNoPii(opts.messages, `ai.complete(${opts.context})`);
  // ------------------------------------------------------------------------

  const { config, key } = resolveProvider();
  const model = process.env.AI_MODEL ?? config.defaultModel;

  return withRetry(async () => {
    let res: Response;
    try {
      res = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          messages: opts.messages,
          temperature: opts.temperature ?? 0.2,
          max_tokens: opts.maxTokens ?? 2000,
          ...(opts.json ? { response_format: { type: 'json_object' } } : {}),
        }),
        signal: opts.signal,
      });
    } catch (cause) {
      throw new AiError(`Network failure calling ${config.endpoint}`, null, true);
    }

    if (!res.ok) {
      // 429 and 5xx are worth retrying; 4xx generally is not.
      const retryable = res.status === 429 || res.status >= 500;
      const retryAfter = Number(res.headers.get('retry-after'));
      if (retryable && Number.isFinite(retryAfter) && retryAfter > 0) {
        await sleep(Math.min(retryAfter * 1000, 10_000));
      }
      // The body may echo our prompt back; never include it in the error.
      throw new AiError(`Provider returned ${res.status}`, res.status, retryable);
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new AiError('Provider returned an empty completion', null, true);
    }

    return content;
  });
}

/**
 * Same call, parsed as JSON. Models sometimes wrap JSON in prose or a fenced
 * block even when asked not to, so we extract the outermost object rather
 * than trusting the response to be bare JSON.
 */
export async function completeJson<T>(opts: CompleteOptions): Promise<T> {
  const raw = await complete({ ...opts, json: true });

  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end <= start) {
    throw new AiError('Provider response contained no JSON object', null, true);
  }

  try {
    return JSON.parse(raw.slice(start, end + 1)) as T;
  } catch {
    throw new AiError('Provider response was not valid JSON', null, true);
  }
}

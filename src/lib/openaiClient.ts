import OpenAI from "openai";
import { ProxyAgent, fetch as undiciFetch } from "undici";

/**
 * Local (China): set OPENAI_HTTPS_PROXY=http://127.0.0.1:8118
 * Vercel / production: leave unset — Node uses the default global fetch.
 */
function resolveProxyUrl(): string | undefined {
  return (
    process.env.OPENAI_HTTPS_PROXY?.trim() ||
    process.env.HTTPS_PROXY?.trim() ||
    process.env.https_proxy?.trim() ||
    process.env.HTTP_PROXY?.trim() ||
    process.env.http_proxy?.trim() ||
    undefined
  );
}

export type CreateOpenAIClientOptions = {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
};

/**
 * Wrap undici fetch with a ProxyAgent. Prefer this over SDK `fetchOptions`
 * so TypeScript stays compatible (`ClientOptions | undefined` has no indexed
 * `fetchOptions` under ConstructorParameters).
 */
function createProxiedFetch(proxyUrl: string): typeof fetch {
  const agent = new ProxyAgent(proxyUrl);
  return ((input: RequestInfo | URL, init?: RequestInit) => {
    return undiciFetch(input as Parameters<typeof undiciFetch>[0], {
      ...(init as object),
      dispatcher: agent,
    } as Parameters<typeof undiciFetch>[1]);
  }) as unknown as typeof fetch;
}

/** Shared OpenAI client used by chat, onboarding, daily recovery, etc. */
export function createOpenAIClient(
  options: CreateOpenAIClientOptions,
): OpenAI {
  const proxyUrl = resolveProxyUrl();

  return new OpenAI({
    apiKey: options.apiKey,
    ...(options.baseURL ? { baseURL: options.baseURL } : {}),
    timeout: options.timeout ?? 120_000,
    maxRetries: options.maxRetries ?? 2,
    ...(proxyUrl ? { fetch: createProxiedFetch(proxyUrl) } : {}),
  });
}

export function getOpenAIChatModel(): string {
  const model = process.env.OPENAI_MODEL?.trim();
  if (!model) {
    throw new Error("Missing OPENAI_MODEL");
  }
  return model;
}

export function requireOpenAIApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }
  return apiKey;
}

import OpenAI from "openai";
import { ProxyAgent, fetch as undiciFetch } from "undici";

/**
 * System proxy (e.g. MonoProxy) is used by the browser/curl but NOT by Node fetch.
 * Set OPENAI_HTTPS_PROXY (or HTTPS_PROXY) so the OpenAI client routes through it.
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

export function createOpenAIClient(
  options: CreateOpenAIClientOptions,
): OpenAI {
  const proxyUrl = resolveProxyUrl();
  const fetchOptions: Record<string, unknown> = {};

  if (proxyUrl) {
    fetchOptions.dispatcher = new ProxyAgent(proxyUrl);
  }

  return new OpenAI({
    apiKey: options.apiKey,
    ...(options.baseURL ? { baseURL: options.baseURL } : {}),
    timeout: options.timeout ?? 120_000,
    maxRetries: options.maxRetries ?? 2,
    // undici fetch + ProxyAgent so Node traffic goes through the local VPN proxy
    fetch: undiciFetch as unknown as typeof fetch,
    //fetchOptions: fetchOptions as ConstructorParameters<typeof OpenAI>[0]["fetchOptions"],
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

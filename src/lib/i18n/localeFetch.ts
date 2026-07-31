import type { Locale } from "./types";

export function localeFetch(
  locale: Locale,
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const headers = new Headers(init?.headers);
  headers.set("X-App-Locale", locale);
  return fetch(input, { ...init, headers, credentials: "same-origin" });
}

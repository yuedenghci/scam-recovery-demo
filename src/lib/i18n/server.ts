import type { Locale, Messages } from "./types";
import { getMessages } from "./messages";

export function parseLocale(value: string | null | undefined): Locale {
  return value === "en" ? "en" : "zh";
}

export function parseLocaleFromRequest(request: Request): Locale {
  return parseLocale(request.headers.get("X-App-Locale"));
}

export function apiMessage(
  locale: Locale,
  key: keyof Messages["api"],
): string {
  return getMessages(locale).api[key];
}

export function htmlLang(locale: Locale): string {
  return locale === "en" ? "en" : "zh-CN";
}

export function dateLocale(locale: Locale): string {
  return locale === "en" ? "en-US" : "zh-CN";
}

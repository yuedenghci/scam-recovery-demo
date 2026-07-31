import type { Locale } from "../types";
import { enMessages } from "./en";
import { zhMessages } from "./zh";

const MESSAGES = {
  zh: zhMessages,
  en: enMessages,
} as const;

export function getMessages(locale: Locale) {
  return MESSAGES[locale];
}

export { zhMessages, enMessages };

import type { UserSupportContext } from "@prisma/client";

import { formatUserSupportContextForSystemPrompt } from "./buildSupportContextPrompt";
import {
  getSupportContextEmpty,
  getSupportContextHeader,
} from "./i18n/llm";
import type { Locale } from "./i18n/types";

export function buildSupportSystemPrompt(input: {
  basePrompt: string;
  supportContext: UserSupportContext | null;
  locale?: Locale;
}): string {
  const locale = input.locale ?? "zh";
  const supplement = input.supportContext
    ? formatUserSupportContextForSystemPrompt({
        scamSituation: input.supportContext.scamSituation ?? "",
        scamImpact: input.supportContext.scamImpact ?? "",
        personality: input.supportContext.personality ?? "",
        likedActivities: input.supportContext.likedActivities ?? "",
        expectedRole: input.supportContext.expectedRole ?? "",
        toneStyle: input.supportContext.toneStyle ?? "",
        proactiveLevel: input.supportContext.proactiveLevel ?? "",
        helpGoals: input.supportContext.helpGoals ?? "",
      })
    : getSupportContextEmpty(locale);

  return [
    input.basePrompt,
    "",
    getSupportContextHeader(locale),
    supplement,
  ]
    .filter(Boolean)
    .join("\n");
}

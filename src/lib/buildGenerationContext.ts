import type { UserSupportContext } from "@prisma/client";

import { getDf1SystemPrompt } from "./i18n/llm";
import type { Locale } from "./i18n/types";
import { buildSupportSystemPrompt } from "./buildSupportSystemPrompt";

export function buildGenerationContext(
  supportContext: UserSupportContext | null,
  currentState:
    | {
        emotional: string | null;
        physical: string | null;
        spatial: string | null;
      }
    | null,
  latestUserMessage: string,
  panelFeedbackNotes: string[],
  explicitFeedbackNotes: string[],
  chatHistory: Array<{ role: "user" | "assistant"; content: string }>,
  locale: Locale = "zh",
) {
  return {
    systemPrompt: buildSupportSystemPrompt({
      basePrompt: getDf1SystemPrompt(locale),
      supportContext,
      locale,
    }),
    currentState: currentState
      ? {
          emotional: currentState.emotional,
          physical: currentState.physical,
          spatial: currentState.spatial,
        }
      : null,
    panelFeedbackNotes,
    explicitFeedbackNotes,
    chatHistory,
    latestUserMessage,
    locale,
  };
}

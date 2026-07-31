import { getMessages } from "@/lib/i18n/messages";
import {
  getLocalizedQuestionById,
  getLocalizedQuestions,
  type LocalizedQuestionNode,
} from "@/lib/i18n/onboardingQuestions";
import type { Locale } from "@/lib/i18n/types";

export type RightPanelKey =
  | "scamSituation"
  | "scamImpact"
  | "personality"
  | "likedActivities"
  | "expectedRole"
  | "toneStyle"
  | "proactiveLevel"
  | "helpGoals";

export type QuestionNode = LocalizedQuestionNode;

export function getOpeningText(locale: Locale = "zh"): string {
  return getMessages(locale).onboarding.openingText;
}

export function getEndingText(locale: Locale = "zh"): string {
  return getMessages(locale).onboarding.endingText;
}

/** @deprecated Use getOpeningText(locale) */
export const OPENING_TEXT = getOpeningText("zh");

/** @deprecated Use getEndingText(locale) */
export const ENDING_TEXT = getEndingText("zh");

export function getRightPanelModules(locale: Locale = "zh"): Array<{
  key: RightPanelKey;
  title: string;
  group: string;
}> {
  const t = getMessages(locale).onboarding;
  const modules = t.modules;
  return [
    { key: "scamSituation", title: modules.scamSituation, group: t.groupUser },
    { key: "scamImpact", title: modules.scamImpact, group: t.groupUser },
    { key: "personality", title: modules.personality, group: t.groupUser },
    {
      key: "likedActivities",
      title: modules.likedActivities,
      group: t.groupUser,
    },
    { key: "expectedRole", title: modules.expectedRole, group: t.groupAi },
    { key: "toneStyle", title: modules.toneStyle, group: t.groupAi },
    {
      key: "proactiveLevel",
      title: modules.proactiveLevel,
      group: t.groupAi,
    },
    { key: "helpGoals", title: modules.helpGoals, group: t.groupAi },
  ];
}

/** @deprecated Use getRightPanelModules(locale) */
export const RIGHT_PANEL_MODULES = getRightPanelModules("zh");

export function getQuestions(locale: Locale = "zh"): QuestionNode[] {
  return getLocalizedQuestions(locale);
}

/** @deprecated Use getQuestions(locale) */
export const QUESTIONS = getQuestions("zh");

export function getQuestionById(
  id: string,
  locale: Locale = "zh",
): QuestionNode | undefined {
  return getLocalizedQuestionById(locale, id);
}

export function questionTargetsProactiveLevel(questionId: string): boolean {
  const q = getLocalizedQuestionById("zh", questionId);
  return q?.rightPanelKey === "proactiveLevel";
}

export function getModuleTitle(
  key: RightPanelKey,
  locale: Locale = "zh",
): string {
  return (
    getRightPanelModules(locale).find((m) => m.key === key)?.title ?? key
  );
}

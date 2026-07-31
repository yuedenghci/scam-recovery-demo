import type { Locale } from "./i18n/types";
import {
  createOpenAIClient,
  getOpenAIChatModel,
  requireOpenAIApiKey,
} from "./openaiClient";

function formatLikedActivities(likedActivities: string): string | null {
  const raw = likedActivities.replace(/\r\n/g, "\n").trim();
  if (!raw) return null;

  // 允许用户在 onboarding 里用多行写多个活动，这里做成更紧凑的“参考清单”。
  const lines = raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  if (lines.length === 1) return lines[0];
  return lines.join("、");
}

function formatCurrentStateForPrompt(
  input: {
    emotional?: string | null;
    physical?: string | null;
    spatial?: string | null;
  },
  locale: Locale,
): string | null {
  const parts: string[] = [];
  const emotional = input.emotional?.trim();
  const physical = input.physical?.trim();
  const spatial = input.spatial?.trim();

  if (emotional) {
    parts.push(locale === "en" ? `Emotional: ${emotional}` : `情绪：${emotional}`);
  }
  if (physical) {
    parts.push(locale === "en" ? `Physical: ${physical}` : `身体：${physical}`);
  }
  if (spatial) {
    parts.push(
      locale === "en" ? `Location/situation: ${spatial}` : `空间/处境：${spatial}`,
    );
  }

  if (parts.length === 0) return null;
  return parts.join(locale === "en" ? "; " : "；");
}

type GenerateDailyRecoveryParams = {
  recoveryDomain: string;
  difficultyNote: string;
  /** onboarding AI 已保存的“让用户稍微缓一缓的活动/方式” */
  likedActivities?: string | null;
  /** 用户临时给的一小句偏好提示，用于「按我的建议换一批」 */
  suggestionLine?: string | null;
  /** 当前状态（如果存在则温和参考；空则不写入 prompt） */
  currentState?: {
    emotional?: string | null;
    physical?: string | null;
    spatial?: string | null;
  } | null;
  locale?: Locale;
};

/**
 * Calls the same Doubao/OpenAI-compatible API as chat, to propose 3 tiny recovery steps.
 */
export async function generateDailyRecoveryCandidates(
  params: GenerateDailyRecoveryParams,
): Promise<[string, string, string]> {
  const locale = params.locale ?? "zh";
  const apiKey = requireOpenAIApiKey();
  const model = getOpenAIChatModel();

  const likedActivities = formatLikedActivities(params.likedActivities ?? "");
  const currentStateBlock = params.currentState
    ? formatCurrentStateForPrompt(params.currentState, locale)
    : null;

  const suggestionLine =
    typeof params.suggestionLine === "string" && params.suggestionLine.trim()
      ? locale === "en"
        ? `User's extra preference hint (reference only, don't follow rigidly): ${params.suggestionLine.trim()}`
        : `用户额外的小提示偏好（不必严格照办，只作参考）：${params.suggestionLine.trim()}`
      : null;

  const system =
    locale === "en"
      ? [
          "You are a supportive companion helping the user with daily recovery. Tone: gentle, non-judgmental.",
          "The user provides a recovery area, current difficulty, and optionally calming activities from onboarding support settings.",
          "If current state (emotional/physical/location) is provided, reference it gently — don't repeat verbatim.",
          "Sometimes the user adds a brief preference (suggestionLine) like 'lighter', 'nothing about going out', 'something for evening' — reference gently.",
          "Generate exactly 3 English candidate actions. Each must be a very small step, low pressure, easy to start.",
          "Forbidden: commanding tone, check-in/completion vibes, productivity jargon, big plans, a 4th item.",
          "Each should feel like 'one small thing to try today', short (ideally under 50 words).",
          "Output only JSON: an array of 3 strings. No markdown, no explanation, no numbering.",
          'Example: ["…","…","…"]',
        ].join("\n")
      : [
          "你是陪伴用户进行日常恢复的支持者，语气温和、不评判。",
          "用户会给出「恢复领域」「当前困难」以及「哪些事情能让他稍微缓一缓」（来自 onboarding 支持设定，可为空）。",
          "如果用户还提供了「当前状态」（情绪/身体/空间），请温和地参考，但不要逐字复述。",
          "有时用户还会补充一小句话说明这次想要的感觉（suggestionLine），例如「想更轻一点」「不要和出门有关」「想要更像晚上能做的事」等，请温和地参考，不要生硬复述。",
          "请生成恰好 3 个中文候选行动，每个都必须是：非常小的一步、低压力、容易开始。",
          "禁止：命令口吻、打卡或考核感、效率工具话术、宏大计划、列表外的第 4 条。",
          "每条应像「今天可以试试的一小步」，简短（建议不超过 40 字）。",
          "只输出 JSON：一个包含 3 个字符串的数组，不要 markdown、不要解释、不要编号前缀。",
          '示例：["……","……","……"]',
        ].join("\n");

  const userLines: string[] =
    locale === "en"
      ? [
          `Recovery area: ${params.recoveryDomain.trim()}`,
          `Current difficulty: ${params.difficultyNote.trim()}`,
        ]
      : [
          `恢复领域：${params.recoveryDomain.trim()}`,
          `当前困难：${params.difficultyNote.trim()}`,
        ];

  if (likedActivities) {
    userLines.push(
      locale === "en"
        ? `Activities that help the user feel a bit calmer (from onboarding, reference only): ${likedActivities}`
        : `能让用户稍微缓一缓的活动（来自 onboarding，仅供参考）：${likedActivities}`,
    );
  }

  if (suggestionLine) userLines.push(suggestionLine);

  if (currentStateBlock) {
    userLines.push(
      locale === "en"
        ? `Current state (gentle reference): ${currentStateBlock}`
        : `当前状态（温和参考）：${currentStateBlock}`,
    );
  }

  const user = userLines.join("\n");

  const client = createOpenAIClient({
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL?.trim() || undefined,
  });

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.65,
    max_tokens: 512,
  });

  const raw = completion.choices?.[0]?.message?.content?.trim();
  if (!raw) {
    throw new Error("Doubao returned empty reply");
  }

  // Try to locate a JSON array in the reply as robustly as possible
  const tryParseArray = (text: string): string[] | null => {
    let candidateText = text;

    // 1) Prefer fenced code block content if present
    const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence?.[1]) {
      candidateText = fence[1].trim();
    }

    // 2) If still not JSON, try to extract the first [...] block
    if (!candidateText.trim().startsWith("[")) {
      const bracketMatch = text.match(/\[[\s\S]*\]/);
      if (bracketMatch) {
        candidateText = bracketMatch[0];
      }
    }

    try {
      const parsed = JSON.parse(candidateText);
      if (!Array.isArray(parsed)) return null;
      return parsed.map((item) => {
        const s = typeof item === "string" ? item.trim() : String(item).trim();
        return s;
      });
    } catch {
      return null;
    }
  };

  let list = tryParseArray(raw);

  // 3) Fallback: treat each non-empty line as a candidate
  if (!list) {
    const lines = raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) =>
        // strip common bullet / numbering prefixes
        line.replace(/^[-*]\s+/, "").replace(/^\d+[.)]\s+/, "").trim(),
      );
    if (lines.length >= 3) {
      list = lines;
    }
  }

  if (!list || list.length < 3) {
    throw new Error(
      locale === "en"
        ? "Unexpected model format. Please try again."
        : "模型返回格式不太对，请再试一次",
    );
  }

  const three = list.slice(0, 3).map((s) => s.trim());
  if (three.some((s) => !s)) {
    throw new Error(
      locale === "en"
        ? "Generated steps contained empty content. Please try again."
        : "生成的小步里有空内容，请再试一次",
    );
  }

  return [three[0], three[1], three[2]];
}

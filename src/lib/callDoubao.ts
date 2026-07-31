import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

import type { Locale } from "./i18n/types";
import { createOpenAIClient } from "./openaiClient";

export type DoubaoGenerationMode =
  | "normal"
  | "proactive_opening"
  | "feedback_revision";

export type DoubaoGenerationContext = {
  systemPrompt: string;
  panelFeedbackNotes: string[];
  explicitFeedbackNotes: string[];
  chatHistory: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  currentState: {
    emotional?: string | null;
    physical?: string | null;
    spatial?: string | null;
  } | null;
  latestUserMessage: string;
  /** 无新用户聊天文字（如仅提交反馈面板）：与主聊天同一套 messages，仅末条 user 提示不同。 */
  noNewUserMessage?: boolean;
  generationMode?: DoubaoGenerationMode;
  /** 可选补充块（如近期日记/日常恢复摘要），注入末条 user 提示前 */
  supplementaryContext?: string;
  llmOverrides?: { maxTokens?: number; temperature?: number };
  locale?: Locale;
};

export type DoubaoChatOutcome = {
  reply: string;
};

function formatNonEmpty(parts: Array<string | undefined | null>): string {
  return parts.map((p) => (p ?? "").trim()).filter(Boolean).join("；");
}

/** 保留完整正文，只做轻量空白与换行规范化，避免“只取第一段”导致回复被截断。 */
function normalizeReplyText(text: string): string {
  let s = text.replace(/\r\n/g, "\n").trim();
  if (!s) return s;
  s = s
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trimEnd())
    .join("\n");
  return s.replace(/\n{4,}/g, "\n\n\n").trim();
}

function extractJsonPayload(text: string): string | null {
  const trimmed = text.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  return trimmed.slice(start, end + 1);
}

function parseDoubaoJsonPayload(raw: string): DoubaoChatOutcome | null {
  const extracted = extractJsonPayload(raw);
  const payload = extracted ?? raw.trim();
  try {
    const obj = JSON.parse(payload) as Record<string, unknown>;
    const replyRaw = obj.reply;
    if (typeof replyRaw !== "string" || !replyRaw.trim()) {
      return null;
    }
    return {
      reply: normalizeReplyText(replyRaw),
    };
  } catch {
    return null;
  }
}

//function validateDoubaoEnv(): { apiKey: string; baseURL: string; modelName: string } {
//  const apiKey = process.env.ARK_API_KEY;
//  const baseURL = process.env.ARK_BASE_URL;
//  const model = process.env.ARK_MODEL;

//  const missing: string[] = [];
//  if (!apiKey) missing.push("ARK_API_KEY");
//  if (!baseURL) missing.push("ARK_BASE_URL");
//  if (!model) missing.push("ARK_MODEL");
//  if (missing.length > 0) {
//    throw new Error(`Missing env vars: ${missing.join(", ")}`);
//  }

//  return {
//    apiKey: apiKey!,
//    baseURL: baseURL!,
//   modelName: model!,
//  };
//}

function validateOpenAIEnv(): { apiKey: string; modelName: string } {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;

  const missing: string[] = [];

  if (!apiKey) missing.push("OPENAI_API_KEY");
  if (!model) missing.push("OPENAI_MODEL");

  if (missing.length > 0) {
    throw new Error(`Missing env vars: ${missing.join(", ")}`);
  }

  return {
    apiKey: apiKey!,
    modelName: model!,
  };
}

function buildDoubaoMessages(context: DoubaoGenerationContext): ChatCompletionMessageParam[] {
  const locale = context.locale ?? "zh";
  const state = context.currentState;
  const stateText = state
    ? formatNonEmpty([
        state.emotional
          ? locale === "en"
            ? `Emotional: ${state.emotional}`
            : `情绪：${state.emotional}`
          : null,
        state.physical
          ? locale === "en"
            ? `Physical: ${state.physical}`
            : `身体：${state.physical}`
          : null,
        state.spatial
          ? locale === "en"
            ? `Location: ${state.spatial}`
            : `空间：${state.spatial}`
          : null,
      ])
    : "";

  const explicitNotesText = context.explicitFeedbackNotes
    .map((note) => note.trim())
    .filter(Boolean)
    .join("\n- ");
  const panelNotesText = context.panelFeedbackNotes
    .map((note) => note.trim())
    .filter(Boolean)
    .join("\n- ");

  const feedbackNotesText = [explicitNotesText, panelNotesText]
    .map((text) => text?.trim())
    .filter(Boolean)
    .join("\n- ");

  const mode = context.generationMode ?? "normal";

  const closingUserLine =
    mode === "proactive_opening"
      ? locale === "en"
        ? [
            "【Generation type】proactive_opening (user just opened chat; system requests a proactive opening).",
            "This is not a normal follow-up chat or feedback revision. The user has not sent new text.",
            "Write 1–3 sentences in English, light and low-pressure. No pushing, no asking them to recount scam details, no mechanical lines like \"I noticed you haven't been here.\"",
            "You may warmly acknowledge their return; a little curiosity is fine, but don't sound like a push notification.",
            "Output format must still follow the JSON / reply rules in the system prompt.",
          ].join("\n")
        : [
          "【本次生成类型】proactive_opening（用户刚打开聊天页，系统请求一条「主动开场」）。",
          "这不是普通追问式聊天，也不是反馈修订任务。用户此刻没有发送新文字。",
          "请写 1～3 句中文，语气轻、低压力，不要催促，不要要求用户复盘诈骗细节，不要用「检测到你很久没来」等机械句式。",
          "可以轻轻接住用户回来；可带一点温暖的好奇或小话题，但不要像推送通知。",
          "输出格式仍须遵守系统提示中的 JSON / 回复规范（与日常 support 一致）。",
        ].join("\n")
      : context.noNewUserMessage
        ? locale === "en"
          ? "The user did not send new chat text. Based on conversation history, current state (if any), and recent feedback notes, generate a new assistant reply."
          : "本次用户未发送新的聊天文字。请根据对话上文、用户当前状态（如有）与近期用户反馈 notes，生成一条新的助手回复。"
        : locale === "en"
          ? `The user just said: ${context.latestUserMessage.trim()}`
          : `用户刚刚说的话：${context.latestUserMessage.trim()}`;

  const supplementary =
    typeof context.supplementaryContext === "string" &&
    context.supplementaryContext.trim()
      ? [
          locale === "en"
            ? "【Recent activity summary (reference only; don't recite line by line)】"
            : "【近期活动摘要（仅供参考，不要逐条复述）】",
          context.supplementaryContext.trim(),
        ].join("\n")
      : "";

  const isNormalChat = !context.noNewUserMessage && mode !== "proactive_opening";

  const prompt = [
    locale === "en"
      ? "Generate a reply based on the following."
      : "请基于以下信息生成回复。",
    isNormalChat
      ? locale === "en"
        ? "Prioritize what the user just said. Other info is supporting context — don't drift away from their current message just to use it."
        : "请优先回应用户刚刚说的话。其他信息是作为辅助参考，不要为了使用这些信息而偏离用户当前这句话。"
      : "",
    supplementary,
    feedbackNotesText
      ? locale === "en"
        ? [
            "Recent user feedback notes:",
            `- ${feedbackNotesText}`,
            "These notes constrain how you respond. If notes conflict, prefer newer, more specific feedback. Don't repeat the notes verbatim.",
          ].join("\n")
        : [
          "近期用户反馈 notes：",
          `- ${feedbackNotesText}`,
          "这些 notes 是对回应方式的约束。若 notes 之间冲突，优先更新、更具体的反馈。不要复述 notes。",
        ].join("\n")
      : "",
    stateText
      ? locale === "en"
        ? [
            `User current state: ${stateText}`,
            "State is only reference for their situation. Don't mechanically repeat it.",
          ].join("\n")
        : [
          `用户当前状态：${stateText}`,
          "状态仅作为理解用户当下处境的参考。不要机械复述。",
        ].join("\n")
      : "",
    closingUserLine,
    locale === "en" ? "Reply in English." : "请用中文回复。",
  ]
    .filter(Boolean)
    .join("\n");

  return [
    { role: "system", content: context.systemPrompt },
    ...context.chatHistory.map(
      (m): ChatCompletionMessageParam => ({
        role: m.role,
        content: m.content,
      }),
    ),
    { role: "user", content: prompt },
  ];
}

/**
 * Parses a full model completion string (non-streaming or buffered stream) into a
 * structured `reply` (JSON payload vs plain text). Use for `callDoubao`, tests,
 * suggested-action helpers, logging — not for persisting the live SSE body: the
 * streamed assistant text shown to the user is the concatenation of deltas and
 * should be stored as-is.
 */
export function normalizeDoubaoStreamedReply(replyBlock: string): DoubaoChatOutcome {
  const trimmed = replyBlock.trim();
  if (!trimmed) {
    throw new Error("Doubao returned empty reply");
  }

  const parsed = parseDoubaoJsonPayload(trimmed);
  if (parsed) {
    return parsed;
  }

  console.warn("callDoubao: JSON parse failed, falling back to plain text only");
  return {
    reply: normalizeReplyText(trimmed),
  };
}

export async function callDoubao(
  context: DoubaoGenerationContext,
): Promise<DoubaoChatOutcome> {
  //const { apiKey, baseURL, modelName } = validateDoubaoEnv();
  const { apiKey, modelName } = validateOpenAIEnv();
  const messages = buildDoubaoMessages(context);

  const client = createOpenAIClient({
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL?.trim() || undefined,
  });

  const maxTokens = context.llmOverrides?.maxTokens ?? 384;
  const temperature = context.llmOverrides?.temperature ?? 0.4;

  const completion = await client.chat.completions.create({
    model: modelName,
    messages,
    temperature,
    max_tokens: maxTokens,
  });

  const replyBlock = completion.choices?.[0]?.message?.content?.trim();
  if (!replyBlock) {
    throw new Error("Doubao returned empty reply");
  }

  return normalizeDoubaoStreamedReply(replyBlock);
}

export async function createDoubaoStream(context: DoubaoGenerationContext) {
  //const { apiKey, baseURL, modelName } = validateDoubaoEnv();
  const { apiKey, modelName } = validateOpenAIEnv();
  const messages = buildDoubaoMessages(context);

  const client = createOpenAIClient({
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL?.trim() || undefined,
  });

  const maxTokens = context.llmOverrides?.maxTokens ?? 384;
  const temperature = context.llmOverrides?.temperature ?? 0.4;

  return client.chat.completions.create({
    model: modelName,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: true,
  });
}

import type { Locale } from "./i18n/types";
import {
  createOpenAIClient,
  getOpenAIChatModel,
  requireOpenAIApiKey,
} from "./openaiClient";

type ProgressLetterContext = {
  periodStart: string;
  periodEnd: string;
  counts: {
    checkin: number;
    tinyStepDone: number;
    tinyStepPartial: number;
    diary: number;
  };
  recentCheckins: Array<{
    emotional: string | null;
    physical: string | null;
    spatial: string | null;
    createdAt: string;
  }>;
  recentTinySteps: Array<{
    taskText: string | null;
    recoveryDomain: string;
    status: "done" | "partial" | "skipped";
    createdAt: string;
  }>;
  recentDiaryEntries: Array<{
    content: string;
    createdAt: string;
  }>;
};

export type ProgressLetterResult = {
  title: string;
  body: string;
};

function safeTrim(text: string, maxChars: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) return trimmed;
  return `${trimmed.slice(0, maxChars - 1).trim()}…`;
}

function fallbackLetter(
  context: ProgressLetterContext,
  locale: Locale,
): ProgressLetterResult {
  const hasDiary = context.counts.diary > 0;
  const hasSteps = context.counts.tinyStepDone + context.counts.tinyStepPartial > 0;
  const hasCheckin = context.counts.checkin > 0;

  if (locale === "en") {
    const paragraphs: string[] = [];
    paragraphs.push("Dear you,");

    if (hasCheckin) {
      paragraphs.push(
        "Lately you've been willing to turn a little attention back toward yourself. Sometimes just naming how you are right now is already a lot.",
      );
    }
    if (hasSteps) {
      paragraphs.push(
        "You've also done some small things that count. They don't need to be dramatic — just moving the day forward a little is enough.",
      );
    }
    if (hasDiary) {
      paragraphs.push(
        "You wrote down some fragments of what you're carrying. You didn't rush to push them away; you gave them a quiet place to rest.",
      );
    }
    if (!hasCheckin && !hasSteps && !hasDiary) {
      paragraphs.push(
        "Even if this stretch felt thin, you still paused and stayed with yourself for a moment. That is care too.",
      );
    }

    paragraphs.push(
      "If you're tired today, you don't need to prove anything. Leave the next step for when you're ready.",
    );
    paragraphs.push("Little Butterfly is here, walking with you as life slowly comes back into your hands.");

    return {
      title: "To you, in this stretch of time",
      body: paragraphs.join("\n\n"),
    };
  }

  const paragraphs: string[] = [];
  paragraphs.push("亲爱的你：");

  if (hasCheckin) {
    paragraphs.push("这段时间，你愿意把注意力放回自己身上。有些时候，只是把当下说出来，就已经很不容易了。");
  }
  if (hasSteps) {
    paragraphs.push("你也做过一些很小、但确实算数的事。它们不需要轰轰烈烈，只要你愿意继续，把一天往前挪一点点就好。");
  }
  if (hasDiary) {
    paragraphs.push("你把心里的片段写了下来。你没有急着把它们放走，而是给了它们一个安静停留的地方。");
  }
  if (!hasCheckin && !hasSteps && !hasDiary) {
    paragraphs.push("就算这周看起来什么都不多，你仍然能停下来，和自己待一会儿。那也是一种照顾。");
  }

  paragraphs.push("如果今天的你有点疲惫，也别急着证明什么。把下一步留到你愿意的时候，再慢慢来。");
  paragraphs.push("小蝴蝶会在这儿，陪你把生活一点点接回自己手里。");

  return {
    title: "给这段时间的你",
    body: paragraphs.join("\n\n"),
  };
}

export async function callProgressLetterLLM(
  context: ProgressLetterContext,
  locale: Locale = "zh",
): Promise<ProgressLetterResult> {
  let apiKey: string;
  let model: string;
  try {
    apiKey = requireOpenAIApiKey();
    model = getOpenAIChatModel();
  } catch {
    return fallbackLetter(context, locale);
  }

  const client = createOpenAIClient({
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL?.trim() || undefined,
  });

  const prompt =
    locale === "en"
      ? [
          "You will receive recovery-related context from the past ~3 days. Write it as a warm English letter, like handwriting.",
          'Structure: greeting (e.g. "Dear you,"); 1–3 body paragraphs; sign-off ("Little Butterfly").',
          "Focus: acknowledge small actions the user took (check-ins, daily recovery, diary). Numbers/structure are background only — not a report or review.",
          "Tone: no lecturing, no official voice, no exaggerated praise, no performance metrics. Natural empathy.",
          "Forbidden: invent details; write a summary/report/lesson; mechanically list metrics.",
          "Allowed: naturally mention specific fragments from the given context (must come from the input).",
          'Output must be JSON: {"title":"...","body":"..."}.',
          "title 8–18 words; body 120–1500 characters; use \\n or \\n\\n for paragraph breaks.",
          "",
          JSON.stringify(context),
        ].join("\n")
      : [
          "你将收到一段近3天的恢复相关上下文。请把它写成一封温暖的中文信，像手写的那种。",
          "结构要求：信件的格式，先一句称呼（如“亲爱的你”：）；正文 1-3 段；结尾有落款（“小蝴蝶”）",
          "内容重点：看见与承认用户做过的“小动作”（比如来自状态、日常恢复、日记），数字以及结构信息只是背景，不要写成报告或复盘。",
          "语气要求：不说教、不官方、不夸张赞美、不绩效口吻，保持自然共情。",
          "禁止：虚构细节；把它写成总结/复盘/教学；机械罗列指标。",
          "允许：可以自然地提到上下文中的具体片段（必须来自给定内容）。",
          '输出必须是 JSON：{"title":"...","body":"..."}。',
          "title 8-18字；body 120-1500字；正文里允许用换行来分段（用\\n或\\n\\n）。",
          "",
          JSON.stringify(context),
        ].join("\n");

  try {
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.45,
      max_tokens: 400,
      messages: [
        {
          role: "system",
          content:
            locale === "en"
              ? "You write heartfelt letters, not reports. Write a gentle letter to the user in English."
              : "你是一个把心意写成信的人。你写的不是报告，而是一封给用户的温柔书信。",
        },
        { role: "user", content: prompt },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content?.trim();
    if (!raw) return fallbackLetter(context, locale);

    const parsed = JSON.parse(raw) as Partial<ProgressLetterResult>;
    const title = safeTrim(String(parsed.title ?? ""), 30);
    const body = safeTrim(String(parsed.body ?? ""), 1000);
    if (!title || !body) return fallbackLetter(context, locale);
    return { title, body };
  } catch {
    return fallbackLetter(context, locale);
  }
}

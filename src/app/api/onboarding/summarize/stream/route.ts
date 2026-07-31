import { getQuestionById } from "@/lib/onboardingFlow";
import { streamCallOnboardingSummary } from "@/lib/callOnboardingSummary";
import { parseLocale, parseLocaleFromRequest } from "@/lib/i18n/server";

const encoder = new TextEncoder();

function encodeSse(event: string, data: unknown) {
  return encoder.encode(
    `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
  );
}

export async function POST(request: Request) {
  const headerLocale = parseLocaleFromRequest(request);
  try {
    const body = (await request.json()) as {
      questionId?: string;
      userAnswer?: string;
      previousChatSummary?: string;
      locale?: string;
    };

    const locale = parseLocale(body.locale ?? headerLocale);
    const questionId =
      typeof body.questionId === "string" ? body.questionId.trim() : "";
    const userAnswer =
      typeof body.userAnswer === "string" ? body.userAnswer : "";
    const previousChatSummary =
      typeof body.previousChatSummary === "string" &&
      body.previousChatSummary.trim()
        ? body.previousChatSummary.trim()
        : undefined;

    if (!questionId || !getQuestionById(questionId, locale)) {
      return Response.json(
        { ok: false, error: "Invalid questionId" },
        { status: 400 },
      );
    }

    const stream = new ReadableStream({
      async start(controller) {
        const enqueue = (event: string, data: unknown) => {
          controller.enqueue(encodeSse(event, data));
        };
        try {
          const result = await streamCallOnboardingSummary(
            {
              questionId,
              userAnswer,
              previousChatSummary,
              locale,
            },
            {
              onSummaryDelta: (delta) => {
                enqueue("delta", { text: delta });
              },
            },
          );
          enqueue("done", {
            chatSummary: result.chatSummary,
            bullets: result.bullets,
            ...(result.proactivePreference
              ? { proactivePreference: result.proactivePreference }
              : {}),
          });
        } catch (e) {
          console.error("onboarding summarize stream error:", e);
          enqueue("error", {
            message:
              locale === "en"
                ? "Summary failed. Please try again later."
                : "整理失败，请稍后再试",
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    console.error("onboarding summarize stream route error:", e);
    return Response.json(
      { ok: false, error: "Bad request" },
      { status: 400 },
    );
  }
}

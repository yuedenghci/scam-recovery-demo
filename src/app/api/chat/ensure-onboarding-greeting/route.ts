import { getCurrentUserId } from "@/lib/auth";
import { getMessages } from "@/lib/i18n/messages";
import { apiMessage, parseLocale, parseLocaleFromRequest } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";

/**
 * 在用户已完成 onboarding 且尚无聊天消息时，写入一条 onboarding 初始开场（持久化）。
 * 若已有任意消息或已有 onboarding_greeting，则跳过。
 */
export async function POST(request: Request) {
  const locale = parseLocaleFromRequest(request);
  try {
    let bodyLocale: string | undefined;
    try {
      const body = (await request.json()) as { locale?: string };
      bodyLocale = body.locale;
    } catch {
      bodyLocale = undefined;
    }
    const greetingLocale = parseLocale(bodyLocale ?? locale);
    const greetingText = getMessages(greetingLocale).chat.greeting;

    const userId = await getCurrentUserId();
    if (!userId) {
      return Response.json(
        { ok: false, error: apiMessage(locale, "notLoggedIn") },
        { status: 401 },
      );
    }

    const draft = await prisma.onboardingDraft.findUnique({
      where: { userId },
    });
    if (!draft?.isCompleted) {
      return Response.json({
        ok: true,
        created: false,
        reason: "not_completed",
      });
    }

    const existingGreeting = await prisma.message.findFirst({
      where: { userId, role: "assistant", mode: "onboarding_greeting" },
    });
    if (existingGreeting) {
      return Response.json({
        ok: true,
        created: false,
        message: {
          id: existingGreeting.id,
          role: "assistant",
          text: existingGreeting.content,
        },
      });
    }

    const totalMessages = await prisma.message.count({ where: { userId } });
    if (totalMessages > 0) {
      return Response.json({
        ok: true,
        created: false,
        reason: "legacy_has_messages",
      });
    }

    const row = await prisma.message.create({
      data: {
        userId,
        role: "assistant",
        content: greetingText,
        mode: "onboarding_greeting",
      },
    });

    return Response.json({
      ok: true,
      created: true,
      message: {
        id: row.id,
        role: "assistant",
        text: row.content,
      },
    });
  } catch (e) {
    console.error("ensure-onboarding-greeting:", e);
    return Response.json(
      {
        ok: false,
        error: "Failed to ensure onboarding greeting",
        details: e instanceof Error ? e.message : "Unknown",
      },
      { status: 500 },
    );
  }
}

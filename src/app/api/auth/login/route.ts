import { prisma } from "@/lib/prisma";
import { setLoginSession, verifyPassword } from "@/lib/auth";
import { apiMessage, parseLocaleFromRequest } from "@/lib/i18n/server";

function asString(value: unknown): string {
  if (typeof value === "string") return value;
  if (value == null) return "";
  return String(value);
}

export async function POST(request: Request) {
  const locale = parseLocaleFromRequest(request);
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const username = asString(body.username).trim();
    const password = asString(body.password);

    if (!username || !password) {
      return Response.json(
        { ok: false, error: apiMessage(locale, "loginMissing") },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true, passwordHash: true },
    });

    if (!user || !user.passwordHash) {
      return Response.json(
        { ok: false, error: apiMessage(locale, "loginInvalid") },
        { status: 400 },
      );
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return Response.json(
        { ok: false, error: apiMessage(locale, "loginInvalid") },
        { status: 400 },
      );
    }

    await setLoginSession(user.id);

    return Response.json({
      ok: true,
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (error) {
    console.error("login POST:", error);
    return Response.json(
      {
        ok: false,
        error: apiMessage(locale, "loginFail"),
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}


import { prisma } from "@/lib/prisma";
import { hashPassword, setLoginSession } from "@/lib/auth";
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
    const gender = asString(body.gender).trim();
    const age = asString(body.age).trim();
    const education = asString(body.education).trim();
    const jobType = asString(body.jobType).trim();
    const scammedAmount = asString(body.scammedAmount).trim();
    const scamWhen = asString(body.scamWhen).trim();
    const scamType = asString(body.scamType).trim();

    if (!username) {
      return Response.json({ ok: false, error: apiMessage(locale, "registerUsernameEmpty") }, { status: 400 });
    }
    if (!password) {
      return Response.json({ ok: false, error: apiMessage(locale, "registerPasswordEmpty") }, { status: 400 });
    }
    if (!gender || !age || !education || !jobType || !scammedAmount || !scamWhen || !scamType) {
      return Response.json(
        { ok: false, error: apiMessage(locale, "registerIncomplete") },
        { status: 400 },
      );
    }

    const existing = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (existing) {
      return Response.json({ ok: false, error: apiMessage(locale, "registerUsernameTaken") }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        gender,
        age,
        education,
        jobType,
        scammedAmount,
        scamWhen,
        scamType,
      },
      select: { id: true, username: true },
    });

    await setLoginSession(user.id);

    return Response.json({
      ok: true,
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (error) {
    console.error("register POST:", error);
    return Response.json(
      {
        ok: false,
        error: apiMessage(locale, "registerFail"),
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}


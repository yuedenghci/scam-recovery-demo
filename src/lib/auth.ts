import { cookies } from "next/headers";
import crypto from "crypto";

import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE_NAME = "sr_user_id";

const ONE_MONTH_IN_SECONDS = 60 * 60 * 24 * 30;

const SESSION_COOKIE_BASE = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: false,
  path: "/",
};

export async function getCurrentUserId(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE_NAME)?.value;
  if (!raw) return null;

  // Cookie may be stale after DB reset / different environment — verify FK target exists.
  const user = await prisma.user.findUnique({
    where: { id: raw },
    select: { id: true },
  });
  if (!user) {
    // Match set() options so the browser actually drops the cookie.
    // May no-op in Server Components; Route Handlers can clear it.
    try {
      store.set(SESSION_COOKIE_NAME, "", { ...SESSION_COOKIE_BASE, maxAge: 0 });
    } catch {
      // ignore
    }
    return null;
  }
  return user.id;
}

export async function setLoginSession(userId: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, userId, {
    ...SESSION_COOKIE_BASE,
    maxAge: ONE_MONTH_IN_SECONDS,
  });
}

export async function clearLoginSession(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, "", { ...SESSION_COOKIE_BASE, maxAge: 0 });
}

const SCRYPT_KEYLEN = 64;
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;

export async function hashPassword(plain: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");

  const derivedKey = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(
      plain,
      salt,
      SCRYPT_KEYLEN,
      { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P },
      (err, key) => {
        if (err) reject(err);
        else resolve(key as Buffer);
      },
    );
  });

  const hash = derivedKey.toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, hash] = parts;

  const derivedKey = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(
      plain,
      salt,
      SCRYPT_KEYLEN,
      { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P },
      (err, key) => {
        if (err) reject(err);
        else resolve(key as Buffer);
      },
    );
  });

  const computed = derivedKey.toString("hex");
  return crypto.timingSafeEqual(Buffer.from(computed, "hex"), Buffer.from(hash, "hex"));
}


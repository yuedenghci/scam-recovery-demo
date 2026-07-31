"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useLocale } from "@/components/i18n/LocaleProvider";
import { localeFetch } from "@/lib/i18n/localeFetch";

export default function LoginPage() {
  const router = useRouter();
  const { locale, t } = useLocale();
  const [mounted, setMounted] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await localeFetch(locale, "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setError(data.error ?? t.auth.login.fail);
        return;
      }

      try {
        const obRes = await localeFetch(locale, "/api/onboarding", {
          method: "GET",
        });
        if (obRes.ok) {
          const obData = (await obRes.json().catch(() => ({}))) as {
            ok?: boolean;
            draft?: { isCompleted?: boolean } | null;
          };
          const completed = !!obData?.draft?.isCompleted;
          router.push(completed ? "/chat" : "/onboarding");
          return;
        }
      } catch {
        // ignore
      }

      router.push("/chat");
    } catch {
      setError(t.auth.login.networkFail);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-dvh flex-col justify-center bg-[#f7f4ef] px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1.75rem,env(safe-area-inset-top))] sm:py-10">
      <div className="mx-auto max-w-md rounded-2xl bg-white/95 p-6 shadow-sm border border-stone-200/70">
        <h1 className="mb-2 text-xl font-semibold text-stone-900">
          {t.auth.login.title}
        </h1>
        <p className="mb-6 text-sm text-stone-600">{t.auth.login.subtitle}</p>

        <form
          className="space-y-4"
          method="post"
          //inert={!mounted}
          onSubmit={handleSubmit}
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-800">
              {t.auth.login.username}
            </label>
            <input
              className="w-full rounded-lg border border-stone-300 px-3 py-3 text-base outline-none focus:border-stone-500 focus:ring-2 focus:ring-stone-200 sm:py-2 sm:text-sm"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-stone-800">
              {t.auth.login.password}
            </label>
            <input
              type="password"
              className="w-full rounded-lg border border-stone-300 px-3 py-3 text-base outline-none focus:border-stone-500 focus:ring-2 focus:ring-stone-200 sm:py-2 sm:text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error ? (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 min-h-[48px] w-full rounded-xl bg-stone-800 py-3 text-sm font-medium text-stone-50 shadow-sm transition-colors hover:bg-stone-900 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-0 sm:py-2.5"
          >
            {submitting ? t.auth.login.submitting : t.auth.login.submit}
          </button>

          <button
            type="button"
            onClick={() => router.push("/register")}
            className="w-full text-center text-xs text-stone-500 hover:text-stone-700"
          >
            {t.auth.login.goRegister}
          </button>
        </form>
      </div>
    </main>
  );
}

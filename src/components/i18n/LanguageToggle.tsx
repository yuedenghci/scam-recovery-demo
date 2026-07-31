"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";

export function LanguageToggle({ className = "" }: { className?: string }) {
  const { locale, setLocale, t } = useLocale();
  const next = locale === "zh" ? "en" : "zh";
  const label = locale === "zh" ? t.lang.switchToEn : t.lang.switchToZh;

  return (
    <button
      type="button"
      onClick={() => setLocale(next)}
      aria-label={t.lang.ariaLabel}
      className={`rounded-full border border-stone-300/70 bg-white/90 px-2.5 py-1 text-xs font-medium text-stone-600 shadow-sm transition-colors hover:border-stone-400 hover:bg-stone-50 hover:text-stone-800 ${className}`}
    >
      {label}
    </button>
  );
}

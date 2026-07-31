"use client";

import type { ReactNode } from "react";

import { MountedLanguageToggle } from "@/components/i18n/MountedLanguageToggle";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <div className="pointer-events-none fixed right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-[300]">
        <div className="pointer-events-auto">
          <MountedLanguageToggle />
        </div>
      </div>
      {children}
    </LocaleProvider>
  );
}

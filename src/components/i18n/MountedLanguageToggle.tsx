"use client";

import { useEffect, useState } from "react";

import { LanguageToggle } from "@/components/i18n/LanguageToggle";

/** Avoid hydration mismatch: only render after client mount. */
export function MountedLanguageToggle() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <LanguageToggle />;
}

"use client";

import { useT } from "@/lib/i18n/client";

/** Skip-to-content link — the first focusable thing on every dashboard (T60). */
export function SkipLink() {
  const t = useT();
  return (
    <a href="#main" className="skip-link">
      {t("a11y.skipToContent")}
    </a>
  );
}

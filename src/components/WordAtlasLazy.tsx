"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type ReactNode } from "react";
import type { Locale } from "@/lib/locale";

/**
 * Code-split the canvas atlas off the first homepage JS. A sized stage keeps
 * layout stable while the chunk loads (see `.atlas-stage--loading` in CSS).
 *
 * The import itself waits for an idle slot after mount so settle()+first draw
 * do not stack on top of React hydration inside the mobile TBT window.
 */
const WordAtlasDynamic = dynamic(
  () => import("@/components/WordAtlas").then((mod) => mod.WordAtlas),
  {
    loading: () => <div className="atlas-stage atlas-stage--loading" aria-hidden="true" />,
  },
);

function LoadingStage() {
  return <div className="atlas-stage atlas-stage--loading" aria-hidden="true" />;
}

export function WordAtlasLazy({
  locale,
  variant = "embed",
  overlay,
}: {
  locale: Locale;
  variant?: "embed" | "hero";
  overlay?: ReactNode;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let idleId = 0;
    let timeoutId = 0;

    const start = () => {
      if (!cancelled) setReady(true);
    };

    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(start, { timeout: 2500 });
    } else {
      timeoutId = window.setTimeout(start, 1);
    }

    return () => {
      cancelled = true;
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idleId);
      window.clearTimeout(timeoutId);
    };
  }, []);

  if (!ready) return <LoadingStage />;
  return <WordAtlasDynamic locale={locale} variant={variant} overlay={overlay} />;
}

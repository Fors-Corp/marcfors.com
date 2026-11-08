"use client";

import { useEffect, useId, useState } from "react";
import { usePathname } from "next/navigation";

import {
  PortfolioAsk,
  type PortfolioAskStrings,
} from "@/components/PortfolioAsk";
import type { Locale } from "@/lib/locale";

const STORAGE_KEY = "marcfors-ask-widget-open";

/** Gap between the layout viewport and the visible viewport (iOS toolbar). */
export function askVisualBottomGap(
  layoutHeight: number,
  visual: { height: number; offsetTop: number },
): number {
  return Math.max(0, Math.round(layoutHeight - visual.height - visual.offsetTop));
}

function syncVisualBottomGap(): void {
  const visual = window.visualViewport;
  const gap = visual
    ? askVisualBottomGap(window.innerHeight, visual)
    : 0;
  document.documentElement.style.setProperty("--ask-vv-bottom", `${gap}px`);
}

export type AskChatWidgetStrings = PortfolioAskStrings & {
  open: string;
  close: string;
  launcher: string;
};

function readOpenDefault(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (stored === "0") return false;
    if (stored === "1") return true;
  } catch {
    // sessionStorage can throw in private mode — stay open by default.
  }
  return true;
}

export function AskChatWidget({
  strings,
  locale = "en",
}: {
  strings: AskChatWidgetStrings;
  locale?: Locale;
}) {
  const panelId = useId();
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setOpen(readOpenDefault());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, open ? "1" : "0");
    } catch {
      // ignore
    }
  }, [hydrated, open]);

  useEffect(() => {
    syncVisualBottomGap();
    const visual = window.visualViewport;
    visual?.addEventListener("resize", syncVisualBottomGap);
    visual?.addEventListener("scroll", syncVisualBottomGap);
    window.addEventListener("resize", syncVisualBottomGap);
    return () => {
      visual?.removeEventListener("resize", syncVisualBottomGap);
      visual?.removeEventListener("scroll", syncVisualBottomGap);
      window.removeEventListener("resize", syncVisualBottomGap);
      document.documentElement.style.removeProperty("--ask-vv-bottom");
    };
  }, []);

  // Full /ask page already hosts the chat — skip the floating duplicate.
  if (pathname?.endsWith("/ask")) {
    return null;
  }

  return (
    <div className={`ask-fab${open ? " ask-fab-open" : ""}`}>
      <section
        id={panelId}
        className="ask-fab-panel"
        aria-label={strings.title}
        hidden={!open}
      >
        <header className="ask-fab-chrome">
          <p className="ask-fab-label">{strings.launcher}</p>
          <button
            type="button"
            className="ask-fab-close"
            aria-controls={panelId}
            aria-expanded={open}
            onClick={() => setOpen(false)}
          >
            {strings.close}
          </button>
        </header>
        <PortfolioAsk
          strings={strings}
          variant="widget"
          locale={locale}
          onSourceNavigate={() => setOpen(false)}
        />
      </section>
      {open ? null : (
        <button
          type="button"
          className="ask-fab-launcher"
          aria-controls={panelId}
          aria-expanded="false"
          onClick={() => setOpen(true)}
        >
          {strings.open}
        </button>
      )}
    </div>
  );
}

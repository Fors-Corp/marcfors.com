"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useSyncExternalStore,
} from "react";
import { usePathname } from "next/navigation";

import {
  PortfolioAsk,
  type PortfolioAskStrings,
} from "@/components/PortfolioAsk";
import { askFabViewportInsets } from "@/lib/askFabViewport";
import type { Locale } from "@/lib/locale";

const STORAGE_KEY = "marcfors-ask-widget-open";

export type AskChatWidgetStrings = PortfolioAskStrings & {
  open: string;
  close: string;
  launcher: string;
};

const openListeners = new Set<() => void>();
// Used only when sessionStorage throws. A successful read always wins so tests
// can reset the preference by clearing storage.
let openFallback: boolean | null = null;

function readOpenDefault(): boolean {
  // Closed by default: the panel is a non-blocking companion, but still starts
  // shut so the first viewport stays the portfolio. sessionStorage remembers an
  // explicit open for the tab.
  if (typeof window === "undefined") return false;
  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (stored === "0") return false;
    if (stored === "1") return true;
  } catch {
    if (openFallback !== null) return openFallback;
  }
  return false;
}

function serverOpen(): boolean {
  return false;
}

function focusHashTarget() {
  const id = window.location.hash.replace(/^#/, "");
  if (!id) return;
  const el = document.getElementById(id);
  if (el instanceof HTMLElement) {
    el.focus({ preventScroll: false });
  }
}

function subscribeOpen(listener: () => void) {
  openListeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    openListeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function emitOpen() {
  for (const listener of openListeners) listener();
}

function writeOpen(next: boolean) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    openFallback = null;
  } catch {
    openFallback = next;
  }
  emitOpen();
}

function focusField(panel: HTMLElement) {
  const field = panel.querySelector<HTMLElement>(
    "input:not([disabled]), textarea:not([disabled])",
  );
  const target = field ?? panel;
  target.focus({ preventScroll: true });
}

export function AskChatWidget({
  strings,
  locale = "en",
}: {
  strings: AskChatWidgetStrings;
  locale?: Locale;
}) {
  const panelId = useId();
  const titleId = useId();
  const pathname = usePathname();
  const fabRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  // Focus moves only when the visitor opens or closes the panel, or follows a
  // source link (hash target). Passive mount stays closed so focus is untouched.
  const focusIntent = useRef<"panel" | "launcher" | "hash" | null>(null);
  const open = useSyncExternalStore(subscribeOpen, readOpenDefault, serverOpen);
  const onAskPage = pathname?.endsWith("/ask") ?? false;

  const openPanel = useCallback(() => {
    focusIntent.current = "panel";
    writeOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    focusIntent.current = "launcher";
    writeOpen(false);
  }, []);

  // Source links navigate away (or to a hash). Do not return focus to the
  // launcher — that stole focus from targets like /cv#cv-download.
  const closeForNavigation = useCallback(() => {
    focusIntent.current = "hash";
    writeOpen(false);
  }, []);

  // Keep the sheet inside the visual viewport so the composer is not trapped
  // under the iOS keyboard (layout viewport stays tall; fixed bottom UI does not).
  useEffect(() => {
    const fab = fabRef.current;
    if (!fab) return;

    const clear = () => {
      fab.style.removeProperty("--ask-vv-bottom");
      fab.style.removeProperty("--ask-vv-height");
    };

    if (!open || onAskPage) {
      clear();
      return;
    }

    const vv = window.visualViewport;
    if (!vv) return;

    const sync = () => {
      const { bottom, height } = askFabViewportInsets(vv, window.innerHeight);
      fab.style.setProperty("--ask-vv-bottom", `${bottom}px`);
      fab.style.setProperty("--ask-vv-height", `${height}px`);
    };
    sync();
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    return () => {
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      clear();
    };
  }, [onAskPage, open]);

  useEffect(() => {
    if (onAskPage) return;
    if (!open) {
      if (focusIntent.current === "launcher") {
        focusIntent.current = null;
        launcherRef.current?.focus({ preventScroll: true });
      } else if (focusIntent.current === "hash") {
        focusIntent.current = null;
        // Next.js may apply the hash after this close; retry once on the next frame.
        focusHashTarget();
        requestAnimationFrame(() => focusHashTarget());
      }
      return;
    }

    const panel = panelRef.current;
    if (panel && focusIntent.current === "panel") {
      focusIntent.current = null;
      focusField(panel);
    }

    // Escape closes the panel; Tab is free to leave so the rest of the site
    // stays usable (non-modal companion panel, not a blocking dialog).
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      event.preventDefault();
      closePanel();
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [closePanel, onAskPage, open]);

  // Full /ask page already hosts the chat — skip the floating duplicate.
  if (onAskPage) {
    return null;
  }

  return (
    <div ref={fabRef} className={`ask-fab${open ? " ask-fab-open" : ""}`}>
      <section
        ref={panelRef}
        id={panelId}
        className="ask-fab-panel"
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        tabIndex={-1}
        hidden={!open}
      >
        <header className="ask-fab-chrome">
          <p id={titleId} className="ask-fab-label">
            {strings.launcher}
          </p>
          <button type="button" className="ask-fab-close" onClick={closePanel}>
            {strings.close}
          </button>
        </header>
        <PortfolioAsk
          strings={strings}
          variant="widget"
          locale={locale}
          onSourceNavigate={closeForNavigation}
        />
      </section>
      {open ? null : (
        <button
          ref={launcherRef}
          type="button"
          className="ask-fab-launcher"
          aria-controls={panelId}
          aria-expanded="false"
          aria-haspopup="dialog"
          onClick={openPanel}
        >
          {strings.open}
        </button>
      )}
    </div>
  );
}

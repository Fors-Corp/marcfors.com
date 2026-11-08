"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import { usePathname } from "next/navigation";

import {
  PortfolioAsk,
  type PortfolioAskStrings,
} from "@/components/PortfolioAsk";
import type { Locale } from "@/lib/locale";

const STORAGE_KEY = "marcfors-ask-widget-open";

const TABBABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([type='hidden']):not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
].join(", ");

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
  if (typeof window === "undefined") return true;
  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (stored === "0") return false;
    if (stored === "1") return true;
  } catch {
    if (openFallback !== null) return openFallback;
  }
  return true;
}

function serverOpen(): boolean {
  return true;
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

function tabbableIn(panel: HTMLElement): HTMLElement[] {
  return Array.from(panel.querySelectorAll<HTMLElement>(TABBABLE)).filter((el) => {
    if (el.getAttribute("tabindex") === "-1") return false;
    const hidden = el.closest("[hidden]");
    return hidden === null || hidden === el;
  });
}

function focusField(panel: HTMLElement) {
  const field = panel.querySelector<HTMLElement>(
    "input:not([disabled]), textarea:not([disabled])",
  );
  const target = field ?? tabbableIn(panel)[0] ?? panel;
  target.focus({ preventScroll: true });
}

function setInert(element: HTMLElement, next: boolean) {
  // Content attribute, not the IDL property: jsdom does not reflect `inert`,
  // and browsers treat the attribute as the inert flag.
  element.toggleAttribute("inert", next);
}

function pageRootsBeside(host: HTMLElement): HTMLElement[] {
  const parent = host.parentElement;
  if (!parent) return [];
  return Array.from(parent.children).filter((node): node is HTMLElement => {
    return node instanceof HTMLElement && node !== host && node.hasAttribute("data-page-root");
  });
}

function trapTab(event: KeyboardEvent, panel: HTMLElement) {
  if (event.key !== "Tab" || event.altKey || event.ctrlKey || event.metaKey) return;
  const items = tabbableIn(panel);
  if (items.length === 0) {
    event.preventDefault();
    panel.focus({ preventScroll: true });
    return;
  }
  const first = items[0]!;
  const last = items[items.length - 1]!;
  const active = document.activeElement;
  const inside = active instanceof Node && panel.contains(active);
  if (event.shiftKey) {
    if (!inside || active === first) {
      event.preventDefault();
      last.focus({ preventScroll: true });
    }
    return;
  }
  if (!inside || active === last) {
    event.preventDefault();
    first.focus({ preventScroll: true });
  }
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
  const panelRef = useRef<HTMLElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  // Focus moves only when the visitor opens or closes the panel. It is open
  // by default; moving focus on load would skip the rest of the page.
  const focusIntent = useRef<"panel" | "launcher" | null>(null);
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

  useEffect(() => {
    if (onAskPage) return;
    if (!open) {
      if (focusIntent.current === "launcher") {
        focusIntent.current = null;
        launcherRef.current?.focus({ preventScroll: true });
      }
      return;
    }

    const panel = panelRef.current;
    if (panel && focusIntent.current === "panel") {
      focusIntent.current = null;
      focusField(panel);
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePanel();
        return;
      }
      const current = panelRef.current;
      if (current) trapTab(event, current);
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [closePanel, onAskPage, open]);

  // aria-modal hides the background from assistive tech. The page root is a
  // sibling of this widget, so marking it inert blocks pointer and keyboard
  // use without disabling the dialog or covering the portfolio. Re-apply on
  // pathname so a client navigation cannot drop the attribute.
  useLayoutEffect(() => {
    if (onAskPage || !open) return;
    const host = hostRef.current;
    if (!host) return;
    const pages = pageRootsBeside(host);
    for (const page of pages) setInert(page, true);
    return () => {
      for (const page of pages) setInert(page, false);
    };
  }, [onAskPage, open, pathname]);

  // Full /ask page already hosts the chat — skip the floating duplicate.
  if (onAskPage) {
    return null;
  }

  return (
    <div ref={hostRef} className={`ask-fab${open ? " ask-fab-open" : ""}`}>
      <section
        ref={panelRef}
        id={panelId}
        className="ask-fab-panel"
        role="dialog"
        aria-modal="true"
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
          onSourceNavigate={closePanel}
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

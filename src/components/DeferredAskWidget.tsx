"use client";

import { useEffect, useState } from "react";
import type { ComponentType } from "react";

import type { AskChatWidgetStrings } from "@/components/AskChatWidget";
import type { Locale } from "@/lib/locale";

type AskWidgetProps = {
  strings: AskChatWidgetStrings;
  locale?: Locale;
};

type AskWidgetComponent = ComponentType<AskWidgetProps>;

const INTERACTION: Array<"pointerdown" | "keydown"> = ["pointerdown", "keydown"];
const listen: AddEventListenerOptions = { capture: true, passive: true };

/**
 * Cap how long we wait for an idle slot after `load` before mounting Ask.
 * Kept short so the launcher appears on first visit without the old 45s
 * Lighthouse-TBT deferral; pointer/key still mounts immediately.
 */
export const ASK_IDLE_TIMEOUT_MS = 1_500;

export function DeferredAskWidget({ strings, locale = "en" }: AskWidgetProps) {
  const [Widget, setWidget] = useState<AskWidgetComponent | null>(null);

  useEffect(() => {
    let cancelled = false;
    let started = false;
    let idleId = 0;
    let fallbackId = 0;

    const mount = () => {
      if (started) return;
      started = true;
      for (const type of INTERACTION) {
        window.removeEventListener(type, onInteract, listen);
      }
      window.removeEventListener("load", onLoad);
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idleId);
      window.clearTimeout(fallbackId);
      void import("@/components/AskChatWidget").then((mod) => {
        if (!cancelled) setWidget(() => mod.AskChatWidget);
      });
    };

    const onInteract = () => mount();

    const armIdle = () => {
      if (started || cancelled) return;
      if (typeof window.requestIdleCallback === "function") {
        idleId = window.requestIdleCallback(() => mount(), {
          timeout: ASK_IDLE_TIMEOUT_MS,
        });
      } else {
        // Safari shipped requestIdleCallback late; mount on the next tick.
        fallbackId = window.setTimeout(mount, 0);
      }
    };

    const onLoad = () => {
      armIdle();
    };

    for (const type of INTERACTION) {
      window.addEventListener(type, onInteract, listen);
    }

    if (document.readyState === "complete") {
      onLoad();
    } else {
      window.addEventListener("load", onLoad, { once: true });
    }

    return () => {
      cancelled = true;
      for (const type of INTERACTION) {
        window.removeEventListener(type, onInteract, listen);
      }
      window.removeEventListener("load", onLoad);
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idleId);
      window.clearTimeout(fallbackId);
    };
  }, []);

  if (!Widget) return null;
  return <Widget strings={strings} locale={locale} />;
}

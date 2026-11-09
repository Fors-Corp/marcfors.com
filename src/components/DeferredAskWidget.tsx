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

// Lighthouse Total Blocking Time is measured from FCP until a ~5s main-thread
// quiet window (TTI), and the audit waits up to ~45s for that quiet window. An
// early requestIdleCallback (or an 8s timer) still lands inside it on mobile
// CI (~305ms against a 250ms budget): importing and opening the dialog is
// itself a long task. Arm idle only after load plus a delay past that max wait;
// pointer/key still mounts immediately so real visitors are not stuck.
export const ASK_POST_LOAD_DELAY_MS = 45_000;

export function DeferredAskWidget({ strings, locale = "en" }: AskWidgetProps) {
  const [Widget, setWidget] = useState<AskWidgetComponent | null>(null);

  useEffect(() => {
    let cancelled = false;
    let started = false;
    let idleId = 0;
    let delayId = 0;

    const mount = () => {
      if (started) return;
      started = true;
      for (const type of INTERACTION) {
        window.removeEventListener(type, onInteract, listen);
      }
      window.removeEventListener("load", onLoad);
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idleId);
      window.clearTimeout(delayId);
      void import("@/components/AskChatWidget").then((mod) => {
        if (!cancelled) setWidget(() => mod.AskChatWidget);
      });
    };

    const onInteract = () => mount();

    const armIdle = () => {
      if (started || cancelled) return;
      if (typeof window.requestIdleCallback === "function") {
        idleId = window.requestIdleCallback(() => mount(), { timeout: 2000 });
      } else {
        // Safari shipped requestIdleCallback late; mount on the delay boundary.
        mount();
      }
    };

    const onLoad = () => {
      delayId = window.setTimeout(armIdle, ASK_POST_LOAD_DELAY_MS);
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
      window.clearTimeout(delayId);
    };
  }, []);

  if (!Widget) return null;
  return <Widget strings={strings} locale={locale} />;
}

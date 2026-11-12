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

// Keep Ask off the first paint and out of the early Total Blocking Time
// window: Lighthouse measures TBT until a ~5s main-thread quiet window, and
// an immediate requestIdleCallback still imports a long task into that span.
// Arm idle only after load plus a short settle delay; pointer/key still mounts
// immediately so engaged visitors are not stuck. 8s is early enough for a
// passive reader to see the launcher without waiting through Lighthouse’s
// ~45s quiet-window hunt, while the panel stays closed on mount (no focus
// steal / first-viewport cover) and mobile TBT has 350ms headroom.
export const ASK_POST_LOAD_DELAY_MS = 8_000;

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

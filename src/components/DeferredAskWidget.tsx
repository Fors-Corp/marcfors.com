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

// The open dialog's commit, and marking the page inert, sat on the mobile
// critical path (Total Blocking Time ~305ms against a 250ms budget). Keep that
// work out of the first paint. Mount on idle and still open by default; a
// pointer or key before then mounts it immediately.
const IDLE_DEADLINE_MS = 2500;

export function DeferredAskWidget({ strings, locale = "en" }: AskWidgetProps) {
  const [Widget, setWidget] = useState<AskWidgetComponent | null>(null);

  useEffect(() => {
    let cancelled = false;
    let started = false;
    let idleId = 0;
    let timerId = 0;

    const mount = () => {
      if (started) return;
      started = true;
      for (const type of INTERACTION) {
        window.removeEventListener(type, onInteract, listen);
      }
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idleId);
      window.clearTimeout(timerId);
      void import("@/components/AskChatWidget").then((mod) => {
        if (!cancelled) setWidget(() => mod.AskChatWidget);
      });
    };

    const onInteract = () => mount();

    for (const type of INTERACTION) {
      window.addEventListener(type, onInteract, listen);
    }

    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(() => mount(), { timeout: IDLE_DEADLINE_MS });
    } else {
      // Safari shipped requestIdleCallback late; a short timeout is the same
      // "not during this task" boundary for browsers that lack it.
      timerId = window.setTimeout(mount, 1);
    }

    return () => {
      cancelled = true;
      for (const type of INTERACTION) {
        window.removeEventListener(type, onInteract, listen);
      }
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idleId);
      window.clearTimeout(timerId);
    };
  }, []);

  if (!Widget) return null;
  return <Widget strings={strings} locale={locale} />;
}

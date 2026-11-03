"use client";

import { useEffect, useRef } from "react";
import { applyTheme, readTheme, useTheme, writeTheme } from "@/lib/prefs";
import { THEME_CHOICES, type Theme } from "@/lib/theme";

export type ThemeNames = Record<Theme, string>;

export function ThemeSwitcher({ label, names }: { label: string; names: ThemeNames }) {
  const theme = useTheme();
  const rootRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const sync = () => {
      if (readTheme() === "system") applyTheme("system");
    };
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!root.open) return;
      if (event.target instanceof Node && root.contains(event.target)) return;
      root.open = false;
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && root.open) root.open = false;
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <details ref={rootRef} className="chrome-menu themes-menu">
      <summary className="chrome-menu-trigger" aria-label={`${label}: ${names[theme]}`}>
        <span className={`theme-swatch theme-dot-${theme}`} aria-hidden="true" />
        <span className="chrome-menu-label">{names[theme]}</span>
      </summary>
      <div className="chrome-menu-panel themes" role="group" aria-label={label}>
        {THEME_CHOICES.map((id) => (
          <button
            key={id}
            type="button"
            className={`theme-option theme-dot-${id}`}
            aria-label={names[id]}
            aria-pressed={theme === id}
            onClick={() => {
              writeTheme(id);
              if (rootRef.current) rootRef.current.open = false;
            }}
          >
            <span className={`theme-swatch theme-dot-${id}`} aria-hidden="true" />
            <span>{names[id]}</span>
          </button>
        ))}
      </div>
    </details>
  );
}

export const THEME_SWITCHER_CHOICES = THEME_CHOICES;

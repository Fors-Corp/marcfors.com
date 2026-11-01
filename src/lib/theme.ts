export const PALETTE_THEMES = ["light", "dark", "green", "blue", "red"] as const;
export type PaletteTheme = (typeof PALETTE_THEMES)[number];

export const THEME_CHOICES = ["system", ...PALETTE_THEMES] as const;
export type Theme = (typeof THEME_CHOICES)[number];

/** @deprecated use THEME_CHOICES; kept so older tests/docs can say THEMES */
export const THEMES = THEME_CHOICES;

export const DEFAULT_THEME: Theme = "system";
export const THEME_KEY = "marcfors-theme";

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEME_CHOICES as readonly string[]).includes(value);
}

export function isPaletteTheme(value: unknown): value is PaletteTheme {
  return typeof value === "string" && (PALETTE_THEMES as readonly string[]).includes(value);
}

export function resolveTheme(choice: Theme, prefersLight: boolean): PaletteTheme {
  if (choice === "system") return prefersLight ? "light" : "dark";
  return choice;
}

// Literal boot script — theme constants are compile-time fixed, so embed them
// directly instead of interpolating JSON.stringify (which CodeQL treats as an
// inadequate sanitizer for code construction).
export const ANTI_FLASH_SCRIPT =
  '(function(){try{var choices=["system","light","dark","green","blue","red"];var palettes=["light","dark","green","blue","red"];var stored=localStorage.getItem("marcfors-theme");var choice=(stored&&choices.indexOf(stored)!==-1)?stored:"system";var light=window.matchMedia&&matchMedia("(prefers-color-scheme: light)").matches;var resolved=(choice==="system")?(light?"light":"dark"):choice;if(palettes.indexOf(resolved)===-1)resolved="dark";document.documentElement.setAttribute("data-theme",resolved);document.documentElement.setAttribute("data-theme-choice",choice);}catch(e){}})();';

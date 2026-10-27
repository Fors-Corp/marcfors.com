/** Trailing arrow on a button: ↗ leaves the site, → stays on it. Decorative only. */
export function ButtonArrow({ out = false }: { out?: boolean }) {
  return (
    <span className="btn-arrow" data-dir={out ? "out" : "in"} aria-hidden="true">
      {out ? "↗" : "→"}
    </span>
  );
}

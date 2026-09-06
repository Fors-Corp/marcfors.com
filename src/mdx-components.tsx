import type { MDXComponents } from "mdx/types";

/**
 * Themes case-study prose to the desk instead of leaving it at browser
 * defaults. Headings need no override — `h2 { ... }` in globals.css already
 * styles the small-caps brass label every case-study section heading uses.
 * `.case-body` (wrapping the compiled MDX in work/[slug]/page.tsx) carries the
 * spacing and typography these tags render into.
 */
const components: MDXComponents = {
  p: (props) => <p className="lede" {...props} />,
};

export function useMDXComponents(): MDXComponents {
  return components;
}

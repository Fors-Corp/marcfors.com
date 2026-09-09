const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
];

export const CONTENT_SECURITY_POLICY = CSP_DIRECTIVES.join("; ");

// `next dev` only: React 19 / Next 16 in development call eval() for debugging
// features (reconstructing call stacks across environments), and @vercel/analytics
// loads its debug build from va.vercel-scripts.com instead of the same-origin
// `/_vercel/insights/script.js` path a real Vercel deployment proxies it through.
// Production builds hit neither case, so the shipped policy above stays strict —
// this relaxed variant is wired up in next.config.ts solely when NODE_ENV !== "production".
export const CONTENT_SECURITY_POLICY_DEV = CSP_DIRECTIVES.map((directive) =>
  directive.startsWith("script-src ")
    ? `${directive} 'unsafe-eval' https://va.vercel-scripts.com`
    : directive,
).join("; ");

export const SECURITY_HEADERS: { key: string; value: string }[] = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
];

export const SECURITY_CONTROL_IDS = ["tls", "csp", "frames", "cookies", "audit", "obs"] as const;
export type SecurityControlId = (typeof SECURITY_CONTROL_IDS)[number];

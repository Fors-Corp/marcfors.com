export function BrandMark({ className = "brand-mark" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="8" fill="var(--ink)" />
      <circle cx="10" cy="12" r="2.2" fill="var(--signal)" />
      <circle cx="22" cy="10" r="1.8" fill="var(--brass)" />
      <circle cx="18" cy="20" r="2.4" fill="var(--signal)" />
      <path
        d="M10 12 L22 10 M22 10 L18 20 M18 20 L10 12"
        fill="none"
        stroke="var(--brass)"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  );
}

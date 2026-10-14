/** Decorative Oracle avatar: a targeting eye. Hidden from assistive tech. */
export function OracleGlyph() {
  return (
    <span
      aria-hidden="true"
      className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center border border-scan/60 bg-void shadow-[0_0_12px_-2px_var(--color-scan)]"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-scan">
        <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
        <path d="M12 2v2M12 20v2M2 2h3M2 2v3M22 22h-3M22 22v-3" />
      </svg>
    </span>
  );
}

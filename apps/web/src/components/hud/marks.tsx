/** The team mark: a small network sphere with one orbit. The big animated version is <FxCanvas kind="sphere" />. */
export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 100 100" className="flex-none">
      <ellipse cx="50" cy="50" rx="46" ry="14" fill="none" stroke="#A07BFF" strokeWidth="3" transform="rotate(-20 50 50)" />
      <circle cx="50" cy="50" r="28" fill="#04050C" stroke="#58E0E8" strokeWidth="4" />
      <path d="M30 42L48 30L68 40L72 58L54 72L34 62ZM30 42L54 50L68 40M48 30L54 50L72 58M34 62L54 50L54 72" fill="none" stroke="#EEF0FF" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="54" cy="50" r="4.5" fill="#FFC83D" />
      <circle cx="93" cy="34" r="4.5" fill="#A07BFF" />
    </svg>
  );
}

/** The AI's mark in front of every answer: a two-colour ring around three voice bars. The ring flows while it is answering. */
export function AiMark({ active = false, size = 24 }: { active?: boolean; size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 200 200" className="flex-none">
      <g fill="none" strokeWidth="13" strokeLinecap="round" className={active ? 'vq-flow' : undefined} strokeDasharray={active ? '24 16' : undefined}>
        <path d="M100 22A62 62 0 0 0 100 146" stroke="#FF2FB3" />
        <path d="M100 22A62 62 0 0 1 100 146" stroke="#58E0E8" />
      </g>
      <path d="M74 70V98M100 56V112M126 70V98" fill="none" stroke="#EEF0FF" strokeWidth="13" strokeLinecap="round" />
      <ellipse cx="100" cy="178" rx="64" ry="12" fill="none" stroke="#5B8CFF" strokeWidth="9" />
    </svg>
  );
}

/** Four corner brackets pinned to the corners of a `relative` parent. */
export function Corners({ inset = 12 }: { inset?: number }) {
  const base = 'pointer-events-none absolute h-5 w-5 border-signal';
  return (
    <>
      <span aria-hidden="true" className={`${base} border-t-2 border-l-2`} style={{ top: inset, left: inset }} />
      <span aria-hidden="true" className={`${base} border-t-2 border-r-2`} style={{ top: inset, right: inset }} />
      <span aria-hidden="true" className={`${base} border-b-2 border-l-2`} style={{ bottom: inset, left: inset }} />
      <span aria-hidden="true" className={`${base} border-r-2 border-b-2`} style={{ bottom: inset, right: inset }} />
    </>
  );
}

/**
 * Clinician Scorecard mark: a navy tile holding an open "C" drawn as a gradient
 * arc (teal to mint) that ends in a mint dot, the point where a number meets its
 * record, cradling three rising bars (the six domains read as a small chart).
 * Same art at 26px in the nav and full-bleed in app/icon.svg.
 */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden className="shrink-0">
      <defs>
        <linearGradient id="cs-arc" x1="22" y1="8" x2="10" y2="25" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#6ee7b7" />
          <stop offset="0.5" stopColor="#2dd4bf" />
          <stop offset="1" stopColor="#0d9488" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="8" fill="#0f172a" />
      <path d="M22.9 10.1 A8.6 8.6 0 1 0 22.9 21.9" stroke="url(#cs-arc)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="23.3" cy="9.7" r="2.1" fill="#6ee7b7" />
      <rect x="12.2" y="17.2" width="2.1" height="3.3" rx="1" fill="#94a3b8" />
      <rect x="15.2" y="14.9" width="2.1" height="5.6" rx="1" fill="#cbd5e1" />
      <rect x="18.2" y="12.4" width="2.1" height="8.1" rx="1" fill="#5eead4" />
    </svg>
  );
}

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark />
      <div className="flex flex-col leading-none">
        <span className="whitespace-nowrap text-[15px] font-semibold tracking-tight text-slate-900">Clinician Scorecard</span>
        <span className="mt-1 hidden whitespace-nowrap text-[9px] font-medium uppercase tracking-[0.16em] text-slate-400 xl:inline">
          Every number, every record
        </span>
      </div>
    </div>
  );
}

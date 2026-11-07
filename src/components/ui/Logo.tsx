interface LogoProps {
  /** "light" for dark backgrounds (sidebar), "dark" for light backgrounds. */
  tone?: 'light' | 'dark'
  showWordmark?: boolean
  className?: string
}

/** KrishiDrishti mark: a sensor lens over a field grid, crossed by an orbit path. */
export function Logo({ tone = 'dark', showWordmark = true, className = '' }: LogoProps) {
  const ink = tone === 'light' ? 'text-white' : 'text-brand-900'
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" aria-hidden="true">
        <rect width="32" height="32" rx="6" fill={tone === 'light' ? '#173a2c' : '#1f4d3a'} />
        <circle cx="16" cy="16" r="9" fill="none" stroke="#adcfbb" strokeWidth="1.6" />
        <path d="M9.5 16h13M16 9.5v13M11 12.5h10M11 19.5h10" stroke="#adcfbb" strokeWidth="1" opacity=".55" />
        <circle cx="16" cy="16" r="3.2" fill="#eef5f1" />
        <path d="M4 22c6-9 18-13 25-12" fill="none" stroke="#eef5f1" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      {showWordmark && (
        <span className={`leading-none ${ink}`}>
          <span className="block text-[15px] font-semibold tracking-tight">KrishiDrishti</span>
          <span className={`mt-1 block font-mono text-[9px] tracking-[0.12em] whitespace-nowrap uppercase ${tone === 'light' ? 'text-brand-300' : 'text-brand-600'}`}>
            Satellite crop intelligence
          </span>
        </span>
      )}
    </span>
  )
}

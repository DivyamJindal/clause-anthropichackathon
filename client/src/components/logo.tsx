interface LogoMarkProps {
  className?: string;
}

export function LogoMark({ className = "w-6 h-6" }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <line x1="16" y1="2" x2="16" y2="30" stroke="hsl(var(--primary))" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="4" y1="12" x2="28" y2="12" stroke="hsl(var(--primary))" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="6" y1="4" x2="26" y2="28" stroke="hsl(var(--primary))" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="26" y1="4" x2="6" y2="28" stroke="hsl(var(--primary))" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="2" y1="20" x2="14" y2="20" stroke="hsl(var(--primary))" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="18" y1="20" x2="30" y2="20" stroke="hsl(var(--primary))" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="16" cy="12" r="2.5" fill="hsl(var(--primary))" />
    </svg>
  );
}

interface LogoFullProps {
  className?: string;
}

export function LogoFull({ className }: LogoFullProps) {
  return (
    <div className={`flex items-center gap-2 ${className || ""}`} data-testid="sidebar-logo">
      <LogoMark className="w-5 h-5" />
      <span className="text-base font-semibold tracking-tight">CLAUSE</span>
    </div>
  );
}

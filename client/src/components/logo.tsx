interface LogoMarkProps {
  className?: string;
}

export function LogoMark({ className = "w-6 h-6" }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" className="text-primary" />
    </svg>
  );
}

interface LogoFullProps {
  className?: string;
}

export function LogoFull({ className }: LogoFullProps) {
  return (
    <div className={`flex items-center gap-2 ${className || ""}`} data-testid="sidebar-logo">
      <LogoMark className="w-5 h-5 text-primary" />
      <span className="text-base font-semibold tracking-tight">CLAUSE</span>
    </div>
  );
}

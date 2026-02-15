interface LogoMarkProps {
  className?: string;
}

export function LogoMark({ className = "w-6 h-6" }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Main Pillar Column - geometric segments */}
      {/* Bottom segment */}
      <rect x="20" y="40" width="24" height="8" fill="currentColor" opacity="0.9" />
      
      {/* Middle segment */}
      <rect x="18" y="28" width="28" height="10" fill="currentColor" opacity="0.85" />
      
      {/* Upper segment */}
      <rect x="16" y="14" width="32" height="12" fill="currentColor" opacity="0.8" />
      
      {/* Top accent - smaller piece */}
      <path
        d="M 22 8 L 26 2 L 38 2 L 42 8 Z"
        fill="currentColor"
        opacity="0.75"
      />
      
      {/* Geometric connecting lines - adds tech element */}
      <line x1="20" y1="24" x2="44" y2="24" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      <line x1="18" y1="36" x2="46" y2="36" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      
      {/* AI/Neural Network Nodes - dots suggesting connections */}
      {/* Left side nodes */}
      <circle cx="12" cy="16" r="2" fill="currentColor" opacity="0.7" />
      <circle cx="14" cy="28" r="2" fill="currentColor" opacity="0.75" />
      <circle cx="12" cy="40" r="2" fill="currentColor" opacity="0.7" />
      
      {/* Right side nodes */}
      <circle cx="52" cy="16" r="2" fill="currentColor" opacity="0.7" />
      <circle cx="50" cy="28" r="2" fill="currentColor" opacity="0.75" />
      <circle cx="52" cy="40" r="2" fill="currentColor" opacity="0.7" />
      
      {/* Center top node */}
      <circle cx="32" cy="48" r="2.5" fill="currentColor" opacity="0.8" />
      
      {/* Connection lines from nodes to pillar - subtle tech aesthetic */}
      <path
        d="M 14 16 Q 18 20 20 22"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.4"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M 14 28 Q 17 30 18 32"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.4"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M 50 16 Q 46 20 44 22"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.4"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M 50 28 Q 47 30 46 32"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.4"
        vectorEffect="non-scaling-stroke"
      />
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

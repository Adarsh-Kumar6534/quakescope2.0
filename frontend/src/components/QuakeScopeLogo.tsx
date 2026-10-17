import React from 'react';

interface QuakeScopeLogoProps {
  size?: 'sm' | 'md' | 'lg';
  theme?: 'dark' | 'light';
  className?: string;
}

export const QuakeScopeLogo: React.FC<QuakeScopeLogoProps> = ({
  size = 'md',
  theme = 'dark',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-12 h-12 rounded-2xl',
  };

  const isLight = theme === 'light';

  // Unique IDs for SVG gradients to prevent conflicts
  const gradId = `qs-wave-grad-${size}-${theme}`;
  const ringGradId = `qs-ring-grad-${size}-${theme}`;
  const dotGradId = `qs-dot-grad-${size}-${theme}`;

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 transition-all duration-300 ${sizeClasses[size]} ${
        isLight
          ? 'bg-gradient-to-br from-white/95 via-sky-50/80 to-indigo-100/70 border border-sky-400/50 shadow-[0_4px_16px_rgba(14,165,233,0.22),inset_0_1.5px_1.5px_#ffffff,inset_0_-1px_1px_rgba(14,165,233,0.15)] backdrop-blur-md'
          : 'bg-gradient-to-br from-cyan-500/25 via-slate-900/85 to-violet-600/25 border border-cyan-400/45 shadow-[0_0_20px_rgba(6,182,212,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] backdrop-blur-md'
      } ${className}`}
    >
      {/* Ambient optical flare in dark theme / specular glass glint in light theme */}
      <div
        className={`absolute inset-0 rounded-inherit pointer-events-none transition-opacity duration-300 ${
          isLight
            ? 'bg-gradient-to-tr from-cyan-400/10 via-transparent to-white/40'
            : 'bg-cyan-400/15 blur-sm'
        }`}
      />

      <svg
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-7 h-7' : 'w-6 h-6'} relative z-10 transition-transform duration-300 group-hover:scale-105`}
      >
        <defs>
          {/* Seismogram Pulse Wave Gradient */}
          <linearGradient id={gradId} x1="3" y1="18" x2="33" y2="18" gradientUnits="userSpaceOnUse">
            {isLight ? (
              <>
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="45%" stopColor="#0891b2" />
                <stop offset="75%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#7c3aed" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="40%" stopColor="#22d3ee" />
                <stop offset="70%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#f43f5e" />
              </>
            )}
          </linearGradient>

          {/* Concentric Epicenter Waves Gradient */}
          <linearGradient id={ringGradId} x1="18" y1="6" x2="18" y2="30" gradientUnits="userSpaceOnUse">
            {isLight ? (
              <>
                <stop offset="0%" stopColor="#0284c7" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.4" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0.3" />
              </>
            )}
          </linearGradient>

          {/* Focal Core Dot */}
          <radialGradient id={dotGradId} cx="50%" cy="50%" r="50%">
            {isLight ? (
              <>
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="60%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#0369a1" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="60%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0284c7" />
              </>
            )}
          </radialGradient>
        </defs>

        {/* Outer concentric tectonic shockwave ring */}
        <circle
          cx="18"
          cy="18"
          r="13"
          stroke={`url(#${ringGradId})`}
          strokeWidth="1.2"
          strokeDasharray="2.5 3.5"
          opacity={isLight ? 0.55 : 0.45}
        />

        {/* Inner high-energy focal wave ring */}
        <circle
          cx="18"
          cy="18"
          r="7.5"
          stroke={`url(#${ringGradId})`}
          strokeWidth="1.4"
          opacity={isLight ? 0.75 : 0.65}
        />

        {/* Realistic Seismic Seismogram Rupture Curve:
            Flat baseline (3 to 8) -> P-wave tremor (8 to 13) ->
            Massive S-wave rupture spike (14.5 to 19.5, peaking at y=6.5 & y=29.5) ->
            Coda aftershock reverberation (20 to 28) -> baseline recovery (28 to 33)
        */}
        <path
          d="M 3.5 18 L 8 18 L 10 16 L 12 20 L 13.5 15.5 L 15 22 L 16.5 6.5 L 18.5 29.5 L 20.5 12 L 22.5 23 L 24 16 L 25.5 19.5 L 27 18 L 32.5 18"
          stroke={`url(#${gradId})`}
          strokeWidth={size === 'sm' ? '2.4' : '2.6'}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Hypocenter / Rupture Focal Origin Core */}
        <circle cx="17.5" cy="18" r="2.2" fill={`url(#${dotGradId})`} />
        <circle
          cx="17.5"
          cy="18"
          r="4.2"
          stroke={isLight ? '#0284c7' : '#38bdf8'}
          strokeWidth="0.8"
          opacity={isLight ? 0.6 : 0.7}
        />
      </svg>
    </div>
  );
};

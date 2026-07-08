export function HeroVisual({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative aspect-[4/3] w-full max-w-lg overflow-hidden rounded-[2rem] ${className}`}
      aria-hidden
    >
      {/* Base gradient — coastal North County mood */}
      <div className="absolute inset-0 bg-gradient-to-br from-trail-100 via-sand-50 to-accent/10" />

      {/* Soft orbs */}
      <div className="absolute -right-8 top-8 h-48 w-48 rounded-full bg-trail-300/40 blur-3xl" />
      <div className="absolute -bottom-4 left-4 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
      <div className="absolute right-1/4 top-1/3 h-24 w-24 rounded-full bg-white/50 blur-2xl" />

      {/* Stylized coastal path + map */}
      <svg
        viewBox="0 0 400 300"
        className="absolute inset-0 h-full w-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="pathGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4a7c59" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#2d5a3d" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="coastGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#94b89e" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#c4783a" stopOpacity="0.15" />
          </linearGradient>
        </defs>

        {/* Abstract coastline */}
        <path
          d="M0 220 Q80 180 160 200 T320 170 L400 190 L400 300 L0 300 Z"
          fill="url(#coastGrad)"
        />

        {/* Walking path curve */}
        <path
          d="M60 240 Q120 160 200 140 T340 90"
          stroke="url(#pathGrad)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="8 6"
          opacity="0.7"
        />

        {/* Route nodes */}
        <circle cx="60" cy="240" r="8" fill="#2d5a3d" opacity="0.9" />
        <circle cx="200" cy="140" r="6" fill="#4a7c59" opacity="0.7" />
        <circle cx="340" cy="90" r="10" fill="#c4783a" opacity="0.85" />

        {/* Map pin at destination */}
        <g transform="translate(328, 72)">
          <path
            d="M12 0C5.4 0 0 5.4 0 12c0 9 12 22 12 22s12-13 12-22C24 5.4 18.6 0 12 0z"
            fill="#2d5a3d"
            opacity="0.95"
          />
          <circle cx="12" cy="11" r="4" fill="white" opacity="0.9" />
        </g>
      </svg>

      {/* Floating UI card — product-style mock */}
      <div className="absolute bottom-6 left-6 right-6 glass rounded-2xl p-4 shadow-glow">
        <div className="flex items-center gap-3">
          <div className="avatar-ring rounded-2xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-[0.875rem] bg-trail-700 text-sm font-semibold text-white">
              M
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-trail-900">
              Maria · Solana Beach
            </p>
            <p className="text-xs text-sand-600">0.8 mi away · Verified</p>
          </div>
          <span className="shrink-0 rounded-full bg-trail-700 px-3 py-1 text-xs font-medium text-white">
            Message
          </span>
        </div>
      </div>
    </div>
  );
}

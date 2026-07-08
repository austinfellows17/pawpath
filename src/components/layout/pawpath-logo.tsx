import Link from "next/link";
import { cn } from "@/lib/utils";

function PawMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient
          id="pawpath-mark-gradient"
          x1="6"
          y1="4"
          x2="34"
          y2="36"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#94b89e" />
          <stop stopColor="#4a7c59" />
          <stop offset="1" stopColor="#234a35" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="11" r="4.2" fill="url(#pawpath-mark-gradient)" />
      <circle cx="20" cy="8" r="4.2" fill="url(#pawpath-mark-gradient)" />
      <circle cx="28" cy="11" r="4.2" fill="url(#pawpath-mark-gradient)" />
      <circle cx="15" cy="17.5" r="3.5" fill="url(#pawpath-mark-gradient)" />
      <circle cx="25" cy="17.5" r="3.5" fill="url(#pawpath-mark-gradient)" />
      <ellipse
        cx="20"
        cy="28"
        rx="10.5"
        ry="8.5"
        fill="url(#pawpath-mark-gradient)"
      />
      {/* Trail path — inspired by PawPath wordmark */}
      <path
        d="M12 28.5C14.5 25.5 17 25.5 20 28.5C23 31.5 25.5 31.5 28 28.5"
        stroke="#e3efe6"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M14 30.5C16.5 27.5 19 27.5 20 29C21 30.5 23.5 30.5 26 27.5"
        stroke="#c2d9c8"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      />
    </svg>
  );
}

const sizeStyles = {
  sm: {
    mark: "h-8 w-8",
    wordmark: "text-base",
    tagline: "text-[10px]",
  },
  md: {
    mark: "h-9 w-9",
    wordmark: "text-lg",
    tagline: "text-[11px]",
  },
  lg: {
    mark: "h-11 w-11",
    wordmark: "text-xl",
    tagline: "text-xs",
  },
} as const;

export function PawPathLogo({
  showTagline = false,
  showWordmark = true,
  size = "md",
  className,
}: {
  showTagline?: boolean;
  showWordmark?: boolean;
  size?: keyof typeof sizeStyles;
  className?: string;
}) {
  const styles = sizeStyles[size];

  return (
    <Link
      href="/"
      className={cn(
        "group inline-flex items-center gap-2.5 transition hover:opacity-90",
        className
      )}
    >
      <PawMark
        className={cn("shrink-0 drop-shadow-sm", styles.mark)}
      />
      {(showWordmark || showTagline) && (
        <div className="flex min-w-0 flex-col leading-none">
          {showWordmark && (
            <span
              className={cn(
                "font-display font-semibold tracking-tight text-trail-900",
                styles.wordmark
              )}
            >
              PawPath
            </span>
          )}
          {showTagline && (
            <span
              className={cn(
                "mt-1 font-medium tracking-wide text-sand-500",
                styles.tagline,
                !showWordmark && "mt-0"
              )}
            >
              Local dog walking
            </span>
          )}
        </div>
      )}
    </Link>
  );
}

export function PawPathMark({ className }: { className?: string }) {
  return <PawMark className={className} />;
}

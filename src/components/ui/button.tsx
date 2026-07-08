import Link from "next/link";
import { cn } from "@/lib/utils";

const variants = {
  primary:
    "bg-trail-700 text-white hover:bg-trail-800 shadow-sm shadow-trail-900/15 hover:shadow-md hover:shadow-trail-900/20 active:scale-[0.98]",
  secondary:
    "bg-sand-100 text-trail-900 hover:bg-sand-200 border border-sand-300/80",
  outline:
    "border border-sand-300/80 text-trail-800 hover:bg-white/90 bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md active:scale-[0.98]",
  ghost: "text-trail-700 hover:bg-trail-50",
  accent: "bg-accent text-white hover:bg-accent/90",
} as const;

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-sm font-medium",
  lg: "px-6 py-3 text-base font-medium",
} as const;

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  href?: string;
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  href,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center rounded-full transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-trail-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}

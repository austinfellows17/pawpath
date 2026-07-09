import { cn } from "@/lib/utils";

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: "default" | "verified" | "tier" | "muted" | "pro";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variant === "default" && "bg-trail-100 text-trail-800",
        variant === "verified" && "bg-trail-700 text-white",
        variant === "tier" && "bg-accent/15 text-accent",
        variant === "muted" && "bg-sand-200 text-sand-700",
        variant === "pro" && "bg-trail-900 text-white",
        className
      )}
    >
      {children}
    </span>
  );
}

import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function BackgroundCheckedBadge({
  className,
  size = "sm",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-accent to-trail-700 font-semibold text-white shadow-md ring-2 ring-white/80",
        size === "sm" ? "px-2.5 py-0.5 text-[10px] uppercase tracking-wide" : "px-3 py-1 text-xs uppercase tracking-wide",
        className
      )}
    >
      <ShieldCheck className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      BG Verified
    </span>
  );
}

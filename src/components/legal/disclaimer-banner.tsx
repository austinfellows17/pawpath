import { cn } from "@/lib/utils";
import { ShieldAlert } from "lucide-react";

export function DisclaimerBanner({
  children,
  className,
  compact = false,
}: {
  children: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-2xl border border-sand-300 bg-sand-100/80 text-sm text-sand-800",
        compact ? "p-3" : "p-4",
        className
      )}
    >
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-sand-600" />
      <p>{children}</p>
    </div>
  );
}

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function FeatureCard({
  icon: Icon,
  title,
  description,
  className,
  variant = "default",
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
  variant?: "default" | "highlight";
}) {
  return (
    <div
      className={cn(
        "surface-card group relative overflow-hidden p-6 sm:p-7",
        variant === "highlight" &&
          "border-trail-200/80 bg-gradient-to-br from-trail-50/90 to-white/90",
        className
      )}
    >
      <div
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-2xl transition-colors",
          variant === "highlight"
            ? "bg-trail-700 text-white"
            : "bg-trail-100 text-trail-700 group-hover:bg-trail-700 group-hover:text-white"
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <h3 className="mt-5 text-base font-semibold tracking-tight text-trail-950">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-sand-600">{description}</p>
    </div>
  );
}

export function PageHero({
  label,
  title,
  description,
  children,
  visual,
}: {
  label?: string;
  title: React.ReactNode;
  description?: string;
  children?: React.ReactNode;
  visual?: React.ReactNode;
}) {
  return (
    <section className="hero-band relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div
          className={cn(
            "grid items-center gap-12",
            visual ? "lg:grid-cols-2 lg:gap-16" : "max-w-3xl"
          )}
        >
          <div className="animate-fade-up">
            {label && <p className="section-label">{label}</p>}
            <h1 className={cn("headline-xl", label && "mt-4")}>{title}</h1>
            {description && (
              <p className="body-lg mt-5 max-w-xl">{description}</p>
            )}
            {children && <div className="mt-8">{children}</div>}
          </div>
          {visual && (
            <div className="animate-fade-up animate-fade-up-delay-2 lg:justify-self-end">
              {visual}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

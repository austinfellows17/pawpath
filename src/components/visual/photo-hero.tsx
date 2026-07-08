import Image from "next/image";
import { cn } from "@/lib/utils";

export function PhotoHero({
  image,
  alt,
  label,
  title,
  description,
  children,
  imagePosition = "center",
  priority = true,
}: {
  image: string;
  alt: string;
  label?: string;
  title: React.ReactNode;
  description?: string;
  children?: React.ReactNode;
  imagePosition?: "center" | "right" | "left";
  priority?: boolean;
}) {
  const positionClass =
    imagePosition === "right"
      ? "object-[70%_center]"
      : imagePosition === "left"
        ? "object-[30%_center]"
        : "object-center";

  return (
    <section className="relative min-h-[min(88vh,820px)] overflow-hidden">
      <Image
        src={image}
        alt={alt}
        fill
        priority={priority}
        className={cn("object-cover", positionClass)}
        sizes="100vw"
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-trail-950/85 via-trail-950/45 to-trail-950/10 sm:via-trail-950/35"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-trail-950/40 via-transparent to-transparent sm:hidden"
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-[min(88vh,820px)] max-w-6xl items-end px-4 pb-16 pt-28 sm:items-center sm:px-6 sm:py-24">
        <div className="max-w-xl animate-fade-up">
          {label && (
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-trail-200/90">
              {label}
            </p>
          )}
          <h1
            className={cn(
              "font-display text-[clamp(2.25rem,5vw,3.75rem)] font-semibold leading-[1.08] tracking-[-0.025em] text-white text-balance",
              label && "mt-4"
            )}
          >
            {title}
          </h1>
          {description && (
            <p className="mt-5 max-w-lg text-[clamp(1.0625rem,1.5vw,1.1875rem)] leading-relaxed text-white/85">
              {description}
            </p>
          )}
          {children && <div className="mt-8">{children}</div>}
        </div>
      </div>
    </section>
  );
}

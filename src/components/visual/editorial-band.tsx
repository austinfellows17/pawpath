import { SiteImage } from "@/components/visual/site-image";
import { cn } from "@/lib/utils";

export function EditorialBand({
  image,
  alt,
  label,
  title,
  description,
  children,
  imageFirst = false,
  className,
}: {
  image: string;
  alt: string;
  label?: string;
  title: React.ReactNode;
  description?: string;
  children?: React.ReactNode;
  imageFirst?: boolean;
  className?: string;
}) {
  return (
    <section className={cn("section-pad overflow-hidden", className)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-8 sm:gap-10 lg:grid-cols-2 lg:gap-16">
          <div
            className={cn(
              "relative aspect-[4/3] min-h-[220px] overflow-hidden rounded-[1.25rem] shadow-lift sm:rounded-[1.75rem]",
              imageFirst && "lg:order-2"
            )}
          >
            <SiteImage
              src={image}
              alt={alt}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          <div className={cn("min-w-0 animate-fade-up", imageFirst && "lg:order-1")}>
            {label && <p className="section-label">{label}</p>}
            <h2 className={cn("headline-lg", label && "mt-3")}>{title}</h2>
            {description && <p className="body-lg mt-4">{description}</p>}
            {children && <div className="mt-6">{children}</div>}
          </div>
        </div>
      </div>
    </section>
  );
}

export function PhotoCtaBand({
  image,
  alt,
  title,
  description,
  children,
}: {
  image: string;
  alt: string;
  title: React.ReactNode;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-[1.25rem] shadow-glow sm:rounded-[2rem]">
      <div className="relative min-h-[280px] sm:aspect-[21/9] sm:min-h-[320px]">
        <SiteImage
          src={image}
          alt={alt}
          fill
          className="object-cover object-[center_40%]"
          sizes="(max-width: 1152px) 100vw, 1152px"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-trail-950/92 via-trail-950/55 to-trail-950/25"
          aria-hidden
        />
        <div className="absolute inset-0 flex flex-col items-center justify-end px-5 pb-10 pt-14 text-center sm:px-16 sm:pb-14">
          <h2 className="font-display text-[clamp(1.375rem,4vw,1.875rem)] font-semibold tracking-tight text-white text-balance">
            {title}
          </h2>
          {description && (
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-trail-100/90 sm:text-base">
              {description}
            </p>
          )}
          {children && <div className="mt-6 sm:mt-8">{children}</div>}
        </div>
      </div>
    </section>
  );
}

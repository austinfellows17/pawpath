import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";

/** Sharp, retina-friendly defaults for PawPath photography. */
export const SITE_IMAGE_QUALITY = 92;

type SiteImageProps = Omit<ImageProps, "quality"> & {
  quality?: number;
  alt: string;
};

export function SiteImage({
  className,
  quality = SITE_IMAGE_QUALITY,
  ...props
}: SiteImageProps) {
  return (
    <Image
      quality={quality}
      className={cn(className)}
      {...props}
    />
  );
}

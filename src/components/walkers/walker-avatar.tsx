import Image from "next/image";
import { cn } from "@/lib/utils";

const sizeStyles = {
  sm: {
    ring: "rounded-2xl",
    inner: "h-14 w-14 rounded-[0.875rem]",
    text: "text-sm",
    imageSizes: "56px",
  },
  md: {
    ring: "rounded-2xl",
    inner: "h-20 w-20 rounded-[1.125rem]",
    text: "text-lg",
    imageSizes: "80px",
  },
  lg: {
    ring: "rounded-3xl",
    inner: "h-24 w-24 rounded-[22px]",
    text: "text-xl",
    imageSizes: "96px",
  },
} as const;

const avatarPalettes = [
  "from-trail-600 to-trail-800 text-white",
  "from-trail-500 to-trail-700 text-white",
  "from-trail-700 to-trail-950 text-trail-100",
  "from-sand-600 to-sand-800 text-white",
  "from-trail-400 to-trail-600 text-trail-950",
  "from-accent to-trail-800 text-white",
] as const;

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getPaletteIndex(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % avatarPalettes.length;
}

export function WalkerAvatar({
  name,
  photoUrl,
  size = "sm",
  className,
}: {
  name: string;
  photoUrl?: string | null;
  size?: keyof typeof sizeStyles;
  className?: string;
}) {
  const styles = sizeStyles[size];
  const initials = getInitials(name);
  const palette = avatarPalettes[getPaletteIndex(name)];

  return (
    <div className={cn("avatar-ring shrink-0", styles.ring, className)}>
      <div className={cn("relative overflow-hidden", styles.inner)}>
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={`${name} profile photo`}
            fill
            className="object-cover object-[center_20%]"
            sizes={styles.imageSizes}
          />
        ) : (
          <div
            className={cn(
              "flex h-full w-full items-center justify-center bg-gradient-to-br font-semibold tracking-tight",
              palette,
              styles.text
            )}
            aria-hidden
          >
            {initials}
          </div>
        )}
      </div>
    </div>
  );
}

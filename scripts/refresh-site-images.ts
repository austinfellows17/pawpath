/**
 * Downloads high-resolution editorial photos (Unsplash) for PawPath marketing pages.
 *
 * Usage:
 *   npx tsx scripts/refresh-site-images.ts
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const OUT_DIR = join(process.cwd(), "public/images");

const IMAGES: Array<{ file: string; url: string }> = [
  {
    file: "hero-beach-frisbee.webp",
    url: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=2400&q=90",
  },
  {
    file: "north-county-coast.webp",
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2400&q=90",
  },
  {
    file: "del-mar-dog-beach.webp",
    url: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=2400&q=90",
  },
  {
    file: "trail-walk.webp",
    url: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=2400&q=90",
  },
  {
    file: "beach-walk-sunset.webp",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2400&q=90",
  },
];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  for (const image of IMAGES) {
    const response = await fetch(image.url);
    if (!response.ok) {
      throw new Error(`Failed to download ${image.file}: ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(join(OUT_DIR, image.file), buffer);
    console.log(`Saved ${image.file} (${Math.round(buffer.length / 1024)} KB)`);
  }

  console.log("\nUpdate src/lib/site-images.ts paths to .webp filenames.\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

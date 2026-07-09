/**
 * Downloads high-resolution editorial photos (Unsplash License) for PawPath.
 * Each image is chosen to match the section copy where it appears.
 *
 * Usage:
 *   npm run images:refresh
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const OUT_DIR = join(process.cwd(), "public/images");

const IMAGES: Array<{ file: string; usage: string; url: string }> = [
  {
    file: "hero-beach-frisbee.webp",
    usage: "Home hero — find a local walker",
    url: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=2400&q=90",
  },
  {
    file: "north-county-coast.webp",
    usage: 'Home + Find — "Built for your neighborhood" (residential street walk)',
    url: "https://images.unsplash.com/photo-1646445767813-14b48536f598?auto=format&fit=crop&w=2400&q=90",
  },
  {
    file: "del-mar-dog-beach.webp",
    usage: "For walkers hero — get discovered locally",
    url: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=2400&q=90",
  },
  {
    file: "trail-walk.webp",
    usage: 'Home + For walkers — daily routes / "Message first. Walk together."',
    url: "https://images.unsplash.com/photo-1656448195312-e892b892b24e?auto=format&fit=crop&w=2400&q=90",
  },
  {
    file: "beach-walk-sunset.webp",
    usage: "Home CTA + How it works — ready to find your walker",
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
    console.log(`  → ${image.usage}\n`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

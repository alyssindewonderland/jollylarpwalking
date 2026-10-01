// Generates placeholder app icons so the PWA is installable today. Swap /public/icons
// for real artwork whenever — this script's only job is "something good enough to ship".
import sharp from "sharp";
import { mkdir } from "fs/promises";

const OUT_DIR = "public/icons";

function svgIcon({ size, padding = 0 }: { size: number; padding?: number }) {
  const inner = size - padding * 2;
  const fontSize = Math.round(inner * 0.52);
  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="${size}" y2="${size}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#0b0b10"/>
      <stop offset="1" stop-color="#141420"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bg)"/>
  <text
    x="50%" y="54%"
    text-anchor="middle"
    dominant-baseline="middle"
    font-family="Arial Black, Helvetica, sans-serif"
    font-weight="900"
    font-size="${fontSize}"
    fill="#22d3ee"
  >S</text>
</svg>`;
}

async function writeIcon(name: string, size: number, padding = 0) {
  await sharp(Buffer.from(svgIcon({ size, padding })))
    .png()
    .toFile(`${OUT_DIR}/${name}`);
  console.log(`wrote ${OUT_DIR}/${name}`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await writeIcon("icon-192.png", 192);
  await writeIcon("icon-512.png", 512);
  // Maskable icons need safe padding since OSes crop to a circle/squircle.
  await writeIcon("icon-maskable-192.png", 192, 24);
  await writeIcon("icon-maskable-512.png", 512, 64);
  await writeIcon("apple-touch-icon.png", 180);
  await writeIcon("badge-96.png", 96);
}

main();

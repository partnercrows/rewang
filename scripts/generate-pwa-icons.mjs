import sharp from "sharp";
import { mkdirSync } from "fs";

const bgColor = "#7d9b76";
const textColor = "#ffffff";

mkdirSync("public", { recursive: true });

/**
 * Generate a PWA icon as PNG.
 *
 * For Android maskable icons, the content must sit inside a safe zone
 * (the inner ~60 % of the canvas).  We build the SVG with padding baked in
 * so the same file can be used for both "any" and "maskable" purposes.
 */
const sizes = [192, 512, 180]; // 180 = apple-touch-icon

for (const size of sizes) {
  // Safe zone: 40 % margin on each side → content = 60 % of canvas
  const safeMargin = Math.round(size * 0.4);
  const innerSize = size - safeMargin * 2;
  const cornerRadius = Math.round(innerSize * 0.222);
  const fontSize = Math.round(innerSize * 0.6);

  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${bgColor}"/>
  <rect x="${safeMargin}" y="${safeMargin}" width="${innerSize}" height="${innerSize}" rx="${cornerRadius}" fill="${bgColor}"/>
  <text x="${size / 2}" y="${size / 2 + fontSize * 0.08}" font-family="Arial,sans-serif" font-size="${fontSize}" font-weight="bold" fill="${textColor}" text-anchor="middle" dominant-baseline="central">R</text>
</svg>`;

  // sharp reads the SVG and renders it at exactly `size×size`
  const outPath = `public/pwa-${size}x${size}.png`;
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(outPath);
  console.log(`✔  ${outPath}  (${size}×${size}, safe-zone built-in)`);
}

console.log("All PWA icons generated successfully.");
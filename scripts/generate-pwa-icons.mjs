import sharp from "sharp";
import { readFileSync, mkdirSync } from "fs";

const bgColor = "#ffffff";

mkdirSync("public", { recursive: true });

// Read the actual logo SVG
const svgBuffer = readFileSync("public/rewang.svg");

const icons = [
  // Maskable icons: logo must sit inside safe zone (~60% of canvas)
  { size: 144, name: "pwa-144x144.png", maskable: true },
  { size: 192, name: "pwa-192x192.png", maskable: true },
  { size: 512, name: "pwa-512x512.png", maskable: true },
  // Apple touch icon: full-bleed
  { size: 180, name: "pwa-180x180.png", maskable: false },
];

for (const { size, name, maskable } of icons) {
  if (maskable) {
    // Render logo at 60% of canvas, then pad to full size
    const logoSize = Math.round(size * 0.6);
    const pad = Math.ceil((size - logoSize) / 2);

    await sharp(svgBuffer)
      .resize(logoSize, logoSize, { fit: "contain", background: bgColor })
      .extend({
        top: pad,
        bottom: pad,
        left: pad,
        right: pad,
        background: bgColor,
      })
      .png()
      .toFile(`public/${name}`);
  } else {
    await sharp(svgBuffer)
      .resize(size, size, { fit: "contain", background: bgColor })
      .png()
      .toFile(`public/${name}`);
  }
  console.log(`✔  public/${name}  (${size}×${size})`);
}

// Generate favicon.ico from the SVG logo (full-bleed, no background)
await sharp(svgBuffer)
  .resize(48, 48, { fit: "cover" })
  .png()
  .toFile("public/favicon.ico");
console.log("✔  public/favicon.ico  (48×48)");

console.log("All PWA icons generated successfully from rewang.svg.");
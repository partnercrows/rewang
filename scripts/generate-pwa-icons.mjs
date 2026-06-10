import sharp from "sharp";

const color = "#7d9b76";
const white = "#ffffff";

const sizes = [192, 512];

for (const size of sizes) {
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="${color}"/>
    <text x="50%" y="52%" font-family="Arial,sans-serif" font-size="${size * 0.55}" font-weight="bold" fill="${white}" text-anchor="middle" dominant-baseline="middle">R</text>
  </svg>`;

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 125, g: 155, b: 118, alpha: 1 },
    },
  })
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toFile(`public/pwa-${size}x${size}.png`);

  console.log(`Created public/pwa-${size}x${size}.png`);
}

console.log("PWA icons generated successfully.");
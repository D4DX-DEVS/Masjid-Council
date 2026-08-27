/**
 * Generates the raster icons that crawlers and social platforms require.
 *
 * Google's favicon fetcher and the Organization `logo` rich result both need a
 * raster image at a stable URL; an SVG-only favicon plus an SVG `logo` is why the
 * site rendered with the generic globe in search results. Open Graph likewise
 * ignores SVG, so og-image.png is generated here too.
 *
 * Run: node scripts/generate-icons.mjs  (wired into `npm run build`)
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const SOURCE_LOGO = resolve(root, 'src/assets/mc-logo2.webp');
const PUBLIC_DIR = resolve(root, 'public');

const BRAND_GREEN = { r: 0x18, g: 0x6b, b: 0x3a, alpha: 1 };

/** Square icon sizes emitted as PNG. */
const ICON_SIZES = [
  { size: 48, name: 'favicon-48.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'favicon-192.png' },
  { size: 512, name: 'logo-512.png' },
];

/**
 * Renders the logo centred on a solid brand-green square.
 * Transparent PNGs render as a black blob in several social embeds, so the
 * background is always flattened.
 *
 * @param {number} size
 * @returns {Promise<Buffer>}
 */
async function squareIcon(size) {
  const padding = Math.round(size * 0.12);
  const logo = await sharp(SOURCE_LOGO)
    .resize(size - padding * 2, size - padding * 2, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  return sharp({
    create: { width: size, height: size, channels: 4, background: BRAND_GREEN },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/**
 * Wraps a single PNG in an ICO container. ICO has allowed embedded PNG payloads
 * since Vista, and sharp cannot write .ico itself.
 *
 * @param {Buffer} png
 * @param {number} size
 * @returns {Buffer}
 */
function pngToIco(png, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // image count

  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0); // width  (0 means 256)
  entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
  entry.writeUInt8(0, 2); // palette colours
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // colour planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(png.length, 8); // payload size
  entry.writeUInt32LE(header.length + entry.length, 12); // payload offset

  return Buffer.concat([header, entry, png]);
}

/**
 * 1200x630 Open Graph card: logo on brand green.
 * @returns {Promise<Buffer>}
 */
async function ogImage() {
  const logo = await sharp(SOURCE_LOGO)
    .resize(560, 380, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  return sharp({
    create: { width: 1200, height: 630, channels: 4, background: BRAND_GREEN },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function main() {
  await mkdir(PUBLIC_DIR, { recursive: true });

  for (const { size, name } of ICON_SIZES) {
    await writeFile(resolve(PUBLIC_DIR, name), await squareIcon(size));
  }

  // 48px, not 64: Google's favicon guidelines ask for a square that is a multiple
  // of 48px, and an off-spec size risks the icon being dropped rather than scaled.
  const ico = await squareIcon(48);
  await writeFile(resolve(PUBLIC_DIR, 'favicon.ico'), pngToIco(ico, 48));
  await writeFile(resolve(PUBLIC_DIR, 'og-image.png'), await ogImage());

  const generated = [...ICON_SIZES.map((i) => i.name), 'favicon.ico', 'og-image.png'];
  process.stdout.write(`icons: generated ${generated.join(', ')}\n`);
}

main().catch((error) => {
  process.stderr.write(`icons: failed — ${error instanceof Error ? error.message : error}\n`);
  process.exit(1);
});

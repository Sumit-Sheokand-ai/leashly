/**
 * Run: node generate-icons.js
 * Converts logo-icon.svg → PNG files in /public
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const publicDir = path.join(__dirname, "public");

// Install sharp if not present
try {
  require.resolve("sharp");
} catch {
  console.log("Installing sharp...");
  execSync("npm install sharp --save-dev", { stdio: "inherit" });
}

const sharp = require("sharp");

const svgPath = path.join(publicDir, "logo-icon.svg");
const svgBuffer = fs.readFileSync(svgPath);

const sizes = [
  { name: "favicon-16.png",      size: 16  },
  { name: "favicon-32.png",      size: 32  },
  { name: "logo-icon-64.png",    size: 64  },
  { name: "logo-icon-180.png",   size: 180 },
  { name: "logo-icon-192.png",   size: 192 },
  { name: "logo-icon-512.png",   size: 512 },
  { name: "logo-icon.png",       size: 512 },
];

async function generate() {
  for (const { name, size } of sizes) {
    const outPath = path.join(publicDir, name);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outPath);
    console.log(`✓ ${name} (${size}x${size})`);
  }

  // Generate favicon.ico using raw ICO format from 16 and 32 px PNGs
  // (sharp doesn't support ICO natively, so we embed the 32px PNG as a simple ICO)
  const png32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
  const png16 = await sharp(svgBuffer).resize(16, 16).png().toBuffer();

  // Build a minimal ICO file manually (2 images: 16x16 and 32x32)
  const ico = buildIco([
    { size: 16, buffer: png16 },
    { size: 32, buffer: png32 },
  ]);
  fs.writeFileSync(path.join(publicDir, "favicon.ico"), ico);
  console.log("✓ favicon.ico");

  console.log("\n✅ All icons generated in /public!");
}

function buildIco(images) {
  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = headerSize + dirEntrySize * images.length;

  let offset = dirSize;
  const offsets = images.map((img) => {
    const o = offset;
    offset += img.buffer.length;
    return o;
  });

  const buf = Buffer.alloc(offset);

  // ICONDIR header
  buf.writeUInt16LE(0, 0);       // reserved
  buf.writeUInt16LE(1, 2);       // type: ICO
  buf.writeUInt16LE(images.length, 4);

  // ICONDIRENTRY for each image
  images.forEach((img, i) => {
    const base = headerSize + i * dirEntrySize;
    buf.writeUInt8(img.size === 256 ? 0 : img.size, base);     // width
    buf.writeUInt8(img.size === 256 ? 0 : img.size, base + 1); // height
    buf.writeUInt8(0, base + 2);   // color count
    buf.writeUInt8(0, base + 3);   // reserved
    buf.writeUInt16LE(1, base + 4); // planes
    buf.writeUInt16LE(32, base + 6); // bit count
    buf.writeUInt32LE(img.buffer.length, base + 8);  // size
    buf.writeUInt32LE(offsets[i], base + 12);         // offset
    img.buffer.copy(buf, offsets[i]);
  });

  return buf;
}

generate().catch(console.error);

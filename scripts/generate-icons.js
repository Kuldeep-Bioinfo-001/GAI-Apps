import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

// Minimal pure-Node script to generate valid PNG icon files for PWA
function createPng(width, height, r, g, b) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type (RGB)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = makeChunk('IHDR', ihdrData);

  // Raw image data with scanline filter byte 0
  const rowSize = 1 + width * 3;
  const rawData = Buffer.alloc(height * rowSize);

  // Indigo gradient with subtle checkmark circle pattern
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = width * 0.42;
  const innerRadius = width * 0.38;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // filter type: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 3;
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Indigo base gradient (#4F46E5 to #7C3AED)
      const gradRatio = (x + y) / (width + height);
      let pr = Math.round(79 + (124 - 79) * gradRatio);
      let pg = Math.round(70 + (58 - 70) * gradRatio);
      let pb = Math.round(229 + (237 - 229) * gradRatio);

      // Outer ring highlight
      if (Math.abs(dist - innerRadius) < width * 0.02) {
        pr = 255; pg = 255; pb = 255;
      }
      
      // Center checkmark approximate pixelation
      const nx = (x - centerX) / width;
      const ny = (y - centerY) / height;
      const onCheck1 = (nx >= -0.18 && nx <= -0.02 && Math.abs(ny - (nx + 0.12)) < 0.04);
      const onCheck2 = (nx >= -0.05 && nx <= 0.22 && Math.abs(ny - (-nx * 1.2 + 0.08)) < 0.04);
      if (onCheck1 || onCheck2) {
        pr = 255; pg = 255; pb = 255;
      }

      rawData[pxOffset] = pr;
      rawData[pxOffset + 1] = pg;
      rawData[pxOffset + 2] = pb;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idat = makeChunk('IDAT', compressed);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);

  // CRC32
  let crc = 0 ^ (-1);
  for (let i = 0; i < body.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ body[i]) & 0xFF];
  }
  crc = (crc ^ (-1)) >>> 0;

  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);

  return Buffer.concat([len, body, crcBuf]);
}

const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xEDB88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, 79, 70, 229));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, 79, 70, 229));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, 79, 70, 229));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, 79, 70, 229));
console.log('Icons generated successfully.');

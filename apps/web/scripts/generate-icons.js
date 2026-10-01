// Generate PNG icons using pure Node.js and zlib
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, isMaskable = false) {
  // Generate RGBA buffer
  const rowSize = width * 4;
  const rawData = Buffer.alloc((rowSize + 1) * height);

  const bgR = 0x25, bgG = 0x97, bgB = 0xd0; // #2597d0
  const whiteR = 0xff, whiteG = 0xff, whiteB = 0xff;
  const darkR = 0x07, darkG = 0x07, darkB = 0x09; // #070709

  const cx = width / 2;
  const cy = height / 2;
  const scale = width / 192;

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter type 0: None
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Base background: rounded squircle if not maskable, or full bleed if maskable
      let r = bgR, g = bgG, b = bgB, a = 255;

      // Draw V shape and Rupee symbol
      // V coordinates normalized
      const nx = (x - cx) / (scale * 50);
      const ny = (y - cy) / (scale * 50);

      // Central symbol: stylized 'V' with inner ₹ slash
      const inV = (Math.abs(Math.abs(nx) - (ny + 0.3) * 0.7) < 0.22 && ny > -0.6 && ny < 0.6) ||
                  (Math.abs(ny - 0.6) < 0.15 && Math.abs(nx) < 0.25);
      
      const inRupeeBar = (Math.abs(ny - (-0.1)) < 0.1 && Math.abs(nx) < 0.5) ||
                         (Math.abs(ny - (-0.3)) < 0.1 && Math.abs(nx) < 0.4);

      if (inV || inRupeeBar) {
        r = whiteR;
        g = whiteG;
        b = whiteB;
      }

      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  // Compress IDAT
  const compressed = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const body = Buffer.concat([typeBuf, data]);
    const crc = Buffer.alloc(4);
    crc.writeInt32BE(crc32(body), 0);
    return Buffer.concat([len, body, crc]);
  }

  // CRC32 implementation
  function crc32(buf) {
    let table = new Int32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c;
    }
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ -1);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = chunk('IHDR', ihdr);
  const idatChunk = chunk('IDAT', compressed);
  const iendChunk = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPNG(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPNG(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPNG(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180, 180, false));
console.log('PWA PNG icons generated successfully!');

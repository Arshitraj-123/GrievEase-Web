const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPng(width, height, r, g, b) {
  // Standard PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth 8
  ihdr.writeUInt8(6, 9); // RGBA color type
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(12 + len);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    const crc = crc32(buf.subarray(4, 8 + len));
    buf.writeUInt32BE(crc, 8 + len);
    return buf;
  }

  // Precompute CRC table
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c >>> 0;
  }

  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  // Raw image data with filter byte 0 per line
  const rawBytes = Buffer.alloc(height * (width * 4 + 1));
  let offset = 0;

  for (let y = 0; y < height; y++) {
    rawBytes[offset++] = 0; // Filter byte 0
    for (let x = 0; x < width; x++) {
      // Create a nice rounded border & inner badge
      const cx = width / 2;
      const cy = height / 2;
      const dx = (x - cx) / (width * 0.45);
      const dy = (y - cy) / (height * 0.45);
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 1.0) {
        // Teal primary: #0d9488 -> (13, 148, 136)
        rawBytes[offset++] = r;
        rawBytes[offset++] = g;
        rawBytes[offset++] = b;
        rawBytes[offset++] = 255;
      } else {
        // Dark slate: #0f172a
        rawBytes[offset++] = 15;
        rawBytes[offset++] = 23;
        rawBytes[offset++] = 42;
        rawBytes[offset++] = 255;
      }
    }
  }

  const compressed = zlib.deflateSync(rawBytes);
  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const iconsDir = path.resolve(__dirname, '../apps/web/public/icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

// Teal: rgb(13, 148, 136)
fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), createPng(192, 192, 13, 148, 136));
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), createPng(512, 512, 13, 148, 136));
console.log('✅ Generated valid PNG icons: icon-192.png and icon-512.png');

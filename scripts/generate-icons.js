#!/usr/bin/env node

/**
 * Generate Nazori extension icons (16x16, 48x48, 128x128) as PNG files.
 *
 * Uses only Node.js built-in modules (no external dependencies).
 * Produces a rounded-corner indigo square with a white "N" letterform.
 *
 * Usage: node scripts/generate-icons.js
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { deflateSync } from 'zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = join(__dirname, '..', 'extension', 'public', 'assets');

// Brand colour (indigo-600 #4f46e5)
const BG = [79, 70, 229];
// White letter
const FG = [255, 255, 255];

/**
 * Draw a simple "N" glyph on an RGBA pixel buffer.
 */
function drawIcon(size) {
  // 4 bytes per pixel (RGBA), with a filter byte per row
  const pixels = Buffer.alloc(size * size * 4, 0);

  const radius = Math.round(size * 0.18);

  function setPixel(x, y, r, g, b, a = 255) {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const idx = (y * size + x) * 4;
    pixels[idx] = r;
    pixels[idx + 1] = g;
    pixels[idx + 2] = b;
    pixels[idx + 3] = a;
  }

  function isInRoundedRect(x, y) {
    // Check four corners
    if (x < radius && y < radius) {
      return (radius - x) ** 2 + (radius - y) ** 2 <= radius ** 2;
    }
    if (x >= size - radius && y < radius) {
      return (x - (size - 1 - radius)) ** 2 + (radius - y) ** 2 <= radius ** 2;
    }
    if (x < radius && y >= size - radius) {
      return (radius - x) ** 2 + (y - (size - 1 - radius)) ** 2 <= radius ** 2;
    }
    if (x >= size - radius && y >= size - radius) {
      return (x - (size - 1 - radius)) ** 2 + (y - (size - 1 - radius)) ** 2 <= radius ** 2;
    }
    return true;
  }

  // Draw background
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (isInRoundedRect(x, y)) {
        setPixel(x, y, BG[0], BG[1], BG[2]);
      } else {
        setPixel(x, y, 0, 0, 0, 0); // transparent
      }
    }
  }

  // Draw "N" letterform
  const pad = Math.max(Math.round(size * 0.22), 2);
  const stroke = Math.max(Math.round(size * 0.15), 1);

  // Left vertical bar
  for (let y = pad; y < size - pad; y++) {
    for (let dx = 0; dx < stroke; dx++) {
      setPixel(pad + dx, y, FG[0], FG[1], FG[2]);
    }
  }

  // Right vertical bar
  for (let y = pad; y < size - pad; y++) {
    for (let dx = 0; dx < stroke; dx++) {
      setPixel(size - pad - stroke + dx, y, FG[0], FG[1], FG[2]);
    }
  }

  // Diagonal from top-left to bottom-right
  const innerH = size - 2 * pad;
  const innerW = size - 2 * pad - stroke;
  for (let i = 0; i < innerH; i++) {
    const y = pad + i;
    const x = Math.round(pad + (i / innerH) * innerW);
    for (let dx = 0; dx < stroke; dx++) {
      for (let dy = 0; dy < Math.max(1, Math.ceil(stroke * 0.5)); dy++) {
        setPixel(x + dx, y + dy, FG[0], FG[1], FG[2]);
      }
    }
  }

  return pixels;
}

/**
 * Encode RGBA pixel buffer as a PNG file (minimal encoder).
 */
function encodePNG(pixels, width, height) {
  // Build raw image data with filter bytes
  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 4);
    rawData[rowOffset] = 0; // filter: None
    pixels.copy(rawData, rowOffset + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressed = deflateSync(rawData);

  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 6;  // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = makeChunk('IHDR', ihdrData);

  // IDAT chunk
  const idat = makeChunk('IDAT', compressed);

  // IEND chunk
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function makeChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const crcInput = Buffer.concat([typeBuffer, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcInput), 0);

  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Generate icons at all sizes
for (const size of [16, 48, 128]) {
  const pixels = drawIcon(size);
  const png = encodePNG(pixels, size, size);
  const outPath = join(ASSETS_DIR, `icon-${size}.png`);
  writeFileSync(outPath, png);
  console.log(`Generated ${outPath} (${png.length} bytes)`);
}

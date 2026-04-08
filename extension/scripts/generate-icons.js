#!/usr/bin/env node

/**
 * Generate PNG icons from SVG sources for the Chrome extension.
 *
 * Usage:
 *   node extension/scripts/generate-icons.js
 *
 * Requirements:
 *   npm install sharp   (or use canvas / puppeteer as an alternative)
 *
 * This script converts the SVG icon placeholders in src/assets/ into
 * the PNG files required by the Chrome extension manifest.
 *
 * Output files are written to extension/icons/:
 *   icon-16.png, icon-48.png, icon-128.png
 */

const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.resolve(__dirname, '..', 'src', 'assets');
const OUTPUT_DIR = path.resolve(__dirname, '..', 'icons');

const sizes = [16, 48, 128];

async function generateWithSharp() {
  const sharp = require('sharp');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  for (const size of sizes) {
    const svgPath = path.join(ASSETS_DIR, `icon-${size}.svg`);
    const pngPath = path.join(OUTPUT_DIR, `icon-${size}.png`);

    const svgBuffer = fs.readFileSync(svgPath);

    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(pngPath);

    console.log(`Created ${pngPath}`);
  }
}

async function generatePlaceholders() {
  // Fallback: create minimal 1x1 PNG placeholders when sharp is not available.
  // These should be replaced with real icons before publishing.

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Minimal valid PNG (1x1 blue pixel) as a placeholder marker
  // Real icons should be generated with: npm install sharp && node generate-icons.js
  const PLACEHOLDER_PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkWP' +
    'r/PwAFWQLiBGjJxgAAAABJRU5ErkJggg==',
    'base64'
  );

  for (const size of sizes) {
    const pngPath = path.join(OUTPUT_DIR, `icon-${size}.png`);
    fs.writeFileSync(pngPath, PLACEHOLDER_PNG);
    console.log(`Created placeholder ${pngPath} (replace with real ${size}x${size} icon)`);
  }
}

async function main() {
  try {
    require.resolve('sharp');
    console.log('Using sharp to convert SVG -> PNG...');
    await generateWithSharp();
  } catch {
    console.log('sharp not found, creating placeholder PNGs...');
    console.log('To generate proper icons: npm install sharp && node extension/scripts/generate-icons.js');
    await generatePlaceholders();
  }
}

main().catch((err) => {
  console.error('Icon generation failed:', err);
  process.exit(1);
});

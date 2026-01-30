#!/usr/bin/env node
/**
 * Generate placeholder icons for Chrome extension
 * Run: node scripts/generate-icons.js
 * 
 * For production, replace these with proper designed icons.
 */

const fs = require('fs');
const path = require('path');

const sizes = [16, 48, 128];
const iconsDir = path.join(__dirname, '..', 'icons');

// Simple SVG icon (star/stellar symbol)
const createSvg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="#8b5cf6"/>
  <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" 
        font-family="Arial, sans-serif" font-size="${size * 0.6}" fill="white">✦</text>
</svg>
`.trim();

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG icons (these work in Chrome for development)
sizes.forEach((size) => {
  const svgPath = path.join(iconsDir, `icon${size}.svg`);
  fs.writeFileSync(svgPath, createSvg(size));
  console.log(`Created ${svgPath}`);
});

console.log('\nNote: For production, convert SVGs to PNGs or create proper icons.');
console.log('You can use: npx svgexport icons/icon128.svg icons/icon128.png 128:128');

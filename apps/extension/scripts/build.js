/**
 * Build script for Stellar Snaps extension
 * Uses esbuild to bundle each entry point separately
 */

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '../dist');

async function build() {
  // Clean and create dist directory
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true });
  }
  fs.mkdirSync(distDir, { recursive: true });

  // Build content script (IIFE)
  await esbuild.build({
    entryPoints: ['src/content.ts'],
    bundle: true,
    outfile: 'dist/content.js',
    format: 'iife',
    target: 'chrome100',
    minify: false,
  });
  console.log('Built content.js');

  // Build injected script (IIFE - runs in page context)
  await esbuild.build({
    entryPoints: ['src/injected.ts'],
    bundle: true,
    outfile: 'dist/injected.js',
    format: 'iife',
    target: 'chrome100',
    minify: false,
  });
  console.log('Built injected.js');

  // Build popup script (IIFE)
  await esbuild.build({
    entryPoints: ['src/popup.ts'],
    bundle: true,
    outfile: 'dist/popup.js',
    format: 'iife',
    target: 'chrome100',
    minify: false,
  });
  console.log('Built popup.js');

  // Copy static files
  fs.copyFileSync('manifest.json', path.join(distDir, 'manifest.json'));
  fs.copyFileSync('popup.html', path.join(distDir, 'popup.html'));
  fs.copyFileSync('src/content.css', path.join(distDir, 'content.css'));

  // Copy icons
  const iconsDir = path.join(distDir, 'icons');
  fs.mkdirSync(iconsDir, { recursive: true });
  
  ['16', '48', '128'].forEach((size) => {
    const svgPath = `icons/icon${size}.svg`;
    const pngPath = `icons/icon${size}.png`;
    if (fs.existsSync(svgPath)) {
      fs.copyFileSync(svgPath, path.join(iconsDir, `icon${size}.svg`));
    } else if (fs.existsSync(pngPath)) {
      fs.copyFileSync(pngPath, path.join(iconsDir, `icon${size}.png`));
    }
  });

  console.log('Static files copied');
  console.log('Build complete!');
}

build().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});

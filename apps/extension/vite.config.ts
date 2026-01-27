import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync, rmSync } from 'fs';
import { build } from 'vite';

const __dirname = import.meta.dirname || process.cwd();

// Plugin to copy static files after build
function copyStaticFiles() {
  return {
    name: 'copy-static-files',
    closeBundle() {
      const distDir = resolve(__dirname, 'dist');
      
      // Ensure dist exists
      if (!existsSync(distDir)) {
        mkdirSync(distDir, { recursive: true });
      }
      
      // Copy manifest.json
      copyFileSync(
        resolve(__dirname, 'manifest.json'),
        resolve(distDir, 'manifest.json')
      );
      
      // Copy popup.html
      copyFileSync(
        resolve(__dirname, 'popup.html'),
        resolve(distDir, 'popup.html')
      );
      
      // Copy content.css
      copyFileSync(
        resolve(__dirname, 'src/content.css'),
        resolve(distDir, 'content.css')
      );
      
      // Create icons directory and copy icons
      const iconsDir = resolve(distDir, 'icons');
      if (!existsSync(iconsDir)) {
        mkdirSync(iconsDir, { recursive: true });
      }
      
      // Copy icons if they exist
      const iconSizes = ['16', '48', '128'];
      iconSizes.forEach((size) => {
        const svgPath = resolve(__dirname, `icons/icon${size}.svg`);
        const pngPath = resolve(__dirname, `icons/icon${size}.png`);
        if (existsSync(svgPath)) {
          copyFileSync(svgPath, resolve(iconsDir, `icon${size}.svg`));
        } else if (existsSync(pngPath)) {
          copyFileSync(pngPath, resolve(iconsDir, `icon${size}.png`));
        }
      });
      
      console.log('Static files copied to dist/');
    },
  };
}

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyDirBeforeWrite: true,
    rollupOptions: {
      input: {
        content: resolve(__dirname, 'src/content.ts'),
        popup: resolve(__dirname, 'src/popup.ts'),
        injected: resolve(__dirname, 'src/injected.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        // Force all code into single files per entry (no code splitting)
        manualChunks: () => 'shared',
      },
    },
    target: 'esnext',
    minify: false,
  },
  plugins: [copyStaticFiles()],
});

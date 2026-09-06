import { defineConfig } from 'vite';
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(fileURLToPath(import.meta.url));

// Frontier Ashes still uses several classic <script src="..."> files for the
// legacy game engine. Vite only puts module-graph assets into the build output,
// so these classic scripts must be copied to dist explicitly for production
// hosts such as Vercel. GitHub Pages serves the repository root directly, which
// is why the same build could appear to work there while failing on Vercel.
const legacyScripts = [
  'raid-state.js',
  'game-v3.js',
  'loadout-ui.js',
  'loadout-bridge.js',
  'weapon-loadout.js',
  'start-fix.js'
];

function copyLegacyScripts() {
  let outputDir;

  return {
    name: 'frontier-ashes-copy-legacy-scripts',
    apply: 'build',
    configResolved(config) {
      outputDir = resolve(config.root, config.build.outDir);
    },
    writeBundle() {
      mkdirSync(outputDir, { recursive: true });
      for (const file of legacyScripts) {
        copyFileSync(resolve(projectRoot, file), resolve(outputDir, file));
      }
    }
  };
}

export default defineConfig({
  root: '.',
  plugins: [copyLegacyScripts()],
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  server: {
    host: true
  }
});

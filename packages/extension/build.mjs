import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import esbuild from 'esbuild';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, 'dist');
const formCoreBundle = path.resolve(__dirname, '../form-core/dist/form-core.iife.js');
const formCoreSrc = path.resolve(__dirname, '../form-core/src/index.ts');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

async function build() {
  console.log('Building TechForm Buddy Chrome Extension (MV3)...');

  // 1. Bundle form-core directly so extension never has missing dependencies
  console.log('1. Bundling form-core engine...');
  const formCoreDistDir = path.dirname(formCoreBundle);
  if (!fs.existsSync(formCoreDistDir)) {
    fs.mkdirSync(formCoreDistDir, { recursive: true });
  }

  await esbuild.build({
    entryPoints: [formCoreSrc],
    outfile: formCoreBundle,
    bundle: true,
    format: 'iife',
    globalName: 'TechFormBuddyCore',
    target: 'es2022',
    sourcemap: false,
  });
  console.log('✓ Bundled form-core -> ' + formCoreBundle);

  // 2. Bundle extension scripts & copy assets
  // We output into BOTH:
  // a) packages/extension (same folder as manifest.json, so "Load unpacked" on packages/extension works directly)
  // b) packages/extension/dist (mirror folder, so "Load unpacked" on packages/extension/dist works as well)
  const outputTargets = [
    { dir: __dirname, isRoot: true },
    { dir: distDir, isRoot: false },
  ];

  for (const target of outputTargets) {
    console.log(`2. Building extension artifacts in ${target.isRoot ? 'packages/extension' : 'packages/extension/dist'}...`);

    await Promise.all([
      esbuild.build({
        entryPoints: [path.resolve(__dirname, 'src/background.ts')],
        outfile: path.resolve(target.dir, 'background.js'),
        bundle: true,
        format: 'esm',
        target: 'es2022',
        sourcemap: false,
      }),
      esbuild.build({
        entryPoints: [path.resolve(__dirname, 'src/content-app.ts')],
        outfile: path.resolve(target.dir, 'content-app.js'),
        bundle: true,
        format: 'iife',
        target: 'es2022',
        sourcemap: false,
      }),
      esbuild.build({
        entryPoints: [path.resolve(__dirname, 'src/content-portal.ts')],
        outfile: path.resolve(target.dir, 'content-portal.js'),
        bundle: true,
        format: 'iife',
        target: 'es2022',
        sourcemap: false,
      }),
      esbuild.build({
        entryPoints: [path.resolve(__dirname, 'src/popup.ts')],
        outfile: path.resolve(target.dir, 'popup.js'),
        bundle: true,
        format: 'iife',
        target: 'es2022',
        sourcemap: false,
      }),
    ]);

    // Copy static files into target folder
    if (!target.isRoot) {
      fs.copyFileSync(path.resolve(__dirname, 'manifest.json'), path.resolve(target.dir, 'manifest.json'));
    }
    fs.copyFileSync(path.resolve(__dirname, 'public/popup.html'), path.resolve(target.dir, 'popup.html'));
    fs.copyFileSync(path.resolve(__dirname, 'public/popup.css'), path.resolve(target.dir, 'popup.css'));
    fs.copyFileSync(formCoreBundle, path.resolve(target.dir, 'form-core.iife.js'));
  }

  console.log('✓ Extension build completed successfully!');
  console.log('Manifest and all referenced files are ready in:');
  console.log(' -> packages/extension');
  console.log(' -> packages/extension/dist');
}

build().catch((err) => {
  console.error('Extension build failed:', err);
  process.exit(1);
});

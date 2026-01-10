import { build, context } from 'esbuild';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const isWatch = process.argv.includes('--watch');

const config = {
  entryPoints: [resolve(root, 'src/app.jsx')],
  outdir: resolve(root, 'public/js'),
  bundle: true,
  sourcemap: true,
  format: 'esm',
  target: ['es2020'],
  jsx: 'automatic',
  splitting: true,
  chunkNames: 'chunks/[name]-[hash]',
  minify: !isWatch,
  metafile: true,
  logLevel: 'info',
};

if (isWatch) {
  const ctx = await context(config);
  await ctx.watch();
  console.log('Watching for changes...');
} else {
  const result = await build(config);
  if (result.metafile) {
    const outputs = Object.keys(result.metafile.outputs);
    console.log(`Built ${outputs.length} files`);
  }
}

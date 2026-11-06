// Render every composition and finish it into the site's media folder.
//   EN -> media/videos/<name>.{mp4,webm}      BS -> media/videos/bs/<name>.{mp4,webm}
// Usage: node render_all.mjs [--only rbih-opening-en,trailer-bs] [--skip-render]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const SITE = path.resolve(HERE, '..', '..');
const OUT = path.join(HERE, 'out');
const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => (a.startsWith('--') ? [a.slice(2), arr[i + 1] ?? true] : [])).filter(Boolean));
const only = typeof args.only === 'string' ? args.only.split(',') : null;
const skipRender = args['skip-render'] === true || args['skip-render'] === 'true';

const comps = execFileSync(process.execPath, [path.join(HERE, 'node_modules', '@remotion', 'cli', 'remotion-cli.js'), 'compositions', 'src/index.ts', '--quiet'], { cwd: HERE, encoding: 'utf8' })
  .split(/\s+/).map((l) => l.trim()).filter((id) => /^(rbih|rs|hrhb|trailer)[-a-z]*-(en|bs)$/.test(id));
const todo = comps.filter((id) => !only || only.includes(id));
console.log(`[render_all] ${todo.length} compositions: ${todo.join(', ')}`);
fs.mkdirSync(OUT, { recursive: true });
const results = [];
for (const id of todo) {
  const lang = id.endsWith('-bs') ? 'bs' : 'en';
  const name = id.replace(/-(en|bs)$/, '').replace(/-/g, '_');
  const rendered = path.join(OUT, `${id}.mp4`);
  const t0 = Date.now();
  if (!skipRender || !fs.existsSync(rendered)) {
    execFileSync(process.execPath, [path.join(HERE, 'node_modules', '@remotion', 'cli', 'remotion-cli.js'), 'render', 'src/index.ts', id, rendered, '--log=error'], { cwd: HERE, stdio: 'inherit' });
  }
  const outBase = path.join(SITE, 'media', 'videos', lang === 'bs' ? 'bs' : '', name);
  const posterAt = name === 'trailer' ? 9.5 : 6.5;
  const line = execFileSync(process.execPath, [path.join(HERE, 'finalize.mjs'), rendered, outBase, '--poster-at', String(posterAt)], { cwd: HERE, encoding: 'utf8' }).trim();
  results.push(`${id}: ${((Date.now() - t0) / 1000).toFixed(0)}s  ${line}`);
  console.log(results[results.length - 1]);
}
fs.writeFileSync(path.join(OUT, 'render_all.log'), results.join('\n') + '\n');

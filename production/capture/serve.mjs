// Static server for the built tactical map + repo /data and /runs, with Range support
// (the browser build fetches /data/derived/startup/apr_1992_initial_save.json on New War).
// Usage: node serve.mjs [--repo F:/A-War-Without-Victory] [--port 3002]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => a.startsWith('--') ? [a.slice(2), arr[i + 1]] : []).filter(Boolean));
const REPO = path.resolve(args.repo ?? 'F:/A-War-Without-Victory');
const PORT = Number(args.port ?? 3002);
const DIST = path.join(REPO, 'dist', 'tactical-map');
const SAVES = path.resolve(args.saves ?? path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', 'raw', 'saves'));

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.geojson': 'application/geo+json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.ogg': 'audio/ogg', '.pmtiles': 'application/octet-stream', '.wasm': 'application/wasm' };

function resolveFile(urlPath) {
  const p = decodeURIComponent(urlPath.split('?')[0]);
  if (p.startsWith('/data/') || p.startsWith('/runs/')) return path.join(REPO, p);
  if (p.startsWith('/pitch_saves/')) return path.join(SAVES, p.slice('/pitch_saves/'.length));
  const f = path.join(DIST, p === '/' ? 'index.html' : p);
  return f;
}

const server = http.createServer((req, res) => {
  let file = resolveFile(req.url ?? '/');
  if (!file.startsWith(REPO) && !file.startsWith(SAVES)) { res.writeHead(403); res.end(); return; }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    // SPA fallback for app routes only
    if (!/^\/(data|runs|assets|pitch_saves)\//.test(req.url ?? '')) file = path.join(DIST, 'index.html');
    if (!fs.existsSync(file)) { res.writeHead(404); res.end('not found'); return; }
  }
  const stat = fs.statSync(file);
  const type = MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream';
  const range = req.headers.range;
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'no-store');
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    const start = m && m[1] ? Number(m[1]) : 0;
    const end = m && m[2] ? Number(m[2]) : stat.size - 1;
    res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Content-Length': end - start + 1 });
    fs.createReadStream(file, { start, end }).pipe(res);
    return;
  }
  res.writeHead(200, { 'Content-Type': type, 'Content-Length': stat.size });
  fs.createReadStream(file).pipe(res);
});
server.listen(PORT, '127.0.0.1', () => console.log(`[serve] http://127.0.0.1:${PORT}/  dist=${DIST}  saves=${SAVES}`));

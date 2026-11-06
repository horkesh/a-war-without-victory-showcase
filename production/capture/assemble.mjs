// frames + take.json -> CFR 60fps H.264 (near-lossless, for the edit).
// Usage: node assemble.mjs <take> [--fps 60]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const [take, ...rest] = process.argv.slice(2);
const args = Object.fromEntries(rest.map((a, i, arr) => (a.startsWith('--') ? [a.slice(2), arr[i + 1]] : [])).filter(Boolean));
const FPS = Number(args.fps ?? 60);
const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const dir = path.join(HERE, '..', 'raw', take);
const log = JSON.parse(fs.readFileSync(path.join(dir, 'take.json'), 'utf8'));
const frames = log.frames;
const end = log.endedAt ?? frames[frames.length - 1].ms;

// ffmpeg concat demuxer with per-frame durations (variable), then fps filter to CFR.
const lines = ['ffconcat version 1.0'];
for (let i = 0; i < frames.length; i++) {
  const next = i + 1 < frames.length ? frames[i + 1].ms : end;
  const dur = Math.max(1, next - frames[i].ms) / 1000;
  lines.push(`file 'frames/${String(frames[i].i).padStart(6, '0')}.jpg'`, `duration ${dur.toFixed(4)}`);
}
lines.push(`file 'frames/${String(frames[frames.length - 1].i).padStart(6, '0')}.jpg'`);
fs.writeFileSync(path.join(dir, 'frames.ffconcat'), lines.join('\n'));

const out = path.join(dir, 'raw.mp4');
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', 'frames.ffconcat', '-vf', `fps=${FPS},format=yuv420p`, '-c:v', 'libx264', '-preset', 'fast', '-crf', '12', out], { cwd: dir, stdio: 'inherit' });
console.log(`[assemble] ${take}: ${frames.length} frames over ${(end / 1000).toFixed(1)}s -> ${out}`);
console.log(`[assemble] actions: ${log.actions.map((a) => `${(a.ms / 1000).toFixed(1)}s ${a.name}${a.text ? ':' + a.text : a.testid ? ':' + a.testid : ''}`).join(' | ')}`);

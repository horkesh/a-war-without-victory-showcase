// Finish a Remotion render for the web: two-pass EBU R128 loudness to -14 LUFS / -1.5 dBTP,
// H.264 MP4 (yuv420p, faststart) + VP9/Opus WebM, and a poster frame. Published names follow the
// site's existing media/videos/<name>.{mp4,webm} convention.
// Usage: node finalize.mjs <in.mp4> <outBaseNameWithoutExt> [--poster-at 6.5]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

// ffmpeg analysis filters report on stderr; execFileSync only returns stdout.
const ffmpegStderr = (args) => {
  const r = spawnSync('ffmpeg', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.error) throw r.error;
  return String(r.stderr ?? '');
};

const [input, outBase, ...rest] = process.argv.slice(2);
if (!input || !outBase) throw new Error('usage: node finalize.mjs <in.mp4> <outBase> [--poster-at s]');
const args = Object.fromEntries(rest.map((a, i, arr) => (a.startsWith('--') ? [a.slice(2), arr[i + 1]] : [])).filter(Boolean));
const posterAt = Number(args['poster-at'] ?? 6.5);
fs.mkdirSync(path.dirname(outBase), { recursive: true });

const run = (a, opts = {}) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...a], { encoding: 'utf8', ...opts });

// Pass 1: measure (loudnorm prints its JSON on stderr).
const stderr = ffmpegStderr(['-hide_banner', '-nostats', '-i', input, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-']);
const jsonText = stderr.slice(stderr.lastIndexOf('{'), stderr.lastIndexOf('}') + 1);
const m = JSON.parse(jsonText);
// Linear gain keeps the mix's dynamics; a true-peak limiter after it holds the -1.5 dBTP ceiling
// (the map tours with the fuller campaign tracks otherwise peak above 0 dBTP).
const ln = `loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true:print_format=summary,alimiter=limit=0.84:attack=5:release=60:level=false`;

// Pass 2: encode MP4 + WebM from the same normalised audio.
// GitHub Pages serves these straight from the repo, and the full set is 16 clips: H.264 only
// (every browser the lightbox targets plays it), crf 24 keeps a 47 s map tour under ~18 MB.
run(['-i', input, '-af', ln, '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', `${outBase}.mp4`]);
run(['-ss', String(posterAt), '-i', `${outBase}.mp4`, '-frames:v', '1', `${outBase}_poster.png`]);

const check = ffmpegStderr(['-hide_banner', '-nostats', '-i', `${outBase}.mp4`, '-af', 'ebur128=peak=true', '-f', 'null', '-']);
const integrated = /I:\s+(-?[\d.]+) LUFS/.exec(check.slice(check.lastIndexOf('Integrated loudness')))?.[1];
const peak = /Peak:\s+(-?[\d.]+) dBFS/.exec(check.slice(check.lastIndexOf('True peak')))?.[1];
const dur = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', `${outBase}.mp4`], { encoding: 'utf8' }).trim();
const sz = (f) => (fs.statSync(f).size / 1024 / 1024).toFixed(1) + ' MB';
console.log(`[finalize] ${path.basename(outBase)}: ${Number(dur).toFixed(1)}s, ${integrated} LUFS, peak ${peak} dBTP, mp4 ${sz(outBase + '.mp4')}`);

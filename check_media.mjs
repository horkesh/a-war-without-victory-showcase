// Publication standard: every still on this site is a real 1920x1080 capture.
//
// WHY THIS EXISTS
// The 1920x1080 re-shoot missed one file. The capture step for the HRHB decision
// room looked for controls named "OPEN REVIEW" / "REVIEW PRIORITIES"; HRHB
// exposes that queue as the "N REVIEWS" toolbar chip, so the step SKIPPED
// without failing, wrote nothing, and the stale 1440x900 file from the earlier
// round stayed in the repo and stayed published on both language versions.
// Nobody noticed, because a skipped capture and a successful one look identical
// from the outside — the old file is still sitting there.
//
// So the standard is checked against the FILES, not against the capture run.
// Run before publishing:  node check_media.mjs
import fs from 'node:fs';
import path from 'node:path';

const REQUIRED = { width: 1920, height: 1080 };
const ROOT = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const MEDIA = path.join(ROOT, 'media');

function dimensions(file) {
  const b = fs.readFileSync(file);
  if (b.slice(1, 4).toString() === 'PNG') return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i < b.length - 8) {
      if (b[i] !== 0xff) { i += 1; continue; }
      const m = b[i + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
        return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
      }
      i += 2 + b.readUInt16BE(i + 2);
    }
  }
  return null;
}

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

const images = walk(MEDIA).filter((f) => /\.(png|jpe?g)$/i.test(f));
const pages = ['index.html', path.join('bs', 'index.html')]
  .map((p) => path.join(ROOT, p))
  .filter((p) => fs.existsSync(p))
  .map((p) => fs.readFileSync(p, 'utf8'))
  .join('\n');

const bad = [];
const orphans = [];
for (const file of images) {
  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  const d = dimensions(file);
  // Only enforce the standard on stills the site actually shows. An unreferenced
  // file is reported separately: it is clutter, not a published defect.
  if (!pages.includes(rel.replace(/^media\//, ''))) { orphans.push(rel); continue; }
  if (!d) bad.push(`${rel}  UNREADABLE`);
  else if (d.width !== REQUIRED.width || d.height !== REQUIRED.height) {
    bad.push(`${rel}  ${d.width}x${d.height}  (expected ${REQUIRED.width}x${REQUIRED.height})`);
  }
}

console.log(`checked ${images.length} images, ${images.length - orphans.length} referenced by a page`);
if (orphans.length) {
  console.log(`\n${orphans.length} unreferenced file(s) — not published, not enforced:`);
  for (const o of orphans) console.log(`  ${o}`);
}
if (bad.length) {
  console.error(`\nFAIL — ${bad.length} published still(s) are not ${REQUIRED.width}x${REQUIRED.height}:`);
  for (const b of bad) console.error(`  ${b}`);
  console.error('\nRe-capture these before publishing. A stale file from an earlier round looks');
  console.error('exactly like a fresh one; only its dimensions give it away.');
  process.exit(1);
}
console.log(`\nPASS — every published still is ${REQUIRED.width}x${REQUIRED.height}.`);

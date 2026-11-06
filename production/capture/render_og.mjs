// Renders og.png (2400x1260): the hero frame, the mark and wordmark, the page's headline and standfirst.
// Chromium comes from the game repo's node_modules, like the rest of the rig. Run: node production/capture/render_og.mjs
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const GAME_REPO = 'F:/A-War-Without-Victory';
const require = createRequire(path.join(GAME_REPO, 'package.json'));
const { chromium } = require('playwright');

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const poster = fs.readFileSync(path.join(root, 'media', 'videos', 'hero_loop_poster.jpg')).toString('base64');
const markSvg = fs.readFileSync(path.join(GAME_REPO, 'docs/50_launch/marketing/logo/convergence/awwv-mark-light.svg'), 'utf8');

const html = `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@600&family=IBM+Plex+Sans+Condensed:wght@600&family=Source+Serif+4:opsz,wght@8..60,400&display=swap">
<style>
  html, body { margin: 0; width: 2400px; height: 1260px; overflow: hidden; background: #0d100f; color: #e7e3d8; }
  .bg { position: absolute; inset: 0; background: url(data:image/jpeg;base64,${poster}) center / cover no-repeat; }
  .shade { position: absolute; inset: 0; background: linear-gradient(to top, rgb(13 16 15 / 0.96) 0%, rgb(13 16 15 / 0.62) 45%, rgb(13 16 15 / 0.18) 80%, rgb(13 16 15 / 0.55) 100%); }
  .brand { position: absolute; left: 130px; top: 110px; display: flex; align-items: center; gap: 28px; }
  .brand svg { width: 96px; height: 96px; }
  .brand .t { font: 600 40px/1 "IBM Plex Sans Condensed", sans-serif; letter-spacing: 0.035em; text-transform: uppercase; }
  .brand .s { margin-top: 10px; font: 600 15px/1 "IBM Plex Mono", monospace; letter-spacing: 0.18em; text-transform: uppercase; opacity: 0.72; }
  .text { position: absolute; left: 130px; bottom: 150px; width: 1900px; }
  h1 { margin: 0; font: 600 168px/0.98 "IBM Plex Sans Condensed", sans-serif; letter-spacing: -0.005em; }
  p { margin: 56px 0 0; font: 400 54px/1.4 "Source Serif 4", Georgia, serif; max-width: 1380px; }
</style></head><body>
<div class="bg"></div><div class="shade"></div>
<div class="brand">${markSvg}<div><div class="t">A War Without Victory</div><div class="s">Bosnia-Herzegovina · 1992-1995</div></div></div>
<div class="text"><h1>Command a war that cannot be won.</h1><p>A political and military simulation of the Bosnian War, 1992 to 1995. Play one of the three presidencies through 188 weekly turns.</p></div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 2400, height: 1260 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: path.join(root, 'og.png'), type: 'png' });
await browser.close();
console.log('wrote og.png');

// Directive take in the REAL Electron shell (the browser build renders the presidential levers inert):
// week-68 desk -> reviews chip -> Decision Room -> review a reserve request -> the directive card -> issue -> receipt.
// Hydrates BOTH sides from saves/pitch_<faction>_w68.json: main process via window.awwv.loadSaveRecord,
// renderer via the launcher's #mm-file-input (the IPC alone leaves the launcher UI unhydrated).
// Usage: node record_directive.mjs RBiH
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { RAW, REPO } from './record_lib.mjs';

const { _electron } = createRequire(path.join(REPO, 'package.json'))('playwright');
const faction = process.argv[2] ?? 'RBiH';
const take = `${faction.toLowerCase()}_directive`;
const dir = path.join(RAW, take);
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(path.join(dir, 'frames'), { recursive: true });
const saveName = `pitch_${faction.toLowerCase()}_w68.json`;
if (!fs.existsSync(path.join(REPO, 'saves', saveName))) throw new Error(`stage ${saveName} in ${REPO}/saves first`);

const log = { take, width: 1920, height: 1080, frames: [], actions: [], errors: [] };
let wall0 = 0;
const mark = (name, extra = {}) => { log.actions.push({ name, ms: Date.now() - wall0, ...extra }); };
const beat = (b) => mark('beat', { beat: b });
const hold = (ms) => new Promise((r) => setTimeout(r, ms));

const app = await _electron.launch({
  executablePath: path.join(REPO, 'node_modules', 'electron', 'dist', 'electron.exe'),
  // Scale factor 1 so a 1920x1080 content area fits a HiDPI desktop without the OS clamping the height.
  args: ['.', '--force-device-scale-factor=1', `--user-data-dir=${path.join(dir, 'profile')}`],
  cwd: REPO,
  env: { ...process.env, ELECTRON_RUN_AS_NODE: undefined },
});
let cdp;
try {
  // Dev mode may open DevTools as its own window first: wait for the warroom window specifically.
  let page = null;
  for (let i = 0; i < 120 && !page; i++) {
    page = (await app.windows()).find((w) => w.url().startsWith('awwv://')) ?? null;
    if (!page) await hold(500);
  }
  if (!page) throw new Error('warroom window not found');
  page.on('pageerror', (e) => log.errors.push(String(e.message)));
  await app.evaluate(({ BrowserWindow }) => {
    for (const w of BrowserWindow.getAllWindows()) {
      if (w.webContents.getURL().startsWith('awwv://')) { w.setContentSize(1920, 1080); w.center(); w.focus(); }
    }
  });
  await page.waitForTimeout(2500);

  // Hide the DEV chip + the browser-only bridge notice inside the embedded app, same rule as the browser rig.
  const hider = () => setInterval(() => {
    for (const b of document.querySelectorAll('button')) if (b.children.length === 0 && (b.textContent || '').trim() === 'DEV') b.style.display = 'none';
  }, 250);

  const frameOf = () => page.frames().find((f) => f.url().includes('embedded=1'));
  await page.waitForFunction(() => (document.body?.innerText ?? '').includes('ASSUME RESPONSIBILITY'), null, { timeout: 60000 }).catch(() => {});

  // Screencast on the main window (covers the launcher and the embedded iframe).
  cdp = await page.context().newCDPSession(page);
  await cdp.send('Page.enable');
  let recording = false;
  cdp.on('Page.screencastFrame', async (f) => {
    if (recording) {
      const i = log.frames.length;
      fs.writeFileSync(path.join(dir, 'frames', String(i).padStart(6, '0') + '.jpg'), Buffer.from(f.data, 'base64'));
      log.frames.push({ i, t: f.metadata.timestamp });
    }
    await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
  });

  // The opening, menu and operational shell all live in the embedded React app (iframe, embedded=1).
  let f = null;
  for (let i = 0; i < 120 && !f; i++) { await hold(500); f = frameOf(); }
  if (!f) throw new Error('embedded operational shell frame not found');
  await f.evaluate(hider);
  await f.waitForFunction(() => /ASSUME RESPONSIBILITY/i.test(document.body?.innerText ?? ''), null, { timeout: 60000 });
  await f.evaluate(() => { const b = Array.from(document.querySelectorAll('button, [role="button"]')).find((x) => /assume responsibility/i.test(x.textContent || '')); b?.click(); });
  await f.waitForFunction(() => /new war/i.test(document.body?.innerText ?? ''), null, { timeout: 60000 });
  await hold(800);

  // Hydrate the MAIN process (sim truth) through the preload bridge on the top window, then the renderer.
  const result = await page.evaluate(async (name) => window.awwv.loadSaveRecord(name), saveName);
  if (!result?.ok || typeof result.stateJson !== 'string') throw new Error(`loadSaveRecord failed: ${result?.error}`);
  mark('load-save-main', { file: saveName });
  await f.waitForFunction(() => typeof window.handleManualSaveLoad === 'function', null, { timeout: 30000 });
  await f.evaluate(async (json) => { await window.handleManualSaveLoad(JSON.parse(json)); }, result.stateJson);
  mark('load-save-renderer');
  await hold(1500);
  if (await f.evaluate(() => /continue/i.test(document.body?.innerText ?? ''))) {
    await f.evaluate(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /continue/i.test(x.textContent || '')); b?.click(); });
  }
  await f.waitForSelector('[data-testid="tactical-map-viewport"]', { state: 'visible', timeout: 120000 });
  await f.waitForFunction(() => !/PREPARING OPERATIONAL MAP/i.test(document.body?.innerText ?? ''), null, { timeout: 120000 });
  await hold(1500);

  const clearPopups = async () => {
    for (const nn of ['acknowledged', 'acknowledge', 'review later']) {
      const ok = await f.evaluate((needle) => {
        const visible = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
        const btn = Array.from(document.querySelectorAll('button')).filter(visible).find((b) => (b.textContent || '').trim().toLowerCase() === needle);
        if (btn) { btn.click(); return true; }
        return false;
      }, nn);
      if (ok) { mark('popup-clear', { label: nn }); await hold(400); }
    }
  };
  // Click a visible control by label regex; logs the control's on-screen centre so the edit can zoom to it.
  const clickText = async (re, opts = {}) => {
    const ok = await f.evaluate(({ src, flags, within }) => {
      const rx = new RegExp(src, flags);
      const root = within ? document.querySelector(within) : document;
      const visible = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
      const c = Array.from((root ?? document).querySelectorAll('button, [role="button"], a')).filter(visible)
        .filter((el) => rx.test([el.textContent, el.getAttribute('aria-label')].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()));
      if (!c[0]) return null;
      const r = c[0].getBoundingClientRect();
      c[0].click();
      return { text: (c[0].textContent || c[0].getAttribute('aria-label') || '').trim().slice(0, 80), x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
    }, { src: re.source, flags: re.flags, within: opts.within ?? null });
    if (ok === null) throw new Error(`no control matching ${re}`);
    mark('click', ok);
    return ok.text;
  };
  // Bring a control into view (smooth) and report its centre; the act card sits below the fold of the dossier panel.
  const revealText = async (re) => {
    const pos = await f.evaluate(({ src, flags }) => {
      const rx = new RegExp(src, flags);
      const el = Array.from(document.querySelectorAll('button, [role="button"], [data-testid]')).find((x) => rx.test([x.textContent, x.getAttribute('aria-label'), x.getAttribute('data-testid')].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()));
      if (!el) return null;
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return true;
    }, { src: re.source, flags: re.flags });
    await hold(1200);
    const rect = await f.evaluate(({ src, flags }) => {
      const rx = new RegExp(src, flags);
      const el = Array.from(document.querySelectorAll('button, [role="button"], [data-testid]')).find((x) => rx.test([x.textContent, x.getAttribute('aria-label'), x.getAttribute('data-testid')].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()));
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), w: Math.round(r.width), h: Math.round(r.height) };
    }, { src: re.source, flags: re.flags });
    if (pos && rect) mark('reveal', { re: re.source, ...rect });
    return rect;
  };

  await clearPopups(); await clearPopups();
  recording = true;
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 });
  await hold(500);
  if (!log.frames.length) throw new Error('no screencast frames');
  wall0 = Date.now();
  beat('map-w68');
  await hold(3000);

  await clickText(/REVIEWS/);
  await f.waitForSelector('[data-testid="presidential-decision-room"], [data-testid="warroom-decision-room-host"]', { state: 'visible', timeout: 30000 });
  beat('decision-room');
  await hold(4000);

  // The first "Review" on a card opens its dossier; the act card (directive) sits further down that panel.
  await clickText(/^Review$/i);
  beat('review-card');
  await f.waitForSelector('[data-testid="directive-card-header-art"], [data-testid="directive-card-stakes"]', { state: 'visible', timeout: 30000 }).catch(() => {});
  await hold(3500);
  await revealText(/directive-card-header-art|directive-card-stakes/);
  beat('directive-card');
  await hold(2500);
  const act = await revealText(/^(issue|authorize|approve)/i);
  mark('act-visible', { ...(act ?? {}) });
  await hold(2500);

  const issued = await clickText(/^(issue|authorize|approve)/i);
  beat('issued');
  await f.waitForSelector('[data-testid="decision-room-action-receipt"]', { state: 'visible', timeout: 30000 }).catch(() => {});
  await hold(1500);
  await revealText(/decision-room-action-receipt/);
  beat('receipt');
  await hold(4500);

  await clickText(/Close Decision Room/i);
  await hold(1500);
  beat('desk');
  await hold(2500);
  await clickText(/^War Map/i);
  await f.waitForSelector('[data-testid="tactical-map-viewport"]', { state: 'visible', timeout: 30000 });
  beat('map-end');
  await hold(3500);
  await page.screenshot({ path: path.join(dir, 'final.png') });
  mark('issued-label', { text: issued });
} catch (e) {
  try { const p = await app.firstWindow(); await p.screenshot({ path: path.join(dir, 'error.png') }); } catch {}
  console.error('[directive] failed:', e);
  process.exitCode = 1;
} finally {
  if (cdp) await cdp.send('Page.stopScreencast').catch(() => {});
  log.endedAt = wall0 ? Date.now() - wall0 : 0;
  const f0 = log.frames[0]?.t ?? 0;
  log.frames = log.frames.map(({ i, t }) => ({ i, ms: Math.round((t - f0) * 1000) })).sort((a, b) => a.ms - b.ms);
  fs.writeFileSync(path.join(dir, 'take.json'), JSON.stringify(log, null, 1));
  await app.close().catch(() => {});
  console.log(`[directive] ${take}: ${log.frames.length} frames, ${(log.endedAt / 1000).toFixed(1)}s, errors=${log.errors.length}`);
  console.log(log.actions.map((a) => `${(a.ms / 1000).toFixed(1)}s ${a.name} ${a.beat ?? a.text ?? a.label ?? ''}`).join('\n'));
  if (log.errors.length) console.log('page errors:', log.errors.slice(0, 5));
}

// Recorder: Playwright Chromium at 1920x1080, CDP screencast with per-frame timestamps,
// and an action log (name + ms offset) so the edit can place UI SFX and cut on action.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

export const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
export const RAW = path.resolve(HERE, '..', 'raw');
// Playwright comes from the game repo's node_modules (no junctions: see the rm -rf incident note).
export const REPO = path.resolve(process.env.AWWV_REPO ?? 'F:/A-War-Without-Victory');
const { chromium } = createRequire(path.join(REPO, 'package.json'))('playwright');

const CLICKABLE = 'button, [role="button"], a';

// Runs inside the page: visible clickable controls whose label matches, best match first.
function pageFindMatches(a) {
  const n = a.needle.toLowerCase();
  const label = (el) => [el.textContent, el.getAttribute('aria-label'), el.getAttribute('title')]
    .filter(Boolean).join(' ').replace(/\s+/g, ' ').trim().toLowerCase();
  return Array.from(document.querySelectorAll(a.sel))
    .map((el) => ({ el, l: label(el) }))
    .filter(({ el, l }) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && (a.exact ? l === n : l.includes(n));
    })
    .sort((x, y) => (x.l === n ? 0 : 1) - (y.l === n ? 0 : 1) || x.l.length - y.l.length);
}

export async function openRecorder({ take, url = 'http://127.0.0.1:3002/?dev=1', width = 1920, height = 1080, headless = true }) {
  const dir = path.join(RAW, take);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(path.join(dir, 'frames'), { recursive: true });
  const browser = await chromium.launch({ headless, args: ['--force-device-scale-factor=1', '--hide-scrollbars'] });
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  // Rig artifact, not product state: the `?dev=1` DEV chip in the tactical toolbar (no testid; matched by text).
  await context.addInitScript(() => {
    setInterval(() => {
      for (const b of document.querySelectorAll('button')) {
        if (b.children.length === 0 && (b.textContent || '').trim() === 'DEV') b.style.display = 'none';
      }
      // Browser-only notice; the packaged desktop app has the bridge (screenshot_plan.md capture rules).
      for (const el of document.querySelectorAll('p, div, span, section')) {
        if (el.children.length <= 2 && /desktop (command )?bridge unavailable/i.test(el.textContent || '') && (el.textContent || '').length < 260) el.style.visibility = 'hidden';
      }
    }, 250);
  });
  const log = { take, width, height, frames: [], actions: [], errors: [] };
  page.on('pageerror', (e) => log.errors.push(String(e.message)));
  page.on('console', (m) => { if (m.type() === 'error') log.errors.push(m.text()); });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch {} });
  await page.reload({ waitUntil: 'domcontentloaded' });

  const cdp = await context.newCDPSession(page);
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

  const rec = {
    page, context, browser, dir, log, wall0: 0,
    async start() {
      recording = true;
      await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: width, maxHeight: height, everyNthFrame: 1 });
      await page.waitForTimeout(400);
      if (!log.frames.length) throw new Error('screencast produced no frames');
      rec.wall0 = Date.now();
    },
    /** Record an action at the current moment (ms since start()). */
    mark(name, extra = {}) {
      const ms = Date.now() - rec.wall0;
      log.actions.push({ name, ms, ...extra });
      return ms;
    },
    async hold(ms) { await page.waitForTimeout(ms); },
    async stop() {
      recording = false;
      await cdp.send('Page.stopScreencast').catch(() => {});
      log.endedAt = rec.wall0 ? Date.now() - rec.wall0 : 0;
      const f0 = log.frames[0]?.t ?? 0;
      log.frames = log.frames.map(({ i, t }) => ({ i, ms: Math.round((t - f0) * 1000) })).sort((a, b) => a.ms - b.ms);
      fs.writeFileSync(path.join(dir, 'take.json'), JSON.stringify(log, null, 1));
      await browser.close();
      return log;
    },

    // ---- UI helpers. Synthetic DOM clicks: modal backdrops swallow real pointer events. ----
    async clickText(text, { timeout = 30000, exact = false } = {}) {
      const arg = { needle: text, exact, sel: CLICKABLE };
      await page.waitForFunction(`(${pageFindMatches.toString()})(${JSON.stringify(arg)}).length > 0`, null, { timeout });
      const ok = await page.evaluate(`(() => { const c = (${pageFindMatches.toString()})(${JSON.stringify(arg)}); if (!c[0]) return false; c[0].el.click(); return true; })()`);
      if (!ok) throw new Error(`clickText: no visible control "${text}"`);
      rec.mark('click', { text });
    },
    async clickTestId(id, { timeout = 30000, nth = 0 } = {}) {
      const sel = `[data-testid="${id}"]`;
      await page.waitForSelector(sel, { state: 'visible', timeout });
      const ok = await page.evaluate(({ sel, nth }) => {
        const els = Array.from(document.querySelectorAll(sel)).filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
        const el = els[nth];
        if (!el) return false;
        el.click();
        return true;
      }, { sel, nth });
      if (!ok) throw new Error(`clickTestId: ${id} not visible`);
      rec.mark('click', { testid: id });
    },
    async clickSelector(sel, { timeout = 30000 } = {}) {
      await page.waitForSelector(sel, { state: 'visible', timeout });
      await page.evaluate((s) => document.querySelector(s).click(), sel);
      rec.mark('click', { selector: sel });
    },
    async waitText(text, timeout = 30000) {
      await page.waitForFunction((n) => (document.body?.innerText ?? '').toLowerCase().includes(n.toLowerCase()), text, { timeout });
    },
    async waitTextGone(text, timeout = 30000) {
      await page.waitForFunction((n) => !(document.body?.innerText ?? '').toLowerCase().includes(n.toLowerCase()), text, { timeout });
    },
    async hasText(text) {
      return page.evaluate((n) => (document.body?.innerText ?? '').toLowerCase().includes(n.toLowerCase()), text);
    },
    /**
     * Clear popups that arrive on their own schedule: intelligence-channel / event dialogs, and the
     * pending peace-plan modal (its "Review Later" button lives outside any role=dialog, and its
     * backdrop sits over everything until it is cleared).
     */
    async clearPopups(labels = ['Acknowledged', 'Acknowledge', 'Review Later', 'Read later', 'Dismiss', 'Close']) {
      let n = 0;
      for (const l of labels) {
        const ok = await page.evaluate((needle) => {
          const nn = needle.toLowerCase();
          const visible = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
          const dialogs = Array.from(document.querySelectorAll('[role="dialog"], [aria-modal="true"]')).filter(visible);
          for (const d of dialogs) {
            const btn = Array.from(d.querySelectorAll('button')).find((b) => (b.textContent || '').trim().toLowerCase() === nn);
            if (btn) { btn.click(); return true; }
          }
          if (nn === 'review later' || nn === 'acknowledge') {
            const btn = Array.from(document.querySelectorAll('button')).filter(visible).find((b) => (b.textContent || '').trim().toLowerCase() === nn);
            if (btn) { btn.click(); return true; }
          }
          return false;
        }, l);
        if (ok) { n++; rec.mark('popup-clear', { label: l }); await page.waitForTimeout(350); }
      }
      return n;
    },
    async loadSave(file) {
      const json = JSON.parse(fs.readFileSync(file, 'utf8'));
      await page.waitForFunction(() => typeof window.handleManualSaveLoad === 'function', null, { timeout: 30000 });
      await page.evaluate(async (j) => { await window.handleManualSaveLoad(j); }, json);
      rec.mark('load-save', { file: path.basename(file) });
    },
    async shot(name) { await page.screenshot({ path: path.join(dir, name + '.png') }); },
    async bodyText(max = 3000) { return (await page.evaluate(() => document.body?.innerText ?? '')).replace(/\s+/g, ' ').slice(0, max); },
  };
  return rec;
}

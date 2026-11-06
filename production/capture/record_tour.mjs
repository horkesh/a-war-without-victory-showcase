// Command tour take at week 68: map -> command briefing -> Army HQ -> a brigade on the map (zoom) -> chronicle -> decision room.
// Never press Escape in the tactical shell: it opens the pause menu. Use route buttons and explicit close controls.
// Usage: node record_tour.mjs RBiH|RS|HRHB [--headed]
import path from 'node:path';
import { openRecorder, RAW } from './record_lib.mjs';

const faction = process.argv[2] ?? 'RBiH';
const headed = process.argv.includes('--headed');
const take = `${faction.toLowerCase()}_tour`;
const save = path.join(RAW, 'saves', `${faction.toLowerCase()}_w68.json`);

const rec = await openRecorder({ take, headless: !headed });
const { page } = rec;
const beat = (name) => rec.mark('beat', { beat: name });
const MAP = '[data-testid="tactical-map-viewport"]';

try {
  await rec.waitText('ASSUME RESPONSIBILITY');
  await page.keyboard.press('Enter');
  await rec.waitText('New War');
  await rec.loadSave(save);
  await rec.hold(1500);
  if (await rec.hasText('Continue')) await rec.clickText('Continue');
  await page.waitForSelector(MAP, { state: 'visible', timeout: 90000 });
  await rec.waitTextGone('PREPARING OPERATIONAL MAP', 90000);
  await rec.hold(1500);
  for (let i = 0; i < 3; i++) { if (!(await rec.clearPopups())) break; await rec.hold(400); }
  await rec.hold(600);
  await rec.start();
  beat('map-w68');
  await rec.hold(3500);

  // 1. Command briefing (the red banner on the map): open the list, then collapse it.
  if (await rec.hasText('COMMAND BRIEFING')) {
    await rec.clickText('Review', { exact: true }).catch(() => rec.clickText('Review'));
    beat('command-briefing');
    await rec.hold(4000);
    await rec.clickText('Collapse').catch(() => rec.clickTestId('command-briefing-dismiss').catch(() => {}));
    await rec.hold(600);
  }

  // 2. Army HQ: the briefing, then one corps order of battle; return through the War Map route.
  await rec.clickTestId('toolbar-route-army-hq');
  await page.waitForSelector('[data-testid="army-hq-modal"]', { state: 'visible', timeout: 30000 });
  beat('army-hq');
  await rec.hold(4000);
  await rec.clickText('command card').catch(() => {});
  beat('corps-orbat');
  await rec.hold(4000);
  await rec.clickTestId('toolbar-route-war-map');
  await page.waitForSelector(MAP, { state: 'visible', timeout: 30000 });
  await rec.hold(800);

  // 3. The map: pick a friendly brigade counter (accessible name carries the brigade name), then zoom in on it.
  await rec.clearPopups();
  const counter = await page.evaluate((sel) => {
    const main = document.querySelector(sel) ?? document;
    const name = (b) => (b.getAttribute('aria-label') || b.textContent || '').trim();
    const b = Array.from(main.querySelectorAll('button')).find((x) => /(mountain|motorized|light|infantry|liberation|brigade)/i.test(name(x)) && !/review|enemy|stack/i.test(name(x)));
    if (!b) return null;
    const r = b.getBoundingClientRect();
    if (r.width <= 0) return null;
    b.click();
    return { name: name(b), x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
  }, 'main[aria-label*="Tactical map"]');
  if (!counter) throw new Error('no friendly brigade counter found on the map');
  rec.mark('click', { text: counter.name, x: counter.x, y: counter.y });
  beat('brigade-selected');
  await rec.hold(3500);
  // Focus the map at the counter, then zoom with the map's own keyboard controls.
  await page.mouse.move(counter.x, counter.y);
  for (let i = 0; i < 3; i++) { await page.keyboard.press('Equal'); rec.mark('key', { key: '+' }); await rec.hold(700); }
  beat('zoomed');
  await rec.hold(4000);
  await page.keyboard.press('Home');
  rec.mark('key', { key: 'Home' });
  await rec.hold(1500);

  // 4. Chronicle.
  await rec.clickTestId('toolbar-route-chronicle');
  await page.waitForSelector('[data-testid="chronicle-overlay"]', { state: 'visible', timeout: 30000 });
  beat('chronicle');
  await rec.hold(4000);
  await rec.clickTestId('chronicle-close');
  await rec.hold(800);

  // 5. The reviews chip opens the Presidential Decision Room on the desk.
  await rec.clearPopups();
  await rec.clickText('REVIEWS');
  await page.waitForSelector('[data-testid="presidential-decision-room"], [data-testid="warroom-decision-room-host"]', { state: 'visible', timeout: 30000 });
  beat('decision-room');
  await rec.hold(5000);
  await rec.clickText('Dossier').catch(() => {});
  beat('dossier');
  await rec.hold(3500);
  await rec.clickText('Close Decision Room');
  await rec.hold(1200);
  beat('desk');
  await rec.hold(2500);
  await rec.clickText('War Map', { exact: true });
  await page.waitForSelector(MAP, { state: 'visible', timeout: 30000 });
  beat('map-end');
  await rec.hold(3500);
  await rec.shot('final');
} catch (e) {
  await rec.shot('error');
  console.error('[tour] failed:', e);
  process.exitCode = 1;
} finally {
  const log = await rec.stop();
  console.log(`[tour] ${take}: ${log.frames.length} frames, ${(log.endedAt / 1000).toFixed(1)}s, errors=${log.errors.length}`);
  console.log(log.actions.map((a) => `${(a.ms / 1000).toFixed(1)}s ${a.name} ${a.beat ?? a.text ?? a.testid ?? a.key ?? a.label ?? ''}`).join('\n'));
  if (log.errors.length) console.log('page errors:', log.errors.slice(0, 5));
}

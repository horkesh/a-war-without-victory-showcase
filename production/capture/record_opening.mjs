// Opening take: splash -> menu -> faction dossier -> mode -> Begin -> war starts -> desk -> war map.
// Usage: node record_opening.mjs RBiH|RS|HRHB [--headed]
import { openRecorder } from './record_lib.mjs';

const faction = process.argv[2] ?? 'RBiH';
const headed = process.argv.includes('--headed');
const take = `${faction.toLowerCase()}_opening`;

const rec = await openRecorder({ take, headless: !headed });
const { page } = rec;
try {
  await rec.waitText('ASSUME RESPONSIBILITY');
  await rec.hold(300);
  await rec.start();
  rec.mark('beat', { beat: 'splash' });
  await rec.hold(2500);

  await page.keyboard.press('Enter');                       // splash swallows clicks until Enter
  rec.mark('key', { key: 'Enter' });
  await rec.waitText('New War');
  rec.mark('beat', { beat: 'menu' });
  await rec.hold(2200);

  await rec.clickText('New War');
  await page.waitForSelector(`[data-testid="main-menu-faction-${faction}"]`, { state: 'visible' });
  rec.mark('beat', { beat: 'faction-picker' });
  await rec.hold(1800);

  await rec.clickTestId(`main-menu-faction-${faction}`);
  await rec.waitText('Take command');
  rec.mark('beat', { beat: 'dossier' });
  await rec.hold(3500);

  await rec.clickText('Take command', { exact: true });
  await rec.waitText('How should the war unfold?');
  rec.mark('beat', { beat: 'mode' });
  await rec.hold(2200);

  await rec.clickText('Begin', { exact: true });
  await rec.waitText('WAR HAS STARTED', 60000);
  rec.mark('beat', { beat: 'war-has-started' });
  await rec.hold(3200);

  // The date sting may auto-dismiss; acknowledge if it offers to.
  const ack = await rec.clearPopups(['Acknowledge']);
  if (!ack) {
    const ok = await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button')).find((x) => /acknowledge/i.test(x.textContent || ''));
      if (b) { b.click(); return true; } return false;
    });
    if (ok) rec.mark('click', { text: 'Acknowledge' });
  }
  await rec.waitTextGone('WAR HAS STARTED', 30000);
  await page.waitForSelector('[data-testid="presidential-inbox-opening-brief"]', { state: 'visible', timeout: 30000 });
  rec.mark('beat', { beat: 'desk' });
  await rec.hold(3500);

  await rec.clickText('War Map', { exact: true });
  await page.waitForSelector('[data-testid="tactical-map-viewport"]', { state: 'visible', timeout: 60000 });
  rec.mark('beat', { beat: 'war-map' });
  await rec.hold(6000);
  await rec.shot('final');
} catch (e) {
  await rec.shot('error');
  console.error('[opening] failed:', e);
  process.exitCode = 1;
} finally {
  const log = await rec.stop();
  console.log(`[opening] ${take}: ${log.frames.length} frames, ${(log.endedAt / 1000).toFixed(1)}s, errors=${log.errors.length}`);
  console.log(log.actions.map((a) => `${(a.ms / 1000).toFixed(1)}s ${a.name} ${a.beat ?? a.text ?? a.testid ?? a.key ?? a.label ?? ''}`).join('\n'));
}

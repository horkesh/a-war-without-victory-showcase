// Planner: take.json (beats + actions) -> edit plan for Remotion.
// Rule: each beat keeps its first `hold` ms at 1x, then CUTS to the next beat (static tails are
// dead time); beats marked `ramp` speed through their tail instead (camera motion, scrolling).
// Also copies the assembled raw take into remotion/public/raw/ and writes src/plans.generated.ts.
// Usage: node plan_edit.mjs            (all takes with a raw.mp4)
import fs from 'node:fs';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const RAW = path.join(HERE, '..', 'raw');
const REMOTION = path.join(HERE, '..', 'remotion');
const PUBLIC_RAW = path.join(REMOTION, 'public', 'raw');
fs.mkdirSync(PUBLIC_RAW, { recursive: true });

// Per-beat timing. hold = ms kept at 1x from the beat start. mode: cut (default) | ramp.
const BEAT_RULES = {
  // opening
  splash: { hold: 2600 },
  menu: { hold: 2000 },
  'faction-picker': { hold: 1500 },
  dossier: { hold: 3200 },
  mode: { hold: 1900 },
  'war-has-started': { hold: 3200 },
  desk: { hold: 3200 },
  'war-map': { hold: 5500 },
  // tour
  'map-w68': { hold: 3400 },
  'command-briefing': { hold: 3600 },
  'army-hq': { hold: 3600 },
  'corps-orbat': { hold: 3600 },
  'brigade-selected': { hold: 3200 },
  zoomed: { hold: 3800, leadIn: 2600, mode: 'ramp', speed: 1 },
  chronicle: { hold: 3600 },
  'decision-room': { hold: 4200 },
  'dossier-tour': { hold: 3200 },
  'map-end': { hold: 3400 },
  // directive (Electron take). zoom: scale toward a focus point (0..1), eased in over `ease` ms, held `hold` ms.
  'decision-room-directive': { hold: 3800 },
  'review-card': { hold: 3600 },
  'directive-card': { hold: 3700, zoom: { scale: 1.5, x: 0.69, y: 0.72, ease: 1000, hold: 2400 } },
  issued: { hold: 4600, zoom: { scale: 1.6, x: 0.66, y: 0.74, ease: 500, hold: 3600 } },
  receipt: { hold: 3600, zoom: { scale: 1.35, x: 0.5, y: 0.32, ease: 900, hold: 2200 } },
  'desk-directive': { hold: 2500 },
};
const DEFAULT_RULE = { hold: 3000 };

const MUSIC = {
  opening: { file: 'audio/music/what_remains_of_home_opening.ogg', offsetMs: 0, gain: 0.9 },
  tour: {
    RBiH: { file: 'audio/music/the_long_winter.ogg', offsetMs: 0, gain: 0.8 },
    RS: { file: 'audio/music/lines_on_paper.ogg', offsetMs: 0, gain: 0.9 },
    HRHB: { file: 'audio/music/a_table_for_strangers.ogg', offsetMs: 0, gain: 0.95 },
  },
  directive: { file: 'audio/music/no_answer_on_the_radio.ogg', offsetMs: 0, gain: 0.8 },
};

const SFX_FOR_ACTION = (a) => {
  if (a.name === 'click') {
    if (/advance/i.test(a.text ?? '')) return 'audio/sfx/turn_advance.ogg';
    if (/review|decision|army-hq|chronicle|codex|order of battle/i.test(`${a.text ?? ''} ${a.testid ?? ''}`)) return 'audio/sfx/ui_open.ogg';
    if (/close|collapse|war-map/i.test(`${a.text ?? ''} ${a.testid ?? ''}`)) return 'audio/sfx/ui_close.ogg';
    return 'audio/sfx/ui_click.ogg';
  }
  if (a.name === 'key' && a.key === 'Enter') return 'audio/sfx/ui_click.ogg';
  if (a.name === 'beat' && a.beat === 'war-has-started') return 'audio/sfx/event_critical.ogg';
  if (a.name === 'beat' && a.beat === 'decision-room') return 'audio/sfx/turn_review_open.ogg';
  return null;
};

function planTake(take) {
  const dir = path.join(RAW, take);
  const log = JSON.parse(fs.readFileSync(path.join(dir, 'take.json'), 'utf8'));
  const [factionLower, kind] = take.split('_');
  const faction = { rbih: 'RBiH', rs: 'RS', hrhb: 'HRHB' }[factionLower];
  const beats = log.actions.filter((a) => a.name === 'beat').map((a) => ({ name: a.beat, src: a.ms }));
  const end = log.endedAt;
  const segments = [];
  // Some beat names recur across kinds with different pacing; disambiguate by kind.
  const beatKey = (b) => {
    if (kind === 'tour' && b.name === 'dossier') return 'dossier-tour';
    if (kind === 'directive' && b.name === 'decision-room') return 'decision-room-directive';
    if (kind === 'directive' && b.name === 'desk') return 'desk-directive';
    return b.name;
  };
  const zooms = [];
  for (let i = 0; i < beats.length; i++) {
    const b = beats[i];
    const next = i + 1 < beats.length ? beats[i + 1].src : end;
    const rule = BEAT_RULES[beatKey(b)] ?? DEFAULT_RULE;
    if (rule.zoom) {
      // Aim at the control the rig revealed/clicked during this beat when it logged a position.
      const until = next;
      const aimed = log.actions.find((a) => a.ms >= b.src && a.ms < until && typeof a.x === 'number' && (a.name === 'reveal' || a.name === 'act-visible' || a.name === 'click'));
      const x = aimed ? Math.min(0.95, Math.max(0.05, aimed.x / 1920)) : rule.zoom.x;
      const y = aimed ? Math.min(0.95, Math.max(0.05, aimed.y / 1080)) : rule.zoom.y;
      zooms.push({ at: b.src + 150, ease: rule.zoom.ease, hold: rule.zoom.hold, scale: rule.zoom.scale, x, y });
    }
    const avail = next - b.src;
    if (rule.mode === 'ramp') {
      // Keep everything from (beat - leadIn) through hold at 1x: the camera move lives before the beat mark.
      const start = Math.max(b.src - (rule.leadIn ?? 0), i > 0 ? beats[i - 1].src + (BEAT_RULES[beatKey(beats[i - 1])] ?? DEFAULT_RULE).hold : 0);
      const dur = Math.min(avail + (b.src - start), (b.src - start) + rule.hold);
      segments.push({ src: start, dur, speed: rule.speed ?? 1, beat: b.name });
    } else {
      segments.push({ src: b.src, dur: Math.min(avail, rule.hold), speed: 1, beat: b.name });
    }
  }
  // SFX: actions that survive the cut.
  const sfx = [];
  for (const a of log.actions) {
    const file = SFX_FOR_ACTION(a);
    if (!file) continue;
    const kept = segments.some((s) => a.ms >= s.src - 150 && a.ms < s.src + s.dur);
    if (kept) sfx.push({ src: a.ms, file });
  }
  const music = kind === 'tour' ? MUSIC.tour[faction] : MUSIC[kind];
  const video = `raw/${take}.mp4`;
  fs.copyFileSync(path.join(dir, 'raw.mp4'), path.join(PUBLIC_RAW, `${take}.mp4`));
  return {
    id: take, take, faction, kind, video, fps: 60, sourceMs: end, segments, zooms, sfx,
    music: { ...music, fadeInMs: 800, fadeOutMs: 2500 }, beats,
  };
}

const takes = fs.readdirSync(RAW).filter((d) => fs.existsSync(path.join(RAW, d, 'raw.mp4')) && fs.existsSync(path.join(RAW, d, 'take.json'))).sort();
const plans = takes.map(planTake);
const out = `// GENERATED by capture/plan_edit.mjs — do not edit by hand.\nimport type { ClipPlan } from './plan';\nexport const PLANS: ClipPlan[] = ${JSON.stringify(plans, null, 1)};\n`;
fs.writeFileSync(path.join(REMOTION, 'src', 'plans.generated.ts'), out);
for (const p of plans) {
  const total = p.segments.reduce((t, s) => t + s.dur / s.speed, 0);
  console.log(`[plan] ${p.id}: ${p.segments.length} segments, ${(p.sourceMs / 1000).toFixed(1)}s -> ${(total / 1000).toFixed(1)}s, sfx=${p.sfx.length}, music=${path.basename(p.music.file)}`);
}

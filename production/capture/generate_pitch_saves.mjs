// Headless per-faction player saves for the showcase captures.
// Run from the MAIN repo so tsx resolves its imports:
//   cd F:/A-War-Without-Victory && node node_modules/tsx/dist/cli.mjs \
//     F:/a-war-without-victory-showcase/production/capture/generate_pitch_saves.mjs --faction RBiH --turns 68
// Decisions: historical default for every pending player decision (same as the bots).
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => a.startsWith('--') ? [a.slice(2), arr[i + 1]] : []).filter(Boolean));
const REPO = path.resolve(args.repo ?? process.cwd());
const FACTION = args.faction ?? 'RBiH';
const TURNS = Number(args.turns ?? 68);
const OUT = path.resolve(args.out ?? path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', 'raw', 'saves'));
fs.mkdirSync(OUT, { recursive: true });

const pp = await import(pathToFileURL(path.join(REPO, 'tools/ai_play/president_playthrough.ts')).href);
const { serializeState } = await import(pathToFileURL(path.join(REPO, 'src/state/serialize.ts')).href);

let state = await pp.startCampaign(FACTION, 'apr_1992', REPO);
const t0 = Date.now();
for (let i = 0; i < TURNS; i++) {
  const ctx = pp.serializeDecisionContext(state, FACTION);
  for (const d of ctx.pending_decisions) {
    const choice = d.historical_default_response_id ?? d.options[0]?.id;
    if (choice) pp.injectDecision(state, d.event_id, choice, 'showcase: historical default');
  }
  state = await pp.advance(state, REPO);
  if ((i + 1) % 10 === 0) console.log(`[${FACTION}] turn ${state.meta?.turn} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
}
const file = path.join(OUT, `${FACTION.toLowerCase()}_w${state.meta?.turn}.json`);
fs.writeFileSync(file, serializeState(state));
console.log(`[${FACTION}] wrote ${file} (${(fs.statSync(file).size / 1024 / 1024).toFixed(1)} MB) hash=${pp.stateHash(state)}`);

# Showcase video production — reshoot + edit (started 2026-11-06)

Owner brief: every clip reshot with the game's music, waits cut out, dynamic edit with
on-screen text and graphical effects, plus a new 90 s hero trailer. Editor: Remotion.

## Layout (this folder is versioned so the rig cannot be lost again)

- `capture/` — rig that drives the real build and records raw takes + an action log.
- `remotion/` — Remotion project (compositions, brand kit, EN/BS strings, audio mix).
- `raw/` (ignored) — raw takes, frames, action logs. `out/` (ignored) — renders.

## Music decision (verified 2026-11-06 against the Codex worktree + handoff file)

Use ONLY the ten OGGs bundled in the runtime on `codex/player-experience-completion`
(PR #539). Eight campaign tracks are the Revised v2 set; each file hash binds to
`docs/audio/CAMPAIGN_SUITE_TWO_AUDITION.json`; expert approval recorded in handoff
entry CX-20261106-002. Opening cue + calm menu theme were owner-approved 2026-11-05.

| Use | Track | File |
|---|---|---|
| Opening clips (3) | What Remains of Home — opening, 35 s | what_remains_of_home_opening.ogg |
| RBiH tour | The Long Winter | the_long_winter.ogg |
| RS tour | Lines on Paper | lines_on_paper.ogg |
| HRHB tour | A Table for Strangers | a_table_for_strangers.ogg |
| Directive clip | No Answer on the Radio | no_answer_on_the_radio.ogg |
| Hero trailer | What Remains of Home — calm menu theme, 125 s | what_remains_of_home.ogg |

REJECTED, never use: `menu_original.ogg` (procedural draft, retained as a previous
version only) and the first campaign suite (superseded by v2; not bundled).
Credit line on the page: original score, A War Without Victory; recorded samples
VSCO 2 Community Edition (CC0), Versilian Studios / Sam Gossner.

## Pipeline

1. Build `F:\A-War-Without-Victory` (`npm run desktop:map:build`, then `node tools/ui/check_chunk_cycles.cjs`).
2. `capture/generate_pitch_saves.mjs` — headless per-faction saves at w68 via desktop_sim.
3. `capture/serve.mjs` — serves dist + /data + /runs on 127.0.0.1:3002.
4. `capture/record_*.mjs` — CDP screencast at 1920x1080, timestamped frames, action log
   (every click / modal / turn with ms offset) → `raw/<take>/frames`, `raw/<take>/actions.json`.
5. `capture/assemble.mjs` — frames → CFR 60 fps lossless-ish mp4 per take.
6. `remotion/` — per-clip compositions: speed ramps through holds, cut on action, eased
   zoom-ins, captions (IBM Plex Sans Condensed / Mono), title + end cards, UI SFX placed from
   the action log, music bed with ducking, loudnorm to -14 LUFS. EN + BS from one strings file.
7. Render → `media/videos/*.mp4|webm`, posters; `node build_panels.mjs`; `node check_media.mjs`.
8. Every caption checked against `docs/50_launch/marketing/claims_inventory.md` before push.

## Checkpoint 2026-11-06 evening

- Captured (1920x1080, 60 fps CFR, action logs): rbih/rs/hrhb_opening, rbih/rs/hrhb_tour (browser rig, w68 saves),
  rbih_directive (real Electron shell; `Issue (25)` reserve-release directive with receipt).
- Remotion project renders: title card, cut-on-beat body, captions EN/BS, UI cues from the action log,
  music bed, end card. 30 fps output. Zooms aim at the control the rig logged (directive card, Issue, receipt).
- Trailer composition (`trailer-en`/`trailer-bs`) assembled from the takes + endgame stills over the menu theme.
- `finalize.mjs`: loudnorm -14 LUFS / -1.5 dBTP, MP4 + WebM + poster.
- Captions checked against claims_inventory.md: no claim beyond "implemented" rows; soundtrack credited as original score
  only (in-game playback lands with PR #539, not claimed on the page).
- Traps found: Escape in the tactical shell opens the PAUSE menu (use route/close controls); Electron's first window can be
  DevTools (pick the awwv:// window); HiDPI clamps a 1080-tall window (launch with --force-device-scale-factor=1);
  the peace-plan modal's "Review Later" is outside any role=dialog; brigade counters carry their name in aria-label.

## Checkpoint 2026-11-06 late

- Pipeline validated on every clip kind (opening, tour, directive) and the trailer; `render_all.mjs --skip-render`
  is producing the 16 encodes into media/videos (EN) and media/videos/bs (BS).
- Pages updated: hero → trailer, directive figure → new 2nd Corps / Black Swans take (copy rewritten EN+BS),
  posters from the encodes, credit line for the score, build_panels is language-aware.
- Not versioned (ignored): raw takes, renders, public/raw, public/audio (the soundtrack must not be downloadable
  from Pages before release), public/stills (already in media/).
- Follow-up in the GAME repo (left untouched while other agents merge): point
  docs/50_launch/marketing/screenshot_plan.md at this production/ rig instead of tmp_gui_observation/.

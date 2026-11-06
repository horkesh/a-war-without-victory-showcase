import React from 'react';
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig, Easing } from 'remotion';
import { PLANS } from '../plans.generated';
import { COLOR, FONT } from '../brand';
import { UI, type Lang } from '../strings';
import { Atmosphere, Caption, EndCard } from './cards';

type L = Record<Lang, string>;
type Shot =
  | { kind: 'video'; take: string; beat: string; lead?: number; dur: number; speed?: number; push?: number; caption?: { kicker?: L; line: L; pos?: 'left' | 'right' | 'center' }; sfx?: string }
  | { kind: 'still'; file: string; dur: number; from: number; to: number; caption?: { kicker?: L; line: L; pos?: 'left' | 'right' | 'center' } }
  | { kind: 'card'; dur: number; lines: L[]; sub?: L };

// The hero cut: ~90 s over the calm menu theme. Durations in ms. `lead` plays that many ms BEFORE the beat mark.
export const TRAILER_SHOTS: Shot[] = [
  { kind: 'card', dur: 3600, lines: [{ en: 'Bosnia-Herzegovina', bs: 'Bosna i Hercegovina' }, { en: 'April 1992', bs: 'April 1992.' }] },
  { kind: 'video', take: 'rbih_opening', beat: 'splash', dur: 3600, push: 0.06, caption: { line: { en: 'A strategic simulation of the Bosnian War', bs: 'Strateška simulacija rata u Bosni' }, pos: 'right' } },
  { kind: 'video', take: 'rbih_opening', beat: 'menu', dur: 2400, push: 0.03 },
  { kind: 'card', dur: 2600, lines: [{ en: 'Three factions.', bs: 'Tri strane.' }, { en: 'Three different wars.', bs: 'Tri različita rata.' }] },
  { kind: 'video', take: 'rbih_opening', beat: 'dossier', dur: 2300, push: 0.03 },
  { kind: 'video', take: 'rs_opening', beat: 'dossier', dur: 2300, push: 0.03 },
  { kind: 'video', take: 'hrhb_opening', beat: 'dossier', dur: 2300, push: 0.03 },
  { kind: 'video', take: 'rbih_opening', beat: 'war-has-started', dur: 3000, sfx: 'audio/sfx/event_critical.ogg', caption: { line: { en: 'There is no conquest victory', bs: 'Nema pobjede osvajanjem' }, pos: 'center' } },
  { kind: 'video', take: 'rbih_opening', beat: 'desk', dur: 4000, push: 0.04, caption: { kicker: { en: "The President's desk", bs: 'Predsjednikov sto' }, line: { en: 'Every decision waits for your signature', bs: 'Svaka odluka čeka tvoj potpis' } } },
  { kind: 'video', take: 'rs_opening', beat: 'war-map', dur: 4200, push: 0.05, caption: { kicker: { en: 'The war map', bs: 'Ratna karta' }, line: { en: 'Brigades, fronts, and the cost of holding them', bs: 'Brigade, frontovi i cijena njihovog držanja' }, pos: 'center' } },
  { kind: 'card', dur: 2600, lines: [{ en: 'Fifteen months in', bs: 'Petnaest mjeseci kasnije' }] },
  { kind: 'video', take: 'rbih_tour', beat: 'map-w68', dur: 3600, push: 0.04, caption: { kicker: { en: 'July 1993', bs: 'Juli 1993.' }, line: { en: 'The front holds. The country does not.', bs: 'Front drži. Zemlja ne.' }, pos: 'center' } },
  { kind: 'video', take: 'hrhb_tour', beat: 'army-hq', dur: 3200, caption: { kicker: { en: 'Army HQ', bs: 'Glavni štab' }, line: { en: 'Commanders report. You set priorities.', bs: 'Komandanti izvještavaju. Ti postavljaš prioritete.' }, pos: 'center' } },
  { kind: 'video', take: 'rbih_tour', beat: 'zoomed', lead: 3200, dur: 6200, caption: { line: { en: 'Fronts are held by people, not by lines', bs: 'Frontove drže ljudi, ne linije' }, pos: 'center' } },
  { kind: 'video', take: 'rs_tour', beat: 'chronicle', dur: 3200, caption: { kicker: { en: 'Chronicle', bs: 'Hronika' }, line: { en: 'What you ordered, and what it cost', bs: 'Šta si naredio i koliko je koštalo' }, pos: 'center' } },
  { kind: 'video', take: 'rbih_tour', beat: 'decision-room', dur: 4200, sfx: 'audio/sfx/turn_review_open.ogg', caption: { kicker: { en: 'Decision Room', bs: 'Soba za odluke' }, line: { en: 'Signature required', bs: 'Potreban potpis' } } },
  { kind: 'video', take: 'rbih_directive', beat: 'directive-card', dur: 4200, caption: { line: { en: 'One order, start to finish', bs: 'Jedna naredba, od početka do kraja' } } },
  { kind: 'video', take: 'rbih_directive', beat: 'issued', dur: 3600, sfx: 'audio/sfx/op_launch.ogg' },
  { kind: 'card', dur: 2800, lines: [{ en: 'Every campaign ends', bs: 'Svaka kampanja završava' }, { en: 'in a reckoning.', bs: 'obračunom.' }] },
  { kind: 'still', file: 'stills/dayton.png', dur: 3600, from: 1.0, to: 1.08, caption: { kicker: { en: 'Dayton, 1995', bs: 'Dayton, 1995.' }, line: { en: 'Negotiate the end', bs: 'Ispregovaraj kraj' }, pos: 'center' } },
  { kind: 'still', file: 'stills/what_it_cost.png', dur: 3600, from: 1.08, to: 1.0, caption: { line: { en: 'Account for the cost', bs: 'Položi račun za cijenu' }, pos: 'center' } },
  { kind: 'still', file: 'stills/verdict.png', dur: 3600, from: 1.0, to: 1.06, caption: { line: { en: 'Judged by the human cost, not by territory', bs: 'Suđeno po ljudskoj cijeni, ne po teritoriji' }, pos: 'center' } },
  { kind: 'still', file: 'stills/another_such_victory.png', dur: 4200, from: 1.06, to: 1.0 },
];

export const TRAILER_END_MS = 6000;

function beatSrc(take: string, beat: string): { video: string; fps: number; src: number } | null {
  const plan = PLANS.find((p) => p.take === take);
  if (!plan) return null;
  const b = plan.beats.find((x) => x.name === beat);
  if (!b) return null;
  return { video: plan.video, fps: plan.fps, src: b.src };
}

export function trailerDurationFrames(fps: number): number {
  const total = TRAILER_SHOTS.reduce((t, s) => t + (resolvable(s) ? s.dur : 0), 0) + TRAILER_END_MS;
  return Math.ceil((total / 1000) * fps);
}

function resolvable(s: Shot): boolean {
  return s.kind !== 'video' || beatSrc(s.take, s.beat) !== null;
}

const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

const Push: React.FC<{ durFrames: number; from: number; to: number; children: React.ReactNode }> = ({ durFrames, from, to, children }) => {
  const frame = useCurrentFrame();
  const s = interpolate(frame, [0, durFrames], [from, to], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeInOut });
  return <AbsoluteFill style={{ transform: `scale(${s})`, transformOrigin: '50% 45%' }}>{children}</AbsoluteFill>;
};

const CutIn: React.FC<{ frames: number }> = ({ frames }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, frames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return <AbsoluteFill style={{ background: COLOR.ground, opacity: o, pointerEvents: 'none' }} />;
};

const TextCard: React.FC<{ lines: string[]; durFrames: number }> = ({ lines, durFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = interpolate(frame, [durFrames - fps * 0.4, durFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ background: COLOR.ground, justifyContent: 'center', alignItems: 'center', opacity: out, fontFamily: FONT.cond, color: COLOR.ink }}>
      {lines.map((l, i) => {
        const t = frame - i * 8;
        const o = interpolate(t, [0, fps * 0.5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        const y = interpolate(t, [0, fps * 0.8], [30, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeOut });
        return <div key={i} style={{ fontSize: 108, fontWeight: 600, lineHeight: 1.05, letterSpacing: '-0.01em', opacity: o, transform: `translateY(${y}px)`, textAlign: 'center' }}>{l}</div>;
      })}
    </AbsoluteFill>
  );
};

export const Trailer: React.FC<{ lang: Lang }> = ({ lang }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const ms = (x: number) => Math.round((x / 1000) * fps);
  const shots = TRAILER_SHOTS.filter(resolvable);
  const total = trailerDurationFrames(fps);
  const totalMs = (total / fps) * 1000;
  const musicVol = (f: number) => {
    const t = (f / fps) * 1000;
    const fin = interpolate(t, [0, 1200], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const fout = interpolate(t, [totalMs - 4500, totalMs], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    return Math.min(fin, fout) * 0.9;
  };
  let cursor = 0;
  const placed = shots.map((s) => { const from = cursor; cursor += ms(s.dur); return { s, from, dur: ms(s.dur) }; });
  const endFrom = cursor;
  return (
    <AbsoluteFill style={{ background: COLOR.ground }}>
      <Audio src={staticFile('audio/music/what_remains_of_home.ogg')} volume={musicVol} />
      {placed.map(({ s, from, dur }, i) => (
        <Sequence key={i} from={from} durationInFrames={dur} name={s.kind === 'video' ? `${s.take}:${s.beat}` : s.kind}>
          {s.kind === 'card' ? <TextCard lines={s.lines.map((l) => l[lang])} durFrames={dur} /> : null}
          {s.kind === 'still' ? (
            <Push durFrames={dur} from={s.from} to={s.to}><Img src={staticFile(s.file)} style={{ width: 1920, height: 1080, objectFit: 'cover' }} /></Push>
          ) : null}
          {s.kind === 'video' ? (() => {
            const b = beatSrc(s.take, s.beat)!;
            const start = Math.max(0, b.src - (s.lead ?? 0));
            return (
              <Push durFrames={dur} from={1} to={1 + (s.push ?? 0)}>
                {/* startFrom counts COMPOSITION frames, not source frames. */}
                <OffthreadVideo src={staticFile(b.video)} startFrom={Math.round((start / 1000) * fps)} playbackRate={s.speed ?? 1} muted />
              </Push>
            );
          })() : null}
          {s.kind !== 'card' ? <CutIn frames={Math.round(fps * 0.25)} /> : null}
          {s.kind !== 'card' && s.caption ? <Caption kicker={s.caption.kicker?.[lang]} line={s.caption.line[lang]} durationFrames={dur} pos={s.caption.pos} /> : null}
          {s.kind === 'video' && s.sfx ? <Audio src={staticFile(s.sfx)} volume={0.5} /> : null}
        </Sequence>
      ))}
      <Sequence from={endFrom} durationInFrames={ms(TRAILER_END_MS)} name="end">
        <EndCard lang={lang} durationFrames={ms(TRAILER_END_MS)} />
      </Sequence>
      <Atmosphere />
      <AbsoluteFill style={{ background: COLOR.ground, opacity: interpolate(frame, [total - fps * 0.8, total], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }), pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
};

import React, { useMemo } from 'react';
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig, Easing } from 'remotion';
import { placeSegments, srcToOut, totalOutMs, type ClipPlan, type PlacedSegment } from '../plan';
import { CAPTIONS, type Lang } from '../strings';
import { Atmosphere, Caption, EndCard, TitleCard } from './cards';
import { COLOR } from '../brand';

export const TITLE_MS = 2600;
export const END_MS = 3400;
export const FADE_MS = 500;

export function clipDurationFrames(plan: ClipPlan, fps: number): number {
  const placed = placeSegments(plan.segments);
  return Math.ceil(((TITLE_MS + totalOutMs(placed) + END_MS) / 1000) * fps);
}

const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

/**
 * One source segment rendered at its speed. Either a slow push-in for presence, or a directed zoom
 * (plan.zooms matching this segment's beat): ease in over `ease` ms, hold, release over the last 600 ms.
 */
const SegmentVideo: React.FC<{ plan: ClipPlan; seg: PlacedSegment; push: number }> = ({ plan, seg, push }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const durF = (seg.outDur / 1000) * fps;
  const zoom = plan.zooms.find((z) => z.at >= seg.src && z.at < seg.src + seg.dur);
  let scale = interpolate(frame, [0, durF], [1, 1 + push], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeInOut });
  let origin = '50% 50%';
  if (zoom) {
    const startF = ((zoom.at - seg.src) / seg.speed / 1000) * fps;
    const easeF = (zoom.ease / 1000) * fps;
    const holdEnd = Math.min(durF, startF + easeF + (zoom.hold / 1000) * fps);
    const release = zoom.hold > 0 && holdEnd < durF - 2 ? (0.6 * fps) : 0;
    const up = interpolate(frame, [startF, startF + easeF], [1, zoom.scale], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeInOut });
    const down = release ? interpolate(frame, [holdEnd, holdEnd + release], [zoom.scale, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeInOut }) : zoom.scale;
    scale = frame < holdEnd ? up : down;
    origin = `${zoom.x * 100}% ${zoom.y * 100}%`;
  }
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})`, transformOrigin: origin }}>
      {/* startFrom counts COMPOSITION frames, not source frames. */}
      <OffthreadVideo src={staticFile(plan.video)} startFrom={Math.round((seg.src / 1000) * fps)} playbackRate={seg.speed} muted />
    </AbsoluteFill>
  );
};

export const Clip: React.FC<{ plan: ClipPlan; lang: Lang }> = ({ plan, lang }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const placed = useMemo(() => placeSegments(plan.segments), [plan]);
  const ms = (x: number) => Math.round((x / 1000) * fps);
  const bodyStart = ms(TITLE_MS);
  const bodyMs = totalOutMs(placed);
  const endStart = bodyStart + ms(bodyMs);
  const total = endStart + ms(END_MS);

  // Music: fade in under the title, fade out over the end card.
  const musicVol = (f: number) => {
    const t = (f / fps) * 1000;
    const fin = interpolate(t, [0, plan.music.fadeInMs], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const fout = interpolate(t, [(total / fps) * 1000 - plan.music.fadeOutMs, (total / fps) * 1000], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    return Math.min(fin, fout) * plan.music.gain;
  };

  const captions = CAPTIONS[plan.kind] ?? {};

  return (
    <AbsoluteFill style={{ background: COLOR.ground }}>
      <Audio src={staticFile(plan.music.file)} startFrom={ms(plan.music.offsetMs)} volume={musicVol} />

      <Sequence from={0} durationInFrames={bodyStart} name="title">
        <TitleCard lang={lang} faction={plan.faction} kind={plan.kind} durationFrames={bodyStart} />
      </Sequence>

      {placed.map((seg, i) => {
        const from = bodyStart + ms(seg.outStart);
        const dur = Math.max(1, ms(seg.outDur));
        const cap = captions[seg.beat];
        const isFirst = i === 0;
        return (
          <Sequence key={`${seg.beat}-${i}`} from={from} durationInFrames={dur} name={seg.beat}>
            <SegmentVideo plan={plan} seg={seg} push={seg.speed === 1 && seg.outDur > 2500 ? 0.035 : 0} />
            {isFirst ? <FadeFrom durationFrames={ms(FADE_MS)} /> : null}
            {cap && dur > fps * 1.6 ? <Caption kicker={cap.kicker?.[lang]} line={cap.line[lang]} durationFrames={dur} pos={cap.pos} /> : null}
          </Sequence>
        );
      })}

      {plan.sfx.map((cue, i) => {
        const out = srcToOut(placed, cue.src);
        if (out === null) return null;
        return <Sequence key={`sfx-${i}`} from={bodyStart + ms(out)} durationInFrames={ms(1500)} name={`sfx ${cue.file}`}><Audio src={staticFile(cue.file)} volume={cue.gain ?? 0.55} /></Sequence>;
      })}

      <Sequence from={endStart} durationInFrames={ms(END_MS)} name="end">
        <EndCard lang={lang} durationFrames={ms(END_MS)} />
      </Sequence>
      <Atmosphere />
      <FadeOut from={total - ms(FADE_MS)} durationFrames={ms(FADE_MS)} frame={frame} />
    </AbsoluteFill>
  );
};

const FadeFrom: React.FC<{ durationFrames: number }> = ({ durationFrames }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, durationFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return <AbsoluteFill style={{ background: COLOR.ground, opacity: o, pointerEvents: 'none' }} />;
};

const FadeOut: React.FC<{ from: number; durationFrames: number; frame: number }> = ({ from, durationFrames, frame }) => {
  const o = interpolate(frame, [from, from + durationFrames], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return <AbsoluteFill style={{ background: COLOR.ground, opacity: o, pointerEvents: 'none' }} />;
};

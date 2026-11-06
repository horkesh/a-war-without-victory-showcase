import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing } from 'remotion';
import { COLOR, FONT, FACTION_LABEL } from '../brand';
import { UI, type Lang } from '../strings';

const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

/** Grain + vignette over everything, in the site's analogue voice. */
export const Atmosphere: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: 'none' }}>
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)' }} />
  </AbsoluteFill>
);

const Rule: React.FC<{ width: number; delay?: number }> = ({ width, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const w = interpolate(frame - delay, [0, fps * 0.8], [0, width], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeOut });
  return <div style={{ height: 2, width: w, background: COLOR.lamp }} />;
};

const Rise: React.FC<{ delay?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ delay = 0, children, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame - delay;
  const o = interpolate(t, [0, fps * 0.5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const y = interpolate(t, [0, fps * 0.7], [26, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeOut });
  return <div style={{ opacity: o, transform: `translateY(${y}px)`, ...style }}>{children}</div>;
};

export const TitleCard: React.FC<{ lang: Lang; faction: 'RBiH' | 'RS' | 'HRHB'; kind: string; durationFrames: number }> = ({ lang, faction, kind, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = interpolate(frame, [durationFrames - fps * 0.5, durationFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const f = FACTION_LABEL[faction];
  const kindLabel = UI[kind]?.[lang] ?? kind;
  return (
    <AbsoluteFill style={{ background: COLOR.ground, opacity: out, fontFamily: FONT.cond, color: COLOR.ink }}>
      <div style={{ position: 'absolute', left: 140, top: 300 }}>
        <Rise>
          <div style={{ fontFamily: FONT.mono, fontSize: 22, letterSpacing: '0.32em', color: COLOR.lamp }}>{UI.presents[lang]}</div>
        </Rise>
        <Rise delay={6}>
          <div style={{ fontSize: 132, fontWeight: 600, lineHeight: 1.02, marginTop: 26, letterSpacing: '-0.01em' }}>{UI.title[lang]}</div>
        </Rise>
        <div style={{ marginTop: 28 }}><Rule width={520} delay={14} /></div>
        <Rise delay={18}>
          <div style={{ fontFamily: FONT.mono, fontSize: 26, marginTop: 28, color: COLOR.dim, letterSpacing: '0.12em' }}>
            <span style={{ color: f.tint }}>■ </span>{f[lang].toUpperCase()}, {kindLabel.toUpperCase()}
          </div>
        </Rise>
      </div>
      <Rise delay={24} style={{ position: 'absolute', left: 140, bottom: 90 }}>
        <div style={{ fontFamily: FONT.mono, fontSize: 20, color: COLOR.faint, letterSpacing: '0.18em' }}>{UI.captured[lang].toUpperCase()}. {UI.wip[lang].toUpperCase()}</div>
      </Rise>
    </AbsoluteFill>
  );
};

export const EndCard: React.FC<{ lang: Lang; durationFrames: number }> = ({ lang, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inO = interpolate(frame, [0, fps * 0.6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ background: COLOR.ground, opacity: inO, fontFamily: FONT.cond, color: COLOR.ink, justifyContent: 'center', alignItems: 'center' }}>
      <Rise delay={8}>
        <div style={{ fontSize: 112, fontWeight: 600, letterSpacing: '-0.01em', textAlign: 'center' }}>{UI.title[lang]}</div>
      </Rise>
      <div style={{ marginTop: 26 }}><Rule width={360} delay={16} /></div>
      <Rise delay={22}>
        <div style={{ fontFamily: FONT.mono, fontSize: 30, marginTop: 30, color: COLOR.lamp, letterSpacing: '0.14em', textAlign: 'center' }}>{UI.tagline[lang].toUpperCase()}</div>
      </Rise>
      <Rise delay={34} style={{ position: 'absolute', bottom: 80, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontFamily: FONT.mono, fontSize: 19, color: COLOR.faint, letterSpacing: '0.16em' }}>{UI.music[lang].toUpperCase()}</div>
      </Rise>
    </AbsoluteFill>
  );
};

/** Lower-third caption: kicker in mono, line in condensed; slides in, holds, slides out. */
export const Caption: React.FC<{ kicker?: string; line: string; durationFrames: number; pos?: 'left' | 'right' | 'center' }> = ({ kicker, line, durationFrames, pos = 'left' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inT = interpolate(frame, [0, fps * 0.45], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeOut });
  const outT = interpolate(frame, [durationFrames - fps * 0.35, durationFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const o = Math.min(inT, outT);
  const right = pos === 'right';
  const center = pos === 'center';
  const x = center ? 0 : (1 - inT) * (right ? 40 : -40);
  const y = center ? (1 - inT) * 30 : 0;
  const bar = <div style={{ width: 6, background: COLOR.lamp, [right ? 'marginLeft' : 'marginRight']: 22 }} />;
  const anchor: React.CSSProperties = center
    ? { left: '50%', bottom: 96, transform: `translate(-50%, ${y}px)` }
    : { [right ? 'right' : 'left']: 96, bottom: 110, transform: `translateX(${x}px)` };
  return (
    <div style={{ position: 'absolute', ...anchor, opacity: o, fontFamily: FONT.cond, color: COLOR.ink }}>
      <div style={{ display: 'flex', alignItems: 'stretch', flexDirection: right ? 'row-reverse' : 'row' }}>
        {bar}
        <div style={{ background: 'rgba(8,11,11,0.78)', padding: '18px 30px 20px 26px', backdropFilter: 'blur(6px)', [right ? 'borderLeft' : 'borderRight']: `1px solid ${COLOR.edge}`, textAlign: right ? 'right' : 'left' }}>
          {kicker ? <div style={{ fontFamily: FONT.mono, fontSize: 21, letterSpacing: '0.26em', color: COLOR.lamp, marginBottom: 8 }}>{kicker.toUpperCase()}</div> : null}
          <div style={{ fontSize: 50, fontWeight: 600, lineHeight: 1.1, letterSpacing: '-0.005em' }}>{line}</div>
        </div>
      </div>
    </div>
  );
};

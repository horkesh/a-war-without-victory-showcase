// Edit plan: the data the planner (capture/plan_edit.mjs) derives from a take's action log.
// Times in the plan are SOURCE milliseconds; output placement is computed here from the segments.

export type Segment = {
  /** source start, ms */
  src: number;
  /** source duration, ms */
  dur: number;
  /** playback speed (1 = real time) */
  speed: number;
  /** beat this segment belongs to */
  beat: string;
};

export type Zoom = {
  /** source ms where the zoom begins */
  at: number;
  /** ms over which the zoom eases in */
  ease: number;
  /** how long to hold before easing back (ms, source) */
  hold: number;
  scale: number;
  /** focus point in 0..1 of the frame */
  x: number;
  y: number;
};

export type SfxCue = { src: number; file: string; gain?: number };

export type ClipPlan = {
  id: string;
  take: string;
  faction: 'RBiH' | 'RS' | 'HRHB';
  kind: 'opening' | 'tour' | 'directive';
  /** public path of the assembled raw take */
  video: string;
  /** source fps of the raw take */
  fps: number;
  /** source length ms */
  sourceMs: number;
  segments: Segment[];
  zooms: Zoom[];
  sfx: SfxCue[];
  music: { file: string; offsetMs: number; gain: number; fadeInMs: number; fadeOutMs: number };
  /** per-beat source start times for captions */
  beats: { name: string; src: number }[];
};

export type PlacedSegment = Segment & { outStart: number; outDur: number };

export function placeSegments(segments: Segment[]): PlacedSegment[] {
  let t = 0;
  return segments.map((s) => {
    const outDur = s.dur / s.speed;
    const placed = { ...s, outStart: t, outDur };
    t += outDur;
    return placed;
  });
}

/** Map a source time (ms) to output time (ms); null when the source time was cut. */
export function srcToOut(placed: PlacedSegment[], srcMs: number): number | null {
  for (const s of placed) {
    if (srcMs >= s.src && srcMs < s.src + s.dur) return s.outStart + (srcMs - s.src) / s.speed;
  }
  return null;
}

export function totalOutMs(placed: PlacedSegment[]): number {
  const last = placed[placed.length - 1];
  return last ? last.outStart + last.outDur : 0;
}

import React from 'react';
import { Composition } from 'remotion';
import { PLANS } from './plans.generated';
import { Clip, clipDurationFrames } from './components/Clip';
import { Trailer, trailerDurationFrames } from './components/Trailer';
import type { Lang } from './strings';

// Output fps for the web clips (sources are 60 fps CFR; 30 keeps renders fast and the files small).
const FPS = 30;
const LANGS: Lang[] = ['en', 'bs'];

export const RemotionRoot: React.FC = () => (
  <>
    {LANGS.map((lang) => (
      <Composition key={`trailer-${lang}`} id={`trailer-${lang}`} component={Trailer} durationInFrames={trailerDurationFrames(FPS)} fps={FPS} width={1920} height={1080} defaultProps={{ lang }} />
    ))}
    {PLANS.flatMap((plan) =>
      LANGS.map((lang) => (
        <Composition
          key={`${plan.id}-${lang}`}
          id={`${plan.id.replace(/_/g, '-')}-${lang}`}
          component={Clip}
          durationInFrames={clipDurationFrames(plan, FPS)}
          fps={FPS}
          width={1920}
          height={1080}
          defaultProps={{ plan, lang }}
        />
      )),
    )}
  </>
);

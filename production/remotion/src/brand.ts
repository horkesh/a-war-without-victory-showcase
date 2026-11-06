// Brand kit: the showcase site's tokens (styles.css) in the game's analogue-opening voice.
import { loadFont as loadCondensed } from '@remotion/google-fonts/IBMPlexSansCondensed';
import { loadFont as loadMono } from '@remotion/google-fonts/IBMPlexMono';
import { loadFont as loadSans } from '@remotion/google-fonts/IBMPlexSans';

const cond = loadCondensed('normal', { weights: ['500', '600', '700'], subsets: ['latin', 'latin-ext'] });
const mono = loadMono('normal', { weights: ['400', '500'], subsets: ['latin', 'latin-ext'] });
const sans = loadSans('normal', { weights: ['400', '500'], subsets: ['latin', 'latin-ext'] });

export const FONT = {
  cond: cond.fontFamily,
  mono: mono.fontFamily,
  sans: sans.fontFamily,
};

export const COLOR = {
  ground: '#080b0b',
  panel: '#111615',
  edge: '#232b28',
  ink: '#e4e7e0',
  dim: '#98a29a',
  faint: '#6d766f',
  lamp: '#c9a55c',
  lampBright: '#e0c17e',
  wine: '#9c4038',
  paper: '#d9d2bf',
  paperInk: '#20261f',
};

export const FACTION_LABEL: Record<string, { en: string; bs: string; short: string; tint: string }> = {
  RBiH: { en: 'Republic of Bosnia and Herzegovina', bs: 'Republika Bosna i Hercegovina', short: 'RBiH', tint: '#4f8f6a' },
  RS: { en: 'Republika Srpska', bs: 'Republika Srpska', short: 'RS', tint: '#9c4038' },
  HRHB: { en: 'Croatian Republic of Herzeg-Bosnia', bs: 'Hrvatska Republika Herceg-Bosna', short: 'HRHB', tint: '#3f6a9c' },
};

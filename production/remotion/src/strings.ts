// On-screen copy, EN + BS. Every line must trace to docs/50_launch/marketing/claims_inventory.md
// in the game repo (checked before publish). Keep captions short: they are read in ~2 seconds.
// Captions are one line each, no label row above them; a date or place that matters is folded into the line.
// Bosnian reviewed by Codex (CX-20261107-BS-SHOWCASE-REVIEW): formal plural on the pages, informal singular here.
export type Lang = 'en' | 'bs';
type L = Record<Lang, string>;

export const UI: Record<string, L> = {
  presents: { en: 'PYRRHIC GAMES PRESENTS', bs: 'PYRRHIC GAMES PREDSTAVLJA' },
  title: { en: 'A War Without Victory', bs: 'Rat bez pobjede' },
  subtitle: { en: 'Bosnia-Herzegovina, 1992–1995', bs: 'Bosna i Hercegovina, 1992–1995' },
  tagline: { en: 'Survive the war. Account for the cost.', bs: 'Preživi rat. Odgovaraj za njegove posljedice.' },
  captured: { en: 'Captured from the current playable build', bs: 'Snimljeno u trenutnoj verziji igre' },
  music: { en: 'Original score, “What Remains of Home”', bs: 'Originalna muzika, „What Remains of Home“' },
  opening: { en: 'Opening', bs: 'Otvaranje' },
  tour: { en: 'Command tour', bs: 'Obilazak komande' },
  directive: { en: 'One order, start to finish', bs: 'Jedna naredba, od početka do kraja' },
  week: { en: 'Week', bs: 'Sedmica' },
  wip: { en: 'Work in progress, version 0.9.9 beta', bs: 'U izradi, verzija 0.9.9 beta' },
};

// Captions keyed by clip kind, then beat name.
// pos: where the lower third sits so it never covers the game's own panel (default left).
export type CaptionDef = { line: L; pos?: 'left' | 'right' | 'center' };
export const CAPTIONS: Record<string, Record<string, CaptionDef>> = {
  opening: {
    menu: { line: { en: 'April 1992. A strategic simulation of the Bosnian War', bs: 'April 1992. Strateška simulacija rata u Bosni' }, pos: 'right' },
    'faction-picker': { line: { en: 'Three governments, three wars.', bs: 'Svaka vlada vodi svoj rat.' }, pos: 'right' },
    dossier: { line: { en: 'Your constraints, before your first order', bs: 'Saznaj šta možeš prije prve naredbe.' }, pos: 'right' },
    mode: { line: { en: 'Follow history, or leave it', bs: 'Možeš slijediti historijski tok ili ga promijeniti.' }, pos: 'right' },
    'war-has-started': { line: { en: 'No one wins this war', bs: 'Ovaj rat niko ne dobija' } },
    desk: { line: { en: 'Every decision waits for your signature', bs: 'Svaka odluka čeka tvoj potpis' } },
    'war-map': { line: { en: 'Every brigade and every front, week by week', bs: 'Na karti pratiš brigade i frontove iz sedmice u sedmicu.' }, pos: 'right' },
  },
  tour: {
    'map-w68': { line: { en: 'July 1993. The front, fifteen months in', bs: 'Juli 1993. Front, petnaest mjeseci kasnije' }, pos: 'center' },
    'command-briefing': { line: { en: 'Your staff tells you what is breaking', bs: 'Štab te upozorava gdje je front ugrožen.' }, pos: 'center' },
    'army-hq': { line: { en: 'Commanders report. You set priorities.', bs: 'Komandanti izvještavaju. Ti postavljaš prioritete.' }, pos: 'center' },
    'corps-orbat': { line: { en: 'Every order and its outcome, on the record', bs: 'U arhivi su sve naredbe i njihovi ishodi.' }, pos: 'right' },
    'brigade-selected': { line: { en: 'Every counter is a named brigade', bs: 'Oznaka na karti nosi ime brigade.' }, pos: 'center' },
    zoomed: { line: { en: 'A front is held by the people on it', bs: 'Front drže ljudi koji su na njemu' }, pos: 'center' },
    chronicle: { line: { en: 'The Chronicle keeps what you ordered and what it cost', bs: 'Hronika bilježi tvoje naredbe i njihovu cijenu.' }, pos: 'center' },
    'decision-room': { line: { en: 'Signature required', bs: 'Potreban potpis' } },
    dossier: { line: { en: 'Staff advise. The choice stays yours.', bs: 'Štab ti daje preporuku. Ti donosiš odluku.' } },
    desk: { line: { en: 'Back to the desk', bs: 'Vrati se za sto.' } },
    'map-end': { line: { en: 'The map can hold while the country is destroyed', bs: 'Front može ostati na istom mjestu dok se zemlja razara.' }, pos: 'center' },
  },
  directive: {
    'map-w68': { line: { en: 'July 1993. A corps asks for reserves', bs: 'Juli 1993. Korpus traži rezerve' }, pos: 'center' },
    'decision-room': { line: { en: 'The request reaches your desk', bs: 'Zahtjev stiže na tvoj sto' } },
    'review-card': { line: { en: 'Read the staff case', bs: 'Pročitaj obrazloženje štaba.' } },
    'directive-card': { line: { en: 'The order costs 25 authority', bs: 'Naredba troši 25 bodova autoriteta.' } },
    issued: { line: { en: 'One signature. The order goes down the chain.', bs: 'Kad potpišeš, naredba se prosljeđuje kroz komandni lanac.' } },
    receipt: { line: { en: 'Every order is on the record', bs: 'Svaka naredba je zapisana' } },
    desk: { line: { en: 'Back to the desk', bs: 'Vrati se za sto.' } },
    'map-end': { line: { en: 'The front will answer in its own time', bs: 'Posljedice ćeš vidjeti na frontu.' }, pos: 'center' },
  },
};

// On-screen copy, EN + BS. Every line must trace to docs/50_launch/marketing/claims_inventory.md
// in the game repo (checked before publish). Keep captions short: they are read in ~2 seconds.
export type Lang = 'en' | 'bs';
type L = Record<Lang, string>;

export const UI: Record<string, L> = {
  presents: { en: 'PYRRHIC GAMES PRESENTS', bs: 'PYRRHIC GAMES PREDSTAVLJA' },
  title: { en: 'A War Without Victory', bs: 'Rat bez pobjede' },
  subtitle: { en: 'Bosnia-Herzegovina, 1992–1995', bs: 'Bosna i Hercegovina, 1992–1995' },
  tagline: { en: 'Survive the war. Account for the cost.', bs: 'Preživi rat. Položi račun za cijenu.' },
  captured: { en: 'Captured from the current playable build', bs: 'Snimljeno iz trenutne igrive verzije' },
  music: { en: 'Original score · “What Remains of Home”', bs: 'Originalna muzika · „What Remains of Home“' },
  opening: { en: 'Opening', bs: 'Otvaranje' },
  tour: { en: 'Command tour', bs: 'Obilazak komande' },
  directive: { en: 'One order, start to finish', bs: 'Jedna naredba, od početka do kraja' },
  week: { en: 'Week', bs: 'Sedmica' },
  wip: { en: 'Work in progress · v0.9.9-beta', bs: 'U izradi · v0.9.9-beta' },
};

// Captions keyed by clip kind, then beat name.
// pos: where the lower third sits so it never covers the game's own panel (default left).
export type CaptionDef = { kicker?: L; line: L; pos?: 'left' | 'right' | 'center' };
export const CAPTIONS: Record<string, Record<string, CaptionDef>> = {
  opening: {
    menu: { kicker: { en: 'April 1992', bs: 'April 1992.' }, line: { en: 'A strategic simulation of the Bosnian War', bs: 'Strateška simulacija rata u Bosni' }, pos: 'right' },
    'faction-picker': { line: { en: 'Three factions. Three different wars.', bs: 'Tri strane. Tri različita rata.' }, pos: 'right' },
    dossier: { kicker: { en: 'Command briefing', bs: 'Komandni brifing' }, line: { en: 'Your constraints, before your first order', bs: 'Tvoja ograničenja, prije prve naredbe' }, pos: 'right' },
    mode: { line: { en: 'History is the reference, not the railroad', bs: 'Historija je referenca, ne šina' }, pos: 'right' },
    'war-has-started': { line: { en: 'There is no conquest victory', bs: 'Nema pobjede osvajanjem' } },
    desk: { kicker: { en: "The President's desk", bs: 'Predsjednikov sto' }, line: { en: 'Every decision waits for your signature', bs: 'Svaka odluka čeka tvoj potpis' } },
    'war-map': { kicker: { en: 'The war map', bs: 'Ratna karta' }, line: { en: 'Brigades, fronts, and the cost of holding them', bs: 'Brigade, frontovi i cijena njihovog držanja' }, pos: 'right' },
  },
  tour: {
    'map-w68': { kicker: { en: 'July 1993 · week 68', bs: 'Juli 1993. · 68. sedmica' }, line: { en: 'The front, fifteen months in', bs: 'Front, petnaest mjeseci kasnije' }, pos: 'center' },
    'command-briefing': { kicker: { en: 'Command briefing', bs: 'Komandni brifing' }, line: { en: 'Your staff tells you what is breaking', bs: 'Štab ti govori šta puca' }, pos: 'center' },
    'army-hq': { kicker: { en: 'Army HQ', bs: 'Glavni štab' }, line: { en: 'Commanders report. You set priorities.', bs: 'Komandanti izvještavaju. Ti postavljaš prioritete.' }, pos: 'center' },
    'corps-orbat': { kicker: { en: 'Campaign records', bs: 'Zapisi kampanje' }, line: { en: 'Every order and its outcome, on the record', bs: 'Svaka naredba i njen ishod, zapisani' }, pos: 'right' },
    'brigade-selected': { kicker: { en: 'The map', bs: 'Karta' }, line: { en: 'Every counter is a brigade, not a number', bs: 'Svaki žeton je brigada, ne broj' }, pos: 'center' },
    zoomed: { line: { en: 'Fronts are held by people, not by lines', bs: 'Frontove drže ljudi, ne linije' }, pos: 'center' },
    chronicle: { kicker: { en: 'Chronicle', bs: 'Hronika' }, line: { en: 'The record of what you ordered, and what it cost', bs: 'Zapis o tome šta si naredio i koliko je koštalo' }, pos: 'center' },
    'decision-room': { kicker: { en: 'Decision Room', bs: 'Soba za odluke' }, line: { en: 'Signature required', bs: 'Potreban potpis' } },
    dossier: { line: { en: 'Staff advise. The choice stays yours.', bs: 'Štab savjetuje. Izbor ostaje tvoj.' } },
    desk: { line: { en: 'Back to the desk', bs: 'Nazad za sto' } },
    'map-end': { line: { en: 'The map can hold while the country is destroyed', bs: 'Karta može držati dok se zemlja uništava' }, pos: 'center' },
  },
  directive: {
    'map-w68': { kicker: { en: 'July 1993 · week 68', bs: 'Juli 1993. · 68. sedmica' }, line: { en: 'A corps asks for reserves', bs: 'Korpus traži rezerve' }, pos: 'center' },
    'decision-room': { kicker: { en: 'Decision Room', bs: 'Soba za odluke' }, line: { en: 'The request reaches your desk', bs: 'Zahtjev stiže na tvoj sto' } },
    'review-card': { line: { en: 'Read the staff case', bs: 'Pročitaj štabni dosije' } },
    'directive-card': { kicker: { en: 'The directive', bs: 'Direktiva' }, line: { en: 'Authority is spent, not free', bs: 'Autoritet se troši, nije besplatan' } },
    issued: { line: { en: 'One signature. The order goes down the chain.', bs: 'Jedan potpis. Naredba ide niz lanac.' } },
    receipt: { kicker: { en: 'Receipt', bs: 'Potvrda' }, line: { en: 'Every order is on the record', bs: 'Svaka naredba je zapisana' } },
    desk: { line: { en: 'Back to the desk', bs: 'Nazad za sto' } },
    'map-end': { line: { en: 'The front will answer in its own time', bs: 'Front će odgovoriti kad dođe vrijeme' }, pos: 'center' },
  },
};

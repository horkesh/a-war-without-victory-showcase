// Regenerates the faction media panels in index.html and bs/index.html.
// Run after recapturing media: node build_panels.mjs
import fs from "node:fs";

const SCREENS = [
  { key: "01_desk", num: "01", en: ["President's Desk", "Command surface, authority meter, and the presidential inbox."], bs: ["Predsjednički sto", "Komandna površina, mjera autoriteta i predsjednička pošta."] },
  { key: "02_war_map", num: "02", en: ["Tactical War Map", "Front lines, formations, and the campaign casualty ledger."], bs: ["Taktička ratna karta", "Linije fronta, formacije i knjiga gubitaka kampanje."] },
  { key: "04_review_before_advance", num: "03", en: ["Review Before Advance", "What blocks the turn, and why, before you commit it."], bs: ["Pregled prije nastavka", "Šta blokira sedmicu, i zašto, prije nego što je potvrdite."] },
  { key: "05_decision_room", num: "04", en: ["Decision Room", "Pending counter-offers and command dossiers awaiting signature."], bs: ["Soba za odluke", "Protivponude i komandni dosijei koji čekaju potpis."] },
  { key: "05a_peace_proposal", num: "", en: ["Peace Proposal", "History's peace plans arrive as live decisions — the map they draw, and the price of saying no."], bs: ["Mirovni prijedlog", "Historijski mirovni planovi stižu kao žive odluke — karta koju crtaju i cijena odbijanja."] },
  { key: "05b_required_decision", num: "", en: ["Required Decision", "What needs the President's signature carries its consequences with it — projected civilian cost, the record it creates, the standing it spends."], bs: ["Obavezna odluka", "Ono što traži predsjednički potpis nosi svoje posljedice — projektovane civilne žrtve, zapis koji ostaje, ugled koji se troši."] },
  { key: "05c_presidential_action", num: "", en: ["Army HQ Request", "The army asks; the President weighs the front against the reserve. Five levers, none of them free."], bs: ["Zahtjev Glavnog štaba", "Vojska traži; predsjednik važe front naspram rezerve. Pet poluga, nijedna besplatna."] },
  { key: "06_army_hq_briefing", num: "05", en: ["Army HQ Briefing", "The Chief of Staff briefing, named casualties, and corps readiness."], bs: ["Brifing Glavnog štaba", "Brifing načelnika štaba, imenovani gubici i spremnost korpusa."] },
  { key: "07_corps_command", num: "06", en: ["Corps Command", "Sectors, front density, and brigade deployment inside one corps."], bs: ["Komanda korpusa", "Sektori, gustina fronta i raspored brigada unutar jednog korpusa."] },
  { key: "07a_sector_command", num: "07", en: ["Sector Command", "Front-line brigades, morale, and enemy contact in one sector."], bs: ["Komanda sektora", "Prvolinijske brigade, moral i kontakt s neprijateljem u jednom sektoru."] },
  { key: "07a2_formation_detail", num: "08", en: ["Formation Detail", "A single brigade's strength, equipment, and entrenchment."], bs: ["Detalj formacije", "Brojno stanje, oprema i ukopanost jedne brigade."] },
  { key: "07b_war_summary", num: "09", en: ["War Summary", "Readiness and condition of the armed forces at a glance."], bs: ["Ratni pregled", "Spremnost i stanje oružanih snaga na jedan pogled."] },
  { key: "07c_personnel", num: "10", en: ["Personnel", "Named officers, appointments, and command changes on record."], bs: ["Kadrovi", "Imenovani oficiri, postavljenja i promjene u komandi."] },
  { key: "08_records", num: "11", en: ["Records", "Operation archive and territory held over the life of the campaign."], bs: ["Arhiva", "Arhiv operacija i teritorija kroz cijelu kampanju."] },
  { key: "09_chronicle", num: "12", en: ["Chronicle", "The campaign's developing story, week by week."], bs: ["Hronika", "Priča kampanje kako se razvija, iz sedmice u sedmicu."] },
  { key: "10_codex", num: "13", en: ["Codex", "Historical essays and the record of how this war diverged from history."], bs: ["Kodeks", "Historijski eseji i zapis o tome koliko se ovaj rat udaljio od stvarnog."] },
];

const FACTIONS = [
  { id: "rbih", label: "RBiH", en: { full: "Republic of Bosnia and Herzegovina", opening: "Opening: desk to war map", tour: "Command tour: Sarajevo" }, bs: { full: "Republika Bosna i Hercegovina", opening: "Otvaranje: od stola do karte", tour: "Komandna tura: Sarajevo" } },
  { id: "rs", label: "RS", en: { full: "Republika Srpska", opening: "Opening: desk to war map", tour: "Command tour: Pale" }, bs: { full: "Republika Srpska", opening: "Otvaranje: od stola do karte", tour: "Komandna tura: Pale" } },
  { id: "hrhb", label: "HRHB", en: { full: "Croatian Republic of Herzeg-Bosnia", opening: "Opening: desk to war map", tour: "Command tour: Grude" }, bs: { full: "Hrvatska Republika Herceg-Bosna", opening: "Otvaranje: od stola do karte", tour: "Komandna tura: Grude" } },
];

// Video durations, read from the actual encoded files at build time when
// ffprobe is available; falls back to the placeholder if not.
import { execSync } from "node:child_process";
function duration(rel) {
  try {
    const out = execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${rel}"`, { encoding: "utf8" }).trim();
    const s = Math.round(Number.parseFloat(out));
    if (!Number.isFinite(s) || s <= 0) return "";
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  } catch { return ""; }
}

function esc(s) { return s.replace(/&/g, "&amp;"); }

function videoCard(prefix, f, kind, label, openCue, downloadLabel) {
  const base = `${prefix}media/videos/${f.id}_${kind}`;
  const poster = `${prefix}media/screenshots/${f.id}/${kind === "opening" ? "01_desk" : "06_army_hq_briefing"}.png`;
  const time = duration(`media/videos/${f.id}_${kind}.mp4`);
  return `<article class="video-card"><a class="video-trigger" href="${base}.webm" data-lightbox="video" data-lightbox-mp4="${base}.mp4" data-lightbox-group="tours-${f.id}" data-lightbox-title="${esc(f.label)} — ${esc(label)}" data-lightbox-poster="${poster}" aria-label="${esc(label)}"><img src="${poster}" alt="" loading="lazy"><span class="play-chip" aria-hidden="true">&#9654;</span><span class="video-open-cue">${openCue}</span></a><div class="video-info"><div class="video-meta"><span>${f.label}</span><time>${time}</time></div><h3>${esc(label)}</h3><a href="${base}.mp4" download>${downloadLabel} &#8595;</a></div></article>`;
}

function galleryCard(prefix, f, screen, lang, num) {
  const [title, desc] = screen[lang];
  const img = `${prefix}media/screenshots/${f.id}/${screen.key}.png`;
  return `<figure class="gallery-card"><a href="${img}" data-lightbox="image" data-lightbox-group="screens-${f.id}" data-lightbox-title="${esc(f.label)}: ${esc(title)}"><img src="${img}" alt="${esc(f.label)}: ${esc(title)}" loading="lazy"></a><figcaption><span>${num}</span><div><strong>${esc(title)}</strong><p>${esc(desc)}</p></div></figcaption></figure>`;
}

function panels(lang, prefix) {
  const openCue = lang === "bs" ? "Otvori snimak" : "Open video";
  const downloadLabel = lang === "bs" ? "Preuzmi MP4 snimak" : "Download MP4 recording";
  return FACTIONS.map((f, i) => {
    const meta = f[lang];
    const videos = `<div class="video-grid">${videoCard(prefix, f, "opening", meta.opening, openCue, downloadLabel)}${videoCard(prefix, f, "tour", meta.tour, openCue, downloadLabel)}</div>`;
    const gallery = `<div class="gallery-grid">${SCREENS.map((s, i) => galleryCard(prefix, f, s, lang, String(i + 1).padStart(2, "0"))).join("")}</div>`;
    return `<div class="faction-panel" id="faction-panel-${f.id}" role="tabpanel" aria-labelledby="faction-tab-${f.id}"${i === 0 ? "" : " hidden"}>${videos}${gallery}</div>`;
  }).join("\n");
}

function inject(file, html) {
  const src = fs.readFileSync(file, "utf8");
  const out = src.replace(
    /(<div class="faction-panels">)[\s\S]*?(<\/div>\s*<p class="capture-note")/,
    `$1\n${html}\n$2`,
  );
  if (!/<div class="faction-panels">/.test(src)) throw new Error(`No faction-panels block found in ${file}`);
  if (out === src) { console.log(`unchanged ${file}`); return; }
  fs.writeFileSync(file, out, "utf8");
  console.log(`updated ${file}`);
}

inject("index.html", panels("en", ""));
if (fs.existsSync("bs/index.html")) inject("bs/index.html", panels("bs", "../"));

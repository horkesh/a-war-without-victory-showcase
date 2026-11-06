// Generates screens.html (EN) and bs/screens.html: the full screenshot set per faction, kept off the
// front page. Run after recapturing stills: node build_screens.mjs
import fs from "node:fs";

const SCREENS = [
  { key: "01_desk", en: ["President's desk", "Command surface, authority meter and the presidential inbox."], bs: ["Predsjednički sto", "Komandna površina, mjera autoriteta i predsjednička pošta."] },
  { key: "02_war_map", en: ["War map", "Front lines, formations and the campaign casualty ledger."], bs: ["Ratna karta", "Linije fronta, formacije i knjiga gubitaka kampanje."] },
  { key: "04_review_before_advance", en: ["Review before advance", "What blocks the week, and why, before you commit it."], bs: ["Pregled prije nastavka", "Šta blokira sedmicu, i zašto, prije nego što je potvrdite."] },
  { key: "05_decision_room", en: ["Decision Room", "Counter-offers and command dossiers awaiting signature."], bs: ["Soba za odluke", "Protivponude i komandni dosijei koji čekaju potpis."] },
  { key: "05a_peace_proposal", en: ["Peace proposal", "History's peace plans arrive as live decisions, with the map they draw and the price of refusing."], bs: ["Mirovni prijedlog", "Historijski mirovni planovi stižu kao žive odluke, s kartom koju crtaju i cijenom odbijanja."] },
  { key: "05b_required_decision", en: ["Required decision", "A decision that needs the president's signature, with its projected civilian cost and the record it creates."], bs: ["Obavezna odluka", "Odluka koja traži predsjednički potpis, s projektovanim civilnim žrtvama i zapisom koji ostaje."] },
  { key: "05c_presidential_action", en: ["Army HQ request", "The army asks; the president weighs the front against the reserve."], bs: ["Zahtjev Glavnog štaba", "Vojska traži; predsjednik važe front naspram rezerve."] },
  { key: "06_army_hq_briefing", en: ["Army HQ briefing", "The Chief of Staff's briefing, named casualties and corps readiness."], bs: ["Brifing Glavnog štaba", "Brifing načelnika štaba, imenovani gubici i spremnost korpusa."] },
  { key: "07_corps_command", en: ["Corps command", "Sectors, front density and brigade deployment inside one corps."], bs: ["Komanda korpusa", "Sektori, gustina fronta i raspored brigada unutar jednog korpusa."] },
  { key: "07a_sector_command", en: ["Sector command", "Front-line brigades, morale and enemy contact in one sector."], bs: ["Komanda sektora", "Prvolinijske brigade, moral i kontakt s neprijateljem u jednom sektoru."] },
  { key: "07a2_formation_detail", en: ["Formation detail", "One brigade's strength, equipment and entrenchment."], bs: ["Detalj formacije", "Brojno stanje, oprema i ukopanost jedne brigade."] },
  { key: "07b_war_summary", en: ["War summary", "Readiness and condition of the armed forces."], bs: ["Ratni pregled", "Spremnost i stanje oružanih snaga."] },
  { key: "07c_personnel", en: ["Personnel", "Named officers, appointments and command changes on record."], bs: ["Kadrovi", "Imenovani oficiri, postavljenja i promjene u komandi."] },
  { key: "08_records", en: ["Records", "Operation archive and territory held over the life of the campaign."], bs: ["Arhiva", "Arhiv operacija i teritorija kroz cijelu kampanju."] },
  { key: "09_chronicle", en: ["Chronicle", "The campaign's story, week by week."], bs: ["Hronika", "Priča kampanje, iz sedmice u sedmicu."] },
  { key: "10_codex", en: ["Codex", "Historical essays and the record of how this war diverged from history."], bs: ["Kodeks", "Historijski eseji i zapis o tome koliko se ovaj rat udaljio od stvarnog."] },
];

const FACTIONS = [
  { id: "rbih", en: "Republic of Bosnia and Herzegovina", bs: "Republika Bosna i Hercegovina" },
  { id: "rs", en: "Republika Srpska", bs: "Republika Srpska" },
  { id: "hrhb", en: "Croatian Republic of Herzeg-Bosnia", bs: "Hrvatska Republika Herceg-Bosna" },
];

const T = {
  en: { title: "Screenshots", lede: "Every screen below exists for all three playable sides, captured from the same mid-campaign week in each side's own save. Click any frame to open it.", back: "Back to the front page", lang: "Bosanski", langHref: "bs/screens.html", clips: "Clips", opening: "Opening", tour: "Command tour" },
  bs: { title: "Snimci ekrana", lede: "Svaki ekran ispod postoji za sve tri igrive strane, snimljen u istoj sedmici kampanje iz vlastitog snimka svake strane. Kliknite na bilo koji kadar da ga otvorite.", back: "Nazad na početnu", lang: "English", langHref: "../screens.html", clips: "Snimci", opening: "Otvaranje", tour: "Obilazak komande" },
};

function esc(s) { return s.replace(/&/g, "&amp;"); }

function page(lang) {
  const prefix = lang === "bs" ? "../" : "";
  const t = T[lang];
  const vdir = lang === "bs" ? "bs/" : "";
  const sections = FACTIONS.map((f) => {
    const figs = SCREENS.map((s) => {
      const [title, desc] = s[lang];
      const img = `${prefix}media/screenshots/${f.id}/${s.key}.png`;
      return `<figure><a href="${img}" data-lightbox="image" data-lightbox-group="${f.id}" data-lightbox-title="${esc(f[lang])}: ${esc(title)}"><img src="${img}" alt="${esc(f[lang])}: ${esc(title)}" loading="lazy"></a><figcaption><b>${esc(title)}</b> ${esc(desc)}</figcaption></figure>`;
    }).join("\n");
    const clips = ["opening", "tour"].map((k) => `<a href="${prefix}media/videos/${vdir}${f.id}_${k}.mp4" data-lightbox="video" data-lightbox-mp4="${prefix}media/videos/${vdir}${f.id}_${k}.mp4" data-lightbox-poster="${prefix}media/videos/${vdir}${f.id}_${k}_poster.png" data-lightbox-title="${esc(f[lang])}: ${t[k]}">${t[k]}</a>`).join(" · ");
    return `<section class="screens" id="${f.id}">
  <h2>${esc(f[lang])}</h2>
  <p class="clips">${t.clips}: ${clips}</p>
  <div class="screen-grid">
${figs}
  </div>
</section>`;
  }).join("\n\n");
  return `<!DOCTYPE html>
<html lang="${lang === "bs" ? "bs" : "en"}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${t.title} · A War Without Victory</title>
  <meta name="robots" content="noindex">
  <link rel="icon" href="${prefix}favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400&family=IBM+Plex+Sans+Condensed:wght@500;600&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap">
  <link rel="stylesheet" href="${prefix}styles.css">
</head>
<body class="paper-page">
<header class="top">
  <a class="wordmark" href="${prefix}${lang === "bs" ? "bs/" : ""}"><svg class="wordmark__mark" viewBox="0 0 100 100" aria-hidden="true"><mask id="gap"><rect width="100" height="100" fill="#fff"/><g transform="translate(50 80) rotate(0) translate(0 -45)" fill="#000" stroke="#000" stroke-width="6" stroke-linejoin="round"><path d="M-13 3.5a3.5 3.5 0 0 1 3.5-3.5h19a3.5 3.5 0 0 1 3.5 3.5v7.5h-5.5l-2.5 9h-10l-2.5-9h-5.5z"/><path d="M-3.4 20h6.8v19L0 45l-3.4-6z"/></g></mask><g fill="currentColor"><g mask="url(#gap)"><g transform="translate(50 80) rotate(-26) translate(0 -45)"><path d="M-13 3.5a3.5 3.5 0 0 1 3.5-3.5h19a3.5 3.5 0 0 1 3.5 3.5v7.5h-5.5l-2.5 9h-10l-2.5-9h-5.5z"/><path d="M-3.4 20h6.8v19L0 45l-3.4-6z"/></g><g transform="translate(50 80) rotate(26) translate(0 -45)"><path d="M-13 3.5a3.5 3.5 0 0 1 3.5-3.5h19a3.5 3.5 0 0 1 3.5 3.5v7.5h-5.5l-2.5 9h-10l-2.5-9h-5.5z"/><path d="M-3.4 20h6.8v19L0 45l-3.4-6z"/></g></g><g transform="translate(50 80) rotate(0) translate(0 -45)"><path d="M-13 3.5a3.5 3.5 0 0 1 3.5-3.5h19a3.5 3.5 0 0 1 3.5 3.5v7.5h-5.5l-2.5 9h-10l-2.5-9h-5.5z"/><path d="M-3.4 20h6.8v19L0 45l-3.4-6z"/></g></g></svg><span>A War Without Victory</span></a>
  <nav><a href="${prefix}${lang === "bs" ? "bs/" : ""}">${t.back}</a><a href="${prefix}${t.langHref}">${t.lang}</a></nav>
</header>
<main class="wrap">
  <h1>${t.title}</h1>
  <p class="lede">${t.lede}</p>
${sections}
</main>
<footer class="foot"><span>A War Without Victory, Pyrrhic Games</span></footer>
<dialog class="lightbox" id="media-lightbox" aria-labelledby="lightbox-title">
  <div class="lightbox-bar">
    <span id="lightbox-title">Media preview</span>
    <span data-lightbox-counter></span>
    <button type="button" data-lightbox-close aria-label="Close">&times;</button>
  </div>
  <div data-lightbox-stage></div>
  <div class="lightbox-nav">
    <button type="button" data-lightbox-prev>&larr;</button>
    <button type="button" data-lightbox-next>&rarr;</button>
  </div>
</dialog>
<script type="module">
  import { installLightbox } from "${prefix}lightbox.js";
  installLightbox();
</script>
</body>
</html>
`;
}

fs.writeFileSync("screens.html", page("en"), "utf8");
fs.mkdirSync("bs", { recursive: true });
fs.writeFileSync("bs/screens.html", page("bs"), "utf8");
console.log("wrote screens.html, bs/screens.html");

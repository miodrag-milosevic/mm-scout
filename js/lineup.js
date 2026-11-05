"use strict";
/* =========================================================
   MM Scout — distinte di gara: carichi la distinta (PDF con
   testo, file di testo/CSV o testo incollato, anche copiato
   da una foto con «Testo live» dell'iPhone). L'app legge
   squadre, data, ora, competizione, campo, arbitro, titolari,
   panchina e allenatori, propone i ruoli, disegna le due
   formazioni e ti fa scegliere chi osservare.
   ========================================================= */
// moduli: linee dal portiere all'attacco, ogni posto = [ruolo, x (lunghezza), y (larghezza: 0 = sinistra)]
const SHEET_SYS = {
  "4-3-3": [[["Portiere", 6, 50]], [["Terzino sinistro", 24, 14], ["Difensore centrale", 20, 38], ["Difensore centrale", 20, 62], ["Terzino destro", 24, 86]], [["Mezzala", 48, 25], ["Regista", 42, 50], ["Mezzala", 48, 75]], [["Ala sinistra", 74, 14], ["Punta centrale", 82, 50], ["Ala destra", 74, 86]]],
  "4-2-3-1": [[["Portiere", 6, 50]], [["Terzino sinistro", 24, 14], ["Difensore centrale", 20, 38], ["Difensore centrale", 20, 62], ["Terzino destro", 24, 86]], [["Mediano", 40, 36], ["Mediano", 40, 64]], [["Ala sinistra", 62, 16], ["Trequartista", 62, 50], ["Ala destra", 62, 84]], [["Punta centrale", 82, 50]]],
  "4-4-2": [[["Portiere", 6, 50]], [["Terzino sinistro", 24, 14], ["Difensore centrale", 20, 38], ["Difensore centrale", 20, 62], ["Terzino destro", 24, 86]], [["Ala sinistra", 50, 14], ["Centrocampista centrale", 46, 38], ["Centrocampista centrale", 46, 62], ["Ala destra", 50, 86]], [["Punta centrale", 78, 38], ["Seconda punta", 78, 62]]],
  "4-1-4-1": [[["Portiere", 6, 50]], [["Terzino sinistro", 24, 14], ["Difensore centrale", 20, 38], ["Difensore centrale", 20, 62], ["Terzino destro", 24, 86]], [["Mediano", 36, 50]], [["Ala sinistra", 56, 14], ["Mezzala", 52, 38], ["Mezzala", 52, 62], ["Ala destra", 56, 86]], [["Punta centrale", 82, 50]]],
  "4-3-1-2": [[["Portiere", 6, 50]], [["Terzino sinistro", 24, 14], ["Difensore centrale", 20, 38], ["Difensore centrale", 20, 62], ["Terzino destro", 24, 86]], [["Mezzala", 46, 24], ["Regista", 42, 50], ["Mezzala", 46, 76]], [["Trequartista", 62, 50]], [["Punta centrale", 80, 38], ["Seconda punta", 80, 62]]],
  "4-4-1-1": [[["Portiere", 6, 50]], [["Terzino sinistro", 24, 14], ["Difensore centrale", 20, 38], ["Difensore centrale", 20, 62], ["Terzino destro", 24, 86]], [["Ala sinistra", 50, 14], ["Centrocampista centrale", 46, 38], ["Centrocampista centrale", 46, 62], ["Ala destra", 50, 86]], [["Seconda punta", 68, 50]], [["Punta centrale", 84, 50]]],
  "3-5-2": [[["Portiere", 6, 50]], [["Difensore centrale", 20, 26], ["Difensore centrale", 18, 50], ["Difensore centrale", 20, 74]], [["Quinto sinistro", 48, 10], ["Mezzala", 48, 32], ["Regista", 42, 50], ["Mezzala", 48, 68], ["Quinto destro", 48, 90]], [["Punta centrale", 80, 38], ["Seconda punta", 80, 62]]],
  "3-4-3": [[["Portiere", 6, 50]], [["Difensore centrale", 20, 26], ["Difensore centrale", 18, 50], ["Difensore centrale", 20, 74]], [["Quinto sinistro", 46, 10], ["Centrocampista centrale", 44, 38], ["Centrocampista centrale", 44, 62], ["Quinto destro", 46, 90]], [["Ala sinistra", 74, 18], ["Punta centrale", 82, 50], ["Ala destra", 74, 82]]],
  "3-4-2-1": [[["Portiere", 6, 50]], [["Difensore centrale", 20, 26], ["Difensore centrale", 18, 50], ["Difensore centrale", 20, 74]], [["Quinto sinistro", 46, 10], ["Centrocampista centrale", 44, 38], ["Centrocampista centrale", 44, 62], ["Quinto destro", 46, 90]], [["Trequartista", 66, 34], ["Trequartista", 66, 66]], [["Punta centrale", 84, 50]]],
  "3-4-1-2": [[["Portiere", 6, 50]], [["Difensore centrale", 20, 26], ["Difensore centrale", 18, 50], ["Difensore centrale", 20, 74]], [["Quinto sinistro", 46, 10], ["Centrocampista centrale", 44, 38], ["Centrocampista centrale", 44, 62], ["Quinto destro", 46, 90]], [["Trequartista", 64, 50]], [["Punta centrale", 82, 38], ["Seconda punta", 82, 62]]],
  "5-3-2": [[["Portiere", 6, 50]], [["Quinto sinistro", 30, 10], ["Difensore centrale", 20, 30], ["Difensore centrale", 18, 50], ["Difensore centrale", 20, 70], ["Quinto destro", 30, 90]], [["Mezzala", 48, 28], ["Regista", 44, 50], ["Mezzala", 48, 72]], [["Punta centrale", 80, 38], ["Seconda punta", 80, 62]]],
  "5-4-1": [[["Portiere", 6, 50]], [["Quinto sinistro", 28, 10], ["Difensore centrale", 20, 30], ["Difensore centrale", 18, 50], ["Difensore centrale", 20, 70], ["Quinto destro", 28, 90]], [["Ala sinistra", 50, 16], ["Centrocampista centrale", 46, 40], ["Centrocampista centrale", 46, 60], ["Ala destra", 50, 84]], [["Punta centrale", 80, 50]]]
};
const SHEET_LINE = { Portiere: 0, "Difensore centrale": 1, "Terzino destro": 1, "Terzino sinistro": 1, "Quinto destro": 2, "Quinto sinistro": 2, Mediano: 2, Regista: 2, "Centrocampista centrale": 2, Mezzala: 2, Trequartista: 3, "Ala destra": 3, "Ala sinistra": 3, "Seconda punta": 3, "Punta centrale": 3, "Falso 9": 3 };
const SHEET_TOK = { gk: /^(p|por|portiere|gk|g|tw|torwart|gol|golman|goalkeeper)$/, d: /^(d|dif|difensore|df|def|defender|ab|abw|v|verteidiger|odb|o)$/, m: /^(c|cen|cc|centrocampista|mf|mid|m|midfielder|mit|mittelfeld|v[ez]n?i?|vez)$/, a: /^(a|att|attaccante|fw|fwd|f|st|s|forward|striker|stürmer|sturm|n|nap|napadac)$/ };
const SHEET_RX = {
  starters: /^(titolari|formazione( titolare)?|undici titolare|starting( xi| eleven| line-?up)?|line-?up|startelf|aufstellung|anfangself|starteri|prva postava|sastav)\b/i,
  bench: /^(panchina|riserve|a disposizione|sostituti|substitutes|subs|bench|reserves|ersatz(spieler|bank)?|auswechselspieler|reserven?|klupa|rezerve|zamene)\b/i,
  coach: /^(allenatore|all\.|mister|coach|head coach|manager|trainer|cheftrainer|trener|selektor)\b[:.\s-]*/i,
  referee: /^(arbitro|direttore di gara|referee|ref\.|schiedsrichter|sr\.|sudija|sudac)\b[:.\s-]*/i,
  venue: /^(stadio|campo|impianto|stadium|venue|ground|stadion|sportplatz|spielort|igralište|teren|luogo|mjesto|mesto)\b[:.\s-]*/i,
  comp: /\b(campionato|serie [a-d]|coppa|lega|liga|league|cup|pokal|kup|torneo|tournament|turnier|primavera|under\s?\d\d|u\s?\d\d\b|allievi|giovanissimi|juniores|giornata|matchday|spieltag|kolo|super ?league|challenge|eccellenza|promozione|prima categoria)\b/i
};
const Sheet = {
  /* ---- lettura dei file ---- */
  async loadPdf() { if (window.pdfjsLib) return window.pdfjsLib; await new Promise((res, rej) => { const s = document.createElement("script"); s.src = "js/vendor/pdfjs/pdf.min.js"; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); window.pdfjsLib.GlobalWorkerOptions.workerSrc = "js/vendor/pdfjs/pdf.worker.min.js"; return window.pdfjsLib; },
  async pdfText(file) {
    const lib = await this.loadPdf(); const doc = await lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false }).promise; const out = [];
    for (let p = 1; p <= Math.min(doc.numPages, 6); p++) {
      const page = await doc.getPage(p); const vw = page.getViewport({ scale: 1 }).width; const tc = await page.getTextContent(); const rows = [];
      for (const it of tc.items) { if (!it.str || !it.str.trim()) continue; const x = it.transform[4], y = Math.round(it.transform[5]); let r = rows.find(r => Math.abs(r.y - y) <= 3); if (!r) rows.push(r = { y, items: [] }); r.items.push({ x, s: it.str }); }
      rows.sort((a, b) => b.y - a.y);
      // due colonne (casa a sinistra, trasferta a destra)?
      const both = rows.filter(r => r.items.some(i => i.x < vw * 0.45) && r.items.some(i => i.x > vw * 0.52)).length; const twoCol = both >= 6;
      for (const r of rows) { r.items.sort((a, b) => a.x - b.x); if (twoCol) { const L1 = r.items.filter(i => i.x < vw * 0.5).map(i => i.s).join(" ").replace(/\s+/g, " ").trim(), R1 = r.items.filter(i => i.x >= vw * 0.5).map(i => i.s).join(" ").replace(/\s+/g, " ").trim(); out.push(L1 && R1 ? L1 + "\t\t" + R1 : L1 ? L1 + "\t\t" : "\t\t" + R1); } else out.push(r.items.map(i => i.s).join(" ").replace(/\s+/g, " ").trim()); }
    }
    return out.join("\n");
  },
  /* ---- interpretazione del testo ---- */
  cleanName(s) { return s.replace(/\((c|k|cap|capt\.?|kap\.?)\)|©|\*|†/gi, " ").replace(/\b(cap(itano)?|captain|kapitän|kapiten)\b/gi, " ").replace(/\s+/g, " ").replace(/^[-–.,:;]+|[-–.,:;]+$/g, "").trim(); },
  roleTok(w) { w = Search.norm(w).replace(/\./g, ""); for (const k in SHEET_TOK) if (SHEET_TOK[k].test(w)) return k; return ""; },
  playerLine(s) {
    s = s.trim(); if (!s || s.length > 70) return null; let m, n = "", name = s, cap = /\((c|k|cap)\)|©|\bcap(itano)?\b|\bcaptain\b/i.test(s), year = "", tok = "";
    name = name.replace(/\((c|k|cap|capt\.?|kap\.?)\)|©/gi, " ").replace(/\s+/g, " ").trim();
    if ((m = s.match(/\b(19[89]\d|20[012]\d)\b/))) { year = m[1]; name = name.replace(m[0], " "); }
    if ((m = name.match(/^\s*(\d{1,2})[\s.)\-–:]+(.+)$/))) { n = m[1]; name = m[2]; } else if ((m = name.match(/^(.+?)[\s(]+(\d{1,2})\)?\s*$/))) { name = m[1]; n = m[2]; }
    const words = name.trim().split(/\s+/); if (words.length > 1) { const a = this.roleTok(words[0]), b = this.roleTok(words[words.length - 1]); if (a && words[0].length <= 3) { tok = a; words.shift(); } else if (b && words[words.length - 1].length <= 3) { tok = b; words.pop(); } }
    name = this.cleanName(words.join(" ")); if (!/[A-Za-zÀ-žđĐ]{2}/.test(name)) return null; if (!n && !tok && name.split(" ").length > 4) return null;
    if (/^(gol|goal|tor|ammonit|espuls|sostituz|cambi|note|spettatori|recupero|angoli|marcatori|risultato|result)/i.test(name)) return null;
    return { n, name, cap, year, tok };
  },
  parse(text) {
    const res = { home: "", away: "", date: "", time: "", comp: "", venue: "", referee: "", teams: [{ coach: "", players: [] }, { coach: "", players: [] }] };
    const lines = text.replace(/\r/g, "").split("\n").map(x => x.replace(/ /g, " ").trimEnd()).filter(x => x.trim());
    let cur = 0, sec = "start", seenStarters = [0, 0], cols = lines.some(l => /\t\t|\s{4,}\d{1,2}\s/.test(l));
    const teamName = l => { const m = l.match(/^(.{2,40}?)\s+(?:-|–|—|vs\.?|v\.?|contro|gegen|protiv)\s+(.{2,40}?)(?:\s+(\d{1,2})\s*[-:]\s*(\d{1,2}))?$/i); return m && !/^\d/.test(m[1]) && !/\d{1,2}[:.]\d{2}/.test(l) ? [m[1].trim(), m[2].trim()] : null; };
    const takeMeta = l => {
      let m; if (!res.date && (m = l.match(/\b(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})\b/))) { const y = m[3].length === 2 ? "20" + m[3] : m[3]; res.date = `${y}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`; }
      if (!res.date && (m = l.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/))) res.date = m[0];
      if (!res.time && (m = l.match(/\b(?:ore|h|um|u|at|alle)?\s*([01]?\d|2[0-3])[:.]([0-5]\d)\b/i)) && !/^\d{1,2}\s/.test(l)) res.time = m[1].padStart(2, "0") + ":" + m[2];
      if (!res.venue && SHEET_RX.venue.test(l)) res.venue = l.replace(SHEET_RX.venue, "").trim();
      if (!res.referee && SHEET_RX.referee.test(l)) res.referee = l.replace(SHEET_RX.referee, "").trim();
      if (!res.comp && SHEET_RX.comp.test(l) && l.length < 80 && !this.playerLine(l)?.n) res.comp = l.replace(/^(competizione|competition|wettbewerb|takmičenje)[:\s-]*/i, "").trim();
    };
    for (const raw of lines) {
      const parts = cols && /\t\t/.test(raw) ? raw.split(/\t\t/) : cols && /\s{4,}/.test(raw) ? raw.split(/\s{4,}/) : [raw];
      if (parts.length === 2) { // riga su due colonne: casa | trasferta
        parts.forEach((pt, side) => { const s = pt.trim(); if (!s) return; if (SHEET_RX.starters.test(s)) { sec = "starters"; return; } if (SHEET_RX.bench.test(s)) { sec = "bench"; return; } if (SHEET_RX.coach.test(s)) { res.teams[side].coach = s.replace(SHEET_RX.coach, "").trim(); return; }
          const pl = this.playerLine(s); if (pl && (pl.n || pl.tok)) res.teams[side].players.push({ ...pl, starter: sec !== "bench" }); else if (!res[side ? "away" : "home"] && sec === "start" && s.length < 40 && !/\d/.test(s)) res[side ? "away" : "home"] = s; else takeMeta(s); });
        continue;
      }
      const l = raw.trim(); const tn = teamName(l);
      const isMeta = /\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b|\b20\d{2}-\d{2}-\d{2}\b/.test(l) || (SHEET_RX.comp.test(l) && !/^\d{1,2}[\s.)]+[A-Za-zÀ-ž]/.test(l)) || SHEET_RX.venue.test(l) || SHEET_RX.referee.test(l) || /^(ore|h|um|kick-?off|anstoß|početak)\b/i.test(l);
      if (isMeta && !tn) { takeMeta(l); continue; }
      if (tn && !res.home) { [res.home, res.away] = tn; continue; }
      if (res.home && Search.sim(Search.norm(l), Search.norm(res.home)) > 0.85) { cur = 0; sec = "team"; continue; }
      if (res.away && Search.sim(Search.norm(l), Search.norm(res.away)) > 0.85) { cur = 1; sec = "team"; continue; }
      if (SHEET_RX.starters.test(l)) { if (seenStarters[cur] && sec !== "team") cur = 1; seenStarters[cur]++; sec = "starters"; const rest = l.replace(SHEET_RX.starters, "").replace(/^[:\s-]+/, ""); const tn2 = rest && rest.length < 40 ? rest : ""; if (tn2) res[cur ? "away" : "home"] = res[cur ? "away" : "home"] || tn2; continue; }
      if (SHEET_RX.bench.test(l)) { sec = "bench"; continue; }
      if (SHEET_RX.coach.test(l)) { res.teams[cur].coach = l.replace(SHEET_RX.coach, "").trim(); if (sec === "bench" || sec === "starters") { sec = "after"; } continue; }
      const pl = this.playerLine(l);
      if (pl && (pl.n || pl.tok || sec === "starters" || sec === "bench")) {
        if (sec === "after") { cur = 1; sec = "starters"; seenStarters[1]++; }
        const T = res.teams[cur]; const st = sec === "bench" ? false : sec === "starters" ? true : T.players.filter(x => x.starter).length < 11;
        // numerazione che riparte e squadra già completa: inizia la seconda squadra
        if (cur === 0 && sec !== "bench" && sec !== "starters" && T.players.length >= 11 && pl.n && T.players.some(x => x.n === pl.n)) { cur = 1; }
        res.teams[cur].players.push({ ...pl, starter: cur === 1 && sec !== "bench" && sec !== "starters" ? res.teams[1].players.filter(x => x.starter).length < 11 : st });
        continue;
      }
      if (!res.home && l.length < 40 && !/\d/.test(l) && !SHEET_RX.comp.test(l)) { res.home = l; continue; }
      if (res.home && !res.away && cur === 0 && res.teams[0].players.length >= 11 && l.length < 40 && !/\d/.test(l)) { res.away = l; cur = 1; continue; }
      takeMeta(l);
    }
    for (const T of res.teams) T.system = this.guessSystem(T.players.filter(p => p.starter));
    return res;
  },
  guessSystem(st) { const c = { d: 0, m: 0, a: 0 }; st.forEach(p => { if (c[p.tok] != null) c[p.tok]++; }); if (st.some(p => p.tok) && c.d + c.m + c.a === 10) { const k = `${c.d}-${c.m}-${c.a}`; if (SHEET_SYS[k]) return k; const alt = Object.keys(SHEET_SYS).find(s => { const L0 = SHEET_SYS[s].slice(1).map(x => x.length); return L0[0] === c.d && L0.slice(1, -1).reduce((a, b) => a + b, 0) + (L0.length > 3 ? 0 : 0) === c.m && L0[L0.length - 1] === c.a; }); if (alt) return alt; } return ""; },
  /* ---- abbinamento giocatori del tuo archivio ---- */
  findPlayer(name, team, n) {
    const nq = Search.norm(name); let best = "", bs = 0;
    for (const [id, p] of S.players) { if (p.archived) continue; const cands = [pname(p), (p.last || "") + " " + (p.first || ""), p.last, p.alias].filter(Boolean).map(Search.norm); let s = Math.max(...cands.map(c => c === nq ? 1 : Search.sim(nq, c))); if (p.last && nq.split(" ").includes(Search.norm(p.last)) && nq.length > 3) s = Math.max(s, 0.86); const clubOk = team && p.club && Search.sim(Search.norm(team), Search.norm(p.club)) > 0.7; if (clubOk) s += 0.06; if (n && p.shirt && String(p.shirt) === String(n) && clubOk) s += 0.1; if (s > bs) { bs = s; best = id; } }
    return bs >= 0.9 ? best : "";
  },
  /* ---- ruoli e posizioni sul campo ---- */
  place(players, sys) {
    const st = players.filter(p => p.starter); const tpl = SHEET_SYS[sys] || SHEET_SYS["4-3-3"]; const lines = tpl.map(l => l.slice());
    const lineOf = p => { const r = p.role || (p.pid && mainRole(P(p.pid))); if (r && SHEET_LINE[r] != null) return SHEET_LINE[r]; return { gk: 0, d: 1, m: 2, a: 3 }[p.tok] ?? -1; };
    const groups = lines.map(() => []); const nLines = lines.length; const map = l => l === 0 ? 0 : l === 1 ? 1 : l === 3 ? nLines - 1 : l === 2 ? Math.min(2, nLines - 2) : -1;
    const rest = [];
    const gk = st.find(p => lineOf(p) === 0) || st.find(p => p.n === "1") || st[0];
    for (const p of st) { if (p === gk) { groups[0].push(p); continue; } const L0 = map(lineOf(p)); if (L0 > 0 && groups[L0].length < lines[L0].length) groups[L0].push(p); else rest.push(p); }
    // gli altri riempiono i posti liberi nell'ordine della distinta
    for (const p of rest) { const i = groups.findIndex((g, k) => k > 0 && g.length < lines[k].length); if (i >= 0) groups[i].push(p); }
    groups.forEach((g, i) => { const slots = lines[i].slice(); // chi ha già un ruolo laterale va sul suo lato
      const sideOf = p => { const r = p.role || (p.pid && mainRole(P(p.pid))) || ""; if (/sinistr/i.test(r)) return 0; if (/destr/i.test(r)) return 2; const nh = { 2: 2, 3: 0, 7: 2, 11: 0 }[p.n]; return nh ?? 1; }; // numerazione classica: 2 e 7 a destra, 3 e 11 a sinistra
      g.sort((a, b) => sideOf(a) - sideOf(b)); g.forEach((p, k) => { const s = slots[k] || slots[slots.length - 1]; p.slot = s; p.x = s[1]; p.y = s[2]; if (!p.role) p.role = s[0]; }); });
    players.filter(p => !p.starter).forEach(p => { if (!p.role && p.tok) p.role = { gk: "Portiere", d: "Difensore centrale", m: "Centrocampista centrale", a: "Punta centrale" }[p.tok]; });
    return players;
  },
  /* ---- interfaccia ---- */
  open(matchId) {
    sheet(`<h2>${t("Carica distinta")}</h2><p class="sub small">${t("PDF della distinta, file di testo o CSV, oppure incolla il testo. Da una foto: su iPhone apri la foto, tieni premuto sul testo (Testo live), «Seleziona tutto», «Copia» e incolla qui.")}</p>
      <div class="row"><button class="btn" id="shFile">${t("Scegli file (PDF, TXT, CSV)")}</button><span class="m" id="shFn"></span></div>
      <label class="f">${t("…oppure incolla qui il testo della distinta")}<textarea id="shText" class="mono small" style="min-height:180px" placeholder="${esc(t("Esempio:\nFC Rossi - AC Bianchi\n12/10/2026 ore 15:00\nCampionato Under 17\nTitolari\n1 Verdi Luca P\n2 Neri Marco D\n…\nPanchina\n12 Gialli Paolo\nAllenatore: Blu Carlo"))}"></textarea></label>
      <div class="warn" id="shErr"></div>
      <div class="row end"><button class="btn" data-a="closeSheetBtn">${t("Annulla")}</button><button class="btn pri" id="shGo">${t("Leggi la distinta")}</button></div>`, true);
    $("#shFile").onclick = async () => {
      const [f] = await pickFile(".pdf,.txt,.csv,.tsv,text/plain,application/pdf"); if (!f) return; $("#shFn").textContent = f.name + " · " + t("Caricamento…");
      try { $("#shText").value = /pdf$/i.test(f.name) || f.type === "application/pdf" ? await this.pdfText(f) : (await f.text()).replace(/[;,](?=\S)/g, " "); $("#shFn").textContent = f.name; if (!$("#shText").value.trim()) $("#shErr").textContent = t("Il PDF non contiene testo (è una scansione o una foto). Copia il testo con «Testo live» e incollalo qui."); }
      catch (e) { $("#shFn").textContent = f.name; $("#shErr").textContent = t("File non leggibile. Prova a copiare e incollare il testo."); }
    };
    $("#shGo").onclick = () => { const tx = $("#shText").value; if (!tx.trim()) { $("#shErr").textContent = t("Non trovo dati: carica un file o incolla il testo."); return; } const r = this.parse(tx); if (!r.teams[0].players.length && !r.teams[1].players.length) { $("#shErr").textContent = t("Non ho riconosciuto giocatori. Controlla che ogni riga abbia numero e nome (es. «7 Rossi Mario»)."); return; } this.review(r, matchId); };
  },
  review(r, matchId) {
    const m = matchId ? S.matches.get(matchId) : null; const c = Cfg.get();
    const home = r.home || (m && m.home) || t("Squadra di casa"), away = r.away || (m && m.away) || t("Squadra in trasferta");
    r.teams.forEach((T, i) => T.players.forEach(p => { p.pid = this.findPlayer(p.name, i ? away : home, p.n); if (p.pid && !p.tok) { const pr = mainRole(P(p.pid)); if (pr) p.role = pr; } }));
    const sysOpts = Object.keys(SHEET_SYS);
    const roleSel = (v, k) => `<select data-k="${k}" class="shRole"><option value="">—</option>${c.roles.map(x => `<option value="${esc(x.id)}" ${x.id === v ? "selected" : ""}>${esc(L(x))}</option>`).join("")}</select>`;
    const rows = (T, ti) => T.players.map((p, i) => `<div class="shrow" data-t="${ti}" data-i="${i}"><input type="checkbox" class="shTg" title="${t("Da osservare")}" ${p.pid && m && (m.targets || []).includes(p.pid) ? "checked" : ""}><input type="text" class="shN mono" value="${esc(p.n)}" inputmode="numeric" aria-label="${t("N° maglia")}"><input type="text" class="shName" value="${esc(p.name)}"><select class="shSt"><option value="1" ${p.starter ? "selected" : ""}>${t("Titolare")}</option><option value="0" ${!p.starter ? "selected" : ""}>${t("Panchina")}</option></select>${roleSel(p.role || "", "role")}${p.pid ? `<span class="pill c-good" title="${esc(pname(P(p.pid)))}">${t("in archivio")}</span>` : ""}</div>`).join("");
    sheet(`<h2>${t("Controlla la distinta")}</h2><p class="sub small">${t("Correggi se serve, spunta ☑ i giocatori da osservare e salva: la partita è pronta con formazioni e ruoli.")}</p>
     <div class="fgrid"><label class="f">${t("Squadra di casa")}<input type="text" id="shHome" value="${esc(home)}"></label><label class="f">${t("Squadra in trasferta")}<input type="text" id="shAway" value="${esc(away)}"></label>
      <label class="f">${t("Data")}<input type="date" id="shDate" value="${esc(r.date || (m && m.date) || today())}"></label><label class="f">${t("Ora")}<input type="time" id="shTime" value="${esc(r.time || (m && m.time) || "")}"></label>
      <label class="f">${t("Competizione")}<input type="text" id="shComp" value="${esc(r.comp || (m && m.competition) || "")}"></label><label class="f">${t("Luogo")}<input type="text" id="shVenue" value="${esc(r.venue || (m && m.venue) || "")}"></label>
      <label class="f">${t("Arbitro")}<input type="text" id="shRef" value="${esc(r.referee || (m && m.referee) || "")}"></label><label class="f">${t("Categoria squadra")}${sel("shCat", c.teamCats, (m && m.teamCat) || "", "—")}</label></div>
     ${r.teams.map((T, ti) => `<section class="panel" style="padding:12px"><div class="row between"><h3>${esc(ti ? away : home)}</h3><label class="row small">${t("Modulo")}<select id="shSys${ti}"><option value="">${t("automatico")}</option>${sysOpts.map(s => `<option ${s === T.system ? "selected" : ""}>${s}</option>`).join("")}</select></label></div>
       <label class="f">${t("Allenatore")}<input type="text" id="shCoach${ti}" value="${esc(T.coach)}"></label>
       <div class="m" style="margin:6px 0">☑ = ${t("da osservare")} · ${t("{a} titolari, {b} in panchina", { a: T.players.filter(p => p.starter).length, b: T.players.filter(p => !p.starter).length })}</div><div class="shlist">${rows(T, ti) || `<p class="muted">${t("Nessun giocatore letto per questa squadra.")}</p>`}</div></section>`).join("")}
     <label class="chk"><input type="checkbox" id="shAll"> ${t("Crea la scheda anche per i giocatori non spuntati (sconsigliato: riempie l'archivio)")}</label>
     <div class="row end"><button class="btn" data-a="closeSheetBtn">${t("Annulla")}</button><button class="btn pri" id="shSave">${m ? t("Aggiorna la partita") : t("Crea la partita")}</button></div>`, true);
    $("#shSave").onclick = () => this.save(r, matchId);
  },
  save(r, matchId) {
    const all = $("#shAll").checked; const home = $("#shHome").value.trim(), away = $("#shAway").value.trim(); const targets = new Set(matchId ? (S.matches.get(matchId).targets || []) : []);
    const teams = r.teams.map((T, ti) => ({ coach: $("#shCoach" + ti).value.trim(), system: $("#shSys" + ti).value, players: [] }));
    $$(".shrow").forEach(row => { const ti = +row.dataset.t, p = { ...r.teams[ti].players[+row.dataset.i] }; p.n = row.querySelector(".shN").value.trim(); p.name = row.querySelector(".shName").value.trim(); p.starter = row.querySelector(".shSt").value === "1"; p.role = row.querySelector(".shRole").value; p.target = row.querySelector(".shTg").checked; if (p.name) teams[ti].players.push(p); });
    teams.forEach((T, ti) => {
      if (!T.system) T.system = this.guessSystem(T.players.filter(p => p.starter)) || (T.players.filter(p => p.starter).length >= 11 ? "4-3-3" : "");
      this.place(T.players, T.system);
      for (const p of T.players) {
        if (!p.pid && (p.target || all)) { const id = uid(); const parts = p.name.split(" "); const r0 = Cfg.role(p.role);
          // nelle distinte di solito c'è prima il cognome
          const last = parts.length > 1 ? parts[0] : p.name, first = parts.length > 1 ? parts.slice(1).join(" ") : "";
          put("players", id, { first, last, shirt: p.n, club: ti ? away : home, roles: p.role ? [p.role] : [], pos: r0 ? { x: r0.x, y: r0.y } : null, birthYear: p.year || "", verdict: "rivedere", tags: [], listIds: [], sex: "Uomo", contract: {}, physique: {}, pros: [], cons: [], injuries: [], relations: [], notes: t("Creato dalla distinta di {h} – {a}.", { h: home, a: away }) }); p.pid = id; }
        else if (p.pid) { const pp = P(p.pid); const patch = {}; if (p.n && !pp.shirt) patch.shirt = p.n; if (!(pp.roles || []).length && p.role) patch.roles = [p.role]; if (Object.keys(patch).length) put("players", p.pid, { ...pp, ...patch }); }
        if (p.target && p.pid) targets.add(p.pid);
      }
    });
    const id = matchId || uid(); const m0 = matchId ? S.matches.get(matchId) : { events: [], status: "pianificata", type: "Campionato", tags: [] };
    const lineTxt = T => T.players.filter(p => p.starter).map(p => `${p.n} ${p.name}${p.cap ? " (C)" : ""}`).join("\n") + (T.players.some(p => !p.starter) ? "\n— " + t("Panchina") + ": " + T.players.filter(p => !p.starter).map(p => `${p.n} ${p.name}`).join(", ") : "") + (T.coach ? "\n" + t("Allenatore") + ": " + T.coach : "");
    const pre = { ...(m0.pre || {}), lineupHome: lineTxt(teams[0]), lineupAway: lineTxt(teams[1]), players: { ...((m0.pre || {}).players || {}) } };
    for (const T of teams) for (const p of T.players) if (p.pid && targets.has(p.pid)) pre.players[p.pid] = { ...(pre.players[p.pid] || {}), status: p.starter ? "Titolare" : "Panchina", role: p.role || "" };
    const strip = T => ({ coach: T.coach, system: T.system, players: T.players.map(p => ({ n: p.n, name: p.name, role: p.role || "", starter: p.starter, cap: !!p.cap, pid: p.pid || "", x: p.x ?? null, y: p.y ?? null })) });
    put("matches", id, { ...m0, home, away, date: $("#shDate").value, time: $("#shTime").value, competition: $("#shComp").value.trim(), venue: $("#shVenue").value.trim(), referee: $("#shRef").value.trim(), teamCat: $("#shCat").value || m0.teamCat || "", sysHome: sysId(teams[0].system) || m0.sysHome, sysAway: sysId(teams[1].system) || m0.sysAway, targets: [...targets], pre, sheet: { home: strip(teams[0]), away: strip(teams[1]), loaded: new Date().toISOString() } });
    closeSheet(); toast(t("Distinta caricata: {n} giocatori da osservare", { n: targets.size })); ui.view = "partite"; ui.matchId = id; ui.mtab = "prima"; history.replaceState(null, "", "#partite"); render();
  }
};
function sysId(s) { if (!s) return ""; const l = Cfg.get().systems || []; return l.includes("1-" + s) ? "1-" + s : l.includes(s) ? s : "1-" + s; }
/* ---------- formazioni disegnate nella partita ---------- */
function sheetPitch(T, side, m) {
  const Lc = "var(--pitch-line)"; const tg = new Set(m.targets || []); const st = T.players.filter(p => p.starter && p.x != null);
  const dots = st.map(p => { const on = p.pid && tg.has(p.pid); const nm = (p.name.split(" ")[0] || "").slice(0, 11); const X = p.x * 1.05, Y = p.y * 0.68; return `<g class="shp${on ? " on" : ""}" data-a="sheetTarget" data-side="${side}" data-n="${esc(p.n)}" data-name="${esc(p.name)}" style="cursor:pointer"><circle cx="${X}" cy="${Y}" r="3.6"/><text x="${X}" y="${Y + 1.3}" text-anchor="middle" font-size="3.4" font-weight="700">${esc(p.n || "")}</text><text x="${X}" y="${Y + 7.3}" text-anchor="middle" font-size="3" class="shnm">${esc(nm)}${p.cap ? " ©" : ""}</text></g>`; }).join("");
  return `<svg class="pitch" viewBox="-3 -3 111 76" role="img"><rect x="-3" y="-3" width="111" height="76" fill="var(--pitch)"/><g fill="none" stroke="${Lc}" stroke-width=".5"><rect x="0" y="0" width="105" height="68"/><line x1="52.5" y1="0" x2="52.5" y2="68"/><circle cx="52.5" cy="34" r="9.15"/><rect x="0" y="13.84" width="16.5" height="40.32"/><rect x="88.5" y="13.84" width="16.5" height="40.32"/></g>${dots}<text x="104" y="72" fill="${Lc}" font-size="3" text-anchor="end">${t("attacco")} →</text></svg>`;
}
function sheetPanel(id, m) {
  const sh = m.sheet;
  if (!sh) return `<section class="panel"><div class="row between"><div><h2>${t("Distinta e formazioni")}</h2><p class="sub small">${t("Carica la distinta: squadre, formazioni, ruoli e dati della partita si compilano da soli.")}</p></div><button class="btn pri" data-a="loadSheet" data-id="${id}">${t("Carica distinta")}</button></div></section>`;
  const tg = new Set(m.targets || []);
  const team = (T, side, name) => `<div><div class="row between"><h3>${esc(name)}</h3><span class="m">${esc(T.system || "")}${T.coach ? " · " + t("All.") + " " + esc(T.coach) : ""}</span></div><div class="pitchbox" style="max-width:none">${sheetPitch(T, side, m)}</div>
    <div class="chips" style="margin-top:6px"><span class="m">${t("Panchina")}:</span>${T.players.filter(p => !p.starter).map(p => `<button class="chip" data-a="sheetTarget" data-side="${side}" data-n="${esc(p.n)}" data-name="${esc(p.name)}" aria-pressed="${!!(p.pid && tg.has(p.pid))}">${esc(p.n)} ${esc(p.name)}</button>`).join("") || "—"}</div></div>`;
  return `<section class="panel"><div class="row between"><div><h2>${t("Distinta e formazioni")}</h2><p class="sub small">${t("Tocca un giocatore per aggiungerlo o toglierlo da quelli da osservare (in giallo).")}${m.referee ? " · " + t("Arbitro") + ": " + esc(m.referee) : ""}</p></div><button class="btn sm" data-a="loadSheet" data-id="${id}">${t("Ricarica distinta")}</button></div>
   <div class="grid2" style="margin-top:8px">${team(sh.home, "home", m.home)}${team(sh.away, "away", m.away)}</div></section>`;
}
window.prePage = (orig => function (id, m) { return sheetPanel(id, m) + orig(id, m); })(window.prePage);
Object.assign(A, {
  loadSheet: el => Sheet.open(el.dataset.id || null),
  sheetTarget: el => {
    const m = S.matches.get(ui.matchId); const T = m.sheet[el.dataset.side]; const p = T.players.find(x => x.n === el.dataset.n && x.name === el.dataset.name); if (!p) return;
    let pid = p.pid; const targets = new Set(m.targets || []);
    if (!pid) { pid = Sheet.findPlayer(p.name, el.dataset.side === "home" ? m.home : m.away, p.n); }
    if (!pid) { pid = uid(); const parts = p.name.split(" "); const r0 = Cfg.role(p.role); put("players", pid, { first: parts.length > 1 ? parts.slice(1).join(" ") : "", last: parts.length > 1 ? parts[0] : p.name, shirt: p.n, club: el.dataset.side === "home" ? m.home : m.away, roles: p.role ? [p.role] : [], pos: r0 ? { x: r0.x, y: r0.y } : null, verdict: "rivedere", tags: [], listIds: [], sex: "Uomo", contract: {}, physique: {}, pros: [], cons: [], injuries: [], relations: [], notes: t("Creato dalla distinta di {h} – {a}.", { h: m.home, a: m.away }) }); }
    p.pid = pid; if (targets.has(pid)) targets.delete(pid); else targets.add(pid);
    const pre = { ...(m.pre || {}), players: { ...((m.pre || {}).players || {}) } }; if (targets.has(pid)) pre.players[pid] = { ...(pre.players[pid] || {}), status: p.starter ? "Titolare" : "Panchina", role: p.role || "" };
    put("matches", ui.matchId, { ...m, targets: [...targets], pre, sheet: { ...m.sheet } }); render(true);
  }
});

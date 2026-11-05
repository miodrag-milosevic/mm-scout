"use strict";
/* =========================================================
   MM Scout 5.5 — esempi di visione singola
   Giocatori e squadre INVENTATI (nomi e club di fantasia) in
   categorie reali di Italia, Svizzera e Serbia, anche
   giovanili. Servono solo per provare il metodo: incarico →
   partita con giocatore obiettivo → azioni → valutazione dai
   dati → giudizio «è giusto per noi?» → riunione → piano A/B/C.
   ========================================================= */
const EX55_PLAYERS = [
  // key, nome, cognome, ruolo, nascita, nazionalità, piede, altezza, club, campionato, base, archetipo, note
  ["mar", "Luka", "Marković", "Ala sinistra", "2007-03-14", "Serbia", "Destro", 176, "Esempio Petrovar", "Prima Lega (esempio)", 7.2, "w-inv", "Ala che rientra sul destro, rapida nello stretto. Visto due volte su incarico del capo scout."],
  ["pet", "Nikola", "Petrović", "Mediano", "2009-08-02", "Serbia", "Destro", 181, "Esempio Dunavac U17", "Campionato U17 (esempio)", 7.0, "mid-rot", "Giovane: osservato soprattutto atteggiamento e lettura. Solo dati di campo, nessuna foto."],
  ["kel", "Jan", "Keller", "Difensore centrale", "2008-05-21", "Svizzera", "Sinistro", 188, "Esempio Uetlitz U18", "Campionato U18 (esempio)", 6.9, "dc-imp", "Centrale mancino che imposta. Partite vicino a casa: facile rivederlo."],
  ["bru", "Elias", "Brunner", "Quinto sinistro", "2005-11-09", "Svizzera", "Sinistro", 179, "Esempio Thurtal", "Terza Lega (esempio)", 7.6, "fb-quinto", "Piano A per il profilo «Quinto sinistro per il 3-4-2-1»."],
  ["fer", "Matteo", "Ferri", "Quinto sinistro", "2006-02-27", "Italia", "Sinistro", 177, "Esempio Collealto Primavera", "Campionato Under 19 (esempio)", 6.8, "fb-spi", "Piano B: spinge molto, da verificare in fase difensiva."],
  ["col", "Dario", "Colombo", "Trequartista", "2010-01-18", "Italia", "Sinistro", 168, "Esempio Lagobello U17", "Campionato Under 17 (esempio)", 6.7, "am-rif", "Giovanissimo: tecnica e personalità, da seguire nel tempo. Solo dati di campo."]
];
// partite: data, competizione, casa, trasferta, risultato, luogo, obiettivo, vista?
const EX55_MATCHES = [
  ["2026-10-11", "Prima Lega (esempio)", "Esempio Petrovar", "Esempio Brezovac", "2-1", "Stadion Esempio, Petrovar", "mar", 1],
  ["2026-10-25", "Prima Lega (esempio)", "Esempio Morava", "Esempio Petrovar", "0-0", "Stadion Esempio, Morava", "mar", 1],
  ["2026-10-19", "Campionato U17 (esempio)", "Esempio Dunavac U17", "Esempio Bačvar U17", "3-1", "Centro sportivo Esempio, Dunavac", "pet", 1],
  ["2026-10-17", "Terza Lega (esempio)", "Esempio Thurtal", "Esempio Monteverde", "1-1", "Sportplatz Esempio, Thurtal", "bru", 1],
  ["2026-11-01", "Terza Lega (esempio)", "Esempio Nordheim II", "Esempio Thurtal", "1-2", "Campus Esempio, Nordheim", "bru", 1],
  ["2026-10-26", "Campionato U18 (esempio)", "Esempio Uetlitz U18", "Esempio Seewald U18", "2-2", "Sportanlage Esempio, Uetlitz", "kel", 1],
  ["2026-10-24", "Campionato Under 19 (esempio)", "Esempio Collealto Primavera", "Esempio Lagobello Primavera", "1-0", "Centro sportivo Esempio, Collealto", "fer", 1],
  ["2026-10-18", "Campionato Under 17 (esempio)", "Esempio Lagobello U17", "Esempio Montebrio U17", "2-3", "Campo Esempio, Lagobello", "col", 1],
  ["+3", "Campionato U18 (esempio)", "Esempio Uetlitz U18", "Esempio Grünfeld U18", "", "Sportanlage Esempio, Uetlitz", "kel", 0],
  ["+4", "Terza Lega (esempio)", "Esempio Thurtal", "Esempio Valmora", "", "Sportplatz Esempio, Thurtal", "bru", 0],
  ["+10", "Prima Lega (esempio)", "Esempio Petrovar", "Esempio Moravica", "", "Stadion Esempio, Petrovar (diretta video)", "mar", 0],
  ["+11", "Campionato Under 19 (esempio)", "Esempio Collealto Primavera", "Esempio Portomare Primavera", "", "Centro sportivo Esempio, Collealto", "fer", 0]
];
const EX55_CATS = {
  w: ["Ricezione", "Ricezione sotto pressione", "Dribbling", "Conduzione", "Cross / Assist", "Occasione creata", "Tiro", "Smarcamento", "Attacco profondità", "Pressing", "Ripiegamento", "Contropressing", "Atteggiamento", "Reazione all'errore"],
  mid: ["Ricezione", "Scanning", "Passaggio", "Passaggio progressivo", "Ricezione sotto pressione", "Pressing", "Recupero palla", "Lettura / Anticipo", "Duello a terra", "Contropressing", "Copertura preventiva", "Comunicazione", "Atteggiamento", "Reazione all'errore", "Leadership"],
  dc: ["Duello aereo", "Duello a terra", "Lettura / Anticipo", "Posizione", "Marcatura", "Copertura", "Passaggio", "Passaggio progressivo", "Ricezione sotto pressione", "Chiusura", "Comunicazione", "Copertura preventiva", "Concentrazione"],
  fb: ["Cross / Assist", "Conduzione", "Smarcamento", "Attacco profondità", "Ripiegamento", "Duello a terra", "Posizione", "Copertura", "Pressing", "Passaggio", "Scatto / Velocità", "Intensità", "Atteggiamento"],
  am: ["Ricezione", "Tra le linee", "Scanning", "Dribbling", "Filtrante", "Occasione creata", "Tiro", "Passaggio progressivo", "Pressing", "Contropressing", "Linguaggio del corpo", "Reazione all'errore", "Atteggiamento"]
};
const EX55_FIT = { mar: [["si", "si", "parte", "si", "parte", "si"], "conferma", "discutere", "Due visioni: rientra sul destro e crea superiorità. Nel nostro 3-4-2-1 giocherebbe da trequartista sinistro. L'allenatore vuole vederlo in pressione."],
  pet: [["si", "si", "si", "parte", "si", "si"], "rivedere", "condiviso", "Ottima lettura per l'età. Va rivisto contro avversari più forti; la crescita va seguita con calma."],
  bru: [["si", "si", "si", "si", "parte", "si"], "conferma", "condiviso", "Piano A confermato: copre tutta la fascia, cross precisi. Da verificare il passo contro ali veloci."],
  kel: [["parte", "si", "si", "parte", "si", "si"], "rivedere", "discutere", "Imposta bene di sinistro; nei duelli aerei va ancora valutato. Rivederlo sabato."],
  fer: [["parte", "parte", "si", "parte", "no", "si"], "rivedere", "diverso", "Spinge tanto ma lascia spazio alle spalle: l'allenatore preferisce un quinto più equilibrato. Resta piano B."],
  col: [["si", "parte", "si", "si", "parte", "si"], "rivedere", "discutere", "Tecnica e coraggio sopra la media della categoria. Troppo presto per decidere: seguirlo nella stagione."] };
const EX55_WHAT = { mar: "Uno contro uno sul lato sinistro, lavoro senza palla e reazione dopo la perdita.", pet: "Lettura delle linee di passaggio, scanning e atteggiamento con compagni e arbitro.", kel: "Costruzione dal basso con il sinistro e duelli aerei in area.", bru: "Spinta a tutta fascia, qualità del cross e diagonale sul lato debole.", fer: "Fase difensiva in uno contro uno e scelta dei tempi di spinta.", col: "Ricezione tra le linee, ultimo passaggio e personalità." };

function exPart55() {
  const ex = o => ({ ...o, example: true }); const rnd = Examples.rng("mm-scout-55"); const K = {}; const cfg = Cfg.get();
  const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  for (const [k, first, last, role, birth, nat, foot, h, club, league, base, arch, note] of EX55_PLAYERS) {
    const id = uid(); K[k] = id; const r0 = ROLE_SPOT[role] || [50, 50];
    put("players", id, ex({ first, last, sex: "Uomo", birth, birthYear: birth.slice(0, 4), nat: t(nat), foot, height: String(h), club, league, roles: [role], archetype: arch, pos: { x: r0[0], y: r0[1] }, verdict: base >= 7.1 ? "prendere" : "seguire", level: base >= 7.1 ? "B" : "C", potential: base >= 7 ? "A" : "B", tags: [], listIds: [], contract: {}, physique: {}, pros: [], cons: [], injuries: [], relations: [], quick: t(note), notes: t("Esempio: giocatore e squadra inventati per esercitazione.") }));
  }
  const ctxs = { "Prima Lega (esempio)": [4, 3, 4, 3, 4], "Terza Lega (esempio)": [3, 3, 3, 3, 3], "Campionato U18 (esempio)": [3, 3, 2, 3, 3], "Campionato Under 19 (esempio)": [4, 4, 3, 3, 4] };
  const mids = {};
  EX55_MATCHES.forEach(([d0, comp, home, away, score, venue, k, seen], mi) => {
    const pid = K[k], p = P(pid); const mid = uid(); const date = d0[0] === "+" ? day(+d0.slice(1)) : d0; const role = mainRole(p); const g = roleGroup(role); const cats = EX55_CATS[g === "fb" ? "fb" : g === "dc" ? "dc" : g === "am" ? "am" : g === "w" ? "w" : "mid"].filter(c => catOf(c)); const [rx, ry] = ROLE_SPOT[role] || [50, 50];
    const base = EX55_PLAYERS.find(x => x[0] === k)[10]; const events = []; const mins = 70 + Math.floor(rnd() * 21); const n = seen ? 20 + Math.floor(rnd() * 9) : 0; const pPos = Math.max(0.35, Math.min(0.78, 0.4 + (base - 6.5) * 0.18));
    for (let i = 0; i < n; i++) { const c = cats[Math.floor(rnd() * cats.length)]; const att = ["Tiro", "Occasione creata", "Cross / Assist", "Attacco profondità", "Filtrante"].includes(c);
      let x = rx + (rnd() - 0.5) * 30 + (att ? 14 : 0), y = ry + (rnd() - 0.5) * 26; if (c === "Tiro") { x = 80 + rnd() * 17; y = 30 + rnd() * 40; }
      const o = rnd() < 0.08 ? "=" : rnd() < pPos ? "+" : "-"; const tm = Math.min(mins, 1 + Math.floor((i + rnd()) / n * mins));
      events.push({ id: uid(), t: tm, h: tm > 45 ? 2 : 1, p: pid, c, o, z: { x: +Math.max(1, Math.min(99, x)).toFixed(1), y: +Math.max(1, Math.min(99, y)).toFixed(1) }, pr: 1 + Math.floor(rnd() * 5) }); }
    const fs = EX55_FIT[k]; const cx = ctxs[comp] || [3, 3, 3, 3, 3];
    const post = seen ? { players: { [pid]: { minutes: mins, grade: Math.round((base + (rnd() - 0.5)) * 2) / 2, cond: "Buona", verdict: "", note: t(fs[3]) } }, context: { intensity: cx[0], opponent: cx[1], pressure: cx[2], tactical: cx[3], speed: cx[4] }, fit: (mi === EX55_MATCHES.findIndex(m => m[6] === k && m[7]) && EX55_MATCHES.filter(m => m[6] === k && m[7]).length > 1) ? {} : { [pid]: { q: Object.fromEntries(FIT_Q.map(([q], i) => [q, fs[0][i]])), dec: fs[1], coach: fs[2], after: isMinor(p) ? ["saluta", "allenatore", "sereno"] : ["saluta", "recupero"], note: t(fs[3]), date } } } : undefined;
    const pre = seen ? { focus: { chk: { arrivo: true, titolare: true, ruolo: true, riscaldamento: true, linguaggio: rnd() > 0.4 } }, players: { [pid]: { status: "Titolare", role, chips: isMinor(p) ? ["Concentrato", "Comunica"] : ["Concentrato"], note: t("Arrivato 45 minuti prima: riscaldamento attento, parla con i compagni.") } } } : {};
    put("matches", mid, ex({ home, away, date, time: seen ? "15:00" : "14:00", type: "Campionato", teamCat: /U18/.test(comp) ? "U18" : /U17/.test(comp) ? "U17" : /Primavera/.test(comp) ? "Primavera / U19" : "Prima squadra", competition: comp, venue, status: seen ? "vista" : "pianificata", score, sysHome: "", sysAway: "", focus: pid, targets: [pid], tags: [], goal: t(EX55_WHAT[k]), notes: t("Esempio: squadre, giocatori e azioni inventati per esercitazione."), events, ...(post ? { post } : {}), pre }));
    (mids[k] = mids[k] || []).push(mid);
  });
  // valutazioni dai dati registrati (ogni voto parte dalle azioni)
  const s = cfg.scale;
  for (const [k] of EX55_PLAYERS) { const pid = K[k], p = P(pid);
    for (const mid of (mids[k] || [])) { const m = S.matches.get(mid); if (m.status !== "vista") continue; const ps = paramStats(pid, mid); const r = {};
      for (const a of visAreas(p)) for (const x of visParams(p, a)) { const sg = suggestFrom(ps[a.id + "|" + x.id]); const base = EX55_PLAYERS.find(z => z[0] === k)[10]; const v = sg != null ? sg : (rnd() < 0.45 ? Math.round((base + (rnd() - 0.5) * 1.4) / s.step) * s.step : null); if (v != null) { r[a.id] = r[a.id] || {}; r[a.id][x.id] = Math.max(s.min, Math.min(s.max, +v.toFixed(2))); } }
      const evd = (m.events || []).slice(0, 7).map(e => ({ area: (catOf(e.c) || {}).area || "tec", min: String(e.t), text: evText(e), liveId: e.id }));
      put("evals", uid(), ex({ playerId: pid, matchId: mid, by: Profile.get().initials || "MM", date: m.date, matchType: "Campionato", cat: "Club", teamCat: m.teamCat, home: m.home, away: m.away, score: m.score, shirt: "", minutes: String(((m.post || {}).players || {})[pid].minutes), source: "Dal vivo", positions: p.pos ? [p.pos] : [], r, notes: {}, evidence: evd, summary: t(EX55_FIT[k][3]), tags: [], context: (m.post || {}).context || {}, proj: { now: base2lvl(k), pot: "A", when: isMinor(p) ? "3-4 anni" : "1-2 anni", ceil: t("Prima squadra di categoria superiore"), imp: t("Da completare nella fase difensiva"), me: t(EX55_FIT[k][3]) } }));
    } }
  function base2lvl(k) { return EX55_PLAYERS.find(z => z[0] === k)[10] >= 7.1 ? "B" : "C"; }
  // staff di esempio (dagli esempi 5.3) o nuovo
  const staff = [...S.staff.entries()].filter(([, x]) => x.example); const chief = (staff.find(([, x]) => x.role === "chief") || staff[0] || [])[0] || "", coach = (staff.find(([, x]) => x.role === "coach") || [])[0] || "", ds = (staff.find(([, x]) => x.role === "ds") || [])[0] || "";
  // profili ideali con piano A, B, C
  const pl = Object.fromEntries([...S.players.entries()].filter(([, p]) => p.example).map(([id, p]) => [p.last, id]));
  const req = keys => keys.map(([key, imp, min]) => ({ key, imp, min }));
  const I1 = uid(), I2 = uid();
  put("ideals", I1, ex({ name: t("Quinto sinistro per il 3-4-2-1 (esempio)"), role: "Quinto sinistro", role2: "Terzino sinistro", system: "1-3-4-2-1", functions: t("Ampiezza costante in possesso, cross dal fondo e rientro a cinque in fase difensiva. Deve reggere 90 minuti di andata e ritorno."), ageMin: "18", ageMax: "24", heightMin: "", foot: "Sinistro", eu: "", maxValue: "1,5 mln €", req: req([["fis|Resistenza", 3, 7], ["tec|Assist", 3, 6.5], ["tat|Ripiegamenti difensivi", 3, 6.5], ["fis|Velocità", 2, 7], ["tec|Conduzione palla", 2, 6.5], ["men|Determinazione", 1, 6.5]]), plan: [K.bru && { pid: K.bru, rank: "A", note: t("Il più completo nelle due fasi.") }, K.fer && { pid: K.fer, rank: "B", note: t("Più offensivo: da accompagnare in fase difensiva.") }, pl["Brambati"] && { pid: pl["Brambati"], rank: "C", note: t("Soluzione già pronta ma costosa.") }].filter(Boolean) }));
  put("ideals", I2, ex({ name: t("Esterno offensivo giovane per il 3-4-2-1 (esempio)"), role: "Ala sinistra", role2: "Trequartista", system: "1-3-4-2-1", functions: t("Gioca tra le linee sul lato sinistro, salta l'uomo e attacca la porta. Deve partecipare al pressing."), ageMin: "16", ageMax: "21", foot: "", eu: "", maxValue: "", req: req([["tec|Dribbling", 3, 7], ["tat|Ricezione tra le linee", 3, 6.5], ["tec|Passaggi chiave", 2, 6.5], ["fis|Accelerazione", 2, 7], ["men|Personalità", 2, 6.5]]), plan: [K.mar && { pid: K.mar, rank: "A", note: t("Due visioni positive, prezzo accessibile.") }, K.col && { pid: K.col, rank: "B", note: t("Molto giovane: investimento sul futuro.") }, pl["Fletcher"] && { pid: pl["Fletcher"], rank: "C", note: t("Esempio di riferimento in prima squadra.") }].filter(Boolean) }));
  // riunioni e incarichi
  const MT1 = uid(), MT2 = uid();
  put("meetings", MT1, ex({ title: t("Definizione profili per il 3-4-2-1 (esempio)"), date: "2026-10-08", time: "09:30", place: t("Sede del club"), people: [ds, chief, coach].filter(Boolean), players: [K.bru, K.fer, K.mar].filter(Boolean), idealId: I1, agenda: t("Cosa chiede l'allenatore al quinto sinistro e all'esterno offensivo; chi andare a vedere."), notes: t("Decisi gli incarichi di visione singola: Brunner e Ferri per il quinto, Marković per l'esterno.") }));
  put("meetings", MT2, ex({ title: t("Esito visioni di ottobre (esempio)"), date: day(2), time: "18:00", place: t("Videochiamata"), people: [chief, coach].filter(Boolean), players: [K.bru, K.mar, K.kel].filter(Boolean), idealId: I2, agenda: t("Presentare i giudizi «è giusto per noi?» e confermare il piano A, B e C."), notes: "" }));
  for (const [k] of EX55_PLAYERS) { const ms = (mids[k] || []); const upm = ms.find(id => S.matches.get(id).status !== "vista"); const lastSeen = ms.filter(id => S.matches.get(id).status === "vista").pop();
    put("tasks", uid(), ex({ meetingId: MT1, playerId: K[k], matchId: upm || lastSeen || "", idealId: ["bru", "fer"].includes(k) ? I1 : ["mar", "col"].includes(k) ? I2 : "", position: t(EX55_PLAYERS.find(z => z[0] === k)[3]), league: EX55_PLAYERS.find(z => z[0] === k)[9], by: chief, due: upm ? S.matches.get(upm).date : day(14), status: upm ? "todo" : "done", result: upm ? "" : EX55_FIT[k][1], what: t(EX55_WHAT[k]) })); }
  // partite della prima squadra di esempio: obiettivo dagli incarichi già presenti
  for (const [tid, x] of [...S.tasks]) if (x.example && x.matchId && x.playerId) { const m = S.matches.get(x.matchId); if (m && !m.focus) put("matches", x.matchId, { ...m, focus: x.playerId, targets: [x.playerId, ...(m.targets || []).filter(y => y !== x.playerId)] }); }
  // diario di esempio
  const acts = []; const at = (d, h) => new Date(d + "T" + h + ":00").getTime();
  acts.push({ at: at("2026-10-08", "10:40"), c: "ideals", id: I1, op: "c", l: t("Quinto sinistro per il 3-4-2-1 (esempio)"), ex: true }, { at: at("2026-10-08", "10:55"), c: "meetings", id: MT1, op: "u", l: t("Definizione profili per il 3-4-2-1 (esempio)"), ex: true });
  for (const [k] of EX55_PLAYERS) for (const mid of (mids[k] || [])) { const m = S.matches.get(mid); if (m.status !== "vista") { acts.push({ at: Date.now() - 3600e3 * (2 + acts.length), c: "matches", id: mid, op: "c", l: `${m.home} – ${m.away}`, ex: true }); continue; } acts.push({ at: at(m.date, "15:05"), c: "matches", id: mid, op: "u", l: `${m.home} – ${m.away}`, n: m.events.length, ex: true }); acts.push({ at: at(m.date, "21:10"), c: "evals", id: [...S.evals.entries()].find(([, e]) => e.matchId === mid)?.[0] || "", op: "c", l: pname(P(K[k])) + ` (${m.home} – ${m.away})`, ex: true }); }
  const cur = ((S.settings.get("activity") || {}).items || []).filter(x => !x.ex); S.settings.set("activity", { items: [...cur, ...acts].sort((a, b) => b.at - a.at).slice(0, 400), _t: Date.now() }); Store.write("settings", "activity");
}
Examples.load = (orig => function (silent) { const r = orig.call(this, silent); Activity.quiet = true; const ub = Undo.busy; try { exPart55(); exFacets55(); } catch (e) { console.warn("esempi 5.5", e); } finally { Activity.quiet = false; } Undo.clear(); return r; })(Examples.load);
function exFacets55() { for (const [mid, m] of [...S.matches]) { if (!m.example || !(m.events || []).length) continue; let ch = false; const evs = m.events.map(e => { if (e.d) return e; const fs = Facet.forCat(e.c); if (!fs.length) return e; const rnd = Examples.rng(e.id + e.c); const d = {}; const o = evOutcome(e); for (const f of fs.slice(0, 3)) { if (rnd() < 0.25) continue; let opts = (f.opts || []).filter(x => !x.hidden); const pref = opts.filter(x => o === "+" ? x.w >= 0 : o === "-" ? x.w <= 0 : true); if (pref.length && rnd() < 0.8) opts = pref; const pick = opts[Math.floor(rnd() * opts.length)]; if (pick) d[f.id] = f.multi ? [pick.id] : pick.id; } if (Object.keys(d).length) { ch = true; return { ...e, d }; } return e; }); if (ch) { S.matches.set(mid, { ...m, events: evs }); Store.write("matches", mid); } } }
// gli esempi vecchi vengono aggiornati al primo accesso
Lock.enter = (orig => async function () { const r = await orig.apply(this, arguments); try { const hasEx = [...S.players.values()].some(p => p.example); const v = (S.settings.get("exVer") || {}).v || 0; if (hasEx && v < 6) { Examples.load(true); put("settings", "exVer", { v: 6 }); Undo.clear(); render(); } } catch (e) { } return r; })(Lock.enter);
Examples.load = (orig => function (silent) { const r = orig.call(this, silent); try { put("settings", "exVer", { v: 6 }); Undo.clear(); } catch (e) { } return r; })(Examples.load);

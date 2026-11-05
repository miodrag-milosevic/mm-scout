"use strict";
/* =========================================================
   MM Scout — esempi della squadra di fantasia, parte 2:
   5 partite, carriere, azioni, voti e valutazioni, tutti
   INVENTATI per esercitazione (nessun dato reale).
   ========================================================= */
const EX_MATCHES = [
  // data, competizione, casa, trasferta, risultato, stadio, giocatori da osservare (tutto inventato)
  ["2026-10-17", "Lega Alfa", "FC Valdoria", "US Collemare", "2-1", "Stadio dei Pini, Valdoria", ["jas", "mod", "pul", "hut", "bar", "gab"]],
  ["2026-10-21", "Coppa Continentale", "Westcliff AFC", "FC Valdoria", "1-1", "Westcliff Park, Westcliff", ["mai", "pav", "gil", "jas", "ram", "lof"]],
  ["2026-10-24", "Lega Alfa", "Calcio Monteregio", "FC Valdoria", "1-3", "Stadio Comunale, Monteregio", ["cam", "mor", "sae", "rab", "tom", "cis"]],
  ["2026-10-27", "Lega Alfa", "FC Valdoria", "FC Portalba", "2-2", "Stadio dei Pini, Valdoria", ["bar", "dew", "mus", "cis", "ram", "com"]],
  ["2026-10-31", "Lega Alfa", "FC Valdoria", "Atletico Borgonuovo", "2-0", "Stadio dei Pini, Valdoria", ["pul", "rab", "mor", "gil", "mod", "mai", "hut"]]
];
// gol dell'ultima partita di esempio (inventati)
const EX_GOALS = { 4: [["pul", 12], ["mor", 67]] };
// percorso di carriera (anni e squadre dai profili ufficiali del club; y = giovanili, p = prima squadra, l = prestito)
const CAREER = {
  mai: [[2014, 2019, "Northgate Athletic", "p"], [2019, 2026, "Riverside FC", "p"], [2026, "", "FC Valdoria", "p"]],
  ptr: [[2009, 2014, "US Calanchi", "p"], [2014, 2026, "Club Westland", "p"], [2026, "", "FC Valdoria", "p"]],
  tor: [[2014, 2021, "US Calanchi", "y"], [2021, 2023, "FC Valdoria", "y"], [2023, "", "FC Valdoria", "p"]],
  est: [[2016, 2021, "US Collemare", "p"], [2021, 2026, "FC Portalba", "p"], [2026, "", "FC Valdoria", "p"]],
  dew: [[2019, 2025, "SV Rheinfeld", "p"], [2025, "", "FC Valdoria", "p"]],
  dia: [[2016, 2023, "Club Westland", "y"], [2023, 2025, "FC Valdoria", "y"], [2025, "", "FC Valdoria", "p"]],
  tom: [[2016, 2021, "US Collemare", "p"], [2021, 2026, "Riverside FC", "p"], [2026, "", "FC Valdoria", "p"]],
  pav: [[2019, 2024, "Northgate Athletic", "p"], [2024, 2025, "Harrow Vale", "p"], [2025, "", "FC Valdoria", "p"]],
  bar: [[2013, 2020, "Olympique Flandres", "y"], [2020, 2022, "FC Valdoria", "y"], [2022, "", "FC Valdoria", "p"]],
  gil: [[2017, 2023, "RSC Brabant", "p"], [2023, 2025, "Paris Lumière", "p"], [2025, "", "FC Valdoria", "p"]],
  vla: [[2018, 2026, "FC Valdoria", "y"], [2026, "", "FC Valdoria", "p"]],
  ftr: [[2020, 2025, "CF Lanterna", "p"], [2025, "", "FC Valdoria", "p"]],
  gab: [[2017, 2021, "FK Sava", "p"], [2021, 2025, "SL Tejo", "p"], [2025, "", "FC Valdoria", "p"]],
  lof: [[2013, 2019, "AC Fioravanti", "p"], [2019, 2026, "CD Azahar", "p"], [2026, "", "FC Valdoria", "p"]],
  pul: [[2017, 2022, "CF Lanterna", "p"], [2022, 2025, "AC Fioravanti", "p"], [2025, "", "FC Valdoria", "p"]],
  rab: [[2014, 2018, "Golfo FC", "p"], [2018, 2026, "Sherwood Rovers", "p"], [2026, "", "FC Valdoria", "p"]],
  mod: [[2007, 2011, "FK Sava", "p"], [2011, 2026, "US Collemare", "p"], [2026, "", "FC Valdoria", "p"]],
  hut: [[2021, 2025, "Sherwood Rovers", "p"], [2025, "", "FC Valdoria", "p"]],
  mor: [[2021, 2025, "FC Portalba", "p"], [2025, "", "FC Valdoria", "p"]],
  com: [[2016, 2023, "Olympique Flandres", "y"], [2023, 2025, "FC Valdoria", "y"], [2025, "", "FC Valdoria", "p"]],
  jas: [[2020, 2025, "Kingsbridge FC", "p"], [2025, "", "FC Valdoria", "p"]],
  sae: [[2017, 2023, "Paris Lumière", "p"], [2023, 2025, "AC Murata", "p"], [2025, "", "FC Valdoria", "p"]],
  cis: [[2015, 2023, "FC Valdoria", "y"], [2023, "", "FC Valdoria", "p"]],
  mus: [[2020, 2025, "Kingsbridge FC", "p"], [2025, "", "FC Valdoria", "p"]],
  ram: [[2019, 2023, "Club Westland", "p"], [2023, 2025, "Sherwood Rovers", "p"], [2025, "", "FC Valdoria", "p"]],
  chu: [[2017, 2021, "SC Torreverde", "p"], [2021, 2025, "AC Murata", "p"], [2025, "", "FC Valdoria", "p"]],
  cam: [[2017, 2024, "Club Westland", "y"], [2024, 2026, "FC Valdoria", "y"], [2026, "", "FC Valdoria", "p"]]
};
// il giudizio personale (inventato, per esercitazione): livello oggi, potenziale, quando, dove può arrivare, dove migliorare, frase personale
const PROJ = {
  mai: ["A", "A", "now", "Portiere da squadra di vertice in Europa, già oggi.", "Costanza nelle uscite basse; gestione dei rinvii lunghi sotto pressione.", "Leader silenzioso: sposta la linea difensiva con la voce e con la posizione."],
  mod: ["A", "A", "now", "Riferimento tecnico per una o due stagioni ad alto livello, con minuti gestiti.", "Duelli in campo aperto e ripiegamenti quando la squadra perde palla.", "Legge la partita prima degli altri: ogni pallone che tocca ha un'idea."],
  jas: ["B", "A", "2", "Mediano titolare in una squadra da Coppa Continentale Élite.", "Accelerazione sui primi metri; più coraggio nel passaggio verticale.", "Pulito e intelligente: è il giocatore che fa funzionare il centrocampo senza farsi notare."],
  pul: ["A", "A", "now", "Titolare in una squadra di vertice in Italia e in Europa.", "Duelli aerei e continuità nelle partite molto fisiche.", "Cambia ritmo in un metro e decide le partite da solo."],
  bar: ["B", "A", "2", "Esterno sinistro titolare in Lega Alfa e in nazionale.", "Lettura delle diagonali sul lato debole; precisione del cross a rimorchio.", "Fisico raro per un esterno: se cresce nella fase difensiva diventa completo."],
  cam: ["C", "A", "3", "Prima punta da Lega Alfa con presenza in area e senso del gol.", "Continuità sotto porta e lavoro senza palla per la squadra.", "Movimenti da attaccante maturo per l'età: va protetto e fatto giocare con costanza."],
  mor: ["B", "A", "2", "Quinto o ala sinistra titolare in una squadra di vertice.", "Scelte nell'ultimo terzo; ripiegamenti quando gioca alto.", "Esplosivo e diretto: crea superiorità a ogni pallone che riceve sulla fascia."],
  pav: ["B", "A", "1", "Centrale sinistro titolare in una squadra da Coppa Continentale Élite.", "Gestione dell'impeto dopo un errore; letture in campo aperto.", "Aggressivo e coraggioso, porta palla con personalità."],
  hut: ["B", "A", "2", "Ala titolare in una squadra di alta classifica.", "Lavoro difensivo e uso del piede destro.", "Rientra sul sinistro e punta l'uomo senza paura: un giocatore che accende la partita."],
  ram: ["B", "B", "1", "Centravanti titolare in Lega Alfa, utile anche nelle coppe.", "Più partecipazione alla manovra spalle alla porta.", "Attacca la profondità con tempi giusti e chiude le azioni."],
  gil: ["B", "B", "now", "Difensore centrale titolare in Lega Alfa.", "Velocità sul lungo quando la linea è alta.", "Ordinato e affidabile: sbaglia poco e fa giocare bene chi gli sta accanto."],
  rab: ["A", "A", "now", "Mezzala titolare in una squadra di vertice.", "Costanza di rendimento nelle partite meno intense.", "Porta fisicità e inserimenti: segna gol pesanti nelle grandi partite."],
  cis: ["C", "B", "2", "Trequartista o mezzala offensiva in Lega Alfa.", "Fisicità nei duelli e continuità nei 90 minuti.", "Tecnica e fantasia: va inserito con gradualità."]
};
const CATS_BY = {
  gk: ["Parata / Uscita", "Uscita alta", "Presa", "Gioco con i piedi", "Rinvio", "Posizionamento portiere", "Guida difesa"],
  dc: ["Contrasto", "Duello aereo", "Lettura / Anticipo", "Chiusura", "Passaggio progressivo", "Posizione", "Marcatura", "Copertura", "Passaggio", "Recupero palla"],
  fb: ["Cross / Assist", "Conduzione", "Ripiegamento", "Duello a terra", "Contrasto", "Passaggio progressivo", "Recupero palla", "Attacco profondità", "Dribbling"],
  mid: ["Passaggio", "Passaggio progressivo", "Ricezione sotto pressione", "Scanning", "Pressing", "Recupero palla", "Duello a terra", "Cambio di gioco", "Lettura / Anticipo", "Perdita palla", "Contropressing"],
  am: ["Tra le linee", "Filtrante", "Occasione creata", "Dribbling", "Tiro", "Ricezione sotto pressione", "Passaggio progressivo", "Perdita palla", "Contropressing"],
  w: ["Dribbling", "Cross / Assist", "Conduzione", "Tiro", "Occasione creata", "Ricezione", "Perdita palla", "Ripiegamento", "Pressing"],
  st: ["Tiro", "Colpo di testa", "Attacco profondità", "Smarcamento", "Protezione palla", "Ricezione", "Pressing", "Duello aereo", "Perdita palla", "Occasione creata"]
};
const ATT_CATS = new Set(["Tiro", "Colpo di testa", "Occasione creata", "Filtrante", "Cross / Assist", "Attacco profondità", "Tra le linee", "Dribbling"]);
// percentili: confronto per reparto (più giocatori a confronto)
const DEPT = { gk: "gk", dc: "def", fb: "def", mid: "mid", am: "att", w: "att", st: "att" };
window.percentiles = (orig => function (pid) {
  const p = P(pid); const g = DEPT[roleGroup(mainRole(p))] || ""; const me = playerData(pid); if (me.mins < 60) return { me, n: 0 };
  const peers = [...S.players.keys()].filter(id => id !== pid && (DEPT[roleGroup(mainRole(P(id)))] || "") === g).map(playerData).filter(d => d.mins >= 60);
  if (peers.length < 4) return { me, n: peers.length };
  const res = {}; for (const [k] of MX) { const v = me.p90[k]; const vals = peers.map(d => d.p90[k]); const inv = k === "loss"; const below = vals.filter(x => inv ? x > v : x < v).length, eq = vals.filter(x => x === v).length; res[k] = Math.round((below + eq / 2) / vals.length * 100); }
  return { me, n: peers.length, pc: res };
})(window.percentiles);

Examples.load = (orig => function (silent) {
  const r = orig.call(this, true);
  try { exPart2(); } catch (e) { console.warn("esempi 2", e); }
  if (!silent) { toast(t("Esempi caricati")); render(); }
  return r;
})(Examples.load);
function exPart2() {
  const ex = o => ({ ...o, example: true }); const rnd = Examples.rng("mm-scout-real-5");
  // giocatori di esempio: chiave → id
  const K = {}; for (const [id, p] of S.players) if (p.example) { const row = EX_SQUAD.find(x => x[1] === p.first && x[2] === p.last); if (row) K[row[0]] = id; }
  const base = k => (EX_SQUAD.find(x => x[0] === k) || [])[13] || 6.5;
  // via le partite e le valutazioni della prima parte degli esempi (restano squadra ombra, liste e confronto)
  for (const c of ["matches", "evals"]) for (const [id, o] of [...S[c]]) if (o && o.example) del(c, id);
  for (const [id, p] of S.players) if (p.example) { const k = Object.keys(K).find(x => K[x] === id); const car = (CAREER[k] || []).map(([from, to, club, kind]) => ({ from: String(from), to: String(to || ""), club, kind })); put("players", id, { ...p, career: car }, true); }
  const MIDS = [];
  EX_MATCHES.forEach(([date, comp, home, away, score, venue, tgs], mi) => {
    const mid = uid(); MIDS.push(mid); const tg = tgs.filter(k => K[k]); const events = []; const post = { players: {}, context: { intensity: comp.includes("Europa") ? 5 : 4, opponent: ["Atletico Borgonuovo", "US Collemare", "Westcliff AFC", "FC Portalba"].includes(home === "FC Valdoria" ? away : home) ? 4 : 3, pressure: away === "Atletico Borgonuovo" ? 5 : 3, tactical: 3, speed: 4 } };
    for (const k of tg) {
      const pid = K[k], p = P(pid); const role = mainRole(p); const g = roleGroup(role) || "mid"; const rr = Cfg.role(role) || { x: 50, y: 50 }; const cats = CATS_BY[g]; const n = g === "gk" ? 9 : 16 + Math.floor(rnd() * 10);
      const pPos = Math.max(0.3, Math.min(0.82, 0.42 + (base(k) - 6.5) * 0.12 + (rnd() - 0.5) * 0.1)); const mins = 72 + Math.floor(rnd() * 19);
      for (let i = 0; i < n; i++) { const c = cats[Math.floor(rnd() * cats.length)]; const att = ATT_CATS.has(c);
        let x = rr.x + (rnd() - 0.5) * 34 + (att ? 12 : 0), y = rr.y + (rnd() - 0.5) * 30; if (c === "Tiro" || c === "Colpo di testa") { x = 80 + rnd() * 17; y = 28 + rnd() * 44; }
        if (g === "gk") { x = 2 + rnd() * 14; y = 30 + rnd() * 40; }
        const o = rnd() < 0.1 ? "=" : rnd() < pPos ? "+" : "-"; const tm = Math.min(mins, 1 + Math.floor((i + rnd()) / n * mins));
        events.push({ id: uid(), t: tm, h: tm > 45 ? 2 : 1, p: pid, c, o: c === "Perdita palla" ? "-" : o, z: { x: +Math.max(1, Math.min(99, x)).toFixed(1), y: +Math.max(1, Math.min(99, y)).toFixed(1) }, pr: 1 + Math.floor(rnd() * 5) }); }
      post.players[pid] = { minutes: mins, grade: Math.round((base(k) + (rnd() - 0.5) * 1.4) * 2) / 2, verdict: "", note: "" };
    }
    for (const [k, tm] of (EX_GOALS[mi] || [])) if (K[k]) events.push({ id: uid(), t: tm, h: 1, p: K[k], c: "Gol", o: "+", z: { x: 90, y: 50 }, n: t("Gol reale della partita") });
    events.sort((a, b) => a.t - b.t);
    put("matches", mid, ex({ home, away, date, time: "20:45", type: comp === "Lega Alfa" ? "Campionato" : "Coppa", teamCat: "Prima squadra", competition: comp, venue, status: "vista", score, sysHome: home === "FC Valdoria" ? "1-3-4-2-1" : "", sysAway: away === "FC Valdoria" ? "1-3-4-2-1" : "", targets: tg.map(k => K[k]), tags: [], goal: t("Esempio di missione su partita reale."), notes: t("Partita reale (data, avversario e risultato ufficiali); azioni, voti e valutazioni sono inventati per esercitazione."), events, post }));
    // valutazione per ogni giocatore osservato
    for (const k of tg) { const pid = K[k], p = P(pid); const pe = events.filter(e => e.p === pid);
      const evd = pe.filter(e => e.c !== "Gol").slice(0, 6).map(e => ({ area: (catOf(e.c) || {}).area || "tec", min: String(e.t), text: evText(e), liveId: e.id }));
      const last = mi === EX_MATCHES.map((m, i) => m[6].includes(k) ? i : -1).filter(i => i >= 0).pop(); const pj = last && PROJ[k] ? { now: PROJ[k][0], pot: PROJ[k][1], when: PROJ[k][2], ceil: PROJ[k][3], imp: PROJ[k][4], me: PROJ[k][5] } : null;
      put("evals", uid(), ex({ playerId: pid, matchId: mid, by: (Profile.get().initials || "MM"), date, matchType: comp === "Lega Alfa" ? "Campionato" : "Coppa", cat: "Club", teamCat: "Prima squadra", home, away, score, sysHome: home === "FC Valdoria" ? "1-3-4-2-1" : "", sysAway: away === "FC Valdoria" ? "1-3-4-2-1" : "", shirt: p.shirt, minutes: String(post.players[pid].minutes), source: "Video completo", positions: p.pos ? [p.pos] : [], r: Examples.gen(p, base(k), k + mi), notes: {}, evidence: evd, summary: t("Valutazione di esempio inventata per esercitazione."), tags: [], context: post.context, proj: pj })); }
  });
  // partita in programma (esempio) per la visione singola
  const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const up = uid(); put("matches", up, ex({ home: "FC Valdoria", away: t("Squadra Esempio C"), date: day(5), time: "20:45", type: "Campionato", competition: t("Partita di esempio"), venue: "Stadio dei Pini, Valdoria", status: "pianificata", goal: t("Verificare Fletcher e Rinaldi contro una difesa bassa."), targets: [K.hut, K.cam].filter(Boolean), tags: [], events: [] }));
  // staff, riunioni e incarichi (persone fittizie)
  const S1 = uid(), S2 = uid(), S3 = uid();
  put("staff", S1, ex({ name: "Luca Esempio", role: "ds", org: t("Club di esempio"), email: "ds@example.com", phone: "+41 00 000 00 01", notes: t("Contatto di esempio (persona fittizia).") }));
  put("staff", S2, ex({ name: "Sara Esempio", role: "chief", org: t("Club di esempio"), email: "capo.scout@example.com", phone: "+41 00 000 00 02", notes: t("Contatto di esempio (persona fittizia).") }));
  put("staff", S3, ex({ name: "Marco Esempio", role: "coach", org: t("Club di esempio"), email: "allenatore@example.com", phone: "+41 00 000 00 03", notes: t("Contatto di esempio (persona fittizia).") }));
  const M1 = uid(), M2 = uid();
  put("meetings", M1, ex({ title: t("Riunione area scouting (esempio)"), date: "2026-10-27", time: "10:00", place: t("Sede del club"), people: [S1, S2], players: [K.bar, K.cam, K.hut, K.jas].filter(Boolean), agenda: t("Esterni e attaccanti giovani: chi seguire nelle prossime due settimane."), notes: t("Decisi tre incarichi di visione singola. Report da consegnare prima della riunione di mercato.") }));
  put("meetings", M2, ex({ title: t("Riunione mercato di gennaio (esempio)"), date: day(7), time: "15:00", place: t("Videochiamata"), people: [S1, S2, S3], players: [K.cam, K.mor, K.pav].filter(Boolean), agenda: t("Presentazione dei report e proposta di due nomi per ruolo."), notes: "" }));
  put("tasks", uid(), ex({ meetingId: M1, playerId: K.cam, matchId: up, position: t("Punta centrale"), league: "Lega Alfa", by: S2, due: day(6), status: "todo", what: t("Movimenti senza palla, attacco della profondità e reazione dopo l'errore.") }));
  put("tasks", uid(), ex({ meetingId: M1, playerId: K.bar, matchId: "", position: t("Terzino sinistro"), league: "Lega Alfa", by: S1, due: day(14), status: "todo", what: t("Diagonali sul lato debole e qualità del cross.") }));
  put("tasks", uid(), ex({ meetingId: M1, playerId: K.hut, matchId: MIDS[0], position: t("Ala destra"), league: "Lega Alfa", by: S2, due: "2026-10-30", status: "done", what: t("Uno contro uno e lavoro difensivo.") }));
  const OFF = { cam: { train: "top", mates: "pos", errors: "var", source: "dir", celebr: t("Corre dai compagni che lo hanno servito, coinvolge la panchina."), comm: t("Parla molto con il compagno di reparto, chiede palla con decisione."), notes: t("Nel riscaldamento è tra i più concentrati; dopo un errore sotto porta si innervosisce per pochi minuti.") }, bar: { train: "ok", mates: "pos", errors: "calm", source: "dir", celebr: t("Esulta con il gruppo, sempre composto."), comm: t("Comunica poco ma segue le indicazioni dalla panchina."), notes: "" } };
  for (const k in OFF) if (K[k]) put("players", K[k], { ...P(K[k]), off: { ...OFF[k], date: "2026-10-28" } }, true);
  if (K.cam) { const m = S.matches.get(up); const pre = { players: { [K.cam]: { goal: t("Movimenti senza palla, attacco della profondità e reazione dopo l'errore."), role: "" } } }; put("matches", up, { ...m, pre }); }
}
// i testi degli esempi cambiano lingua insieme all'app (anche giudizio personale, riunioni e incarichi)
function relangExamples2(from, to) {
  if (from === to) return; const dl = l => l === "it" ? null : window["I18N_" + l.toUpperCase()];
  const fwd = dl(from); const rev = new Map(); if (fwd) for (const k in fwd) rev.set(fwd[k], k);
  const tr = s => { if (typeof s !== "string" || !s) return s; const it = from === "it" ? s : rev.get(s); if (it == null) return s; const d2 = dl(to); return to === "it" ? it : (d2 && d2[it]) || s; };
  const F = { meetings: ["title", "place", "agenda", "notes"], tasks: ["what", "position"], staff: ["org", "notes"] }; Undo.busy = true;
  try {
    for (const c in F) for (const [id, o] of [...S[c]]) { if (!o || !o.example) continue; const n = clone(o); let ch = false; for (const f of F[c]) { const v = tr(n[f]); if (v !== n[f]) { n[f] = v; ch = true; } } if (ch) { S[c].set(id, n); Store.write(c, id); } }
    for (const [id, o] of [...S.players]) { if (!o || !o.example || !o.off) continue; const n = clone(o); let ch = false; for (const f of ["celebr", "comm", "notes"]) { const v = tr(n.off[f]); if (v !== n.off[f]) { n.off[f] = v; ch = true; } } if (ch) { S.players.set(id, n); Store.write("players", id); } }
    for (const [id, o] of [...S.evals]) { if (!o || !o.example || !o.proj) continue; const n = clone(o); let ch = false; for (const f of ["ceil", "imp", "me"]) { const v = tr(n.proj[f]); if (v !== n.proj[f]) { n.proj[f] = v; ch = true; } } if (ch) { S.evals.set(id, n); Store.write("evals", id); } }
    for (const [id, o] of [...S.matches]) { if (!o || !o.example || !o.pre || !o.pre.players) continue; const n = clone(o); let ch = false; for (const k in n.pre.players) { const v = tr(n.pre.players[k].goal); if (v !== n.pre.players[k].goal) { n.pre.players[k].goal = v; ch = true; } } if (ch) { S.matches.set(id, n); Store.write("matches", id); } }
  } finally { Undo.busy = false; }
}
A.setLang = (orig => function (el) { const from = Prefs.lang; const r = orig(el); try { if (App.unlocked) relangExamples2(from, Prefs.lang); } catch (e) { } return r; })(A.setLang);

"use strict";
/* =========================================================
   MM Scout 5.6.2 — © 2026 Miodrag Milosevic. Tutti i diritti riservati.
   Vietato copiare, modificare o divulgare senza il consenso dell'autore.
   ---------------------------------------------------------
   1. Numeri della Panoramica cliccabili → scheda con statistiche
   2. Tracciabilità: cosa è cambiato, da dove, storico per giocatore e partita
   3. Ricerca più interattiva (recenti, suggerimenti, tastiera, evidenziazione)
   4. Diritti d'autore e uso
   ========================================================= */
const LOC = () => ({ en: "en-GB", de: "de-CH", sr: "sr-Latn-RS", es: "es-ES", fr: "fr-FR" })[Prefs.lang] || "it-IT";
const ymKey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const daysAgo = n => { const d = new Date(Date.now() - n * 864e5); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

/* ---------- 1. Statistiche in card ---------- */
const ST = {
  bars(rows) { rows = rows.filter(r => r[1] > 0); if (!rows.length) return `<div class="m">${t("Nessun dato.")}</div>`; const max = Math.max(1, ...rows.map(r => r[1])); return `<div class="sbars">${rows.map(([l, n]) => `<div class="sbar"><span class="sl">${esc(l)}</span><span class="st"><i style="width:${Math.max(4, Math.round(n / max * 100))}%"></i></span><b>${n}</b></div>`).join("")}</div>`; },
  months(dates) { const now = new Date(); const ks = []; for (let i = 5; i >= 0; i--) { const x = new Date(now.getFullYear(), now.getMonth() - i, 1); ks.push([ymKey(x), x.toLocaleDateString(LOC(), { month: "short" })]); }
    const c = {}; for (const d of dates) if (d) c[d.slice(0, 7)] = (c[d.slice(0, 7)] || 0) + 1; const max = Math.max(1, ...ks.map(k => c[k[0]] || 0));
    return `<div class="scols" role="img" aria-label="${t("Ultimi 6 mesi")}">${ks.map(([k, l]) => `<div class="scol"><b>${c[k] || ""}</b><i style="height:${Math.round((c[k] || 0) / max * 100)}%"></i><span>${esc(l)}</span></div>`).join("")}</div>`; },
  kpis(arr) { return `<div class="skpi">${arr.map(([v, l]) => `<div><b>${v}</b><span>${l}</span></div>`).join("")}</div>`; },
  count(arr, fn) { const c = {}; for (const x of arr) { const k = fn(x); if (k) c[k] = (c[k] || 0) + 1; } return Object.entries(c).sort((a, b) => b[1] - a[1]); },
  block(title, html) { return `<div class="sblock"><h3>${title}</h3>${html}</div>`; },
  sheet(title, sub, body, view) { sheet(`<div class="row between"><h2>${title}</h2><button class="btn sm ghost" data-a="closeSheetBtn" aria-label="${t("Chiudi")}">✕</button></div><p class="sub small">${sub}</p>${body}<div class="row end" style="margin-top:12px"><button class="btn" data-a="closeSheetBtn">${t("Chiudi")}</button><button class="btn pri" data-a="menuGo" data-v="${view}">${t("Apri la pagina")} →</button></div>`); }
};
const STATS = {
  players() {
    const pl = [...S.players.entries()].filter(([, p]) => !p.archived); const prs = pl.map(([id, p]) => [id, p, profile(id)]);
    const seen = prs.filter(r => r[2].n > 0).length; const avg = mean(prs.map(r => r[2].rating));
    const exp = pl.filter(([, p]) => { const m = contractMonths(p); return m != null && m >= 0 && m <= 12; }).length;
    const bands = [["≤ 17", a => a <= 17], ["18–21", a => a >= 18 && a <= 21], ["22–25", a => a >= 22 && a <= 25], ["26–29", a => a >= 26 && a <= 29], ["30+", a => a >= 30]];
    const ages = pl.map(([, p]) => age(p)).filter(a => a != null);
    const top = prs.filter(r => r[2].rating != null).sort((a, b) => b[2].rating - a[2].rating).slice(0, 5);
    ST.sheet(t("Giocatori: statistiche"), t("Il tuo archivio giocatori in numeri. Tocca un giocatore per aprirlo."),
      ST.kpis([[pl.length, t("Giocatori")], [seen, t("Visti almeno una volta")], [pl.length - seen, t("Mai valutati")], [f1(avg), t("Voto medio")], [exp, t("Contratto in scadenza (12 mesi)")]])
      + `<div class="sgrid">` + ST.block(t("Per reparto"), ST.bars(DEPTS.map(([k, n]) => [t(n), pl.filter(([, p]) => deptOf(p) === k).length])))
      + ST.block(t("Per età"), ST.bars(bands.map(([l, f]) => [l, ages.filter(f).length])))
      + ST.block(t("Per giudizio"), ST.bars(Cfg.get().verdicts.map(v => [L(v), pl.filter(([, p]) => p.verdict === v.id).length])))
      + ST.block(t("Campionati più seguiti"), ST.bars(ST.count(pl, ([, p]) => p.league).slice(0, 5))) + `</div>`
      + ST.block(t("I 5 con il voto più alto"), top.length ? `<div class="list">${top.map(([id, p]) => playerItem(id, p)).join("")}</div>` : `<div class="m">${t("Nessuna valutazione.")}</div>`), "giocatori");
  },
  evals() {
    const evs = [...S.evals.entries()].filter(([, e]) => !e.archived).map(([id, e]) => [id, e, evalRating(e)]);
    const d30 = daysAgo(30); const r = evs.map(x => x[2]);
    const band = v => v == null ? null : pct(v) >= 0.72 ? t("Alto") : pct(v) >= 0.5 ? t("Nella media") : t("Basso");
    const top = evs.filter(x => x[2] != null).sort((a, b) => b[2] - a[2]).slice(0, 5);
    ST.sheet(t("Valutazioni: statistiche"), t("Quanti report hai scritto, quando e con che voti."),
      ST.kpis([[evs.length, t("Valutazioni")], [evs.filter(x => x[1].date >= d30).length, t("Ultimi 30 giorni")], [f1(mean(r)), t("Voto medio")], [evs.filter(x => x[1].signature).length, t("Firmate")], [new Set(evs.map(x => x[1].playerId)).size, t("Giocatori valutati")]])
      + ST.block(t("Ultimi 6 mesi"), ST.months(evs.map(x => x[1].date)))
      + `<div class="sgrid">` + ST.block(t("Per livello del voto"), ST.bars([t("Alto"), t("Nella media"), t("Basso")].map(l => [l, evs.filter(x => band(x[2]) === l).length])))
      + ST.block(t("Per tipo di partita"), ST.bars(ST.count(evs, x => { const mt = Cfg.get().matchTypes.find(m => m.id === x[1].matchType); return mt ? L(mt) : ""; }).slice(0, 5))) + `</div>`
      + ST.block(t("I 5 voti più alti"), top.length ? `<div class="list">${top.map(([id, e]) => evalItem(id, e, true)).join("")}</div>` : `<div class="m">${t("Nessuna valutazione.")}</div>`), "report");
  },
  seen() {
    const ms = [...S.matches.entries()].filter(([, m]) => !m.archived && m.status === "vista").sort((a, b) => cmpTxt(b[1].date, a[1].date));
    const acts = ms.map(([, m]) => (m.events || []).length); const tot = acts.reduce((s, x) => s + x, 0);
    ST.sheet(t("Partite viste: statistiche"), t("Le partite che hai osservato e quante azioni hai registrato."),
      ST.kpis([[ms.length, t("Partite viste")], [ms.filter(([, m]) => m.date >= daysAgo(30)).length, t("Ultimi 30 giorni")], [tot, t("Azioni registrate")], [ms.length ? Math.round(tot / ms.length) : "–", t("Azioni per partita")], [ms.filter(([, m]) => m.focus).length, t("Con giocatore obiettivo")]])
      + ST.block(t("Ultimi 6 mesi"), ST.months(ms.map(([, m]) => m.date)))
      + `<div class="sgrid">` + ST.block(t("Per competizione"), ST.bars(ST.count(ms, ([, m]) => m.competition).slice(0, 6)))
      + ST.block(t("Per tipo di partita"), ST.bars(ST.count(ms, ([, m]) => { const mt = Cfg.get().matchTypes.find(x => x.id === m.type); return mt ? L(mt) : m.type || ""; }).slice(0, 6))) + `</div>`
      + ST.block(t("Ultime viste"), ms.length ? `<div class="list">${ms.slice(0, 5).map(([id, m]) => matchItem(id, m)).join("")}</div>` : `<div class="m">${t("Nessuna partita vista.")}</div>`), "partite");
  },
  next() {
    const td = today(); const ms = [...S.matches.entries()].filter(([, m]) => !m.archived && m.status !== "vista" && m.date >= td).sort((a, b) => cmpTxt(a[1].date + (a[1].time || ""), b[1].date + (b[1].time || "")));
    const in7 = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10), in30 = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
    ST.sheet(t("Partite in programma: statistiche"), t("Le prossime partite da vedere, con o senza giocatore obiettivo."),
      ST.kpis([[ms.length, t("In programma")], [ms.filter(([, m]) => m.date <= in7).length, t("Prossimi 7 giorni")], [ms.filter(([, m]) => m.date <= in30).length, t("Prossimi 30 giorni")], [ms.filter(([, m]) => m.focus).length, t("Con giocatore obiettivo")]])
      + ST.block(t("Per competizione"), ST.bars(ST.count(ms, ([, m]) => m.competition).slice(0, 6)))
      + ST.block(t("Le prossime"), ms.length ? `<div class="list">${ms.slice(0, 8).map(([id, m]) => matchItem(id, m)).join("")}</div>` : `<div class="m">${t("Niente in programma.")}</div>`), "calendario");
  }
};
A.statCard = el => { const f = STATS[el.dataset.k]; if (f) f(); };
R.panoramica = (orig => () => {
  const h = orig(); if (h.indexOf('<div class="stats">') < 0) return h;
  const pl = [...S.players.values()].filter(p => !p.archived).length, ev = [...S.evals.values()].filter(e => !e.archived).length;
  const ms = [...S.matches.values()].filter(m => !m.archived); const seen = ms.filter(m => m.status === "vista").length, next = ms.filter(m => m.status !== "vista" && m.date >= today()).length;
  const b = (k, n, l) => `<button class="stat click" data-a="statCard" data-k="${k}" title="${t("Apri le statistiche")}"><b>${n}</b><span>${l}</span><small class="smore">${t("Statistiche")} ›</small></button>`;
  return h.replace(/<div class="stats">[\s\S]*?<\/div>/, `<div class="stats">${b("players", pl, t("Giocatori"))}${b("evals", ev, t("Valutazioni"))}${b("seen", seen, t("Partite viste"))}${b("next", next, t("Partite in programma"))}</div>`);
})(R.panoramica);

/* ---------- 2. Tracciabilità ---------- */
const TRACK = ["players", "matches", "evals", "lists", "meetings", "tasks", "ideals", "staff", "lineups", "todos", "notes"];
const FP_SKIP = new Set(["_t", "updatedAt", "createdAt", "createdBy", "updatedBy", "example", "_v"]);
const FP = new Map();
const fpOf = v => { const o = {}; if (!v || typeof v !== "object") return o; for (const k of Object.keys(v)) { if (FP_SKIP.has(k)) continue; const x = v[k]; if (x == null || x === "") continue; o[k] = typeof x === "object" ? (Array.isArray(x) ? "A" + x.length + ":" : "O") + JSON.stringify(x).length : String(x).slice(0, 120); } return o; };
const FIELD_L = { first: "nome", last: "cognome", alias: "soprannome", club: "club", league: "campionato", roles: "ruoli", foot: "piede", height: "altezza", weight: "peso", birth: "data di nascita", birthYear: "anno di nascita", nat: "nazionalità", nat2: "seconda nazionalità", contract: "contratto", verdict: "giudizio", status: "stato", tags: "tag", notes: "note", quick: "nota rapida", photo: "foto", nextCheck: "prossima verifica", relations: "fuori dal campo", lists: "liste", shirt: "numero di maglia",
  home: "squadra di casa", away: "squadra in trasferta", date: "data", time: "ora", competition: "competizione", venue: "luogo", type: "tipo", focus: "giocatore obiettivo", targets: "giocatori da osservare", events: "azioni", lineup: "formazioni", lineups: "formazioni", pre: "prima della partita", post: "dopo la partita", goal: "obiettivo", score: "risultato", media: "multimedia", warmup: "riscaldamento", arrival: "arrivo",
  r: "voti", summary: "sintesi", evidence: "evidenze", signature: "firma", playerId: "giocatore", by: "autore", what: "cosa osservare", due: "scadenza", matchId: "partita", name: "nome", plan: "piano A/B/C", reqs: "requisiti", items: "elementi", title: "titolo", participants: "partecipanti", players: "giocatori", decisions: "decisioni", slots: "posizioni" };
window.put = (orig => function (coll, id, v) {
  try { if (v && TRACK.includes(coll)) { const key = coll + ":" + id; const nf = fpOf(v); const of = FP.get(key);
    if (of) { const ks = []; let ev = 0; for (const k of new Set([...Object.keys(of), ...Object.keys(nf)])) if (of[k] !== nf[k]) { if (k === "events") ev = (v.events || []).length - (parseInt(String(of[k] || "A0").slice(1), 10) || 0); else ks.push(k); } Activity._d = { k: ks, ev }; } else Activity._d = null;
    FP.set(key, nf); } } catch (e) { Activity._d = null; }
  return orig.apply(this, arguments);
})(window.put);
window.del = (orig => function (coll, id) { FP.delete(coll + ":" + id); return orig.apply(this, arguments); })(window.del);
const actWhere = () => { const v = ui.view || ""; const sh = document.querySelector("#sheetRoot .sheet h2"); const st = sh ? sh.textContent.replace(/\s+/g, " ").trim().slice(0, 40) : ""; return [v, st]; };
Activity.rec = (orig => function (coll, id, op, o) {
  const d = Activity._d; Activity._d = null; const t0 = Date.now(); orig.call(this, coll, id, op, o);
  if (this.quiet || !App.unlocked) return;
  const e = this.buf.concat(this.list()).find(x => x.c === coll && x.id === id && x.at >= t0 - 5); if (!e) return;
  if (d && op === "u") { if (d.k.length) e.k = [...new Set([...(e.k || []), ...d.k])].slice(0, 10); if (d.ev) e.ev = (e.ev || 0) + d.ev; }
  if (!e.w) e.w = actWhere();
})(Activity.rec);
const primeFP = () => { for (const c of TRACK) if (S[c]) for (const [id, v] of S[c]) FP.set(c + ":" + id, fpOf(v)); };
Lock.enter = (orig => async function () { const r = await orig.apply(this, arguments); setTimeout(() => { try { primeFP(); } catch (e) { } }, 900); return r; })(Lock.enter);
Examples.load = (orig => function () { const r = orig.apply(this, arguments); setTimeout(() => { try { primeFP(); } catch (e) { } }, 300); return r; })(Examples.load);
const VIEW_L = { panoramica: "Panoramica", calendario: "Calendario", partite: "Partite", giocatori: "Giocatori", report: "Report", staff: "Staff e riunioni", profili: "Profili ideali", confronto: "Confronto", squadre: "Squadre ombra", liste: "Liste", dati: "Dati", attivita: "Attività", impostazioni: "Impostazioni", cerca: "Cerca", profilo: "Il mio profilo", portfolio: "Portfolio", archivio: "Archivio" };
const actDetail = x => { const parts = []; if (x.ev > 0) parts.push(t("+{n} azioni", { n: x.ev })); else if (x.ev < 0) parts.push(t("{n} azioni tolte", { n: -x.ev })); if (x.k && x.k.length) parts.push(x.k.map(k => t(FIELD_L[k] || k)).slice(0, 5).join(", "));
  const w = x.w ? [t(VIEW_L[x.w[0]] || x.w[0] || ""), x.w[1]].filter(Boolean).join(" › ") : ""; return (parts.length ? `<span class="fdet">${esc(parts.join(" · "))}</span>` : "") + (w ? `<span class="fwhere">${t("da")} ${esc(w)}</span>` : ""); };
const fmtT = ts => new Date(ts).toLocaleTimeString(LOC(), { hour: "2-digit", minute: "2-digit" });
const actRow = (x, showKind = true) => { const k = ACT_KIND[x.c] || [x.c]; const op = ACT_OP[x.op] || ACT_OP.u; const alive = x.op !== "d" && S[x.c] && S[x.c].has(x.id);
  return `<div class="fitem ${alive && showKind ? "click" : ""}" ${alive && showKind ? `data-a="actOpen" data-c="${x.c}" data-id="${x.id}"` : ""}><span class="fic">${op[1]}</span><span class="fti mono">${fmtT(x.at)}</span><span class="grow"><span class="m">${t(op[0])} ·</span> ${showKind ? `<b>${esc(t(k[0]))}</b>: ${esc(x.l || "—")}` : ""}${x.n > 1 ? ` <span class="m">(${t("{n} modifiche", { n: x.n })})</span>` : ""}${x.ex ? ` <span class="pill c-grey">${t("Esempio")}</span>` : ""}${actDetail(x)}</span><button type="button" class="fdel" data-a="actDel" data-at="${x.at}" data-c="${x.c}" data-id="${esc(x.id)}" title="${t("Togli dallo storico")}" aria-label="${t("Togli dallo storico")}">✕</button></div>`; };
const feedHtml = (items, showKind) => { const day = ts => new Date(ts).toISOString().slice(0, 10); let cur = ""; return items.map(x => { const d = day(x.at); const hd = d !== cur ? (cur = d, `<div class="fday">${fmtDate(d)}${d === today() ? " · " + t("oggi") : ""}</div>`) : ""; return hd + actRow(x, showKind); }).join(""); };
window.activityFeed = function () {
  const f = ui.actF || ""; const items = Activity.buf.concat(Activity.list()).filter(x => !f || (f === "staff" ? ["meetings", "tasks", "staff", "ideals"].includes(x.c) : x.c === f)).slice(0, 80);
  return `<section class="panel"><div class="row between" style="flex-wrap:wrap;gap:8px"><div><h2>${t("Diario delle attività")}</h2><p class="sub small">${t("Si aggiorna da solo mentre lavori: cosa hai creato, modificato o eliminato, cosa è cambiato e da quale pagina.")}</p></div>
   <div class="seg">${[["", "Tutto"], ["players", "Giocatori"], ["matches", "Partite"], ["evals", "Report"], ["staff", "Staff"]].map(([k, n]) => `<button data-a="actF" data-v="${k}" aria-pressed="${f === k}">${t(n)}</button>`).join("")}</div></div>
   <div class="feed">${feedHtml(items, true) || `<div class="empty">${t("Ancora nessuna attività: inizia a lavorare e qui vedrai cosa hai fatto.")}</div>`}</div></section>`;
};
const historyPanel = (coll, id) => { const items = Activity.buf.concat(Activity.list()).filter(x => x.c === coll && x.id === id).slice(0, 30); if (!items.length) return "";
  return `<details class="panel hist noprint"><summary><b>🕑 ${t("Storico modifiche")}</b> <span class="m">${items.length}</span></summary><p class="sub small">${t("Quando è stato creato e modificato, cosa è cambiato e da quale pagina.")}</p><div class="feed">${feedHtml(items, false)}</div></details>`; };
window.playerPage = (orig => function (id) { return orig(id) + historyPanel("players", id); })(window.playerPage);
window.matchPage = (orig => function (id) { return orig(id) + historyPanel("matches", id); })(window.matchPage);

/* ---------- 3. Ricerca interattiva ---------- */
const SR = {
  recent() { return ((S.settings && S.settings.get("searchRecent")) || {}).items || []; },
  save(q) { q = String(q || "").trim(); if (q.length < 2 || !App.unlocked) return; const items = [q, ...this.recent().filter(x => x.toLowerCase() !== q.toLowerCase())].slice(0, 6); S.settings.set("searchRecent", { items, _t: Date.now() }); try { Store.write("settings", "searchRecent"); } catch (e) { } },
  clear() { S.settings.set("searchRecent", { items: [], _t: Date.now() }); try { Store.write("settings", "searchRecent"); } catch (e) { } },
  ideas() { const out = []; const pl = [...S.players.values()].filter(p => !p.archived);
    const rc = ST.count(pl.flatMap(p => (p.roles || []).slice(0, 1)), r => r)[0]; if (rc) out.push(roleL(rc[0]));
    const cl = ST.count(pl, p => p.club)[0]; if (cl) out.push(cl[0]);
    const nx = [...S.matches.values()].filter(m => m.status !== "vista" && m.date >= today()).sort((a, b) => cmpTxt(a.date, b.date))[0]; if (nx && nx.competition) out.push(nx.competition);
    const tg = (Cfg.get().tags || [])[0]; if (tg && tg.name) out.push(tg.name);
    out.push({ en: "today", de: "heute", sr: "danas", es: "hoy", fr: "aujourd'hui" }[Prefs.lang] || "oggi");
    const d = new Date(); out.push(d.toLocaleDateString(LOC().startsWith("sr") ? "en-GB" : LOC(), { month: "long" }).toLowerCase() + " " + d.getFullYear());
    return [...new Set(out.filter(Boolean))].slice(0, 6); },
  tips() { return [t("Puoi scrivere anche con errori: trova comunque il nome più vicino."), t("Cerca per data: «12/10», «ottobre 2026», «oggi»."), t("Cerca per ruolo, club, nazionalità o tag, anche insieme: «terzino U17»."), t("Premi Invio per aprire il primo risultato, ↓ per scorrere i risultati."), t("Da qualsiasi pagina: ⌘K (Mac) o Ctrl+K per cercare.")]; },
  tip() { const a = this.tips(); return a[Math.floor(Date.now() / 60000) % a.length]; },
  chips(arr, cls) { return arr.map(s => `<button type="button" class="chip ${cls || ""}" data-a="searchSet" data-q="${esc(s)}">${esc(s)}</button>`).join(""); },
  pop() { const rec = this.recent(); return `${rec.length ? `<div class="gph"><b>${t("Ricerche recenti")}</b><button type="button" class="lnk" data-a="srClear">${t("Cancella")}</button></div><div class="chips">${this.chips(rec, "rec")}</div>` : ""}
    <div class="gph"><b>${t("Prova a cercare")}</b></div><div class="chips">${this.chips(this.ideas())}</div><p class="gptip">💡 ${esc(this.tip())}</p>`; }
};
R.cerca = (orig => () => {
  const raw = (ui.q || "").trim(); if (raw.length >= 2) return orig();
  return `<div class="head"><div><h1>${t("Cerca")}</h1><p class="sub">${t("Cerca per nome (anche scritto male), club, ruolo, nazionalità, partita, competizione, tag, note o data: «12/10», «ottobre 2026», «oggi».")}</p></div></div>
   <section class="panel">${SR.pop()}</section><section class="panel"><h2>${t("Come cercare meglio")}</h2><ul class="small plist">${SR.tips().map(x => `<li>${esc(x)}</li>`).join("")}</ul></section>`;
})(R.cerca);
const srHighlight = () => { const q = (ui.q || "").trim().toLowerCase(); if (q.length < 2 || ui.view !== "cerca") return; const words = q.split(/\s+/).filter(w => w.length >= 2);
  for (const el of document.querySelectorAll("#view .item .t, #view .pcard .pcn")) { const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); const nodes = []; while (walk.nextNode()) nodes.push(walk.currentNode);
    for (const n of nodes) { const txt = n.nodeValue; const low = txt.toLowerCase(); let best = null; for (const w of words) { const i = low.indexOf(w); if (i >= 0 && (!best || w.length > best[1])) best = [i, w.length]; } if (!best) continue;
      const m = document.createElement("mark"); m.textContent = txt.slice(best[0], best[0] + best[1]); const after = n.splitText(best[0]); after.nodeValue = after.nodeValue.slice(best[1]); after.before(m); } } };
const srRender = () => { $("#view").innerHTML = R.cerca(); srHighlight(); };
let srT = null;
const srPopEl = () => { let p = $("#gqPop"); const s = $("#topbar .search"); if (!s) return null; if (!p) { p = document.createElement("div"); p.id = "gqPop"; p.className = "gqpop"; p.setAttribute("role", "dialog"); p.setAttribute("aria-label", t("Suggerimenti di ricerca")); p.addEventListener("mousedown", e => e.preventDefault()); s.appendChild(p); } return p; };
const srShowPop = () => { const g = $("#gq"); if (!g || g.value.trim() || ui.view === "cerca") { srHidePop(); return; } const p = srPopEl(); if (!p) return; p.innerHTML = SR.pop(); p.hidden = false; };
const srHidePop = () => { const p = $("#gqPop"); if (p) p.hidden = true; };
window.renderShell = (orig => function () {
  orig(); const gq = $("#gq"); if (!gq) return;
  gq.oninput = () => { ui.q = gq.value; srHidePop(); if (ui.view !== "cerca") { ui.view = "cerca"; history.replaceState(null, "", "#cerca"); renderShellNav(); }
    clearTimeout(srT); srT = setTimeout(srRender, gq.value.trim().length < 2 ? 0 : 110); if (!gq.value) setTimeout(srShowPop, 0); };
  gq.onfocus = () => srShowPop(); gq.onblur = () => setTimeout(srHidePop, 120);
  gq.onkeydown = e => {
    if (e.key === "Escape") { if (gq.value) { gq.value = ""; ui.q = ""; srRender(); } srHidePop(); gq.blur(); return; }
    if (e.key === "ArrowDown") { const f = $("#view .item.click, #view .pcard"); if (f) { e.preventDefault(); srHidePop(); f.setAttribute("tabindex", "0"); f.focus(); } return; }
    if (e.key === "Enter") { e.preventDefault(); clearTimeout(srT); if (ui.view === "cerca") srRender(); const f = $("#view .item.click, #view .pcard"); if (f) { SR.save(gq.value); f.click(); } }
  };
})(window.renderShell);
document.addEventListener("keydown", e => {
  if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K") && App.unlocked) { const g = $("#gq"); if (g) { e.preventDefault(); g.focus(); g.select(); } return; }
  if (ui.view !== "cerca" || !document.activeElement) return; const a = document.activeElement; if (!a.closest || !a.closest("#view")) return;
  const all = [...document.querySelectorAll("#view .item.click, #view .pcard")]; const i = all.indexOf(a); if (i < 0) return;
  if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); const n = all[Math.max(0, Math.min(all.length - 1, i + (e.key === "ArrowDown" ? 1 : -1)))]; if (i === 0 && e.key === "ArrowUp") { $("#gq").focus(); return; } n.setAttribute("tabindex", "0"); n.focus(); }
  else if (e.key === "Enter" && a.tagName !== "BUTTON") { e.preventDefault(); SR.save(ui.q); a.click(); }
});
document.addEventListener("click", e => { if (ui.view === "cerca" && (ui.q || "").trim().length >= 2 && e.target.closest("#view [data-a]") && !e.target.closest('[data-a="searchTab"],[data-a="sView"]')) SR.save(ui.q); }, true);
Object.assign(A, {
  searchSet: el => { ui.q = el.dataset.q; const g = $("#gq"); if (g) g.value = ui.q; srHidePop(); if (ui.view !== "cerca") { ui.view = "cerca"; history.replaceState(null, "", "#cerca"); renderShellNav(); } srRender(); SR.save(ui.q); },
  srClear: () => { SR.clear(); const p = $("#gqPop"); if (p && !p.hidden) p.innerHTML = SR.pop(); if (ui.view === "cerca") srRender(); }
});

/* ---------- 4. Diritti d'autore e uso ---------- */
const COPY_Y = () => { const y = new Date().getFullYear(); return y > 2026 ? "2026–" + y : "2026"; };
A.legalInfo = () => sheet(`<div class="row between"><h2>${t("Diritti d'autore e uso")}</h2><button class="btn sm ghost" data-a="closeSheetBtn" aria-label="${t("Chiudi")}">✕</button></div>
  <p class="sub small">© ${COPY_Y()} Miodrag Milosevic · ${t("Tutti i diritti riservati")}</p>
  <ul class="small plist"><li>${t("MM Scout è un'opera originale di Miodrag Milosevic: nome, logo, codice, testi, grafica e struttura dell'app sono protetti dal diritto d'autore.")}</li>
  <li>${t("Senza il consenso scritto dell'autore è vietato copiare, modificare, distribuire, pubblicare o divulgare l'app o parti di essa, anche per l'uso interno di club o agenzie.")}</li>
  <li>${t("I dati che inserisci (giocatori, report, note, foto e video) sono tuoi e restano cifrati sul tuo dispositivo: nessuno può divulgarli, copiarli o usarli senza il tuo consenso.")}</li>
  <li>${t("I report condivisi sono riservati: chi li riceve non può inoltrarli, pubblicarli o modificarli senza il consenso di chi li ha scritti.")}</li>
  <li>${t("I dati personali dei giocatori, soprattutto dei minorenni, vanno trattati secondo la legge svizzera sulla protezione dei dati (LPD) e, quando serve, il GDPR europeo.")}</li>
  <li>${t("Per chiedere il permesso di usare l'app o per collaborare: contatta Miodrag Milosevic su LinkedIn.")}</li></ul>
  <div class="row end"><a class="btn" href="${LINKEDIN}" target="_blank" rel="noopener noreferrer">LinkedIn</a><button class="btn" data-a="privacyInfo">${t("Privacy e tutela dei minori")}</button><button class="btn pri" data-a="closeSheetBtn">${t("Ho capito")}</button></div>`);
window.footHtml = (orig => function () { return orig() + `<div class="fcopy">© ${COPY_Y()} Miodrag Milosevic · ${t("Tutti i diritti riservati")} · <button data-a="legalInfo">${t("Diritti d'autore e uso")}</button></div>`; })(window.footHtml);
footHtml = window.footHtml;
A.privacyInfo = (orig => () => { orig(); const s = $("#sheetRoot .sheet .row.end"); if (s) s.insertAdjacentHTML("afterbegin", `<button class="btn" data-a="legalInfo">${t("Diritti d'autore e uso")}</button>`); })(A.privacyInfo);
SET.info = (orig => () => orig() + `<section class="panel"><h2>${t("Diritti d'autore e uso")}</h2><p class="sub small">© ${COPY_Y()} Miodrag Milosevic · ${t("Tutti i diritti riservati")}. ${t("Vietato copiare, modificare o divulgare l'app e i tuoi dati senza consenso.")}</p><div class="row" style="margin-top:8px"><button class="btn" data-a="legalInfo">${t("Leggi tutto")}</button><button class="btn" data-a="privacyInfo">${t("Privacy e tutela dei minori")}</button></div></section>`)(SET.info);
// la schermata di accesso può essere disegnata prima che questo file sia caricato: aggiorna il piè di pagina
const refreshLockFoot = () => { try { const f = document.querySelector("#lockRoot .appfoot"); if (f && !f.querySelector(".fcopy")) f.innerHTML = footHtml(); } catch (e) { } };
setTimeout(refreshLockFoot, 0); window.addEventListener("load", () => setTimeout(refreshLockFoot, 80));
Lock.render = (orig => function (html) { orig.call(this, html); refreshLockFoot(); })(Lock.render);

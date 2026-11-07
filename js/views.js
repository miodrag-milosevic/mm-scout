"use strict";
/* =========================================================
   MM Scout — panoramica, ricerca, partite, report,
   liste, confronto, squadre ombra, attività, archivio.
   ========================================================= */

/* ---------- Panoramica ---------- */
R.panoramica = () => {
  const pl = [...S.players.entries()].filter(([, p]) => !p.archived);
  const ev = [...S.evals.entries()].filter(([, e]) => !e.archived).sort((a, b) => (b[1].date || "").localeCompare(a[1].date || ""));
  const ms = [...S.matches.entries()].filter(([, m]) => !m.archived);
  const up = ms.filter(([, m]) => m.status !== "vista").sort((a, b) => (a[1].date || "").localeCompare(b[1].date || ""));
  const prof = Profile.get();
  const anyEx = ["players", "evals", "matches", "lists", "lineups"].some(c => [...S[c].values()].some(x => x && x.example));
  const checks = pl.filter(([, p]) => p.nextCheck && p.nextCheck <= new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10)).sort((a, b) => a[1].nextCheck.localeCompare(b[1].nextCheck));
  const expiring = pl.filter(([, p]) => { const m = contractMonths(p); return m != null && m <= 12 && m > -1; }).sort((a, b) => contractMonths(a[1]) - contractMonths(b[1]));
  const reminder = (window.syncReminder ? syncReminder() : "") + Backup.reminder();
  if (!pl.length && !ms.length) return `<div class="head"><div><h1>${t("Ciao{n}", { n: prof.name ? " " + esc(prof.name.split(" ")[0]) : "" })}</h1><p class="sub">${t("L'archivio è vuoto. Aggiungi il primo giocatore o la prossima partita da vedere.")}</p></div></div>
    ${reminder}<div class="row"><button class="btn pri" data-a="newPlayer">+ ${t("Nuovo giocatore")}</button><button class="btn" data-a="newMatch">+ ${t("Nuova partita")}</button><button class="btn ghost" data-a="loadEx">${t("Carica esempi")}</button></div>`;
  return `<div class="head"><div><h1>${t("Ciao{n}", { n: prof.name ? " " + esc(prof.name.split(" ")[0]) : "" })}</h1><p class="sub">${t("Situazione del lavoro di osservazione.")}</p></div>
    <div class="row noprint"><button class="btn pri" data-a="newPlayer">+ ${t("Giocatore")}</button><button class="btn" data-a="newMatch">+ ${t("Partita")}</button></div></div>
  ${reminder}
  ${anyEx ? `<div class="banner row between">${t("Ci sono dati di esempio: servono per provare l'app.")} <button class="btn sm" data-a="clearEx">${t("Elimina esempi")}</button></div>` : ""}
  <div class="stats"><div class="stat"><b>${pl.length}</b><span>${t("Giocatori")}</span></div><div class="stat"><b>${ev.length}</b><span>${t("Valutazioni")}</span></div><div class="stat"><b>${ms.filter(([, m]) => m.status === "vista").length}</b><span>${t("Partite viste")}</span></div><div class="stat"><b>${pl.filter(([, p]) => p.verdict === "prendere").length}</b><span>${L(Cfg.verdict("prendere")) || t("Da prendere")}</span></div></div>
  <div class="grid2">
   <section class="panel"><h2>${t("Prossime partite")}</h2><div class="list">${up.slice(0, 5).map(([id, m]) => matchItem(id, m)).join("") || `<div class="empty">${t("Nessuna partita in programma.")}</div>`}</div></section>
   <section class="panel"><h2>${t("Ultime valutazioni")}</h2><div class="list">${ev.slice(0, 5).map(([id, e]) => evalItem(id, e, true)).join("") || `<div class="empty">${t("Nessuna valutazione.")}</div>`}</div></section>
  </div>
  ${checks.length || expiring.length ? `<div class="grid2">
   ${checks.length ? `<section class="panel"><h2>${t("Da rivedere a breve")}</h2><div class="list">${checks.slice(0, 6).map(([id, p]) => playerItem(id, p, `<span class="pill ${p.nextCheck < today() ? "c-bad" : "c-amber"}">${fmtDate(p.nextCheck)}</span>`)).join("")}</div></section>` : ""}
   ${expiring.length ? `<section class="panel"><h2>${t("Contratti in scadenza (12 mesi)")}</h2><div class="list">${expiring.slice(0, 6).map(([id, p]) => playerItem(id, p, `<span class="pill c-amber">${fmtDate(p.contract.until)}</span>`)).join("")}</div></section>` : ""}</div>` : ""}
  <section class="panel"><h2>${t("Migliori per rating")}</h2><div class="list">${pl.map(([id, p]) => [id, p, profile(id).rating]).filter(x => x[2] != null).sort((a, b) => b[2] - a[2]).slice(0, 8).map(([id, p]) => playerItem(id, p)).join("") || `<div class="empty">${t("Valuta qualche giocatore per vedere la classifica.")}</div>`}</div></section>`;
};

/* ---------- Ricerca globale ---------- */
R.cerca = () => {
  const q = ui.q.trim().toLowerCase();
  if (q.length < 2) return `<div class="head"><h1>${t("Cerca")}</h1></div><div class="empty">${t("Scrivi almeno 2 lettere nella barra in alto.")}</div>`;
  const has = s => String(s || "").toLowerCase().includes(q);
  const pl = [...S.players.entries()].filter(([, p]) => has(pname(p)) || has(p.club) || has(p.nat) || has(p.notes) || has((p.contract || {}).agent) || (p.relations || []).some(r => has(r.title) || has(r.text)) || (p.tags || []).some(id => has((Cfg.tag(id) || {}).name)));
  const ms = [...S.matches.entries()].filter(([, m]) => has(m.home) || has(m.away) || has(m.competition) || has(m.venue) || has(m.goal) || has(m.notes));
  const ev = [...S.evals.entries()].filter(([, e]) => has(e.summary) || has(e.home) || has(e.away) || Object.values(e.notes || {}).some(has) || (e.evidence || []).some(x => has(x.text)) || has(pname(P(e.playerId))));
  const ls = [...S.lists.entries()].filter(([, l]) => has(l.name) || has(l.note));
  const md = [...S.media.entries()].filter(([, m]) => has(m.name) || has(m.note));
  const tot = pl.length + ms.length + ev.length + ls.length + md.length;
  return `<div class="head"><div><h1>${t("Cerca")}</h1><p class="sub">${t("{n} risultati per «{q}»", { n: tot, q: esc(ui.q) })}</p></div></div>
   ${pl.length ? `<section class="panel"><h2>${t("Giocatori")}</h2><div class="list">${pl.slice(0, 30).map(([id, p]) => playerItem(id, p)).join("")}</div></section>` : ""}
   ${ev.length ? `<section class="panel"><h2>${t("Valutazioni")}</h2><div class="list">${ev.slice(0, 30).map(([id, e]) => evalItem(id, e, true)).join("")}</div></section>` : ""}
   ${ms.length ? `<section class="panel"><h2>${t("Partite")}</h2><div class="list">${ms.slice(0, 30).map(([id, m]) => matchItem(id, m)).join("")}</div></section>` : ""}
   ${ls.length ? `<section class="panel"><h2>${t("Liste")}</h2><div class="list">${ls.map(([id, l]) => `<div class="item click" data-a="openList" data-id="${id}"><span class="tag" style="color:${esc(l.color)}"><i></i></span><div class="grow t">${esc(listPath(id).map(x => x[1].name).join(" › "))}</div></div>`).join("")}</div></section>` : ""}
   ${md.length ? `<section class="panel"><h2>${t("Multimedia")}</h2><div class="list">${md.map(([id, m]) => `<div class="item click" data-a="openMedia" data-id="${id}"><span class="code">${esc(mediaKindL(m.kind))}</span><div class="grow t">${esc(m.name)}</div></div>`).join("")}</div></section>` : ""}
   ${!tot ? `<div class="empty">${t("Nessun risultato.")}</div>` : ""}`;
};

/* ---------- Partite ---------- */
function matchItem(id, m) {
  return `<div class="item click" data-a="openMatch" data-id="${id}"><div class="mono small" style="width:54px">${fmtDate(m.date).slice(0, 5)}<br><span class="muted">${esc(m.time || "")}</span></div><div class="grow"><div class="t">${esc(m.home || "?")} – ${esc(m.away || "?")}${m.score ? " " + esc(m.score) : ""}${exB(m)}${archB(m)}</div><div class="m">${esc(L(Cfg.get().matchTypes.find(x => x.id === m.type)) || m.type || "")}${m.competition ? " · " + esc(m.competition) : ""}${m.venue ? " · " + esc(m.venue) : ""}</div>${(m.tags || []).length ? `<div style="margin-top:3px">${tagsHtml(m.tags)}</div>` : ""}</div><span class="pill ${m.status === "vista" ? "c-good" : "c-blue"}">${m.status === "vista" ? t("Vista") : t("In programma")}</span></div>`;
}
R.partite = () => {
  if (ui.matchId && S.matches.get(ui.matchId)) return matchPage(ui.matchId);
  const f = ui.mf, q = f.q.toLowerCase(); const c = Cfg.get();
  const rows = [...S.matches.entries()].filter(([, m]) => (f.showArch || !m.archived) && (!q || (m.home + " " + m.away + " " + (m.competition || "") + " " + (m.venue || "")).toLowerCase().includes(q)) && (!f.status || (f.status === "vista" ? m.status === "vista" : m.status !== "vista")) && (!f.type || m.type === f.type) && (!f.tag || (m.tags || []).includes(f.tag)));
  const up = rows.filter(([, m]) => m.status !== "vista").sort((a, b) => (a[1].date || "").localeCompare(b[1].date || "")), done = rows.filter(([, m]) => m.status === "vista").sort((a, b) => (b[1].date || "").localeCompare(a[1].date || ""));
  return `<div class="head"><div><h1>${t("Partite")}</h1><p class="sub">${t("Pianifica le missioni e registra le azioni al minuto durante la gara.")}</p></div><div class="row"><button class="btn" data-a="loadSheet">${t("Carica distinta")}</button><button class="btn pri" data-a="newMatch">+ ${t("Nuova partita")}</button></div></div>
  <div class="row"><input type="search" id="mfq" placeholder="${t("Cerca squadra, competizione, luogo")}" value="${esc(f.q)}" style="flex:2 1 220px;width:auto">
   <select id="mf_status" style="flex:1 1 140px;width:auto"><option value="">${t("Tutte")}</option><option value="prog" ${f.status === "prog" ? "selected" : ""}>${t("In programma")}</option><option value="vista" ${f.status === "vista" ? "selected" : ""}>${t("Viste")}</option></select>
   <select id="mf_type" style="flex:1 1 140px;width:auto"><option value="">${t("Tutte le tipologie")}</option>${c.matchTypes.map(x => `<option value="${esc(x.id)}" ${f.type === x.id ? "selected" : ""}>${esc(L(x))}</option>`).join("")}</select>
   <select id="mf_tag" style="flex:1 1 140px;width:auto"><option value="">${t("Tutti i tag")}</option>${c.tags.map(x => `<option value="${x.id}" ${f.tag === x.id ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select>
   <label class="chk"><input type="checkbox" id="mf_showArch" ${f.showArch ? "checked" : ""}> ${t("Archiviate")}</label></div>
  <section class="panel"><h2>${t("In programma")}</h2><div class="list">${up.map(([id, m]) => matchItem(id, m)).join("") || `<div class="empty">${t("Nessuna partita in programma.")}</div>`}</div></section>
  <section class="panel"><h2>${t("Già viste")}</h2><div class="list">${done.map(([id, m]) => matchItem(id, m)).join("") || `<div class="empty">${t("Nessuna partita ancora vista.")}</div>`}</div></section>`;
};
function tGet(id) { try { return JSON.parse(localStorage.getItem("ts3_tmr_" + id)) || { run: false, start: 0, base: 0, half: 1 }; } catch (e) { return { run: false, start: 0, base: 0, half: 1 }; } }
function tSet(id, tm) { try { localStorage.setItem("ts3_tmr_" + id, JSON.stringify(tm)); } catch (e) { } ui.timer = tm; }
const tSec = tm => { const raw = tm.base + (tm.run ? Math.floor((Date.now() - tm.start) / 1000) : 0); return window.CL && tm.run ? CL.limit(tm, raw) : raw; };
const minuteOf = tm => Math.floor(tSec(tm) / 60) + 1;
function matchPage(id) {
  const m = S.matches.get(id); const tabs = [["live", t("Registro live")], ["info", t("Dettagli e note")], ["valutazioni", t("Valutazioni")], ["multimedia", t("Multimedia")]];
  return `<div class="row between noprint"><button class="btn ghost sm" data-a="closeMatch">← ${t("Partite")}</button><div class="row"><button class="btn sm" data-a="shareItem" data-kind="match" data-id="${id}">${ico("share")} ${t("Condividi")}</button><button class="btn sm" data-a="toggleArchive" data-coll="matches" data-id="${id}">${m.archived ? t("Ripristina") : t("Archivia")}</button><button class="btn sm" data-a="editMatch" data-id="${id}">${t("Modifica")}</button>${m.status !== "vista" ? `<button class="btn sm pri" data-a="markSeen" data-id="${id}">${t("Segna come vista")}</button>` : ""}</div></div>
  <div class="head"><div><h1>${esc(m.home)} – ${esc(m.away)}${m.score ? " " + esc(m.score) : ""}${exB(m)}${archB(m)}</h1><p class="sub">${fmtDate(m.date)} ${esc(m.time || "")} · ${esc(L(Cfg.get().matchTypes.find(x => x.id === m.type)) || m.type || "")} ${m.competition ? "· " + esc(m.competition) : ""} ${m.venue ? "· " + esc(m.venue) : ""}</p>${m.goal ? `<p class="small" style="margin-top:4px"><b>${t("Obiettivo")}:</b> ${esc(m.goal)}</p>` : ""}${(m.tags || []).length ? `<div style="margin-top:6px">${tagsHtml(m.tags)}</div>` : ""}</div></div>
  <div class="tabs noprint">${tabs.map(([k, n]) => `<button data-a="mtab" data-t="${k}" aria-pressed="${ui.mtab === k}">${n}</button>`).join("")}</div>
  ${ui.mtab === "info" ? matchInfo(id, m) : ui.mtab === "valutazioni" ? matchEvals(id, m) : ui.mtab === "multimedia" ? mediaSection("match", id) : liveView(id, m)}`;
}
function matchInfo(id, m) {
  const sysOpts = Cfg.get().systems.map(x => ({ id: x, it: x, en: x }));
  return `<section class="panel"><h2>${t("Analisi della partita")}</h2><div class="fgrid" style="margin-top:10px">
    <label class="f">${t("Risultato")}<input type="text" id="mi_score" value="${esc(m.score)}" placeholder="2-1"></label>
    <label class="f">${t("Sistema di gioco casa")}${sel("mi_sysHome", sysOpts, m.sysHome, "—")}</label>
    <label class="f">${t("Sistema di gioco trasferta")}${sel("mi_sysAway", sysOpts, m.sysAway, "—")}</label>
    <label class="f">${t("Condizioni (campo, meteo, pubblico)")}<input type="text" id="mi_cond" value="${esc(m.conditions)}"></label>
    <label class="f full">${t("Squadra di casa: idea di gioco e note")}<textarea id="mi_homeNotes">${esc(m.homeNotes)}</textarea></label>
    <label class="f full">${t("Squadra in trasferta: idea di gioco e note")}<textarea id="mi_awayNotes">${esc(m.awayNotes)}</textarea></label>
    <label class="f full">${t("Note generali e giocatori da segnalare")}<textarea id="mi_notes">${esc(m.notes)}</textarea></label></div>
    <div class="row end" style="margin-top:10px"><button class="btn pri" data-a="saveMatchInfo" data-id="${id}">${t("Salva note")}</button></div></section>
  <section class="panel"><div class="row between"><h2>${t("Giocatori notati")}</h2><button class="btn sm" data-a="quickPlayer" data-id="${id}">+ ${t("Aggiungi giocatore notato")}</button></div>
    <p class="sub small">${t("Crea al volo un giocatore visto in questa partita: lo completi con calma dopo.")}</p>
    <div class="list" style="margin-top:6px">${(m.targets || []).filter(P).map(pid => playerItem(pid, P(pid))).join("") || `<div class="empty">${t("Nessun giocatore collegato.")}</div>`}</div></section>`;
}
function matchEvals(id, m) {
  const evs = [...S.evals.entries()].filter(([, e]) => e.matchId === id);
  return `<section class="panel"><h2>${t("Valutazioni di questa partita")}</h2><div class="list" style="margin-top:6px">${evs.map(([eid, e]) => evalItem(eid, e, true)).join("") || `<div class="empty">${t("Nessuna valutazione.")}</div>`}</div>
   <h3 style="margin-top:14px">${t("Crea valutazioni dal registro")}</h3><div class="list">${(m.targets || []).filter(P).map(pid => { const ex = evs.find(([, e]) => e.playerId === pid); return `<div class="item"><div class="grow t">${esc(pname(P(pid)))}</div>${ex ? `<button class="btn sm" data-a="openEvalPlayer" data-id="${ex[0]}">${t("Apri")}</button>` : `<button class="btn sm pri" data-a="evalFromMatch" data-id="${pid}">${t("Crea valutazione")}</button>`}</div>`; }).join("") || `<div class="empty">${t("Aggiungi i giocatori da osservare.")}</div>`}</div></section>`;
}
function liveView(id, m) {
  if (!ui.timer || ui.timerFor !== id) { ui.timer = tGet(id); ui.timerFor = id; }
  const tg = (m.targets || []).filter(P); const others = [...S.players.entries()].filter(([x, p]) => !tg.includes(x) && !p.archived);
  if (!ui.liveP && tg.length) ui.liveP = tg[0];
  return `<div class="grid2">
  <section class="panel" style="display:flex;flex-direction:column;gap:14px">
   <div class="row between"><div><div class="clock" id="clock">00:00</div><div class="m" id="minLbl"></div></div>
    <div class="row"><button class="btn ${ui.timer.run ? "" : "pri"}" data-a="tToggle">${ui.timer.run ? t("Pausa") : t("Avvia")}</button><button class="btn" data-a="tHalf">${ui.timer.half === 1 ? t("Inizia 2° tempo") : t("Torna al 1° tempo")}</button></div></div>
   <div><div class="m" style="font-weight:600;margin-bottom:6px">${t("Giocatore osservato")}</div><div class="chips">${tg.map(x => `<button class="chip" data-a="liveP" data-id="${x}" aria-pressed="${ui.liveP === x}">${esc(pname(P(x)))}</button>`).join("")}
     <select id="addTarget" style="width:auto;min-height:32px;padding:4px 8px"><option value="">+ ${t("aggiungi giocatore")}</option>${others.map(([x, p]) => `<option value="${x}">${esc(pname(p))}</option>`).join("")}</select></div></div>
   <div><div class="m" style="font-weight:600;margin-bottom:6px">${t("Tipo di azione")}</div><div class="cats">${Cfg.get().liveCats.filter(c => !c.hidden).map(c => `<button data-a="liveC" data-c="${esc(c.id)}" aria-pressed="${ui.liveCat === c.id}">${esc(L(c))}</button>`).join("")}</div></div>
   <input type="text" id="liveNote" placeholder="${t("Nota breve (facoltativa)")}">
   <div class="outs"><button class="o-p" data-a="liveO" data-o="+">${t("Positiva")}</button><button class="o-n" data-a="liveO" data-o="=">${t("Neutra")}</button><button class="o-m" data-a="liveO" data-o="-">${t("Negativa")}</button></div>
   <div class="row between"><span class="m">${t("Minuto manuale")} <input type="number" id="manMin" min="1" max="130" placeholder="auto" style="width:80px;display:inline-block;min-height:30px;padding:2px 6px"></span><button class="btn sm" data-a="undo">${t("Annulla ultima")}</button></div>
  </section>
  <section class="panel" id="liveLog"></section></div>`;
}
function renderLiveLog() {
  const el = $("#liveLog"); if (!el) return; const m = S.matches.get(ui.matchId); if (!m) return;
  const ev = (m.events || []).slice().reverse();
  el.innerHTML = `<h2>${t("Registro ({n})", { n: ev.length })}</h2>${(m.targets || []).filter(P).map(pid => { const e = (m.events || []).filter(x => x.p === pid); if (!e.length) return ""; const pos = e.filter(x => x.o === "+").length; return `<div class="row between" style="margin-top:8px"><b>${esc(pname(P(pid)))}</b><span class="mono small">${t("{n} azioni", { n: e.length })} · ${Math.round(pos / e.length * 100)}% +</span></div>`; }).join("")}
   <div class="list" style="margin-top:8px">${ev.map(e => `<div class="item" style="padding:7px 2px"><span class="code">${e.h === 2 ? "2T" : "1T"} ${e.t}'</span><div class="grow"><div class="t"><span class="${e.o === "+" ? "tp" : e.o === "-" ? "tm" : ""}">${e.o === "+" ? "＋" : e.o === "-" ? "−" : "＝"}</span> ${esc(liveCatL(e.c))} <span class="muted" style="font-weight:400">· ${esc(pname(P(e.p)))}</span></div>${e.n ? `<div class="m">${esc(e.n)}</div>` : ""}</div></div>`).join("") || `<div class="empty">${t("Scegli giocatore e azione, poi tocca Positiva, Neutra o Negativa.")}</div>`}</div>`;
}
let clockH = null;
function tickClock() { const c = $("#clock"); if (!c) { clearInterval(clockH); clockH = null; return; } const s = tSec(ui.timer); c.textContent = String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); $("#minLbl").textContent = (ui.timer.half === 1 ? t("1° tempo") : t("2° tempo")) + " · " + t("minuto {n}'", { n: minuteOf(ui.timer) }); }

/* ---------- Report (tutte le valutazioni) ---------- */
R.report = () => {
  if (ui.edraft) return evalEditor();
  const f = ui.rf, q = f.q.toLowerCase(), c = Cfg.get();
  const rows = [...S.evals.entries()].filter(([, e]) => {
    if (!f.showArch && e.archived) return false;
    const p = P(e.playerId);
    if (q && !(pname(p) + " " + (e.home || "") + " " + (e.away || "") + " " + (e.summary || "")).toLowerCase().includes(q)) return false;
    if (f.from && (e.date || "") < f.from) return false; if (f.to && (e.date || "") > f.to) return false;
    if (f.by && !(e.by || "").toLowerCase().includes(f.by.toLowerCase())) return false;
    if (f.type && e.matchType !== f.type) return false;
    if (f.tag && !(e.tags || []).includes(f.tag) && !((p && p.tags) || []).includes(f.tag)) return false;
    if (f.rMin) { const r = evalRating(e); if (r == null || r < +f.rMin) return false; }
    return true;
  }).sort(f.sort === "rating" ? (a, b) => (evalRating(b[1]) ?? -1) - (evalRating(a[1]) ?? -1) : (a, b) => (b[1].date || "").localeCompare(a[1].date || ""));
  return `<div class="head"><div><h1>${t("Report")}</h1><p class="sub">${t("Tutte le valutazioni scritte: {n}.", { n: rows.length })}</p></div></div>
  <section class="panel"><div class="fgrid">
   <label class="f">${t("Cerca")}<input type="search" id="rfq" value="${esc(f.q)}" placeholder="${t("Giocatore, squadra, sintesi")}"></label>
   <label class="f">${t("Dal")}<input type="date" id="rf_from" value="${esc(f.from)}"></label><label class="f">${t("Al")}<input type="date" id="rf_to" value="${esc(f.to)}"></label>
   <label class="f">${t("Valutato da")}<input type="text" id="rf_by" value="${esc(f.by)}"></label>
   <label class="f">${t("Tipologia")}${sel("rf_type", c.matchTypes, f.type, t("Tutte"))}</label>
   <label class="f">${t("Tag")}<select id="rf_tag"><option value="">${t("Tutti")}</option>${c.tags.map(x => `<option value="${x.id}" ${f.tag === x.id ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select></label>
   <label class="f">${t("Rating minimo")}<input type="number" step="0.5" id="rf_rMin" value="${esc(f.rMin)}"></label>
   <label class="f">${t("Ordina")}<select id="rf_sort"><option value="date">${t("Più recenti")}</option><option value="rating" ${f.sort === "rating" ? "selected" : ""}>${t("Rating più alto")}</option></select></label>
   <label class="chk" style="align-self:end"><input type="checkbox" id="rf_showArch" ${f.showArch ? "checked" : ""}> ${t("Mostra archiviati")}</label></div></section>
  <section class="panel"><div class="list">${rows.map(([id, e]) => evalItem(id, e, true)).join("") || `<div class="empty">${t("Nessuna valutazione trovata.")}</div>`}</div></section>`;
};

/* ---------- Liste (cartelle e sottoliste) ---------- */
R.liste = () => {
  const cur = ui.listId && S.lists.get(ui.listId) ? ui.listId : null; const l = cur ? S.lists.get(cur) : null;
  const children = pid => [...S.lists.entries()].filter(([, x]) => (x.parentId || null) === pid && !x.archived && !x.smart).sort((a, b) => (a[1].order ?? 0) - (b[1].order ?? 0) || a[1].name.localeCompare(b[1].name));
  const count = id => [...S.players.entries()].filter(([pid, p]) => !p.archived && listContains(id, pid)).length;
  const tree = (pid, depth) => children(pid).map(([id, x]) => `<div class="tnode" data-a="openList" data-id="${id}" aria-current="${cur === id}" style="padding-left:${8 + depth * 16}px"><span class="dot" style="background:${esc(x.color || "#1E6A47")}"></span><span class="grow t">${esc(x.name)}</span><span class="m mono">${count(id)}</span></div>` + tree(id, depth + 1)).join("");
  const smart = [...S.lists.entries()].filter(([, x]) => x.smart && !x.archived);
  let content;
  if (l && l.smart) {
    const rows = filterPlayers({ ...ui.pf, ...l.smart, open: false, q: l.smart.q || "" });
    content = `<div class="head"><div><h2>${esc(l.name)}</h2><p class="sub">${t("Lista intelligente: si aggiorna da sola con i filtri salvati.")}</p></div><div class="row"><button class="btn sm" data-a="editList" data-id="${cur}">${t("Modifica")}</button><button class="btn sm danger" data-a="delList" data-id="${cur}">${t("Elimina")}</button></div></div><div class="list">${rows.map(([id, p]) => playerItem(id, p)).join("") || `<div class="empty">${t("Nessun giocatore corrisponde.")}</div>`}</div>`;
  } else if (l) {
    const direct = [...S.players.entries()].filter(([, p]) => (p.listIds || []).includes(cur) && !p.archived);
    const sub = [...S.players.entries()].filter(([pid, p]) => !p.archived && !(p.listIds || []).includes(cur) && listContains(cur, pid));
    content = `<div class="breadcrumb"><button data-a="openList" data-id="">${t("Tutte le liste")}</button>${listPath(cur).map(([id, x]) => ` › <button data-a="openList" data-id="${id}">${esc(x.name)}</button>`).join("")}</div>
     <div class="head" style="margin-top:6px"><div><h2>${esc(l.name)}</h2>${l.note ? `<p class="sub">${esc(l.note)}</p>` : ""}</div><div class="row"><button class="btn sm" data-a="newList" data-parent="${cur}">+ ${t("Sottolista")}</button><button class="btn sm" data-a="editList" data-id="${cur}">${t("Modifica")}</button><button class="btn sm" data-a="toggleArchive" data-coll="lists" data-id="${cur}">${t("Archivia")}</button><button class="btn sm pri" data-a="addToList" data-id="${cur}">+ ${t("Aggiungi giocatori")}</button></div></div>
     ${children(cur).length ? `<div class="chips" style="margin:10px 0">${children(cur).map(([id, x]) => `<button class="chip" data-a="openList" data-id="${id}"><span class="tag" style="color:${esc(x.color)}"><i></i></span>${esc(x.name)} · ${count(id)}</button>`).join("")}</div>` : ""}
     <div class="list">${direct.map(([id, p]) => playerItem(id, p, `<button class="btn sm ghost" data-a="rmFromList" data-id="${id}" data-list="${cur}" title="${t("Togli dalla lista")}">✕</button>`)).join("") || `<div class="empty">${t("Nessun giocatore in questa lista.")}</div>`}</div>
     ${sub.length ? `<h3 style="margin-top:14px">${t("Nelle sottoliste")}</h3><div class="list">${sub.map(([id, p]) => playerItem(id, p)).join("")}</div>` : ""}`;
  } else {
    content = `<div class="empty">${t("Scegli una lista a sinistra, oppure creane una nuova. Le liste possono contenere sottoliste (es. Estate 2027 › Difensori › Under 21).")}</div>`;
  }
  return `<div class="head"><div><h1>${t("Liste")}</h1><p class="sub">${t("Organizza i giocatori in cartelle e sottoliste. Un giocatore può stare in più liste.")}</p></div><button class="btn pri" data-a="newList" data-parent="">+ ${t("Nuova lista")}</button></div>
  <div class="split">
   <section class="panel"><h3>${t("Cartelle")}</h3><div class="tree" style="margin-top:8px">${tree(null, 0) || `<div class="m">${t("Ancora nessuna lista.")}</div>`}</div>
    <h3 style="margin-top:16px">${t("Liste intelligenti")}</h3><div class="tree" style="margin-top:8px">${smart.map(([id, x]) => `<div class="tnode" data-a="openList" data-id="${id}" aria-current="${cur === id}"><span class="dot" style="background:var(--blue)"></span><span class="grow t">${esc(x.name)}</span></div>`).join("") || `<div class="m">${t("Salvale dai filtri della pagina Giocatori.")}</div>`}</div></section>
   <section class="panel">${content}</section></div>`;
};

/* ---------- Confronto ---------- */
R.confronto = () => {
  const pl = [...S.players.entries()].filter(([id, p]) => !p.archived && profile(id).n).sort((a, b) => pname(a[1]).localeCompare(pname(b[1])));
  if (!ui.cmp.length) { const c = S.settings.get("compare"); if (c && c.ids) ui.cmp = [...c.ids]; }
  ui.cmp = ui.cmp.filter(id => P(id));
  const selP = ui.cmp.map(id => [id, P(id), profile(id)]); const colors = ["var(--accent)", "var(--amber)", "var(--bad)", "var(--blue)"];
  const areas = Cfg.get().areas.filter(a => !a.hidden && (!a.gk || (selP.length && selP.every(([, p]) => isGK(p)))));
  return `<div class="head"><div><h1>${t("Confronto")}</h1><p class="sub">${t("Fino a quattro giocatori sulle medie delle loro valutazioni.")}</p></div></div>
  <section class="panel"><input type="search" id="cmpQ" placeholder="${t("Filtra nomi")}" style="margin-bottom:10px"><div class="chips" id="cmpChips">${pl.map(([id, p]) => `<button class="chip" data-a="cmp" data-id="${id}" data-n="${esc(pname(p).toLowerCase())}" aria-pressed="${ui.cmp.includes(id)}">${esc(pname(p))}</button>`).join("") || `<div class="empty" style="width:100%">${t("Servono giocatori con almeno una valutazione.")}</div>`}</div></section>
  ${selP.length ? `<div class="grid2"><section class="panel"><h2>${t("Aree")}</h2>${radar(selP.map(([, , pr]) => ({ vals: areas.map(a => pr.area[a.id]) })), areas.map(a => L(a)), colors)}<div class="legend">${selP.map(([, p, pr], i) => `<span><i style="background:${colors[i]}"></i>${esc(pname(p))} · ${f1(pr.rating)}</span>`).join("")}</div></section>
   <section class="panel"><h2>${t("Parametri")}</h2><div class="tw" style="max-height:640px;overflow:auto"><table><thead><tr><th>${t("Parametro")}</th>${selP.map(([, p]) => `<th class="n">${esc(p.last || pname(p))}</th>`).join("")}</tr></thead><tbody>
   <tr><td>${t("Età")}</td>${selP.map(([, p]) => `<td class="n">${age(p) ?? "–"}</td>`).join("")}</tr>
   ${areas.map(a => `<tr><td colspan="${selP.length + 1}" style="font-weight:700;padding-top:12px">${esc(L(a))}</td></tr>` + a.params.filter(x => !x.hidden).map(x => { const vs = selP.map(([, , pr]) => pr.attr[a.id]?.[x.id]); if (vs.every(v => v == null)) return ""; const mx = Math.max(...vs.filter(v => v != null)); return `<tr><td>${esc(L(x))}</td>${vs.map(v => `<td class="n" style="${v != null && v === mx && selP.length > 1 ? "color:var(--accent);font-weight:700" : ""}">${f1(v)}</td>`).join("")}</tr>`; }).join("")).join("")}
   <tr><td style="font-weight:700">${t("Rating")}</td>${selP.map(([, , pr]) => `<td class="n" style="font-weight:700">${f1(pr.rating)}</td>`).join("")}</tr></tbody></table></div></section></div>` : ""}`;
};

/* ---------- Squadre ombra (più formazioni, con alternative) ---------- */
const FORMATIONS = {
  "4-3-3": [["POR", 50, 92], ["TD", 85, 72], ["DC", 62, 77], ["DC", 38, 77], ["TS", 15, 72], ["MED", 50, 58], ["MEZ", 72, 50], ["MEZ", 28, 50], ["AD", 82, 26], ["PC", 50, 18], ["AS", 18, 26]],
  "4-2-3-1": [["POR", 50, 92], ["TD", 85, 72], ["DC", 62, 77], ["DC", 38, 77], ["TS", 15, 72], ["MED", 62, 58], ["MED", 38, 58], ["AD", 82, 36], ["TRQ", 50, 36], ["AS", 18, 36], ["PC", 50, 16]],
  "4-4-2": [["POR", 50, 92], ["TD", 85, 72], ["DC", 62, 77], ["DC", 38, 77], ["TS", 15, 72], ["ED", 85, 48], ["CC", 62, 52], ["CC", 38, 52], ["ES", 15, 48], ["ATT", 62, 20], ["ATT", 38, 20]],
  "4-3-1-2": [["POR", 50, 92], ["TD", 85, 72], ["DC", 62, 77], ["DC", 38, 77], ["TS", 15, 72], ["MEZ", 72, 56], ["REG", 50, 60], ["MEZ", 28, 56], ["TRQ", 50, 38], ["ATT", 62, 18], ["ATT", 38, 18]],
  "3-5-2": [["POR", 50, 92], ["DC", 72, 76], ["DC", 50, 79], ["DC", 28, 76], ["QD", 88, 50], ["MEZ", 68, 48], ["REG", 50, 58], ["MEZ", 32, 48], ["QS", 12, 50], ["ATT", 62, 20], ["ATT", 38, 20]],
  "3-4-2-1": [["POR", 50, 92], ["DC", 72, 76], ["DC", 50, 79], ["DC", 28, 76], ["QD", 88, 50], ["MED", 62, 56], ["REG", 38, 56], ["QS", 12, 50], ["TRQ", 68, 30], ["TRQ", 32, 30], ["PC", 50, 15]],
  "3-4-3": [["POR", 50, 92], ["DC", 72, 76], ["DC", 50, 79], ["DC", 28, 76], ["QD", 88, 52], ["CC", 62, 55], ["CC", 38, 55], ["QS", 12, 52], ["AD", 80, 26], ["PC", 50, 18], ["AS", 20, 26]]
};
R.squadre = () => {
  const lus = [...S.lineups.entries()].sort((a, b) => (a[1].name || "").localeCompare(b[1].name || ""));
  if (!lus.length) return `<div class="head"><div><h1>${t("Squadre ombra")}</h1><p class="sub">${t("Costruisci formazioni ideali (es. «Prima squadra 2027», «Under 19») con titolare e alternative per ogni posizione.")}</p></div><button class="btn pri" data-a="newLineup">+ ${t("Nuova squadra")}</button></div><div class="empty">${t("Nessuna squadra ombra.")}</div>`;
  if (!ui.lineupId || !S.lineups.get(ui.lineupId)) ui.lineupId = lus[0][0];
  const lu = S.lineups.get(ui.lineupId); const F = FORMATIONS[lu.formation] || FORMATIONS["4-3-3"];
  const mains = Object.values(lu.slots || {}).map(s => s && s.main).filter(P); const avg = mean(mains.map(id => profile(id).rating)); const ages = mean(mains.map(id => age(P(id))));
  return `<div class="head"><div><h1>${t("Squadre ombra")}</h1><p class="sub">${t("Tocca una posizione per scegliere titolare e alternative.")}</p></div><div class="row"><button class="btn" data-a="shareItem" data-kind="lineup" data-id="${ui.lineupId}">${ico("share")} ${t("Condividi")}</button><button class="btn pri" data-a="newLineup">+ ${t("Nuova squadra")}</button></div></div>
  <div class="row"><div class="chips">${lus.map(([id, l]) => `<button class="chip" data-a="selLineup" data-id="${id}" aria-pressed="${id === ui.lineupId}">${esc(l.name)}${l.example ? " ·" + t("Esempio") : ""}</button>`).join("")}</div></div>
  <div class="split rev">
   <div class="t11">${F.map(([lb, x, y], i) => { const s = (lu.slots || {})[i] || {}; const p = P(s.main); const alts = (s.alt || []).filter(P).map(id => P(id).last || pname(P(id))); return `<button class="slot ${p ? "filled" : ""}" style="left:${7 + x * 0.86}%;top:${y}%" data-a="slot" data-i="${i}"><span class="dot">${p && p.photo ? `<img src="${p.photo}" alt="">` : esc(posCode(lb))}</span><span class="nm">${p ? esc(p.last || pname(p)) + " " + f1(profile(s.main).rating) : "—"}</span>${alts.length ? `<span class="alt">${esc(alts.join(", "))}</span>` : ""}</button>`; }).join("")}</div>
   <section class="panel"><div class="fgrid"><label class="f">${t("Nome della squadra")}<input type="text" id="luName" value="${esc(lu.name)}"></label><label class="f">${t("Modulo")}<select id="formation">${Object.keys(FORMATIONS).map(f => `<option ${lu.formation === f ? "selected" : ""}>${f}</option>`).join("")}</select></label></div>
    <label class="f" style="margin-top:10px">${t("Note")}<textarea id="luNote">${esc(lu.note)}</textarea></label>
    <div class="row between" style="margin-top:10px"><span class="m">${t("Rating medio titolari")}: <b class="mono">${f1(avg)}</b> · ${t("Età media")}: <b class="mono">${ages != null ? ages.toFixed(1) : "–"}</b></span><div class="row"><button class="btn sm danger" data-a="delLineup">${t("Elimina")}</button><button class="btn sm pri" data-a="saveLineup">${t("Salva")}</button></div></div></section></div>`;
};

/* ---------- Attività (per mostrare il lavoro svolto) ---------- */
function activityStats(months) {
  const since = new Date(); since.setMonth(since.getMonth() - months + 1); since.setDate(1); const s0 = since.toISOString().slice(0, 10);
  const evs = [...S.evals.values()].filter(e => (e.date || "") >= s0 && !e.example);
  const ms = [...S.matches.values()].filter(m => m.status === "vista" && (m.date || "") >= s0 && !m.example);
  const minutes = evs.reduce((s, e) => s + (+e.minutes || 0), 0);
  const comps = {}; for (const m of ms) { const k = m.competition || L(Cfg.get().matchTypes.find(x => x.id === m.type)) || "—"; comps[k] = (comps[k] || 0) + 1; }
  const nats = {}; const pids = new Set(evs.map(e => e.playerId)); for (const id of pids) { const p = P(id); if (p && p.nat) nats[p.nat] = (nats[p.nat] || 0) + 1; }
  const rows = []; for (let i = 0; i < months; i++) { const d = new Date(since); d.setMonth(d.getMonth() + i); const k = d.toISOString().slice(0, 7); rows.push({ label: d.toLocaleDateString(locale(), { month: "short" }), a: ms.filter(m => m.date.slice(0, 7) === k).length, b: evs.filter(e => (e.date || "").slice(0, 7) === k).length }); }
  const verd = {}; for (const id of pids) { const p = P(id); if (p && p.verdict) verd[p.verdict] = (verd[p.verdict] || 0) + 1; }
  return { evs, ms, minutes, comps, nats, rows, verd, players: pids.size, avgRating: mean(evs.map(evalRating)) };
}
R.attivita = () => {
  const st = activityStats(ui.actRange); const hasEx = [...S.evals.values()].some(e => e.example);
  return `<div class="head"><div><h1>${t("Attività")}</h1><p class="sub">${t("Il riepilogo del tuo lavoro: utile per un colloquio o da allegare al portfolio.")}</p></div><div class="seg">${[3, 6, 12, 24].map(n => `<button data-a="actRange" data-v="${n}" aria-pressed="${ui.actRange === n}">${t("{n} mesi", { n })}</button>`).join("")}</div></div>
  ${hasEx ? `<div class="banner info">${t("I dati di esempio non vengono conteggiati.")}</div>` : ""}
  <div class="stats"><div class="stat"><b>${st.ms.length}</b><span>${t("Partite viste")}</span></div><div class="stat"><b>${st.evs.length}</b><span>${t("Valutazioni")}</span></div><div class="stat"><b>${st.players}</b><span>${t("Giocatori valutati")}</span></div><div class="stat"><b>${Math.round(st.minutes / 60)}</b><span>${t("Ore osservate")}</span></div></div>
  <section class="panel"><div class="row between"><h2>${t("Mese per mese")}</h2><div class="legend"><span><i style="background:var(--accent)"></i>${t("Partite viste")}</span><span><i style="background:var(--amber)"></i>${t("Valutazioni")}</span></div></div>${barChart(st.rows, { label: t("Mese per mese") })}</section>
  <div class="grid2"><section class="panel"><h2>${t("Competizioni seguite")}</h2>${countTable(st.comps)}</section><section class="panel"><h2>${t("Nazionalità valutate")}</h2>${countTable(st.nats)}</section></div>
  <section class="panel"><h2>${t("Giudizi espressi")}</h2>${countTable(Object.fromEntries(Object.entries(st.verd).map(([k, v]) => [L(Cfg.verdict(k)) || k, v])))}<p class="m" style="margin-top:8px">${t("Rating medio assegnato")}: <b class="mono">${f1(st.avgRating)}</b></p></section>`;
};
function countTable(o) { const rows = Object.entries(o).sort((a, b) => b[1] - a[1]); if (!rows.length) return `<p class="muted small" style="margin-top:6px">${t("Nessun dato nel periodo.")}</p>`; const max = rows[0][1]; return `<div class="col" style="margin-top:8px;gap:6px">${rows.slice(0, 12).map(([k, v]) => `<div class="pb"><div class="lab"><span>${esc(k)}</span><span class="mono">${v}</span></div><div class="bar"><i style="width:${v / max * 100}%"></i></div></div>`).join("")}</div>`; }

/* ---------- Archivio ---------- */
R.archivio = () => {
  const tabs = [["players", t("Giocatori")], ["matches", t("Partite")], ["evals", t("Valutazioni")], ["lists", t("Liste")]];
  const rows = [...S[ui.archTab].entries()].filter(([, x]) => x.archived);
  const item = ([id, x]) => ui.archTab === "players" ? playerItem(id, x) : ui.archTab === "matches" ? matchItem(id, x) : ui.archTab === "evals" ? evalItem(id, x, true) : `<div class="item"><div class="grow t">${esc(x.name)}</div></div>`;
  return `<div class="head"><div><h1>${t("Archivio")}</h1><p class="sub">${t("Quello che non usi più ma vuoi conservare. Gli elementi archiviati non compaiono nelle liste e nelle ricerche normali.")}</p></div></div>
  <div class="tabs">${tabs.map(([k, n]) => `<button data-a="archTab" data-t="${k}" aria-pressed="${ui.archTab === k}">${n} (${[...S[k].values()].filter(x => x.archived).length})</button>`).join("")}</div>
  <section class="panel"><div class="list">${rows.map(r => `<div class="row" style="flex-wrap:nowrap"><div class="grow">${item(r)}</div><button class="btn sm" data-a="toggleArchive" data-coll="${ui.archTab}" data-id="${r[0]}">${t("Ripristina")}</button><button class="btn sm danger" data-a="purge" data-coll="${ui.archTab}" data-id="${r[0]}">${t("Elimina")}</button></div>`).join("") || `<div class="empty">${t("Archivio vuoto.")}</div>`}</div></section>`;
};

"use strict";
/* =========================================================
   MM Scout 5.5 — metodo del «giocatore obiettivo»
   Dal manuale: prima del nome viene il bisogno della
   squadra (recruitment prima dello scouting), poi il profilo
   ideale con piano A, B e C, poi la visione mirata di UN
   giocatore: arrivo prima, riscaldamento, partita, dopo la
   partita, e la domanda finale: è quello giusto per NOI, per
   il nostro sistema e per l'allenatore?
   Qui anche: aspetto (piè di pagina, barra in alto, saluto,
   descrizioni delle pagine), fasi positive e negative nel
   «Durante», profili ideali collegati allo staff, confronto
   personalizzabile, diario delle attività.
   ========================================================= */

/* =========================================================
   ASPETTO GENERALE
   ========================================================= */
function greet(name) { const h = new Date().getHours(); const g = h < 5 ? t("Buonasera") : h < 12 ? t("Buongiorno") : h < 18 ? t("Buon pomeriggio") : t("Buonasera"); return name ? `${g}, ${name}` : g; }
const firstName = () => { const p = Profile.get(); return ((p.name || (Accounts.acc || {}).name || "").split(" ")[0]) || ""; };
const PAGE_DESC = {
  panoramica: "Il punto di partenza: prossime partite, obiettivi da osservare, ultime valutazioni e promemoria.",
  giocatori: "Il tuo archivio di giocatori: cerca, filtra, ordina e apri la scheda completa di ognuno.",
  partite: "Pianifica le partite, osserva il giocatore obiettivo prima, durante e dopo la gara e scrivi il report.",
  report: "Tutte le valutazioni scritte: cercale, ordinale, firmale e condividile con lo staff.",
  liste: "Organizza i giocatori in cartelle e sottoliste (es. mercato estivo › difensori › Under 21).",
  calendario: "Partite e riunioni nel calendario, da esportare nel Calendario del Mac o dell'iPhone.",
  staff: "Contatti dello staff, riunioni e incarichi: decidi con loro chi osservare, dove e perché.",
  profili: "Il giocatore che serve alla squadra, con piano A, B e C, deciso insieme allo staff.",
  confronto: "Metti a confronto fino a quattro giocatori tra loro e con il profilo ideale.",
  squadre: "La formazione che costruiresti: titolare e alternative per ogni posizione, con rating ed età media.",
  attivita: "Il diario di ciò che fai nell'app e il riepilogo del tuo lavoro di osservazione.",
  portfolio: "Il tuo biglietto da visita da scout: lavoro svolto e report scelti, da condividere.",
  archivio: "Ciò che non usi più ma vuoi conservare, e gli archivi nascosti con codice.",
  profilo: "I tuoi dati da osservatore: compaiono su report, firme e condivisioni.",
  impostazioni: "Lingua, tema, sicurezza, backup, sincronizzazione e personalizzazione dell'app."
};
function withDesc(view, h) {
  const d = PAGE_DESC[view]; if (!d) return h; const i = h.indexOf('<div class="head">'); if (i < 0 || i > 400) return h;
  const j = h.indexOf("</h1>", i); if (j < 0) return h; const after = h.slice(j + 5); const name = (views().find(v => v !== "-" && v[0] === view) || [])[1] || "";
  const eyebrow = view === "panoramica" ? `<div class="eyebrow">${esc(name)}</div>` : "";
  const om = after.match(/^\s*<p class="sub">([\s\S]*?)<\/p>/); let rest = om ? after.slice(om[0].length) : after; rest = `<p class="sub">${t(d)}</p>${om && /\d/.test(om[1]) ? `<p class="m pcount">${om[1]}</p>` : ""}` + rest;
  const head = h.slice(0, j + 5); return (eyebrow ? head.replace('<div class="head"><div>', `<div class="head"><div>${eyebrow}`) : head) + rest;
}
const isMainPage = v => v === "giocatori" ? !(ui.playerId && P(ui.playerId)) && !ui.pdraft && !ui.edraft : v === "report" ? !ui.edraft : v === "partite" ? !(ui.matchId && S.matches.get(ui.matchId)) : v === "liste" ? !(ui.listId && S.lists.get(ui.listId)) : v === "profili" ? !ui.idraft && !(ui.idealId && S.ideals.get(ui.idealId)) : v === "staff" ? !ui.meetId : true;
setTimeout(() => { for (const v of Object.keys(PAGE_DESC)) if (R[v]) R[v] = (orig => () => { const h = orig(); return isMainPage(v) ? withDesc(v, h) : h; })(R[v]); }, 0);
// saluto in Panoramica
R.panoramica = (orig => () => orig().replace(/<h1>[^<]*<\/h1>/, `<h1>${esc(greet(firstName()))}</h1>`))(R.panoramica);
// saluto all'ingresso
Lock.enter = (orig => async function () { const r = await orig.apply(this, arguments); setTimeout(() => { if (window.welcomeCard) { try { return welcomeCard(); } catch (e) { } } const up = [...S.matches.values()].filter(m => !m.archived && m.status !== "vista" && m.date >= today()); const in7 = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10); const tot = up.length, w = up.filter(m => m.date <= in7).length;
    const msg = !tot ? "" : w === tot ? (tot === 1 ? t("1 partita in programma nei prossimi 7 giorni") : t("{n} partite in programma nei prossimi 7 giorni", { n: tot })) : (tot === 1 ? t("1 partita in programma") : t("{n} partite in programma", { n: tot })) + (w ? " · " + (w === 1 ? t("1 nei prossimi 7 giorni") : t("{n} nei prossimi 7 giorni", { n: w })) : "");
    if (window.welcomeToast) welcomeToast(); else toast(`${greet(firstName())} 👋${msg ? " · " + msg : ""}`, 4500); }, 400); return r; })(Lock.enter);
Lock.show = (orig => async function (msg) { const r = await orig.apply(this, arguments); const h = $("#lockRoot .who h2"); if (h) { const a = Accounts.byEmail(Prefs.get("lastEmail", "")) || Accounts.list()[0]; h.textContent = greet(((a && a.name) || "").split(" ")[0]); } return r; })(Lock.show);
// barra in alto: … + 🔒, tema, lingua (ultima a destra) · logo = Panoramica · piè di pagina
window.renderShell = (orig => function () {
  orig(); const tools = $("#topbar .tbtools"); if (tools) { const th = tools.querySelector('[data-a="themeCycle"]'), lg = tools.querySelector("#langSel"); if (th) tools.appendChild(th); if (lg) { lg.classList.add("tblang"); tools.appendChild(lg); } const lk = tools.querySelector('[data-a="lockNow"]'); if (lk) tools.appendChild(lk); }
  const b = $("#side .brand"); if (b) { b.setAttribute("data-a", "goHome"); b.setAttribute("role", "link"); b.setAttribute("tabindex", "0"); b.title = t("Panoramica"); }
})(window.renderShell);
A.goHome = () => { closeSheet(); resetSub(); ui.listId = null; ui.idealId = null; ui.meetId = null; go("panoramica"); };
const LI_ICON = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect width="24" height="24" rx="4" fill="#0A3B5C"/><path fill="#fff" d="M7.1 9.4h2.5v7.9H7.1zm1.3-3.9a1.4 1.4 0 1 1 0 2.9 1.4 1.4 0 0 1 0-2.9zM11 9.4h2.4v1.1c.4-.7 1.2-1.3 2.5-1.3 2.6 0 3.1 1.7 3.1 4v4.1h-2.5v-3.6c0-.9 0-2-1.2-2s-1.4.9-1.4 1.9v3.7H11z"/></svg>`;
window.footHtml = function () {
  return `<div class="fmade">${esc(appName())} ${APP_VERSION} · Made with <span class="heart" aria-hidden="true">❤️</span> by <span class="fname">Miodrag Milosevic</span><a class="fli-ico" href="${LINKEDIN}" target="_blank" rel="noopener noreferrer" title="LinkedIn · Miodrag Milosevic" aria-label="LinkedIn · Miodrag Milosevic">${LI_ICON}</a></div>
   <nav class="flinks" aria-label="${t("Link utili")}">${App.unlocked ? `<button data-a="footGo" data-v="backup">${t("Backup")}</button><button data-a="footGo" data-v="sync">${t("Sincronizzazione")}</button><button data-a="footGo" data-v="info">${t("Informazioni")}</button>` : ""}<button data-a="privacyInfo">${t("Privacy e tutela dei minori")}</button></nav>`;
};
// le funzioni che usano footHtml lo leggono a ogni chiamata
footHtml = window.footHtml;

/* =========================================================
   «DURANTE»: FASE POSITIVA E FASE NEGATIVA
   ========================================================= */
const GROUPS55 = [["frequenti", "Frequenti", "Frequent"], ["possesso", "Con palla", "On the ball"], ["senzapalla", "Movimenti senza palla", "Movement off the ball"], ["tpos", "Transizione positiva", "Positive transition"], ["inattoff", "Palle inattive offensive", "Attacking set pieces"], ["difesa", "Fase difensiva", "Defending"], ["tneg", "Transizione negativa", "Negative transition"], ["inattdif", "Palle inattive difensive", "Defending set pieces"], ["fisico", "Fisico", "Physical"], ["mentale", "Mentale", "Mental"], ["portiere", "Portiere", "Goalkeeper"], ["eventi", "Eventi", "Match events"]];
const MACRO = [["pos", "⚡ Fase positiva", "⚡ In possession", ["possesso", "senzapalla", "tpos", "inattoff"]], ["neg", "🛡 Fase negativa", "🛡 Out of possession", ["difesa", "tneg", "inattdif"]], ["oth", "Fisico, mentale, eventi", "Physical, mental, events", ["fisico", "mentale", "portiere", "eventi"]]];
const REGROUP = { "Contropressing": "tneg", "Ripiegamento": "tneg", "Ripartenza": "tpos", "Prima scelta": "tpos", "Angolo": "inattoff", "Punizione": "inattoff", "Rigore": "inattoff", "Rimessa": "inattoff", "Palla inattiva difensiva": "inattdif" };
const NEWCATS = [["Attacco in transizione", "Attacca lo spazio in transizione", "Attacks space in transition", "tpos", ["tat|Contropiede", "tat|Attacco della profondità"], ["reaz", "smtipo", "smesito"]], ["Copertura preventiva", "Copertura preventiva", "Rest defence (cover before the loss)", "tneg", ["tat|Posizione", "tat|Lettura del gioco"], ["covlinea", "rischio", "com"]], ["Fallo tattico", "Fallo tattico", "Tactical foul", "tneg", ["men|Autocontrollo", "tat|Lettura del gioco"], ["falltipo"]]];
const SUBS = {
  possesso: [["Ricevere", ["Ricezione", "Controllo orientato", "Ricezione sotto pressione", "Scanning"]], ["Costruire", ["Passaggio", "Passaggio progressivo", "Cambio di gioco", "Piede debole"]], ["Progredire", ["Conduzione", "Dribbling", "Protezione palla"]], ["Rifinire e concludere", ["Filtrante", "Cross / Assist", "Occasione creata", "Tiro", "Colpo di testa"]], ["Errori", ["Perdita palla"]]],
  senzapalla: [["Smarcarsi", ["Smarcamento", "Supporto", "Tra le linee"]], ["Attaccare lo spazio", ["Attacco profondità", "Inserimento"]], ["Per la squadra", ["Apre spazi", "Superiorità"]]],
  difesa: [["Pressione", ["Pressing"]], ["Duelli", ["Contrasto", "Duello a terra", "Duello aereo"]], ["Lettura e posizione", ["Lettura / Anticipo", "Posizione", "Marcatura", "Copertura"]], ["Esito", ["Recupero palla", "Chiusura", "Fallo"]]]
};
Migrate.config = (orig => function () {
  orig.call(Migrate); const c = S.settings.get("config"); if (!c || (c.gv || 0) >= 1) return;
  const old = new Map((c.liveGroups || []).map(g => [g.id, g])); c.liveGroups = GROUPS55.map(([id, it, en]) => ({ ...(old.get(id) || {}), id, it, en }));
  for (const lc of (c.liveCats || [])) { if (REGROUP[lc.id]) lc.group = REGROUP[lc.id]; else if (lc.group === "transizioni") lc.group = "tpos"; else if (lc.group === "inattive") lc.group = "inattoff"; }
  for (const [id, it, en, group, params, facets] of NEWCATS) if (!c.liveCats.some(x => x.id === id)) c.liveCats.push({ id, it, en, group, params, area: params[0].split("|")[0], kind: "", fixed: "", hidden: false, facets });
  c.gv = 1; put("settings", "config", c);
})(Migrate.config);
window.renderLive = (orig => function () {
  orig(); const gs = $("#lgroups"); const m = S.matches.get(ui.matchId); const p = P(ui.liveP); if (!gs || !m || !p) return;
  const groups = liveGroupsFor(p); const pev = (m.events || []).filter(e => e.p === ui.liveP); const cnt = gid => pev.filter(e => (catOf(e.c) || {}).group === gid).length;
  const btn = g => `<button data-a="lgroup" data-g="${g.id}" aria-pressed="${ui.lgroup === g.id}">${esc(L(g))}${cnt(g.id) ? ` <small>${cnt(g.id)}</small>` : ""}</button>`;
  const fr = groups.find(g => g.id === "frequenti");
  gs.innerHTML = `${fr ? `<div class="lmacro"><div class="lmrow">${btn(fr)}</div></div>` : ""}${MACRO.map(([k, it, en, ids]) => { const gg = ids.map(id => groups.find(g => g.id === id)).filter(Boolean); return gg.length ? `<div class="lmacro m-${k}"><span class="lmt">${esc(L({ it, en }))}</span><div class="lmrow">${gg.map(btn).join("")}</div></div>` : ""; }).join("")}${groups.filter(g => g.id !== "frequenti" && !MACRO.some(x => x[3].includes(g.id))).map(btn).join("")}`;
  gs.classList.add("macro");
  // sottogruppi nelle caselle (es. Ricevere, Costruire, Progredire…)
  const sub = SUBS[ui.lgroup]; const ts = $("#ltiles"); if (!sub || !ts) return;
  const tiles = new Map([...ts.querySelectorAll(".ltile")].map(el => [el.dataset.cat, el])); if (!tiles.size) return; const frag = document.createDocumentFragment(); const used = new Set();
  for (const [name, ids] of sub) { const els = ids.map(id => tiles.get(id)).filter(Boolean); if (!els.length) continue; const h = document.createElement("div"); h.className = "lsub"; h.textContent = t(name); frag.appendChild(h); els.forEach(el => { frag.appendChild(el); used.add(el); }); }
  const rest = [...tiles.values()].filter(el => !used.has(el)); if (rest.length) { const h = document.createElement("div"); h.className = "lsub"; h.textContent = t("Altre azioni"); frag.appendChild(h); rest.forEach(el => frag.appendChild(el)); }
  ts.innerHTML = ""; ts.appendChild(frag);
})(window.renderLive);

/* =========================================================
   CAMPI DEI MODULI: stessa altezza e stile (CSS) — nulla qui
   ========================================================= */

/* =========================================================
   GIOCATORE OBIETTIVO
   ========================================================= */
const FIT_Q = [["sys", "Si adatta al nostro sistema di gioco?", "Does he fit our system of play?"], ["fun", "Svolge la funzione che chiediamo nel ruolo?", "Does he perform the function we need in the role?"], ["pri", "Rispetta i principi di gioco dell'allenatore?", "Does he follow the coach's principles of play?"], ["ada", "Si adatta ai cambi durante la gara?", "Does he adapt to changes during the match?"], ["fasi", "È efficace in possesso, senza palla e nelle transizioni?", "Is he effective in and out of possession and in transitions?"], ["club", "Può crescere nel nostro club e nel nostro ambiente?", "Can he grow in our club and environment?"]];
const FIT_V = [["si", "Sì", "Yes", 1], ["parte", "In parte", "Partly", 0.5], ["no", "No", "No", 0]];
const DEC = [["conferma", "Confermare: procedere", "Confirm: go ahead", "good"], ["rivedere", "Serve un'altra visione", "Needs another viewing", "amber"], ["scarta", "Non fa per noi", "Not for us", "bad"]];
const SHARE = [["condiviso", "Condiviso con l'allenatore e lo staff", "Shared with the coach and staff", "good"], ["discutere", "Da discutere in riunione", "To discuss in a meeting", "amber"], ["diverso", "L'allenatore la pensa diversamente", "The coach sees it differently", "bad"]];
const AFTER = [["saluta", "Saluta compagni e avversari", "Greets team-mates and opponents"], ["allenatore", "Parla con l'allenatore", "Talks with the coach"], ["tifosi", "Ringrazia i tifosi", "Thanks the fans"], ["sereno", "Sereno dopo il risultato", "Calm after the result"], ["deluso", "Deluso ma composto", "Disappointed but composed"], ["nervoso", "Nervoso o polemico", "Tense or argumentative"], ["solo", "Si isola dal gruppo", "Isolates himself"], ["recupero", "Fa defaticamento con cura", "Cools down properly"]];
const fitScore = f => { if (!f || !f.q) return null; const v = FIT_Q.map(([k]) => (FIT_V.find(x => x[0] === f.q[k]) || [])[3]).filter(x => x != null); return v.length ? Math.round(mean(v) * 100) : null; };
function latestFit(pid) { const rows = [...S.matches.entries()].map(([mid, m]) => [mid, m, ((m.post || {}).fit || {})[pid]]).filter(x => x[2] && (x[2].dec || fitScore(x[2]) != null)).sort((a, b) => cmpTxt(b[1].date, a[1].date)); return rows[0] || null; }
const focusOf = m => m && m.focus && P(m.focus) ? m.focus : null;
const taskFor = (mid, pid) => [...S.tasks.entries()].find(([, x]) => x.matchId === mid && x.playerId === pid) || [...S.tasks.entries()].find(([, x]) => x.playerId === pid && x.status !== "done");
const idealsFor = pid => [...S.ideals.entries()].filter(([, x]) => (x.plan || []).some(c => c.pid === pid));
function setFocus(mid, pid) { const m = S.matches.get(mid); if (!m) return; const tg = (m.targets || []).filter(x => x !== pid); put("matches", mid, { ...m, focus: pid || "", targets: pid ? [pid, ...tg] : tg }); }
function focusOptions(sel) {
  const prio = new Set(); for (const x of S.tasks.values()) if (x.status !== "done" && x.playerId) prio.add(x.playerId); for (const x of S.ideals.values()) for (const c of (x.plan || [])) prio.add(c.pid);
  const pl = [...S.players.entries()].filter(([, p]) => !p.archived).sort((a, b) => cmpTxt(pname(a[1]), pname(b[1]))); const a = pl.filter(([id]) => prio.has(id)), b = pl.filter(([id]) => !prio.has(id));
  return `<option value="">— ${t("nessuno")} —</option>${a.length ? `<optgroup label="${t("Da incarichi e profili ideali")}">${a.map(([id, p]) => `<option value="${id}" ${sel === id ? "selected" : ""}>🎯 ${esc(pname(p))}${p.club ? " · " + esc(p.club) : ""}</option>`).join("")}</optgroup>` : ""}<optgroup label="${t("Tutti i giocatori")}">${b.map(([id, p]) => `<option value="${id}" ${sel === id ? "selected" : ""}>${esc(pname(p))}${p.club ? " · " + esc(p.club) : ""}</option>`).join("")}</optgroup>`;
}
// nuova partita / modifica: il giocatore obiettivo per primo
window.matchForm = (orig => function (id, presetDate) {
  orig(id, presetDate); const f = $("#mForm"); if (!f) return; const m = id ? S.matches.get(id) : null;
  f.insertAdjacentHTML("afterbegin", `<div class="full focusbox"><label class="f">🎯 ${t("Giocatore obiettivo (quello che vai a vedere)")}<select id="mFocus">${focusOptions(m ? m.focus : ui.presetFocus || "")}</select></label>${inlinePlayerForm("mFocus")}<p class="m">${t("Di solito osservi un solo giocatore, deciso prima con lo staff. Gli altri li aggiungi sotto, se servono.")}</p></div>`);
  ui.presetFocus = null; const sub = f.onsubmit;
  f.onsubmit = e => { const foc = $("#mFocus").value; sub(e); const mid = id || ui.matchId; if (mid && S.matches.get(mid)) { setFocus(mid, foc); if (foc && !id) { ui.mtab = "prima"; ui.focusP = foc; } render(true); } };
})(window.matchForm);
// banner dell'obiettivo in cima alla partita
function focusCard(id, m) {
  const pid = focusOf(m);
  if (!pid) return `<section class="panel focuscard empty"><div class="row between" style="flex-wrap:wrap;gap:8px"><div><b>🎯 ${t("Nessun giocatore obiettivo")}</b><p class="m">${t("Scegli chi vai a vedere: la partita, il registro e il report si concentrano su di lui.")}</p></div><div class="row"><select id="fcSel" aria-label="${t("Giocatore obiettivo")}">${focusOptions("")}</select><button class="btn sm" data-a="fcNew">+ ${t("Nuovo")}</button></div></div></section>`;
  const p = P(pid); const tk = taskFor(id, pid); const ids = idealsFor(pid); const pe = (m.events || []).filter(e => e.p === pid); const f = ((m.post || {}).fit || {})[pid]; const fs = fitScore(f); const dec = f && DEC.find(x => x[0] === f.dec);
  const plan = ids.map(([iid, x]) => { const c = x.plan.find(c => c.pid === pid); return `<button class="pill c-blue" data-a="openIdeal" data-id="${iid}">${t("Piano {r}", { r: c.rank })} · ${esc(x.name)}</button>`; }).join("");
  return `<section class="panel focuscard"><div class="fcrow">${avatar(p)}<div class="grow"><div class="m">🎯 ${t("Giocatore obiettivo")}${isMinor(p) ? ` · <span class="pill c-amber">${t("minorenne")}</span>` : ""}</div><div class="t big">${esc(pname(p))}</div><div class="m">${esc(roleL(mainRole(p)) || "")}${p.archetype ? " · " + esc(archL(p.archetype)) : ""}${p.club ? " · " + esc(p.club) : ""}${age(p) != null ? " · " + t("{n} anni", { n: age(p) }) : ""}</div>
    ${tk ? `<div class="m">📋 ${t("Incarico")}: ${esc(tk[1].what || "—")}${tk[1].by ? " · " + t("richiesto da {n}", { n: esc(staffName(tk[1].by)) }) : ""}</div>` : ""}${plan ? `<div class="chips" style="margin-top:4px">${plan}</div>` : ""}</div>
    <div class="fcstats"><div><b class="mono">${pe.length}</b><span>${t("azioni")}</span></div>${fs != null ? `<div><b class="mono">${fs}%</b><span>${t("idoneità")}</span></div>` : ""}${dec ? `<span class="pill c-${dec[3]}">${esc(L({ it: dec[1], en: dec[2] }))}</span>` : ""}</div></div>
   <div class="row fcbtns"><button class="btn sm pri" data-a="fcLive">${t("Osserva in partita")}</button><button class="btn sm" data-a="mtab" data-t="dopo">${t("Giudizio sull'obiettivo")}</button><button class="btn sm" data-a="openPlayer" data-id="${pid}">${t("Scheda")}</button><button class="btn sm ghost" data-a="fcChange">${t("Cambia")}</button></div></section>`;
}
window.matchPage = (orig => function (id) {
  const m = S.matches.get(id); const h = orig(id); const i = h.indexOf('<div class="tabnav') >= 0 ? h.indexOf('<div class="tabnav') : h.indexOf('<div class="tabs noprint">'); if (i < 0) return h;
  return h.slice(0, i) + focusCard(id, m) + h.slice(i);
})(window.matchPage);
document.addEventListener("change", e => { if (e.target && e.target.id === "fcSel" && ui.matchId) { setFocus(ui.matchId, e.target.value); ui.focusP = e.target.value || null; ui.liveP = e.target.value || ui.liveP; render(true); } });
Object.assign(A, {
  fcLive: () => { const m = S.matches.get(ui.matchId); ui.mtab = "live"; ui.liveP = m.focus; ui.focusP = m.focus; render(true); },
  fcChange: () => { const m = S.matches.get(ui.matchId); sheet(`<h2>🎯 ${t("Giocatore obiettivo")}</h2><label class="f">${t("Giocatore")}<select id="fcSel2">${focusOptions(m.focus)}</select></label>${inlinePlayerForm("fcSel2")}<div class="row end"><button class="btn" data-a="closeSheetBtn">${t("Annulla")}</button><button class="btn pri" id="fcOk">${t("Salva")}</button></div>`); $("#fcOk").onclick = () => { const v = $("#fcSel2").value; closeSheet(); setFocus(ui.matchId, v); ui.focusP = v || null; if (v) ui.liveP = v; render(true); }; },
  fcNew: () => A.fcChange()
});
// aprendo una partita con obiettivo, il «Durante» parte già in visione singola
A.openMatch = (orig => function (el) { orig(el); const m = S.matches.get(el.dataset.id); if (m && focusOf(m)) { ui.focusP = m.focus; ui.liveP = m.focus; if (m.status !== "vista") { ui.mtab = "prima"; } render(); } })(A.openMatch);
// incarico → la partita ha quel giocatore come obiettivo
window.linkTask = (orig => function (x) { orig(x); if (x.matchId && x.playerId) { const m = S.matches.get(x.matchId); if (m && !m.focus) setFocus(x.matchId, x.playerId); } })(window.linkTask);
// elenco partite: l'obiettivo in evidenza
window.matchPlayers = (orig => function (id, m) { const h = orig(id, m); const pid = focusOf(m); if (!pid) return h; const p = P(pid); const f = ((m.post || {}).fit || {})[pid]; const fs = fitScore(f);
  const chip = `<button type="button" class="mpc focus" data-a="openPlayer" data-id="${pid}" title="${t("Giocatore obiettivo")}">🎯 ${p.shirt ? `<b>${esc(p.shirt)}</b> ` : ""}${esc(p.last || pname(p))}${fs != null ? `<i class="mg">${fs}%</i>` : ""}</button>`;
  return h ? h.replace('<div class="mpl">', `<div class="mpl">${chip}`) : `<div class="mpl">${chip}</div>`; })(window.matchPlayers);
matchPlayers = window.matchPlayers;

/* ---------- PRIMA: arriva prima, osserva l'obiettivo ---------- */
const PRE_FOCUS = [["arrivo", "Arrivato in anticipo, distinta presa", "Arrived early, team sheet collected"], ["titolare", "Confermato titolare", "Confirmed in the starting XI"], ["ruolo", "Ruolo e posizione verificati", "Role and position checked"], ["riscaldamento", "Riscaldamento osservato", "Warm-up observed"], ["linguaggio", "Linguaggio del corpo annotato", "Body language noted"], ["video", "Video o diretta pronta (se serve)", "Video or stream ready (if needed)"]];
window.prePage = (orig => function (id, m) {
  const h = orig(id, m); const pid = focusOf(m); if (!pid) return h; const pre = m.pre || {}; const fp = (pre.focus || {}); const tk = taskFor(id, pid);
  return `<section class="panel"><h2>🎯 ${t("Prima della partita: {n}", { n: esc(pname(P(pid))) })}</h2><p class="sub small">${t("Arriva prima, prendi la distinta e guarda il giocatore già nel riscaldamento: dice molto su concentrazione e atteggiamento.")}</p>
   ${tk ? `<div class="banner info small">📋 ${t("Cosa osservare")}: ${esc(tk[1].what || "—")}</div>` : ""}
   <div class="chips" id="preFocus" style="margin-top:8px">${PRE_FOCUS.map(([k, it, en]) => `<button type="button" class="chip" data-pf="${k}" aria-pressed="${!!(fp.chk || {})[k]}">✓ ${esc(L({ it, en }))}</button>`).join("")}</div></section>` + h;
})(window.prePage);
document.addEventListener("click", e => { const b = e.target.closest && e.target.closest("[data-pf]"); if (!b || !ui.matchId) return; const m = S.matches.get(ui.matchId); const pre = clone(m.pre || {}); pre.focus = pre.focus || {}; pre.focus.chk = pre.focus.chk || {}; pre.focus.chk[b.dataset.pf] = !pre.focus.chk[b.dataset.pf]; b.setAttribute("aria-pressed", pre.focus.chk[b.dataset.pf]); put("matches", ui.matchId, { ...m, pre }); });

/* ---------- DOPO: è il giocatore giusto per noi? ---------- */
function fitPanel(id, m, pid) {
  const p = P(pid); const f = ((m.post || {}).fit || {})[pid] || {}; const fs = fitScore(f); const minor = isMinor(p);
  const seg = (k, opts, cur) => `<div class="seg" data-fit="${k}">${opts.map(([v, it, en]) => `<button type="button" data-v="${v}" aria-pressed="${cur === v}">${esc(L({ it, en }))}</button>`).join("")}</div>`;
  return `<section class="panel fitp" data-fitp="${pid}"><div class="row between"><h2>🎯 ${t("È il giocatore giusto per noi?")}</h2>${fs != null ? `<span class="pill ${fs >= 75 ? "c-good" : fs >= 50 ? "c-amber" : "c-bad"}">${t("Idoneità al nostro modello")}: ${fs}%</span>` : ""}</div>
   <p class="sub small">${t("Il talento rende solo nel posto giusto: valuta {n} rispetto al nostro sistema, all'idea dell'allenatore e al club, non in assoluto.", { n: esc(pname(p)) })}</p>
   <div class="fitq">${FIT_Q.map(([k, it, en]) => `<div class="fitr"><span>${esc(L({ it, en }))}</span>${seg("q." + k, FIT_V, (f.q || {})[k])}</div>`).join("")}</div>
   <div class="grid2" style="margin-top:10px"><div><div class="m fctl">${t("Decisione")}</div>${seg("dec", DEC, f.dec)}</div><div><div class="m fctl">${t("Con l'allenatore e lo staff")}</div>${seg("coach", SHARE, f.coach)}</div></div>
   <div style="margin-top:10px"><div class="m fctl">${t("Dopo il fischio finale")}${minor ? ` · <span class="pill c-amber">${t("giovane: conta molto l'aspetto mentale")}</span>` : ""}</div><div class="chips" data-fitc="after">${AFTER.map(([k, it, en]) => `<button type="button" class="chip" data-v="${k}" aria-pressed="${(f.after || []).includes(k)}">${esc(L({ it, en }))}</button>`).join("")}</div></div>
   <label class="f" style="margin-top:10px">${t("Motivazione in 2 righe (per la riunione)")}<textarea data-fitn="1" style="min-height:60px">${esc(f.note || "")}</textarea></label>
   <div class="row end" style="margin-top:8px"><button class="btn" data-a="fitMeet" data-id="${pid}">${t("Porta in riunione")}</button><button class="btn pri" data-a="fitSave" data-id="${pid}">${t("Salva il giudizio")}</button></div></section>`;
}
window.postPage = (orig => function (id, m) { const h = orig(id, m); const pid = focusOf(m); return pid ? fitPanel(id, m, pid) + h : h; })(window.postPage);
document.addEventListener("click", e => { const b = e.target.closest && e.target.closest("[data-fit] button, [data-fitc] .chip"); if (!b) return; const g = b.closest("[data-fit]"); if (g) { const on = b.getAttribute("aria-pressed") === "true"; g.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", "false")); if (!on) b.setAttribute("aria-pressed", "true"); } else b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") !== "true"); });
function readFit(pid) { const box = $(`[data-fitp="${pid}"]`); if (!box) return null; const f = { q: {} }; box.querySelectorAll("[data-fit]").forEach(g => { const b = g.querySelector('[aria-pressed="true"]'); const k = g.dataset.fit; const v = b ? b.dataset.v : ""; if (k.startsWith("q.")) f.q[k.slice(2)] = v; else f[k] = v; }); f.after = [...box.querySelectorAll('[data-fitc="after"] .chip[aria-pressed="true"]')].map(x => x.dataset.v); f.note = box.querySelector("[data-fitn]").value.trim(); f.date = today(); return f; }
Object.assign(A, {
  fitSave: el => { const pid = el.dataset.id; const f = readFit(pid); const m = S.matches.get(ui.matchId); const post = clone(m.post || {}); post.fit = post.fit || {}; post.fit[pid] = f; put("matches", ui.matchId, { ...m, post });
    const tk = taskFor(ui.matchId, pid); if (tk && tk[1].status !== "done" && f.dec) put("tasks", tk[0], { ...tk[1], status: "done", result: f.dec }); toast(t("Giudizio salvato")); render(true); },
  fitMeet: el => { const pid = el.dataset.id; const f = readFit(pid); const m = S.matches.get(ui.matchId); const post = clone(m.post || {}); post.fit = post.fit || {}; post.fit[pid] = f; put("matches", ui.matchId, { ...m, post });
    ui.meetPreset = { players: [pid], agenda: t("Esito della visione di {n} ({h} – {a}): {d}", { n: pname(P(pid)), h: m.home, a: m.away, d: f.note || "" }), idealId: (idealsFor(pid)[0] || [])[0] || "" }; meetSheet(null, today()); }
});

/* ---------- scheda Report del giocatore: idoneità al nostro modello ---------- */
window.reportTab = (orig => function (id, p) {
  const h = orig(id, p); const lf = latestFit(id); if (!lf) return h; const [mid, m, f] = lf; const fs = fitScore(f); const dec = DEC.find(x => x[0] === f.dec), sh = SHARE.find(x => x[0] === f.coach);
  const blk = `<div class="rfit"><h3>🎯 ${t("Idoneità al nostro modello")}${fs != null ? ` · ${fs}%` : ""}</h3><div class="m">${t("Ultima visione")}: ${fmtDate(m.date)} · ${esc(m.home)} – ${esc(m.away)}</div><div class="row" style="margin-top:4px">${dec ? `<span class="pill c-${dec[3]}">${esc(L({ it: dec[1], en: dec[2] }))}</span>` : ""}${sh ? `<span class="pill c-${sh[3]}">${esc(L({ it: sh[1], en: sh[2] }))}</span>` : ""}</div>${f.note ? `<p class="small" style="margin-top:6px">${esc(f.note)}</p>` : ""}</div>`;
  return h.replace('<div class="rsign">', blk + '<div class="rsign">');
})(window.reportTab);

/* =========================================================
   PROFILI IDEALI: piano A, B, C · collegati allo staff
   ========================================================= */
const RANKS = ["A", "B", "C"];
window.idealPage = (orig => function (id) {
  const h = orig(id); const x = S.ideals.get(id); const plan = (x.plan || []).filter(c => P(c.pid)).sort((a, b) => RANKS.indexOf(a.rank) - RANKS.indexOf(b.rank));
  const meets = [...S.meetings.entries()].filter(([, mt]) => mt.idealId === id).sort((a, b) => cmpTxt(b[1].date, a[1].date));
  const card = c => { const p = P(c.pid); const cp = idealCompat(c.pid, x); const lf = latestFit(c.pid); const fs = lf ? fitScore(lf[2]) : null;
    return `<div class="plan r-${c.rank}"><div class="prk">${typeof PLAN_L !== "undefined" && PLAN_L[c.rank] ? t(PLAN_L[c.rank]) : t("Piano {r}", { r: c.rank })}</div><div class="item click" data-a="openPlayer" data-id="${c.pid}" style="border:0;padding:0">${avatar(p)}<div class="grow"><div class="t">${esc(pname(p))}${exB(p)}</div><div class="m">${esc(roleL(mainRole(p)) || "")}${p.club ? " · " + esc(p.club) : ""}${age(p) != null ? " · " + t("{n} anni", { n: age(p) }) : ""}</div></div></div>
     <div class="row small" style="gap:6px"><span class="pill ${pctClass(cp.pct)}">${t("aderenza")} ${cp.pct}%</span><span class="pill c-grey">${t("rating")} ${f1(profile(c.pid).rating)}</span>${fs != null ? `<span class="pill c-blue">${t("idoneità")} ${fs}%</span>` : ""}</div>${c.note ? `<p class="small">${esc(c.note)}</p>` : ""}
     <div class="row"><select data-prank="${c.pid}" aria-label="${t("Piano")}">${RANKS.map(r => `<option ${r === c.rank ? "selected" : ""}>${r}</option>`).join("")}</select><button class="btn sm ghost" data-a="planRm" data-id="${c.pid}">✕</button></div></div>`; };
  const panel = `<section class="panel"><div class="row between"><div><h2>${t("Piano A, B e C")}</h2><p class="sub small">${t("Il primo nome e le alternative se la trattativa non va: decisi con lo staff.")}</p></div><button class="btn sm pri" data-a="planAdd">+ ${t("Aggiungi candidato")}</button></div>
    <div class="plangrid" style="margin-top:8px">${plan.map(card).join("") || `<div class="empty">${t("Nessun candidato: aggiungi il piano A e le alternative B e C.")}</div>`}</div></section>
   <section class="panel"><div class="row between"><div><h2>${t("Discusso con lo staff")}</h2><p class="sub small">${t("Riunioni in cui avete definito o aggiornato questo profilo.")}</p></div><button class="btn sm" data-a="planMeet">+ ${t("Riunione su questo profilo")}</button></div>
    <div class="list" style="margin-top:6px">${meets.map(([mid, mt]) => meetingItem(mid, mt)).join("") || `<div class="empty">${t("Nessuna riunione collegata.")}</div>`}</div>${plan.length >= 2 ? `<div class="row end" style="margin-top:8px"><button class="btn sm" data-a="planCompare">${t("Confronta i candidati")}</button></div>` : ""}</section>`;
  const k = h.indexOf('<div class="split">'); return k > 0 ? h.slice(0, k) + panel + h.slice(k) : h + panel;
})(window.idealPage);
document.addEventListener("change", e => { const s = e.target.closest && e.target.closest("[data-prank]"); if (!s || !ui.idealId) return; const x = S.ideals.get(ui.idealId); put("ideals", ui.idealId, { ...x, plan: (x.plan || []).map(c => c.pid === s.dataset.prank ? { ...c, rank: s.value } : c) }); render(true); });
Object.assign(A, {
  planAdd: () => { const x = S.ideals.get(ui.idealId); const used = new Set((x.plan || []).map(c => c.pid)); const free = RANKS.find(r => !(x.plan || []).some(c => c.rank === r)) || "C";
    const rk = idealRanking(x).filter(([pid]) => !used.has(pid)).slice(0, 40);
    sheet(`<h2>${t("Aggiungi candidato")}</h2><div class="fgrid"><label class="f">${t("Giocatore")}<select id="paP"><option value="">—</option>${rk.map(([pid, p, c]) => `<option value="${pid}">${esc(pname(p))} · ${c.pct}%</option>`).join("")}${[...S.players.entries()].filter(([pid]) => !used.has(pid) && !rk.some(r => r[0] === pid)).map(([pid, p]) => `<option value="${pid}">${esc(pname(p))}</option>`).join("")}</select></label><label class="f">${t("Piano")}<select id="paR">${RANKS.map(r => `<option ${r === free ? "selected" : ""}>${r}</option>`).join("")}</select></label><label class="f full">${t("Perché (in una riga)")}<input type="text" id="paN"></label></div>${inlinePlayerForm("paP")}
     <div class="row end"><button class="btn" data-a="closeSheetBtn">${t("Annulla")}</button><button class="btn pri" id="paOk">${t("Aggiungi")}</button></div>`, true);
    $("#paOk").onclick = () => { const pid = $("#paP").value; if (!pid) { toast(t("Scegli prima il giocatore")); return; } closeSheet(); put("ideals", ui.idealId, { ...x, plan: [...(x.plan || []), { pid, rank: $("#paR").value, note: $("#paN").value.trim() }] }); render(true); }; },
  planRm: el => { const x = S.ideals.get(ui.idealId); put("ideals", ui.idealId, { ...x, plan: (x.plan || []).filter(c => c.pid !== el.dataset.id) }); render(true); },
  planMeet: () => { const x = S.ideals.get(ui.idealId); ui.meetPreset = { idealId: ui.idealId, players: (x.plan || []).map(c => c.pid), title: t("Profilo ideale: {n}", { n: x.name }), agenda: t("Confermare il profilo e l'ordine dei candidati (piano A, B, C).") }; meetSheet(null, today()); },
  planCompare: () => { const x = S.ideals.get(ui.idealId); ui.cmp = (x.plan || []).sort((a, b) => RANKS.indexOf(a.rank) - RANKS.indexOf(b.rank)).map(c => c.pid).slice(0, 4); ui.cmpIdeal = ui.idealId; put("settings", "compare", { ids: [...ui.cmp] }); resetSub(); ui.idealId = null; go("confronto"); }
});
// riunioni: profilo ideale discusso, giocatori preimpostati
window.meetSheet = (orig => function (id, date) {
  orig(id, date); const pre = ui.meetPreset; ui.meetPreset = null; const mt = id ? S.meetings.get(id) : {};
  const t0 = $("#mtT"); if (!t0) return;
  t0.closest("label").insertAdjacentHTML("afterend", `<label class="f full">⭐ ${t("Profilo ideale discusso")}<select id="mtIdeal"><option value="">—</option>${[...S.ideals.entries()].filter(([, x]) => !x.archived).map(([iid, x]) => `<option value="${iid}" ${(pre ? pre.idealId : mt.idealId) === iid ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select></label>`);
  if (pre) { if (pre.title && !t0.value) t0.value = pre.title; if (pre.agenda) $("#mtA").value = pre.agenda; for (const pid of (pre.players || [])) { const b = $(`#mtPl .chip[data-v="${pid}"]`); if (b) b.setAttribute("aria-pressed", "true"); } }
  const sv = $("#mtSave"); const old = sv.onclick; sv.onclick = () => { const ideal = $("#mtIdeal").value; old(); const nid = id || ui.meetId; const m2 = S.meetings.get(nid); if (m2 && (m2.idealId || "") !== ideal) put("meetings", nid, { ...m2, idealId: ideal }); };
})(window.meetSheet);
window.meetingPage = (orig => function (id) { const h = orig(id); const mt = S.meetings.get(id); const x = mt && mt.idealId && S.ideals.get(mt.idealId); if (!x) return h;
  const plan = (x.plan || []).filter(c => P(c.pid)).sort((a, b) => RANKS.indexOf(a.rank) - RANKS.indexOf(b.rank));
  return h + `<section class="panel"><div class="row between"><h2>⭐ ${esc(x.name)}</h2><button class="btn sm" data-a="openIdeal" data-id="${mt.idealId}">${t("Apri il profilo ideale")}</button></div><div class="list" style="margin-top:6px">${plan.map(c => playerItem(c.pid, P(c.pid), `<span class="pill c-blue">${t("Piano {r}", { r: c.rank })}</span>`)).join("") || `<div class="empty">${t("Nessun candidato.")}</div>`}</div></section>`; })(window.meetingPage);
// incarico: collegato a un profilo ideale
window.taskSheet = (orig => function (id, preset) {
  orig(id, preset); const x = id ? S.tasks.get(id) : (preset || {}); const s = $("#tkW"); if (!s) return;
  s.closest("label").insertAdjacentHTML("beforebegin", `<label class="f">⭐ ${t("Per il profilo ideale")}<select id="tkIdeal"><option value="">—</option>${[...S.ideals.entries()].filter(([, i]) => !i.archived).map(([iid, i]) => `<option value="${iid}" ${x.idealId === iid ? "selected" : ""}>${esc(i.name)}</option>`).join("")}</select></label>`);
  const sv = $("#tkSave"); const old = sv.onclick; sv.onclick = () => { const ideal = $("#tkIdeal").value; const pid = $("#tkP").value; const before = new Set(S.tasks.keys()); old(); const tid = id || [...S.tasks.keys()].find(k => !before.has(k)); const tk = tid && S.tasks.get(tid); if (tk && (tk.idealId || "") !== ideal) put("tasks", tid, { ...tk, idealId: ideal }); if (ideal && pid) { const i = S.ideals.get(ideal); if (i && !(i.plan || []).some(c => c.pid === pid)) put("ideals", ideal, { ...i, plan: [...(i.plan || []), { pid, rank: RANKS[Math.min(2, (i.plan || []).length)], note: "" }] }); } };
})(window.taskSheet);

/* =========================================================
   CONFRONTO PERSONALIZZABILE
   ========================================================= */
const CMP_MODES = [["aree", "Aree"], ["param", "Parametri scelti"], ["dati", "Dati per 90'"], ["zone", "Zone del campo"], ["come", "Come lo fa"]];
R.confronto = (orig => () => {
  const h = orig(); ui.cmp = ui.cmp.filter(id => P(id)); if (!ui.cmp.length) return h + cmpIdealHint();
  const mode = ui.cmpMode || "param"; const cfg = S.settings.get("compare") || {}; const ideal = ui.cmpIdeal && S.ideals.get(ui.cmpIdeal) ? S.ideals.get(ui.cmpIdeal) : null; const colors = ["var(--accent)", "var(--amber)", "var(--bad)", "var(--blue)"];
  const selP = ui.cmp.map(id => [id, P(id), profile(id)]);
  const top = `<section class="panel"><div class="row between" style="flex-wrap:wrap;gap:8px"><h2>${t("Confronto personalizzato")}</h2><label class="sortsel"><span>⭐</span><select id="cmpIdeal" aria-label="${t("Profilo ideale")}"><option value="">${t("Senza profilo ideale")}</option>${[...S.ideals.entries()].filter(([, x]) => !x.archived).map(([iid, x]) => `<option value="${iid}" ${ui.cmpIdeal === iid ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select></label></div>
   ${ideal ? `<div class="row" style="margin-top:6px;gap:6px">${selP.map(([id, p], i) => { const c = idealCompat(id, ideal); const pl = (ideal.plan || []).find(x => x.pid === id); return `<span class="pill" style="border-left:4px solid ${colors[i]}">${esc(p.last || pname(p))} · ${c.pct}%${pl ? " · " + t("Piano {r}", { r: pl.rank }) : ""}</span>`; }).join("")}${(ideal.plan || []).length ? `<button class="btn sm" data-a="cmpPlan">${t("Metti a confronto piano A, B, C")}</button>` : ""}</div>` : ""}
   <div class="seg cmpseg" style="margin-top:10px">${CMP_MODES.map(([k, n]) => `<button data-a="cmpMode" data-v="${k}" aria-pressed="${mode === k}">${t(n)}</button>`).join("")}</div>
   <div style="margin-top:12px">${cmpBody(mode, selP, colors, ideal, cfg)}</div></section>`;
  const i = h.indexOf('<div class="grid2">'); return i > 0 ? h.slice(0, i) + top + h.slice(i) : h + top;
})(R.confronto);
function cmpIdealHint() { const ids = [...S.ideals.entries()].filter(([, x]) => (x.plan || []).length >= 2); return ids.length ? `<section class="panel"><h2>${t("Parti da un profilo ideale")}</h2><div class="list">${ids.map(([iid, x]) => `<div class="item click" data-a="cmpFromIdeal" data-id="${iid}"><div class="grow t">⭐ ${esc(x.name)}</div><span class="m">${t("{n} candidati", { n: x.plan.length })}</span></div>`).join("")}</div></section>` : ""; }
function cmpBody(mode, selP, colors, ideal, cfg) {
  const legend = `<div class="legend">${selP.map(([, p, pr], i) => `<span><i style="background:${colors[i]}"></i>${esc(pname(p))} · ${f1(pr.rating)}</span>`).join("")}${ideal ? `<span><i style="background:transparent;border:2px dashed var(--muted)"></i>${t("minimo del profilo")}</span>` : ""}</div>`;
  if (mode === "param") {
    const keys = (cfg.params && cfg.params.length ? cfg.params : ideal ? (ideal.req || []).map(r => r.key) : []).slice(0, 14);
    const all = Cfg.get().areas.filter(a => !a.hidden).flatMap(a => a.params.filter(x => !x.hidden).map(x => [a.id + "|" + x.id, L(a), L(x)]));
    const lab = k => { const r = all.find(x => x[0] === k); return r ? r[2] : k; };
    const series = selP.map(([, , pr]) => ({ vals: keys.map(k => { const [a, x] = k.split("|"); return (pr.attr[a] || {})[x] ?? null; }) }));
    if (ideal && keys.length) series.push({ vals: keys.map(k => { const r = (ideal.req || []).find(q => q.key === k); return r ? +r.min : null; }) });
    return `<details class="cmpick" ${keys.length ? "" : "open"}><summary>${t("Scegli i parametri da confrontare ({n})", { n: keys.length })}</summary><input type="search" class="chipq" data-for="cmpParams" placeholder="${t("Filtra")}" style="margin:6px 0"><div class="chips" id="cmpParams" style="max-height:200px;overflow:auto">${all.map(([k, a, n]) => `<button type="button" class="chip" data-cp="${esc(k)}" data-n="${esc((a + " " + n).toLowerCase())}" aria-pressed="${keys.includes(k)}">${esc(n)} <small class="m">${esc(a)}</small></button>`).join("")}</div><div class="row end" style="margin-top:6px">${ideal ? `<button class="btn sm ghost" data-a="cmpUseIdeal">${t("Usa i requisiti del profilo ideale")}</button>` : ""}<button class="btn sm pri" data-a="cmpSaveParams">${t("Applica")}</button></div></details>
     ${keys.length >= 3 ? radar(series, keys.map(lab), [...colors.slice(0, selP.length), "var(--muted)"]) + legend : keys.length ? "" : `<p class="m">${t("Scegli almeno 3 parametri (o un profilo ideale) per vedere il radar.")}</p>`}
     ${keys.length ? `<div class="tw" style="margin-top:8px"><table><thead><tr><th>${t("Parametro")}</th>${ideal ? `<th class="n">${t("Minimo")}</th>` : ""}${selP.map(([, p]) => `<th class="n">${esc(p.last || pname(p))}</th>`).join("")}</tr></thead><tbody>${keys.map(k => { const [a, x] = k.split("|"); const vs = selP.map(([, , pr]) => (pr.attr[a] || {})[x] ?? null); const mx = Math.max(...vs.filter(v => v != null)); const r = ideal && (ideal.req || []).find(q => q.key === k);
       return `<tr><td>${esc(lab(k))}</td>${ideal ? `<td class="n m">${r ? f1(+r.min) : "–"}</td>` : ""}${vs.map(v => `<td class="n" style="${v != null && v === mx && selP.length > 1 ? "color:var(--accent);font-weight:700" : ""}${r && v != null && v < +r.min ? ";text-decoration:underline wavy var(--bad)" : ""}">${f1(v)}</td>`).join("")}</tr>`; }).join("")}</tbody></table></div>` : ""}`;
  }
  if (mode === "dati") { const ds = selP.map(([id]) => playerData(id)); const f2 = v => (Math.round(v * 100) / 100).toLocaleString(Prefs.lang); return `<div class="tw"><table><thead><tr><th>${t("Metrica")}</th>${selP.map(([, p]) => `<th class="n">${esc(p.last || pname(p))}</th>`).join("")}</tr></thead><tbody><tr><td>${t("Minuti osservati")}</td>${ds.map(d => `<td class="n">${d.mins}</td>`).join("")}</tr><tr><td>${t("Azioni registrate")}</td>${ds.map(d => `<td class="n">${d.ev.length}</td>`).join("")}</tr><tr><td>${t("Voto dai dati registrati")}</td>${selP.map(([id]) => `<td class="n">${f1(dataRating(id).rating)}</td>`).join("")}</tr>${MX.map(([k, l]) => { const vs = ds.map(d => d.p90[k]); const best = k === "loss" ? Math.min(...vs) : Math.max(...vs); return `<tr><td>${esc(t(l))}</td>${vs.map(v => `<td class="n" style="${v === best && selP.length > 1 && v ? "color:var(--accent);font-weight:700" : ""}">${f2(v)}</td>`).join("")}</tr>`; }).join("")}</tbody></table></div><p class="m" style="margin-top:6px">${t("Per 90 minuti, solo dalle partite che hai visto e dalle azioni che hai registrato.")}</p>`; }
  if (mode === "zone") return `<div class="cmpzones">${selP.map(([id, p], i) => { const evs = playerData(id).ev; HEATEV["c" + id] = evs.filter(e => e.z); return `<div><div class="row" style="gap:6px"><i class="gdot" style="background:${colors[i]}"></i><b>${esc(pname(p))}</b></div>${evs.some(e => e.z) ? `<div class="pitchbox">${heatmapSVG(evs.filter(e => e.z).map(e => e.z), { key: "c" + id })}</div><p class="m">${t("{n} azioni con zona", { n: evs.filter(e => e.z).length })}</p>` : `<p class="m">${t("Nessuna azione con zona.")}</p>`}</div>`; }).join("")}</div>`;
  if (mode === "come") return `<div class="cmpzones">${selP.map(([id, p], i) => `<div><div class="row" style="gap:6px"><i class="gdot" style="background:${colors[i]}"></i><b>${esc(pname(p))}</b></div>${howPanel(id).replace(/<section class="panel">|<\/section>/g, "").replace(/<h2>[^<]*<\/h2>/, "")}</div>`).join("")}</div>`;
  const areas = Cfg.get().areas.filter(a => !a.hidden && !a.gk);
  return `${radar(selP.map(([, , pr]) => ({ vals: areas.map(a => pr.area[a.id]) })), areas.map(a => L(a)), colors)}${legend}`;
}
document.addEventListener("click", e => { const b = e.target.closest && e.target.closest("[data-cp]"); if (b) b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") !== "true"); });
document.addEventListener("input", e => { const q = e.target.closest && e.target.closest(".chipq[data-for=cmpParams]"); if (q) { const v = q.value.toLowerCase(); $$("#cmpParams .chip").forEach(x => x.hidden = !x.dataset.n.includes(v)); } });
document.addEventListener("change", e => { if (e.target && e.target.id === "cmpIdeal") { ui.cmpIdeal = e.target.value || null; render(true); } });
Object.assign(A, {
  cmpMode: el => { ui.cmpMode = el.dataset.v; render(true); },
  cmpSaveParams: () => { const ks = $$("#cmpParams .chip[aria-pressed=true]").map(b => b.dataset.cp); put("settings", "compare", { ...(S.settings.get("compare") || {}), ids: [...ui.cmp], params: ks }); render(true); },
  cmpUseIdeal: () => { const x = S.ideals.get(ui.cmpIdeal); if (!x) return; put("settings", "compare", { ...(S.settings.get("compare") || {}), ids: [...ui.cmp], params: (x.req || []).map(r => r.key) }); render(true); },
  cmpPlan: () => { const x = S.ideals.get(ui.cmpIdeal); ui.cmp = (x.plan || []).slice().sort((a, b) => RANKS.indexOf(a.rank) - RANKS.indexOf(b.rank)).map(c => c.pid).filter(P).slice(0, 4); put("settings", "compare", { ...(S.settings.get("compare") || {}), ids: [...ui.cmp] }); render(true); },
  cmpFromIdeal: el => { ui.cmpIdeal = el.dataset.id; A.cmpPlan(); }
});

/* =========================================================
   DIARIO DELLE ATTIVITÀ
   ========================================================= */
const Activity = {
  buf: [], quiet: false, t: null, max: 400,
  list() { return ((S.settings.get("activity") || {}).items) || []; },
  label(coll, o) { if (!o) return ""; return coll === "players" ? pname(o) : coll === "matches" ? `${o.home || "?"} – ${o.away || "?"}` : coll === "evals" ? pname(P(o.playerId)) + (o.home ? ` (${o.home} – ${o.away})` : "") : o.name || o.title || o.what || ""; },
  rec(coll, id, op, o) {
    if (this.quiet || !App.unlocked || !["players", "matches", "evals", "lists", "meetings", "tasks", "ideals", "staff", "lineups", "todos", "notes"].includes(coll)) return;
    const now = Date.now(); const lab = this.label(coll, o); const all = this.buf.concat(this.list()); const last = all.find(x => x.c === coll && x.id === id);
    if (last && op === "u" && now - last.at < 90000 && last.op !== "d") { last.at = now; last.n = (last.n || 1) + 1; last.l = lab || last.l; } else this.buf.unshift({ at: now, c: coll, id, op, l: lab, ex: !!(o && o.example) });
    clearTimeout(this.t); this.t = setTimeout(() => this.flush(), 1200);
  },
  flush() { if (!App.unlocked || !this.buf.length) return; const items = this.buf.concat(this.list().filter(x => !this.buf.includes(x))).sort((a, b) => b.at - a.at).slice(0, this.max); this.buf = []; S.settings.set("activity", { items, _t: Date.now() }); Store.write("settings", "activity"); }
};
window.put = (orig => function (coll, id, v, keepT) { const had = S[coll] && S[coll].has(id); const r = orig(coll, id, v, keepT); if (v) Activity.rec(coll, id, had ? "u" : "c", v); return r; })(window.put);
window.del = (orig => function (coll, id, noTomb) { const o = S[coll] && S[coll].get(id); const r = orig(coll, id, noTomb); if (o) Activity.rec(coll, id, "d", o); return r; })(window.del);
Examples.load = (orig => function (silent) { Activity.quiet = true; let r; try { r = orig.call(this, silent); } finally { Activity.quiet = false; } return r; })(Examples.load);
const ACT_KIND = { players: ["Giocatore", "giocatori"], matches: ["Partita", "partite"], evals: ["Report", "report"], lists: ["Lista", "liste"], meetings: ["Riunione", "staff"], tasks: ["Incarico", "staff"], ideals: ["Profilo ideale", "profili"], staff: ["Contatto", "staff"], lineups: ["Squadra ombra", "squadre"], todos: ["Impegno", "calendario"], notes: ["Nota", "note"] };
const ACT_OP = { c: ["Creazione", "➕"], u: ["Modifica", "✎"], d: ["Eliminazione", "🗑"] };
function activityFeed() {
  const f = ui.actF || ""; const items = Activity.buf.concat(Activity.list()).filter(x => !f || (f === "staff" ? ["meetings", "tasks", "staff", "ideals"].includes(x.c) : x.c === f)).slice(0, 60);
  const day = ts => new Date(ts).toISOString().slice(0, 10); let cur = ""; const fmtT = ts => new Date(ts).toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit" });
  return `<section class="panel"><div class="row between" style="flex-wrap:wrap;gap:8px"><div><h2>${t("Diario delle attività")}</h2><p class="sub small">${t("Si aggiorna da solo mentre lavori: giocatori, partite, report, liste, riunioni e incarichi.")}</p></div>
   <div class="seg">${[["", "Tutto"], ["players", "Giocatori"], ["matches", "Partite"], ["evals", "Report"], ["staff", "Staff"]].map(([k, n]) => `<button data-a="actF" data-v="${k}" aria-pressed="${f === k}">${t(n)}</button>`).join("")}</div></div>
   <div class="feed">${items.map(x => { const d = day(x.at); const hd = d !== cur ? (cur = d, `<div class="fday">${fmtDate(d)}${d === today() ? " · " + t("oggi") : ""}</div>`) : ""; const k = ACT_KIND[x.c] || [x.c]; const op = ACT_OP[x.op] || ACT_OP.u; const alive = x.op !== "d" && S[x.c] && S[x.c].has(x.id);
     return hd + `<div class="fitem ${alive ? "click" : ""}" ${alive ? `data-a="actOpen" data-c="${x.c}" data-id="${x.id}"` : ""}><span class="fic">${op[1]}</span><span class="fti mono">${fmtT(x.at)}</span><span class="grow"><span class="m">${t(op[0])} ·</span> <b>${esc(t(k[0]))}</b>: ${esc(x.l || "—")}${x.n > 1 ? ` <span class="m">(${t("{n} modifiche", { n: x.n })})</span>` : ""}${x.ex ? ` <span class="pill c-grey">${t("Esempio")}</span>` : ""}</span></div>`; }).join("") || `<div class="empty">${t("Ancora nessuna attività: inizia a lavorare e qui vedrai cosa hai fatto.")}</div>`}</div></section>`;
}
R.attivita = (orig => () => { const h = orig(); const i = h.indexOf("</div></div>", h.indexOf('<div class="head">')); return i > 0 ? h.slice(0, i + 12) + activityFeed() + h.slice(i + 12) : activityFeed() + h; })(R.attivita);
Object.assign(A, {
  actF: el => { ui.actF = el.dataset.v; render(true); },
  actOpen: el => { const c = el.dataset.c, id = el.dataset.id; closeSheet(); resetSub();
    if (c === "players") go("giocatori", { playerId: id, ptab: "profilo" }); else if (c === "matches") go("partite", { matchId: id, mtab: "registro" }); else if (c === "evals") A.openEvalPlayer({ dataset: { id } }); else if (c === "lists") { ui.listId = id; go("liste"); } else if (c === "ideals") go("profili", { idealId: id }); else if (c === "meetings") A.openMeet({ dataset: { id } }); else if (c === "tasks") { ui.stTab = "tasks"; go("staff"); } else if (c === "lineups") { ui.lineupId = id; go("squadre"); } else go("staff"); }
});
// squadre ombra: spiegazione chiara
R.squadre = (orig => () => orig().replace(/(<h1>[^<]*<\/h1>)/, `$1`) + `<section class="panel help"><h3>${t("A cosa serve la squadra ombra?")}</h3><p class="small">${t("È la squadra che proporresti al club: per ogni posizione del modulo il titolare che hai scelto e le alternative (piano B e C). Ti aiuta a vedere dove la rosa è coperta e dove manca qualcuno, l'età media e il rating medio, e a presentare il tuo lavoro al direttore sportivo in un colpo d'occhio.")}</p></section>`)(R.squadre);

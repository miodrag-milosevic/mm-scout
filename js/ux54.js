"use strict";
/* =========================================================
   MM Scout 5.4 — esperienza d'uso
   · elenco partite con i giocatori visti e interessanti
   · ordinamento di giocatori, partite, report e liste
   · banner «Modifica salvata — Annulla / Conferma» al posto
     delle frecce fisse in alto
   · frecce ‹ › per le schede e per scorrere giocatori/partite
   · firma digitale in fondo a valutazioni, partite, giocatori
   · elimina ovunque (con possibilità di annullare)
   · formazione iniziale e fasi di gioco della partita
   · accesso più semplice, bandiere e tema anche al login,
     cambio profilo scout, piè di pagina
   ========================================================= */
Object.assign(POS_CODES, { SP: ["SS", "HS", "DN"], F9: ["F9", "F9", "L9"] });
const ROLE_CODE = { "Portiere": "POR", "Difensore centrale": "DC", "Terzino destro": "TD", "Terzino sinistro": "TS", "Quinto destro": "QD", "Quinto sinistro": "QS", "Mediano": "MED", "Regista": "REG", "Centrocampista centrale": "CC", "Mezzala": "MEZ", "Trequartista": "TRQ", "Ala destra": "AD", "Ala sinistra": "AS", "Seconda punta": "SP", "Punta centrale": "PC", "Falso 9": "F9" };
const roleCode = r => posCode(ROLE_CODE[r] || (String(roleL(r) || r || "?").split(/\s+/).map(x => x[0]).join("").slice(0, 3).toUpperCase()));

/* =========================================================
   ORDINAMENTO
   ========================================================= */
ui.mf.sort = ui.mf.sort || "auto"; ui.rf.sort = ui.rf.sort || "date"; ui.lf = ui.lf || { p: "", g: "", o: "", h: "" }; ui.lsort = ui.lsort || { lists: "order", players: "name" };
const SORTS = {
  "pf.sort": [["rating", "Rating"], ["name", "Nome (A-Z)"], ["last", "Cognome (A-Z)"], ["age", "Età"], ["club", "Club (A-Z)"], ["verdict", "Giudizio"], ["recent", "Ultima valutazione"], ["created", "Inseriti di recente"], ["contract", "Scadenza contratto"]],
  "mf.sort": [["auto", "Prossime e ultime viste"], ["date_desc", "Data: più recenti"], ["date_asc", "Data: meno recenti"], ["team", "Squadra (A-Z)"], ["comp", "Competizione (A-Z)"], ["actions", "Più azioni registrate"], ["players", "Più giocatori osservati"]],
  "rf.sort": [["date", "Più recenti"], ["date_asc", "Meno recenti"], ["rating", "Rating più alto"], ["rating_asc", "Rating più basso"], ["name", "Giocatore (A-Z)"], ["match", "Partita (A-Z)"]],
  "lsort.lists": [["order", "Ordine personale"], ["name", "Nome (A-Z)"], ["date", "Create di recente"], ["count", "Più giocatori"]],
  "lsort.players": [["name", "Nome (A-Z)"], ["last", "Cognome (A-Z)"], ["rating", "Rating"], ["age", "Età"], ["role", "Ruolo"], ["recent", "Ultima valutazione"]]
};
function sortSel(key, label) { const [o, f] = key.split("."); const cur = ui[o][f]; return `<label class="sortsel"><span>${label || t("Ordina")}</span><select data-sortk="${key}" aria-label="${t("Ordina")}">${SORTS[key].map(([k, n]) => `<option value="${k}" ${cur === k ? "selected" : ""}>${esc(t(n))}</option>`).join("")}</select></label>`; }
document.addEventListener("change", e => { const s = e.target.closest && e.target.closest("select[data-sortk]"); if (!s) return; const [o, f] = s.dataset.sortk.split("."); ui[o][f] = s.value; render(true); });
const cmpTxt = (a, b) => String(a || "").localeCompare(String(b || ""), Prefs.lang, { sensitivity: "base" });
const createdAt = o => o.createdOn || (o._t ? new Date(o._t).toISOString() : "") || o.created || "";
function sortPlayers(rows, k) {
  const vIdx = id => { const i = Cfg.get().verdicts.findIndex(v => v.id === id); return i < 0 ? 99 : i; };
  const S0 = { last: (a, b) => cmpTxt(a[1].last, b[1].last) || cmpTxt(a[1].first, b[1].first), club: (a, b) => cmpTxt(a[1].club, b[1].club) || cmpTxt(pname(a[1]), pname(b[1])), verdict: (a, b) => vIdx(a[1].verdict) - vIdx(b[1].verdict) || (profile(b[0]).rating ?? -1) - (profile(a[0]).rating ?? -1), created: (a, b) => cmpTxt(createdAt(b[1]), createdAt(a[1])), name: (a, b) => cmpTxt(pname(a[1]), pname(b[1])), rating: (a, b) => (profile(b[0]).rating ?? -1) - (profile(a[0]).rating ?? -1), age: (a, b) => (age(a[1]) ?? 99) - (age(b[1]) ?? 99), recent: (a, b) => cmpTxt(profile(b[0]).last, profile(a[0]).last), role: (a, b) => { const ri = r => { const i = Cfg.get().roles.findIndex(x => x.id === r); return i < 0 ? 99 : i; }; return ri(mainRole(a[1])) - ri(mainRole(b[1])) || cmpTxt(pname(a[1]), pname(b[1])); } };
  return S0[k] ? rows.slice().sort(S0[k]) : rows;
}
window.filterPlayers = (orig => function (f) { const rows = orig(f); return ["last", "club", "verdict", "created"].includes(f.sort) ? sortPlayers(rows, f.sort) : rows; })(window.filterPlayers);
R.giocatori = (orig => () => { const h = orig(); return h.replace(/<select id="pfsort"[\s\S]*?<\/select>/, sortSel("pf.sort")); })(R.giocatori);

/* ---------- Partite: elenco con i giocatori subito visibili ---------- */
function matchPlayers(id, m) {
  const ids = [...new Set([...(m.targets || []), ...(m.events || []).map(e => e.p)])].filter(P).filter(x => x !== m.focus); if (!ids.length) return "";
  const evals = new Set([...S.evals.values()].filter(e => e.matchId === id).map(e => e.playerId));
  const rows = ids.map(pid => { const p = P(pid); const n = (m.events || []).filter(e => e.p === pid).length; const pp = ((m.post || {}).players || {})[pid] || {}; const v = Cfg.verdict(p.verdict); const star = v && v.color === "good"; return { pid, p, n, g: +pp.grade || null, ev: evals.has(pid), star, col: v ? v.color : "grey" }; })
    .sort((a, b) => (b.star - a.star) || (b.ev - a.ev) || (b.n - a.n));
  const max = 8; const more = rows.length - max;
  return `<div class="mpl">${rows.slice(0, max).map(r => `<button type="button" class="mpc v-${r.col}${r.n || r.ev ? " seen" : ""}" data-a="openPlayer" data-id="${r.pid}" title="${esc(pname(r.p))}${r.n ? " · " + t("{n} azioni", { n: r.n }) : ""}${r.ev ? " · " + t("valutato") : ""}">${r.star ? "★ " : ""}${r.p.shirt ? `<b>${esc(r.p.shirt)}</b> ` : ""}${esc(r.p.last || pname(r.p))}${r.n ? `<small>${r.n}</small>` : ""}${r.g ? `<i class="mg ${sc(r.g)}">${f1(r.g)}</i>` : r.ev ? `<i class="mg">✍</i>` : ""}</button>`).join("")}${more > 0 ? `<span class="mpc more">+${more}</span>` : ""}</div>`;
}
window.matchItem = function (id, m) {
  return `<div class="item click mi" data-a="openMatch" data-id="${id}"><div class="mono small mdate">${fmtDate(m.date).slice(0, 5)}<br><span class="muted">${esc(m.time || "")}</span></div><div class="grow"><div class="t">${esc(m.home || "?")} – ${esc(m.away || "?")}${m.score ? " " + esc(m.score) : ""}${exB(m)}${archB(m)}${m.signature ? ` <span class="pill c-good">✍</span>` : ""}</div><div class="m">${esc(L(Cfg.get().matchTypes.find(x => x.id === m.type)) || m.type || "")}${m.competition ? " · " + esc(m.competition) : ""}${m.venue ? " · " + esc(m.venue) : ""}</div>${matchPlayers(id, m)}${(m.tags || []).length ? `<div style="margin-top:3px">${tagsHtml(m.tags)}</div>` : ""}</div><span class="pill ${m.status === "vista" ? "c-good" : "c-blue"}">${m.status === "vista" ? t("Vista") : t("In programma")}</span></div>`;
};
R.partite = () => {
  if (ui.matchId && S.matches.get(ui.matchId)) return matchPage(ui.matchId);
  const f = ui.mf, q = (f.q || "").toLowerCase(); const c = Cfg.get();
  const rows = [...S.matches.entries()].filter(([, m]) => (f.showArch || !m.archived) && (!q || (m.home + " " + m.away + " " + (m.competition || "") + " " + (m.venue || "") + " " + (m.targets || []).filter(P).map(x => pname(P(x))).join(" ")).toLowerCase().includes(q)) && (!f.status || (f.status === "vista" ? m.status === "vista" : m.status !== "vista")) && (!f.type || m.type === f.type) && (!f.tag || (m.tags || []).includes(f.tag)));
  const sorters = { date_desc: (a, b) => cmpTxt(b[1].date + (b[1].time || ""), a[1].date + (a[1].time || "")), date_asc: (a, b) => cmpTxt(a[1].date + (a[1].time || ""), b[1].date + (b[1].time || "")), team: (a, b) => cmpTxt(a[1].home, b[1].home) || cmpTxt(a[1].away, b[1].away), comp: (a, b) => cmpTxt(a[1].competition, b[1].competition) || cmpTxt(b[1].date, a[1].date), actions: (a, b) => (b[1].events || []).length - (a[1].events || []).length, players: (a, b) => (b[1].targets || []).length - (a[1].targets || []).length };
  let up = rows.filter(([, m]) => m.status !== "vista"), done = rows.filter(([, m]) => m.status === "vista");
  if (f.sort === "auto" || !sorters[f.sort]) { up.sort(sorters.date_asc); done.sort(sorters.date_desc); } else { up.sort(sorters[f.sort]); done.sort(sorters[f.sort]); }
  return `<div class="head"><div><h1>${t("Partite")}</h1><p class="sub">${t("Pianifica le missioni e registra le azioni al minuto durante la gara.")}</p></div><div class="row"><button class="btn" data-a="loadSheet">${t("Carica distinta")}</button><button class="btn pri" data-a="newMatch">+ ${t("Nuova partita")}</button></div></div>
  <div class="row filt"><input type="search" id="mfq" placeholder="${t("Cerca squadra, competizione, luogo, giocatore")}" value="${esc(f.q)}" style="flex:2 1 220px;width:auto">
   <select id="mf_status" style="flex:1 1 130px;width:auto"><option value="">${t("Tutte")}</option><option value="prog" ${f.status === "prog" ? "selected" : ""}>${t("In programma")}</option><option value="vista" ${f.status === "vista" ? "selected" : ""}>${t("Viste")}</option></select>
   <select id="mf_type" style="flex:1 1 130px;width:auto"><option value="">${t("Tutte le tipologie")}</option>${c.matchTypes.map(x => `<option value="${esc(x.id)}" ${f.type === x.id ? "selected" : ""}>${esc(L(x))}</option>`).join("")}</select>
   <select id="mf_tag" style="flex:1 1 130px;width:auto"><option value="">${t("Tutti i tag")}</option>${c.tags.map(x => `<option value="${x.id}" ${f.tag === x.id ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select>
   ${sortSel("mf.sort")}<label class="chk"><input type="checkbox" id="mf_showArch" ${f.showArch ? "checked" : ""}> ${t("Archiviate")}</label></div>
  <p class="m legend">★ ${t("giocatore interessante (giudizio positivo)")} · <b>${t("numero")}</b> = ${t("azioni registrate")} · ✍ = ${t("valutazione scritta")}</p>
  <section class="panel"><h2>${t("In programma")} <span class="m">· ${up.length}</span></h2><div class="list">${up.map(([id, m]) => matchItem(id, m)).join("") || `<div class="empty">${t("Nessuna partita in programma.")}</div>`}</div></section>
  <section class="panel"><h2>${t("Già viste")} <span class="m">· ${done.length}</span></h2><div class="list">${done.map(([id, m]) => matchItem(id, m)).join("") || `<div class="empty">${t("Nessuna partita ancora vista.")}</div>`}</div></section>`;
};

/* ---------- Report: ordinamento ed eliminazione ---------- */
R.report = () => {
  if (ui.edraft) return evalEditor();
  const f = ui.rf, q = (f.q || "").toLowerCase(), c = Cfg.get();
  const rows = [...S.evals.entries()].filter(([, e]) => {
    if (!f.showArch && e.archived) return false; const p = P(e.playerId);
    if (q && !(pname(p) + " " + (e.home || "") + " " + (e.away || "") + " " + (e.summary || "")).toLowerCase().includes(q)) return false;
    if (f.from && (e.date || "") < f.from) return false; if (f.to && (e.date || "") > f.to) return false;
    if (f.by && !(e.by || "").toLowerCase().includes(f.by.toLowerCase())) return false; if (f.type && e.matchType !== f.type) return false;
    if (f.tag && !(e.tags || []).includes(f.tag) && !((p && p.tags) || []).includes(f.tag)) return false;
    if (f.rMin) { const r = evalRating(e); if (r == null || r < +f.rMin) return false; } return true;
  });
  const so = { date: (a, b) => cmpTxt(b[1].date, a[1].date), date_asc: (a, b) => cmpTxt(a[1].date, b[1].date), rating: (a, b) => (evalRating(b[1]) ?? -1) - (evalRating(a[1]) ?? -1), rating_asc: (a, b) => (evalRating(a[1]) ?? 99) - (evalRating(b[1]) ?? 99), name: (a, b) => cmpTxt(pname(P(a[1].playerId)), pname(P(b[1].playerId))), match: (a, b) => cmpTxt((a[1].home || "") + a[1].away, (b[1].home || "") + b[1].away) };
  rows.sort(so[f.sort] || so.date);
  return `<div class="head"><div><h1>${t("Report")}</h1><p class="sub">${t("Tutte le valutazioni scritte: {n}.", { n: rows.length })}</p></div><button class="btn pri" data-a="pickEvalPlayer">+ ${t("Valutazione")}</button></div>
  <section class="panel"><div class="fgrid">
   <label class="f">${t("Cerca")}<input type="search" id="rfq" value="${esc(f.q)}" placeholder="${t("Giocatore, squadra, sintesi")}"></label>
   <label class="f">${t("Dal")}<input type="date" id="rf_from" value="${esc(f.from)}"></label><label class="f">${t("Al")}<input type="date" id="rf_to" value="${esc(f.to)}"></label>
   <label class="f">${t("Valutato da")}<input type="text" id="rf_by" value="${esc(f.by)}"></label>
   <label class="f">${t("Tipologia")}${sel("rf_type", c.matchTypes, f.type, t("Tutte"))}</label>
   <label class="f">${t("Tag")}<select id="rf_tag"><option value="">${t("Tutti")}</option>${c.tags.map(x => `<option value="${x.id}" ${f.tag === x.id ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select></label>
   <label class="f">${t("Rating minimo")}<input type="number" step="0.5" id="rf_rMin" value="${esc(f.rMin)}"></label>
   <label class="f">${t("Ordina")}<select data-sortk="rf.sort">${SORTS["rf.sort"].map(([k, n]) => `<option value="${k}" ${f.sort === k ? "selected" : ""}>${esc(t(n))}</option>`).join("")}</select></label>
   <label class="chk" style="align-self:end"><input type="checkbox" id="rf_showArch" ${f.showArch ? "checked" : ""}> ${t("Mostra archiviati")}</label></div></section>
  <section class="panel"><div class="list">${rows.map(([id, e]) => evalItem(id, e, true).replace(/<\/div>$/, `<button class="iconbtn sm del" data-a="delItem" data-coll="evals" data-id="${id}" title="${t("Elimina")}" aria-label="${t("Elimina")}">${ico("trash")}</button></div>`)).join("") || `<div class="empty">${t("Nessuna valutazione trovata.")}</div>`}</div></section>`;
};

/* ---------- Liste: ordinamento delle cartelle e dei giocatori ---------- */
R.liste = () => {
  const cur = ui.listId && S.lists.get(ui.listId) ? ui.listId : null; const l = cur ? S.lists.get(cur) : null;
  const count = id => [...S.players.entries()].filter(([pid, p]) => !p.archived && listContains(id, pid)).length;
  const ls = { order: (a, b) => (a[1].order ?? 0) - (b[1].order ?? 0) || cmpTxt(a[1].name, b[1].name), name: (a, b) => cmpTxt(a[1].name, b[1].name), date: (a, b) => cmpTxt(b[1].created || createdAt(b[1]), a[1].created || createdAt(a[1])), count: (a, b) => count(b[0]) - count(a[0]) };
  const children = pid => [...S.lists.entries()].filter(([, x]) => (x.parentId || null) === pid && !x.archived && !x.smart).sort(ls[ui.lsort.lists] || ls.order);
  const tree = (pid, depth) => children(pid).map(([id, x]) => `<div class="tnode" data-a="openList" data-id="${id}" aria-current="${cur === id}" style="padding-left:${8 + depth * 16}px"><span class="dot" style="background:${esc(x.color || "#1E6A47")}"></span><span class="grow t">${esc(x.name)}</span><span class="m mono">${count(id)}</span></div>` + tree(id, depth + 1)).join("");
  const smart = [...S.lists.entries()].filter(([, x]) => x.smart && !x.archived).sort(ls.name);
  const sp = rows => sortPlayers(rows, ui.lsort.players);
  let content;
  if (l && l.smart) {
    const rows = sp(filterPlayers({ ...ui.pf, ...l.smart, open: false, q: l.smart.q || "" }));
    content = `<div class="head"><div><h2>${esc(l.name)}</h2><p class="sub">${t("Lista intelligente: si aggiorna da sola con i filtri salvati.")}</p></div><div class="row">${sortSel("lsort.players")}<button class="btn sm" data-a="editList" data-id="${cur}">${t("Modifica")}</button><button class="btn sm danger" data-a="delList" data-id="${cur}">${t("Elimina")}</button></div></div><div class="list">${rows.map(([id, p]) => playerItem(id, p)).join("") || `<div class="empty">${t("Nessun giocatore corrisponde.")}</div>`}</div>`;
  } else if (l) {
    const direct = sp([...S.players.entries()].filter(([, p]) => (p.listIds || []).includes(cur) && !p.archived));
    const sub = sp([...S.players.entries()].filter(([pid, p]) => !p.archived && !(p.listIds || []).includes(cur) && listContains(cur, pid)));
    content = `<div class="breadcrumb"><button data-a="openList" data-id="">${t("Tutte le liste")}</button>${listPath(cur).map(([id, x]) => ` › <button data-a="openList" data-id="${id}">${esc(x.name)}</button>`).join("")}</div>
     <div class="head" style="margin-top:6px"><div><h2>${esc(l.name)}</h2>${l.note ? `<p class="sub">${esc(l.note)}</p>` : ""}</div><div class="row"><button class="btn sm" data-a="newList" data-parent="${cur}">+ ${t("Sottolista")}</button><button class="btn sm" data-a="editList" data-id="${cur}">${t("Modifica")}</button><button class="btn sm" data-a="toggleArchive" data-coll="lists" data-id="${cur}">${t("Archivia")}</button><button class="btn sm danger" data-a="delList" data-id="${cur}">${t("Elimina")}</button><button class="btn sm pri" data-a="addToList" data-id="${cur}">+ ${t("Aggiungi giocatori")}</button></div></div>
     ${children(cur).length ? `<div class="chips" style="margin:10px 0">${children(cur).map(([id, x]) => `<button class="chip" data-a="openList" data-id="${id}"><span class="tag" style="color:${esc(x.color)}"><i></i></span>${esc(x.name)} · ${count(id)}</button>`).join("")}</div>` : ""}
     <div class="row end" style="margin:6px 0">${sortSel("lsort.players")}</div>
     <div class="list">${direct.map(([id, p]) => playerItem(id, p, `<button class="btn sm ghost" data-a="rmFromList" data-id="${id}" data-list="${cur}" title="${t("Togli dalla lista")}">✕</button>`)).join("") || `<div class="empty">${t("Nessun giocatore in questa lista.")}</div>`}</div>
     ${sub.length ? `<h3 style="margin-top:14px">${t("Nelle sottoliste")}</h3><div class="list">${sub.map(([id, p]) => playerItem(id, p)).join("")}</div>` : ""}`;
  } else content = `<div class="empty">${t("Scegli una lista a sinistra, oppure creane una nuova. Le liste possono contenere sottoliste (es. Estate 2027 › Difensori › Under 21).")}</div>`;
  const nTasks = [...S.tasks.values()].filter(x => x.status !== "done").length;
  return `${cur ? "" : `<div class="banner info row between"><span>🎯 ${t("Visione singola: {n} incarichi aperti", { n: nTasks })}</span><button class="btn sm pri" data-a="menuGoTasks">${t("Apri incarichi")}</button></div>`}
  <div class="head"><div><h1>${t("Liste")}</h1><p class="sub">${t("Organizza i giocatori in cartelle e sottoliste. Un giocatore può stare in più liste.")}</p></div><button class="btn pri" data-a="newList" data-parent="">+ ${t("Nuova lista")}</button></div>
  <div class="split"><section class="panel"><div class="row between"><h3>${t("Cartelle")}</h3>${sortSel("lsort.lists", "⇅")}</div><div class="tree" style="margin-top:8px">${tree(null, 0) || `<div class="m">${t("Ancora nessuna lista.")}</div>`}</div>
    <h3 style="margin-top:16px">${t("Liste intelligenti")}</h3><div class="tree" style="margin-top:8px">${smart.map(([id, x]) => `<div class="tnode" data-a="openList" data-id="${id}" aria-current="${cur === id}"><span class="dot" style="background:var(--blue)"></span><span class="grow t">${esc(x.name)}</span></div>`).join("") || `<div class="m">${t("Salvale dai filtri della pagina Giocatori.")}</div>`}</div></section>
   <section class="panel">${content}</section></div>`;
};

/* =========================================================
   BANNER «MODIFICA SALVATA — ANNULLA / CONFERMA»
   ========================================================= */
ICONS.trash = '<path d="M9 3h6l1 2h4v2H4V5h4zm-3 6h12l-1 12H7zm4 2v8h1.6v-8zm2.4 0v8H14v-8z"/>';
ICONS.prev = '<path d="M15.4 5.4 14 4l-8 8 8 8 1.4-1.4L8.8 12z"/>';
ICONS.next = '<path d="M8.6 5.4 10 4l8 8-8 8-1.4-1.4 6.6-6.6z"/>';
const UB = {
  pend: null, pendAt: 0, pt: null, msg: null, quiet: false, timer: null,
  relevant(coll, id) { if (coll === "settings" && !["config", "profile", "vaults"].includes(id)) return false; if (ui.view === "partite" && ui.matchId && ui.mtab === "live" && coll === "matches" && id === ui.matchId && !$("#sheetRoot .sheet")) return false; return true; },
  show(kind, msg) {
    let el = $("#undoBar"); if (!el) { el = document.createElement("div"); el.id = "undoBar"; el.className = "undobar noprint"; el.setAttribute("role", "status"); el.setAttribute("aria-live", "polite"); document.body.appendChild(el); }
    const back = kind === "save" || kind === "redo";
    el.innerHTML = `<span class="ubi">${kind === "undo" ? "↶" : kind === "redo" ? "↷" : "✓"}</span><span class="grow">${esc(msg)}</span>${back ? `<button class="btn sm" data-a="ubUndo">↶ ${t("Annulla")}</button>` : `<button class="btn sm" data-a="ubRedo">↷ ${t("Ripeti")}</button>`}<button class="btn sm pri" data-a="ubOk">${kind === "save" ? t("Conferma") : t("OK")}</button>`;
    el.hidden = false; el.classList.remove("in"); void el.offsetWidth; el.classList.add("in"); const tt = $("#toast"); if (tt) tt.hidden = true;
    clearTimeout(this.timer); this.timer = setTimeout(() => this.hide(), 7000);
  },
  hide() { clearTimeout(this.timer); const el = $("#undoBar"); if (el) el.hidden = true; },
  fire() { this.pt = null; const g = this.pend; this.pend = null; const msg = this.msg; this.msg = null; if (!g || !Undo.stack.includes(g) || !App.unlocked || $("#sheetRoot .sheet")) { if (msg) toast0(msg); return; } this.show("save", msg || t("Modifica salvata")); }
};
const toast0 = window.toast;
window.toast = function (msg, ms) { if (UB.quiet) return; if (UB.pt && Date.now() - UB.pendAt < 600) { UB.msg = msg; return; } return toast0(msg, ms); };
Undo.rec = (orig => function (coll, id) {
  const busy = this.busy; orig.call(this, coll, id); if (busy || !App.unlocked || !UB.relevant(coll, id)) return;
  UB.pend = this.stack[this.stack.length - 1]; UB.pendAt = Date.now(); clearTimeout(UB.pt); UB.pt = setTimeout(() => UB.fire(), 160);
})(Undo.rec);
Undo.after = (orig => function (msg, g) { UB.quiet = true; try { orig.call(this, msg, g); } finally { UB.quiet = false; } UB.show(msg === t("Modifica annullata") ? "undo" : "redo", msg); })(Undo.after);
Undo.clear = (orig => function () { UB.pend = null; clearTimeout(UB.pt); UB.pt = null; UB.hide(); return orig.call(this); })(Undo.clear);
Object.assign(A, { ubUndo: () => { UB.hide(); Undo.undo(); }, ubRedo: () => { UB.hide(); Undo.redo(); }, ubOk: () => UB.hide() });

/* =========================================================
   BARRA IN ALTO, MENU LATERALE, PIÈ DI PAGINA
   ========================================================= */
window.renderShell = (orig => function () {
  orig(); $$("#undoBtn,#redoBtn").forEach(b => b.remove());
  const foot = $("#side .side-foot"); if (foot && !foot.querySelector("[data-a=switchProfile]")) foot.insertAdjacentHTML("beforeend", `<button data-a="switchProfile">${t("Cambia profilo")}</button>`);
  const tools = $("#topbar .tbtools"); if (tools && window.Vault && Vault.openIds().length) tools.insertAdjacentHTML("afterbegin", `<button class="pill c-amber vaultpill" data-a="vaultCloseAll" title="${t("Chiudi gli archivi nascosti")}">🔓 ${esc(Vault.openIds().map(id => Vault.name(id)).join(", "))} ✕</button>`);
  let f = $("#appFoot"); if (!f) { const v = $("#view"); if (v) { f = document.createElement("footer"); f.id = "appFoot"; f.className = "appfoot noprint"; v.after(f); } }
  if (f) f.innerHTML = footHtml();
})(window.renderShell);
const LINKEDIN = "https://www.linkedin.com/in/miodragmilosevic/";
function footHtml() {
  return `<div class="fmade">${esc(appName())} ${APP_VERSION} · Made with <span class="heart" aria-label="love">❤️</span> by <a href="${LINKEDIN}" target="_blank" rel="noopener noreferrer">Miodrag Milosevic</a></div>
   <nav class="flinks" aria-label="${t("Link utili")}"><a href="${LINKEDIN}" target="_blank" rel="noopener noreferrer" class="fli"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zm7 0h3.8v1.7h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.6c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9V21h-4z"/></svg> LinkedIn</a>${App.unlocked ? `<button data-a="footGo" data-v="backup">${t("Backup")}</button><button data-a="footGo" data-v="sync">${t("Sincronizzazione")}</button><button data-a="footGo" data-v="info">${t("Informazioni")}</button>` : ""}<button data-a="privacyInfo">${t("Privacy e tutela dei minori")}</button></nav>`;
}
A.footGo = el => { resetSub(); ui.setTab = el.dataset.v; go("impostazioni"); };
A.privacyInfo = () => sheet(`<div class="row between"><h2>${t("Privacy e tutela dei minori")}</h2><button class="btn sm ghost" data-a="closeSheetBtn">✕</button></div>
  <ul class="small plist"><li>${t("I dati restano solo sui tuoi dispositivi, cifrati con la tua password (AES-256). Nessun server, nessun tracciamento, nessuna pubblicità.")}</li><li>${t("La sincronizzazione passa da un file cifrato nella tua cartella cloud (iCloud Drive, OneDrive, Google Drive…): senza la tua password non è leggibile.")}</li><li>${t("Per i minorenni annota solo ciò che vedi in campo o in luoghi pubblici; per foto e video serve il consenso dei genitori. Niente dati sanitari, scolastici o familiari dettagliati.")}</li><li>${t("Condividi un report solo con chi deve valutarlo (club, direttore sportivo) e solo con link o file protetti da codice.")}</li><li>${t("Dati di esempio: giocatori, società e giudizi tutti inventati per esercitarsi.")}</li></ul>
  <div class="row end"><button class="btn pri" data-a="closeSheetBtn">${t("Ho capito")}</button></div>`);

/* =========================================================
   FRECCE ‹ › PER LE SCHEDE (e tasti ← →)
   ========================================================= */
function enhanceTabs(root) {
  for (const tb of (root || document).querySelectorAll(".tabs:not([data-nav])")) {
    const bs = [...tb.querySelectorAll(":scope > button[aria-pressed]")]; if (bs.length < 3) continue; tb.dataset.nav = "1";
    const wrap = document.createElement("div"); wrap.className = "tabnav noprint"; tb.parentNode.insertBefore(wrap, tb);
    const i = bs.findIndex(b => b.getAttribute("aria-pressed") === "true");
    const mk = (d, lab) => { const b = document.createElement("button"); b.type = "button"; b.className = "tabarrow"; b.innerHTML = ico(d < 0 ? "prev" : "next"); b.setAttribute("aria-label", lab); b.title = lab; b.disabled = d < 0 ? i <= 0 : i >= bs.length - 1; b.onclick = () => stepTab(tb, d); return b; };
    wrap.append(mk(-1, t("Scheda precedente")), tb, mk(1, t("Scheda successiva")));
    if (i >= 0) { const b = bs[i]; const l = b.offsetLeft - tb.clientWidth / 2 + b.clientWidth / 2; tb.scrollLeft = Math.max(0, l); }
  }
}
function stepTab(tb, d) { const bs = [...tb.querySelectorAll(":scope > button[aria-pressed]")]; const i = bs.findIndex(b => b.getAttribute("aria-pressed") === "true"); const n = bs[i + d]; if (n) n.click(); }
window.afterRender = (orig => async function () { try { enhanceTabs($("#view")); } catch (e) { } return orig.apply(this, arguments); })(window.afterRender);
document.addEventListener("keydown", e => {
  if (!App.unlocked || e.metaKey || e.ctrlKey || e.altKey || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return; const tg = (e.target.tagName || "").toLowerCase(); if (["input", "textarea", "select"].includes(tg) || e.target.isContentEditable || $("#sheetRoot .sheet")) return;
  const tb = $("#view .tabs[data-nav]"); if (!tb) return; e.preventDefault(); stepTab(tb, e.key === "ArrowLeft" ? -1 : 1);
});
// scorri giocatori e partite senza tornare all'elenco
function navBtns(kind, ids, cur) { const i = ids.indexOf(cur); if (i < 0 || ids.length < 2) return ""; return `<span class="pnav"><button class="iconbtn sm" data-a="${kind}" data-id="${ids[i - 1] || ""}" ${i ? "" : "disabled"} aria-label="${t("Precedente")}" title="${t("Precedente")}">${ico("prev")}</button><span class="m mono">${i + 1}/${ids.length}</span><button class="iconbtn sm" data-a="${kind}" data-id="${ids[i + 1] || ""}" ${i < ids.length - 1 ? "" : "disabled"} aria-label="${t("Successivo")}" title="${t("Successivo")}">${ico("next")}</button></span>`; }
A.pNav = el => { if (!el.dataset.id) return; ui.playerId = el.dataset.id; ui.evalSel = null; render(); window.scrollTo(0, 0); };
A.mNav = el => { if (!el.dataset.id) return; ui.matchId = el.dataset.id; ui.liveP = null; ui.timer = null; render(); window.scrollTo(0, 0); };

/* =========================================================
   FIRMA DIGITALE IN FONDO (valutazioni, partite, giocatori)
   ========================================================= */
const SKIP = new Set(["_t", "createdBy", "createdOn", "updatedBy", "updatedOn", "updatedAt", "signature", "listIds", "archived", "example", "vault", "org"]);
const SignX = {
  content(coll, o) { if (coll === "evals") return Sign.evalContent(o); const r = {}; for (const k of Object.keys(o).sort()) if (!SKIP.has(k)) r[k] = o[k]; return JSON.stringify(r); },
  async hash(coll, o) { return Sign.sha256(this.content(coll, o)); },
  async check(coll, o) { if (!o || !o.signature) return null; return (await this.hash(coll, o)) === o.signature.hash; },
  label: { evals: "Firma la valutazione", matches: "Firma la visione della partita", players: "Firma la scheda del giocatore" },
  footer(coll, id) {
    const o = S[coll].get(id); if (!o) return "";
    if (o.signature) return `<section class="panel sigfoot"><div class="row between"><h3>✍ ${t("Firma")}</h3><button class="btn sm ghost noprint" data-a="signObj" data-coll="${coll}" data-id="${id}">${t("Firma di nuovo")}</button></div><div data-sigx="${coll}|${id}"></div></section>`;
    return `<section class="panel sigfoot noprint"><div class="row between" style="flex-wrap:wrap;gap:8px"><div><h3>✍ ${t("Firma")}</h3><p class="m">${t("La firma certifica che il report è tuo e segnala ogni modifica successiva.")} · ${fmtDate(today())}</p></div><button class="btn pri" data-a="signObj" data-coll="${coll}" data-id="${id}">✍ ${t(this.label[coll])}</button></div></section>`;
  },
  block(sig, valid) { return Sign.block(sig, valid).replace(t("Attenzione: la valutazione è stata modificata dopo la firma."), t("Attenzione: il contenuto è stato modificato dopo la firma.")); }
};
A.signObj = el => { const coll = el.dataset.coll, id = el.dataset.id; const p = Profile.get(); if (!p.name) { toast(t("Prima completa il tuo profilo scout (nome e firma).")); go("profilo"); return; }
  Sign.askPassword(t(SignX.label[coll] || "Firma"), async () => { const o = S[coll].get(id); const hash = await SignX.hash(coll, o); put(coll, id, { ...o, signature: { by: p.name, title: p.title || "", img: p.signature || "", date: new Date().toISOString(), hash, account: (Accounts.acc || {}).id || "" } }); toast(t("Firmato")); render(true); }); };
A.signEval = el => A.signObj({ dataset: { coll: "evals", id: el.dataset.id } });
window.afterRender = (orig => async function () { const r = orig.apply(this, arguments); for (const el of $$("[data-sigx]")) { const [coll, id] = el.dataset.sigx.split("|"); el.removeAttribute("data-sigx"); const o = S[coll] && S[coll].get(id); if (!o || !o.signature) continue; el.innerHTML = SignX.block(o.signature, await SignX.check(coll, o)); } return r; })(window.afterRender);
// salvare una partita o un giocatore firmato lascia la firma: il riquadro segnalerà la modifica

/* =========================================================
   ELIMINA (giocatori, partite, valutazioni) — si può annullare
   ========================================================= */
A.delItem = (el, ev) => {
  if (ev) ev.stopPropagation(); const coll = el.dataset.coll, id = el.dataset.id; const o = S[coll].get(id); if (!o) return;
  const what = coll === "players" ? t("il giocatore «{n}» con le sue valutazioni", { n: pname(o) }) : coll === "matches" ? t("la partita {h} – {a} con il registro", { h: o.home || "?", a: o.away || "?" }) : t("questa valutazione");
  confirmSheet(t("Eliminare {w}? Subito dopo puoi ancora annullare.", { w: what }), async () => {
    const owners = new Set([id]); if (coll === "players") for (const [eid, e] of [...S.evals]) if (e.playerId === id) { owners.add(eid); del("evals", eid); }
    for (const [mid, m] of [...S.media]) if (owners.has(m.ownerId)) del("media", mid);
    if (coll === "players") for (const [tid, x] of [...S.tasks]) if (x.playerId === id) del("tasks", tid);
    del(coll, id); toast(t("Eliminato"));
    if (coll === "players" && ui.playerId === id) ui.playerId = null; if (coll === "matches" && ui.matchId === id) ui.matchId = null; if (coll === "evals" && ui.evalSel === id) ui.evalSel = null;
  }, t("Elimina"));
};

/* =========================================================
   SCHEDA GIOCATORE: frecce, elimina, firma in fondo
   ========================================================= */
window.playerPage = (orig => function (id) {
  let h = orig(id); const ids = filterPlayers(ui.pf).map(x => x[0]); const list = ids.includes(id) ? ids : [...S.players.keys()];
  h = h.replace(/(<button class="btn ghost sm" data-a="backList">[^<]*<\/button>)/, `<div class="row">$1${navBtns("pNav", list, id)}</div>`);
  h = h.replace(`<button class="btn sm" data-a="editPlayer" data-id="${id}">`, `<button class="btn sm ghost danger" data-a="delItem" data-coll="players" data-id="${id}">${ico("trash")} ${t("Elimina")}</button><button class="btn sm" data-a="vaultPick" data-coll="players" data-id="${id}">🔒 ${P(id).vault ? t("Archivio nascosto") : t("Nascondi")}</button><button class="btn sm" data-a="editPlayer" data-id="${id}">`);
  const evalOpen = ui.ptab === "caratteristiche" && ui.evalSel && S.evals.has(ui.evalSel);
  if (ui.ptab !== "report" && !evalOpen) h += SignX.footer("players", id);
  return h;
})(window.playerPage);

/* =========================================================
   PARTITA: schede (con «Formazioni»), frecce, elimina, firma
   ========================================================= */
window.matchPage = function (id) {
  const m = S.matches.get(id); const tabs = [["prima", t("Prima")], ["formazioni", t("Formazioni")], ["live", t("Durante")], ["dopo", t("Dopo")], ["registro", t("Registro ({n})", { n: (m.events || []).length })], ["multimedia", t("Multimedia")]];
  if (!tabs.some(x => x[0] === ui.mtab)) ui.mtab = "live";
  const body = ui.mtab === "prima" ? prePage(id, m) : ui.mtab === "formazioni" ? formPage(id, m) : ui.mtab === "dopo" ? postPage(id, m) : ui.mtab === "registro" ? logPage(id, m) : ui.mtab === "multimedia" ? mediaSection("match", id) : liveView(id, m);
  const ids = [...S.matches.entries()].filter(([, x]) => !x.archived || x === m).sort((a, b) => cmpTxt(b[1].date, a[1].date)).map(x => x[0]);
  return `<div class="row between noprint"><div class="row"><button class="btn ghost sm" data-a="closeMatch">← ${t("Partite")}</button>${navBtns("mNav", ids, id)}</div><div class="row"><button class="btn sm" data-a="shareItem" data-kind="match" data-id="${id}">${ico("share")} ${t("Condividi")}</button><button class="btn sm" data-a="toggleArchive" data-coll="matches" data-id="${id}">${m.archived ? t("Ripristina") : t("Archivia")}</button><button class="btn sm" data-a="vaultPick" data-coll="matches" data-id="${id}">🔒 ${m.vault ? t("Archivio nascosto") : t("Nascondi")}</button><button class="btn sm ghost danger" data-a="delItem" data-coll="matches" data-id="${id}">${ico("trash")} ${t("Elimina")}</button><button class="btn sm" data-a="editMatch" data-id="${id}">${t("Modifica")}</button></div></div>
  <div class="head"><div><h1>${esc(m.home)} – ${esc(m.away)}${m.score ? " " + esc(m.score) : ""}${exB(m)}${archB(m)}</h1><p class="sub">${fmtDate(m.date)} ${esc(m.time || "")} · ${esc(L(Cfg.get().matchTypes.find(x => x.id === m.type)) || m.type || "")} ${m.competition ? "· " + esc(m.competition) : ""} ${m.venue ? "· " + esc(m.venue) : ""}</p>${Author.line(m)}${matchLinks(id, m)}</div><span class="pill ${m.status === "vista" ? "c-good" : "c-blue"}">${m.status === "vista" ? t("Vista") : t("In programma")}</span></div>
  <div class="tabs noprint">${tabs.map(([k, n]) => `<button data-a="mtab" data-t="${k}" aria-pressed="${ui.mtab === k}">${n}</button>`).join("")}</div>${body}${ui.mtab === "live" ? "" : SignX.footer("matches", id)}`;
};
// la «Prima» mostra solo un rimando alle formazioni (ora hanno una scheda tutta loro)
window.prePage = (orig => function (id, m) {
  const h = orig(id, m); const sp = sheetPanel(id, m); const rest = h.startsWith(sp) ? h.slice(sp.length) : h;
  const sh = m.sheet; const sum = sh ? `${esc(m.home)} ${esc(sh.home.system || "")} · ${esc(m.away)} ${esc(sh.away.system || "")}` : t("Non ancora inserite");
  return `<section class="panel"><div class="row between"><div><h2>${t("Formazioni")}</h2><p class="sub small">${sum}</p></div><div class="row"><button class="btn sm" data-a="loadSheet" data-id="${id}">${t("Carica distinta")}</button><button class="btn sm pri" data-a="mtab" data-t="formazioni">${t("Apri le formazioni")}</button></div></div></section>` + rest;
})(window.prePage);

/* ---------- formazione iniziale e fasi di gioco ---------- */
const PHASES = [["start", "Formazione iniziale", "Starting line-up"], ["poss", "In possesso", "In possession"], ["nonposs", "Senza palla", "Out of possession"], ["tpos", "Transizione offensiva", "Attacking transition"], ["tneg", "Transizione difensiva", "Defensive transition"], ["inatt", "Palle inattive", "Set pieces"]];
const sysKey = s => String(s || "").replace(/^1-/, "");
function sysPitch(sys, T, m) {
  const tpl = SHEET_SYS[sysKey(sys)]; const Lc = "var(--pitch-line)";
  if (!tpl) return `<div class="empty small">${sys ? t("Nessuno schema disegnato per {s}: usa le note.", { s: esc(sys) }) : t("Scegli il modulo")}</div>`;
  const starters = T ? T.players.filter(p => p.starter) : []; const used = new Set();
  const dots = tpl.flat().map(([r, x, y]) => { const pl = starters.find(p => !used.has(p) && p.role === r) || null; if (pl) used.add(pl); const X = x * 1.05, Y = y * 0.68; const on = pl && pl.pid && (m.targets || []).includes(pl.pid);
    return `<g class="shp${on ? " on" : ""}"><circle cx="${X}" cy="${Y}" r="3.6"/><text x="${X}" y="${Y + 1.3}" text-anchor="middle" font-size="${pl && pl.n ? 3.4 : 2.5}" font-weight="700">${esc(pl && pl.n ? pl.n : roleCode(r))}</text>${pl ? `<text x="${X}" y="${Y + 7.3}" text-anchor="middle" font-size="3" class="shnm">${esc((pl.name.split(" ")[0] || "").slice(0, 11))}</text>` : ""}</g>`; }).join("");
  return `<svg class="pitch" viewBox="-3 -3 111 76" role="img" aria-label="${esc(sys)}"><rect x="-3" y="-3" width="111" height="76" fill="var(--pitch)"/><g fill="none" stroke="${Lc}" stroke-width=".5"><rect x="0" y="0" width="105" height="68"/><line x1="52.5" y1="0" x2="52.5" y2="68"/><circle cx="52.5" cy="34" r="9.15"/><rect x="0" y="13.84" width="16.5" height="40.32"/><rect x="88.5" y="13.84" width="16.5" height="40.32"/></g>${dots}<text x="104" y="72" fill="${Lc}" font-size="3" text-anchor="end">${t("attacco")} →</text></svg>`;
}
function formPage(id, m) {
  const ph = m.phases || {}; const cur = PHASES.some(p => p[0] === ui.fphase) ? ui.fphase : "start"; const c = Cfg.get(); const sh = m.sheet;
  const sysOf = side => (ph[side] || {})[cur] && ph[side][cur].sys ? ph[side][cur].sys : cur === "start" ? (sh && sh[side].system) || (side === "home" ? m.sysHome : m.sysAway) || "" : "";
  const team = (side, name) => { const v = (ph[side] || {})[cur] || {}; const sys = sysOf(side); const T = sh ? sh[side] : null;
    return `<div class="fteam"><div class="row between"><h3>${esc(name)}</h3><select data-ph="${side}.${cur}.sys" aria-label="${t("Modulo")}"><option value="">${t("Modulo")} —</option>${c.systems.map(s => `<option value="${esc(s)}" ${sysKey(s) === sysKey(sys) ? "selected" : ""}>${esc(sysKey(s))}</option>`).join("")}</select></div>
     <div class="pitchbox" style="max-width:none">${cur === "start" && T && sysKey(T.system) === sysKey(sys) ? sheetPitch(T, side, m) : sysPitch(sys, cur === "start" ? T : null, m)}</div>
     <textarea data-ph="${side}.${cur}.note" placeholder="${esc(cur === "start" ? t("es. 4-3-3 con il terzino destro alto, mezzala sinistra che si inserisce") : t("Come si dispone e cosa fa in questa fase"))}" style="min-height:58px;margin-top:6px">${esc(v.note || "")}</textarea></div>`; };
  const changes = (ph.changes || []).slice().sort((a, b) => (+a.min || 0) - (+b.min || 0));
  return `${sheetPanel(id, m).replace(/(<button class="btn (?:pri|sm)" data-a="loadSheet" data-id="[^"]*">)/, `<button class="btn sm" data-a="manualSheet" data-id="${id}">✎ ${t("Inserisci a mano")}</button>$1`)}
  <section class="panel"><h2>${t("Fasi di gioco")}</h2><p class="sub small">${t("Per ogni fase scegli il modulo e scrivi come si dispone la squadra. Si salva da solo.")}</p>
   <div class="seg phseg" style="margin-top:8px">${PHASES.map(([k, it, en]) => `<button data-a="fphase" data-v="${k}" aria-pressed="${cur === k}">${esc(L({ it, en }))}${((ph.home || {})[k] || {}).sys || ((ph.away || {})[k] || {}).sys || ((ph.home || {})[k] || {}).note || ((ph.away || {})[k] || {}).note ? " •" : ""}</button>`).join("")}</div>
   <div class="grid2" style="margin-top:10px">${team("home", m.home)}${team("away", m.away)}</div></section>
  <section class="panel"><h2>${t("Cambi durante la gara")}</h2><p class="sub small">${t("Cambi di modulo, sostituzioni, spostamenti dei giocatori osservati.")}</p>
   <div class="list" style="margin-top:6px">${changes.map(x => `<div class="item"><span class="code">${esc(x.min || "–")}'</span><div class="grow"><div class="t">${esc(x.side === "away" ? m.away : m.home)}${x.sys ? " → " + esc(sysKey(x.sys)) : ""}</div>${x.note ? `<div class="m">${esc(x.note)}</div>` : ""}</div><button class="btn sm ghost" data-a="phDel" data-i="${(ph.changes || []).indexOf(x)}" aria-label="${t("Elimina")}">✕</button></div>`).join("") || `<div class="empty">${t("Nessun cambio registrato.")}</div>`}</div>
   <div class="row phadd" style="margin-top:8px"><input type="number" id="phMin" min="0" max="130" placeholder="${t("Min.")}" style="width:80px"><select id="phSide"><option value="home">${esc(m.home)}</option><option value="away">${esc(m.away)}</option></select><select id="phSys"><option value="">${t("Modulo")} —</option>${c.systems.map(s => `<option value="${esc(s)}">${esc(sysKey(s))}</option>`).join("")}</select><input type="text" id="phNote" placeholder="${t("es. entra il 10 per il 7, passa a 3-5-2")}" style="flex:1;min-width:180px"><button class="btn sm pri" data-a="phAdd">+ ${t("Aggiungi")}</button></div></section>`;
}
document.addEventListener("change", e => {
  const el = e.target.closest && e.target.closest("[data-ph]"); if (!el || !ui.matchId) return; const m = S.matches.get(ui.matchId); if (!m) return; const [side, ph, k] = el.dataset.ph.split(".");
  const phases = clone(m.phases || {}); phases[side] = phases[side] || {}; phases[side][ph] = { ...(phases[side][ph] || {}), [k]: el.value };
  const patch = { phases }; if (ph === "start" && k === "sys") { if (side === "home") patch.sysHome = el.value; else patch.sysAway = el.value; }
  put("matches", ui.matchId, { ...m, ...patch }); if (k === "sys") render(true);
});
Object.assign(A, {
  fphase: el => { ui.fphase = el.dataset.v; render(true); },
  phAdd: () => { const m = S.matches.get(ui.matchId); const x = { min: $("#phMin").value, side: $("#phSide").value, sys: $("#phSys").value, note: $("#phNote").value.trim() }; if (!x.sys && !x.note) { toast(t("Scrivi il cambio o scegli il modulo")); return; } const phases = clone(m.phases || {}); phases.changes = [...(phases.changes || []), x]; put("matches", ui.matchId, { ...m, phases }); toast(t("Cambio aggiunto")); render(true); },
  phDel: el => { const m = S.matches.get(ui.matchId); const phases = clone(m.phases || {}); phases.changes = (phases.changes || []).filter((_, i) => i !== +el.dataset.i); put("matches", ui.matchId, { ...m, phases }); render(true); },
  manualSheet: el => {
    const id = el.dataset.id; const m = S.matches.get(id); const sysName = s => sysKey(s) || "4-3-3";
    const mk = (side, sys) => { const T = m.sheet && m.sheet[side]; if (T && T.players.length) return { coach: T.coach || "", system: T.system || sysName(sys), players: T.players.map(p => ({ ...p })) }; const tpl = SHEET_SYS[sysName(sys)] || SHEET_SYS["4-3-3"]; return { coach: "", system: sysName(sys), players: [...tpl.flat().map(([r]) => ({ n: "", name: "", role: r, starter: true })), ...Array.from({ length: 7 }, () => ({ n: "", name: "", role: "", starter: false }))] }; };
    Sheet.review({ home: m.home, away: m.away, date: m.date, time: m.time, comp: m.competition, venue: m.venue, referee: m.referee, teams: [mk("home", m.sysHome), mk("away", m.sysAway)] }, id);
    toast(t("Scrivi numero e nome: le righe vuote non vengono salvate"));
  }
});
Sheet.findPlayer = (orig => function (name, team, n) { if (!String(name || "").trim()) return ""; return orig.call(this, name, team, n); })(Sheet.findPlayer);
Sheet.save = (orig => function (r, matchId) { const res = orig.call(this, r, matchId); if (ui.view === "partite" && ui.matchId) { ui.mtab = "formazioni"; render(); } return res; })(Sheet.save);

/* =========================================================
   VALUTAZIONE: elimina accanto a «Modifica valutazione»
   ========================================================= */
window.caratteristiche = (orig => function (id, p, pr, evs) {
  let h = orig(id, p, pr, evs); const sel = ui.evalSel && S.evals.has(ui.evalSel) ? ui.evalSel : null; if (!sel) return h;
  return h.replace(`<button class="btn sm" data-a="editEval" data-id="${sel}">`, `<button class="btn sm ghost danger" data-a="delItem" data-coll="evals" data-id="${sel}">${ico("trash")} ${t("Elimina")}</button><button class="btn sm" data-a="editEval" data-id="${sel}">`);
})(window.caratteristiche);

/* =========================================================
   ACCESSO PIÙ SEMPLICE · bandiere e tema · cambio profilo
   ========================================================= */
Lock.langTheme = function () {
  return `<div class="lt"><select class="langsel" id="lockLang" aria-label="${t("Lingua")}">${LANGS.map(([k, n]) => `<option value="${k}" ${Prefs.lang === k ? "selected" : ""} title="${n}">${FLAGS[k]}</option>`).join("")}</select><button type="button" class="iconbtn" data-a="themeCycle" title="${t("Tema")}: ${themeLabel()}" aria-label="${t("Tema")}: ${themeLabel()}">${themeIcon()}</button></div>`;
};
document.addEventListener("change", e => { if (e.target && e.target.id === "lockLang") A.setLang({ dataset: { v: e.target.value } }); });
A.setLang = (orig => function (el) { if (App.unlocked) return orig(el); Prefs.set("lang", el.dataset.v); document.documentElement.lang = el.dataset.v; Lock.again(); })(A.setLang);
A.themeCycle = (orig => function () { if (App.unlocked) return orig(); const order = ["system", "light", "dark"]; Prefs.set("theme", order[(order.indexOf(Prefs.theme) + 1) % 3]); applyTheme(); Lock.again(); })(A.themeCycle);
["show", "signup", "recovery"].forEach(k => { Lock[k] = (orig => function (...a) { this._scr = [k, a]; return orig.apply(this, a); })(Lock[k]); });
Lock.again = function () { const [k, a] = this._scr || ["show", []]; this[k](...(a || [])); };
Lock.render = (orig => function (html) { UB.hide(); orig.call(this, html); const box = this.root().querySelector(".lock"); if (box && !box.querySelector(".appfoot")) box.insertAdjacentHTML("beforeend", `<footer class="appfoot">${footHtml()}</footer>`); })(Lock.render);
const ini = s => esc(String(s || "?").split(/\s+/).map(x => x[0]).join("").slice(0, 2).toUpperCase());
Lock.show = (orig => async function (msg) {
  this._scr = ["show", [msg]]; const l = Accounts.list(); if (!l.length) return this.signup(true);
  const last = Prefs.get("lastEmail", ""); const acc = this._pick ? null : (Accounts.byEmail(last) || (l.length === 1 ? l[0] : null));
  if (!acc) {
    this.render(`<div class="lhead">${this.brand()}${this.langTheme()}</div>${msg ? `<div class="banner info">${esc(msg)}</div>` : ""}<h2>${t("Chi sta usando l'app?")}</h2>
     <div class="col" style="gap:8px">${l.map(a => `<button type="button" class="acct" data-a="loginPick" data-id="${a.id}"><span class="miniav">${ini(a.name || a.email)}</span><span class="grow"><b>${esc(a.name || t("Profilo senza nome"))}</b><small>${esc(a.email || "")}</small></span><span aria-hidden="true">›</span></button>`).join("")}</div>
     <button class="btn" data-a="signup">+ ${t("Crea un nuovo profilo scout")}</button>
     <details class="lmore"><summary>${t("Altre opzioni")}</summary><button class="btn sm" data-a="syncJoin">${t("Collega un dispositivo (dati dal cloud)")}</button></details>`);
    return;
  }
  this.render(`<div class="lhead">${this.brand()}${this.langTheme()}</div>${msg ? `<div class="banner info">${esc(msg)}</div>` : ""}
    <div class="who"><span class="miniav big">${ini(acc.name || acc.email)}</span><div><h2>${t("Ciao {n}", { n: esc((acc.name || "").split(" ")[0] || t("scout")) })}</h2><div class="m">${esc(acc.email || t("Profilo senza email"))}</div></div></div>
    <form id="loginForm" class="col">${acc.email ? `<input type="hidden" id="lgEmail" value="${esc(acc.email)}">` : `<label class="f">${t("Email")}<input type="email" id="lgEmail" autocomplete="username" placeholder="${t("la tua email (la imposti ora)")}"></label>`}
     <label class="f">${t("Password")}<input type="password" id="pw" autocomplete="current-password" required></label><div id="lockErr" class="warn"></div>
     <button class="btn pri" id="unlockBtn">${t("Accedi")}</button></form>
    <div class="row between lsmall"><button class="btn ghost sm" data-a="lockRecovery">${t("Password dimenticata?")}</button>${l.length > 1 ? `<button class="btn ghost sm" data-a="loginSwitch">${t("Cambia profilo")}</button>` : `<button class="btn ghost sm" data-a="signup">${t("Nuovo profilo")}</button>`}</div>
    <details class="lmore"><summary>${t("Altre opzioni")}</summary><div class="col" style="gap:6px;margin-top:6px">${l.length > 1 ? `<button class="btn sm" data-a="signup">+ ${t("Crea un nuovo profilo scout")}</button>` : ""}<button class="btn sm" data-a="syncJoin">${t("Collega un dispositivo (dati dal cloud)")}</button><p class="m">${t("Il profilo resta su questo dispositivo: l'email serve a riconoscerti e a firmare i tuoi report, non viene inviata da nessuna parte.")}</p></div></details>`);
  const pw = $("#pw"); if (pw) pw.focus();
  $("#loginForm").onsubmit = e => { e.preventDefault(); this.login($("#lgEmail").value || acc.email, $("#pw").value); };
})(Lock.show);
Object.assign(A, {
  loginPick: el => { const a = Accounts.list().find(x => x.id === el.dataset.id); Lock._pick = false; Prefs.set("lastEmail", a ? a.email || "" : ""); if (a && !a.email) Lock._legacy = a.id; Lock.show(); },
  loginSwitch: () => { Lock._pick = true; Lock.show(); },
  switchProfile: () => confirmSheet(t("Vuoi passare a un altro profilo scout? L'app si blocca e scegli il profilo."), async () => { Lock._pick = true; await App.lock(); })
});
Lock.findAcc = (orig => async function (email) { if (!email && this._legacy) { const a = Accounts.list().find(x => x.id === this._legacy); if (a) return a; } return orig.call(this, email); })(Lock.findAcc);
Lock.enter = (orig => async function () { this._pick = false; this._legacy = null; return orig.apply(this, arguments); })(Lock.enter);
// impostazioni: bandiere anche nei pulsanti della lingua
SET.generale = (orig => () => orig().replace(/data-a="setLang" data-v="(it|en|de|sr|es|fr)" aria-pressed="(true|false)">([^<]*)</g, (m0, k, pr, n) => `data-a="setLang" data-v="${k}" aria-pressed="${pr}">${FLAGS[k]} ${n}<`))(SET.generale);
// profilo scout: cambia profilo ed elimina il profilo da questo dispositivo
R.profilo = (orig => () => orig() + `<section class="panel"><h2>${t("Profili su questo dispositivo")}</h2><p class="sub small">${t("Ogni profilo ha il suo archivio cifrato separato.")}</p>
  <div class="list" style="margin-top:6px">${Accounts.list().map(a => `<div class="item"><span class="miniav">${ini(a.name || a.email)}</span><div class="grow"><div class="t">${esc(a.name || t("Profilo senza nome"))}${Accounts.acc && Accounts.acc.id === a.id ? ` <span class="pill c-good">${t("in uso")}</span>` : ""}</div><div class="m">${esc(a.email || "")}</div></div></div>`).join("")}</div>
  <div class="row" style="margin-top:10px"><button class="btn" data-a="switchProfile">${t("Cambia profilo")}</button><button class="btn" data-a="newProfileFromApp">+ ${t("Nuovo profilo")}</button><button class="btn danger" data-a="delProfile">${t("Elimina questo profilo")}</button></div></section>`)(R.profilo);
A.newProfileFromApp = () => confirmSheet(t("Per creare un nuovo profilo l'app si blocca. Continuare?"), async () => { await App.lock(); Lock.signup(false); });
A.delProfile = () => {
  sheet(`<h2>${t("Elimina questo profilo")}</h2><p class="sub">${t("Vengono cancellati da questo dispositivo il profilo e tutti i suoi dati. Fai prima un backup se vuoi conservarli. Per confermare scrivi ELIMINA e la tua password.")}</p>
   <form id="dpf" class="col"><input type="text" id="dpW" placeholder="ELIMINA" autocomplete="off"><input type="password" id="dpPw" placeholder="${t("Password")}" autocomplete="current-password"><div class="warn" id="dpErr"></div><div class="row end"><button type="button" class="btn" data-a="closeSheetBtn">${t("Annulla")}</button><button class="btn danger">${t("Elimina definitivamente")}</button></div></form>`);
  $("#dpf").onsubmit = async e => { e.preventDefault(); if ($("#dpW").value.trim().toUpperCase() !== "ELIMINA") { $("#dpErr").textContent = t("Scrivi ELIMINA per confermare."); return; } try { const raw = await Store.unwrap($("#dpPw").value); raw.fill(0); } catch (err) { $("#dpErr").textContent = t("Password errata."); return; } closeSheet(); App.unlocked = false; Store.lock(); Prefs.set("lastEmail", ""); await Lock.wipeAll(); };
};

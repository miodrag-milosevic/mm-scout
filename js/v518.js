/* MM Scout 0.6 (beta) — Committenti: per chi lavori (club, agenzie, agenti, freelance) e tutto il lavoro diviso per committente.
   © Miodrag Milosevic. Vietato divulgare, copiare o modificare senza consenso dell'autore. */
"use strict";
// Orgs è dichiarato con const in pro2.js: lo rendo visibile anche come window.Orgs,
// così i moduli di partita, giocatore e valutazione mostrano «Per conto di».
window.Orgs = Orgs;

/* ---------- 1. tipi e dati del committente ---------- */
for (const x of [["academy", "Accademia / scuola calcio"], ["media", "Media / piattaforma dati"]]) if (!ORG_TYPES.some(o => o[0] === x[0])) ORG_TYPES.splice(ORG_TYPES.length - 1, 0, x);
const ORG_COLORS = ["#2F6690", "#1E6A47", "#7A4E9E", "#B8730F", "#8C3B3B", "#2D6E6E", "#5C7A29", "#4A4A4A"];
const orgColor = o => (o && o.color) || ORG_COLORS[Math.abs([...String(o && o.id || "")].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0)) % ORG_COLORS.length];
const orgTypeL = o => t((ORG_TYPES.find(x => x[0] === (o && o.type)) || ["", ""])[1]);
const ORG_COLLS = ["players", "matches", "evals", "tasks", "todos", "notes", "meetings", "staff", "ideals"];
// nei contatti dello staff «org» è già il nome scritto a mano del loro club: il committente va in «orgId»
const ORG_F = c => c === "staff" ? "orgId" : "org";
const orgOf = (c, x) => (x && x[ORG_F(c)]) || "";
const orgRec = (c, oid) => [...S[c].entries()].filter(([, x]) => x && !x.archived && (oid === "_none" ? !orgOf(c, x) && !x.example : orgOf(c, x) === oid));
function orgStats(oid) {
  const td = today(); const m = orgRec("matches", oid);
  return { players: orgRec("players", oid).length, next: m.filter(([, x]) => x.status !== "vista" && (x.date || "") >= td).length, seen: m.filter(([, x]) => x.status === "vista").length, evals: orgRec("evals", oid).length,
    tasks: orgRec("tasks", oid).filter(([, x]) => x.status !== "done").length, todos: orgRec("todos", oid).filter(([, x]) => !x.done && x.status !== "done").length, notes: orgRec("notes", oid).length,
    meets: orgRec("meetings", oid).length, staff: orgRec("staff", oid).length, ideals: orgRec("ideals", oid).length };
}

// modulo del committente più completo: referente, contatti, cosa chiede, colore
A.editOrg = el => {
  const id = el && el.dataset && el.dataset.id; const used = Orgs.list().map(x => orgColor(x)); const o = id ? Orgs.get(id) : { type: "club", from: today(), color: ORG_COLORS.find(c => !used.includes(c)) || ORG_COLORS[Orgs.list().length % ORG_COLORS.length] };
  sheet(`<div class="row between"><h2>${id ? t("Modifica committente") : t("Aggiungi committente")}</h2><button class="iconbtn" data-a="closeSheetBtn" aria-label="${t("Chiudi")}">✕</button></div>
   <div class="oform"><div class="orow1"><label class="f a-n">${t("Nome")}<input type="text" id="orgN" maxlength="80" data-vrule="team" value="${esc(o.name)}" placeholder="${t("es. FC Esempio, Agenzia Esempio")}"></label>
    <label class="f a-c">${t("Colore")}<input type="color" id="orgC" value="${esc(orgColor(o))}" aria-label="${t("Colore")}"></label></div>
    <label class="f a-t">${t("Tipo")}<select id="orgT">${ORG_TYPES.map(([k, n]) => `<option value="${k}" ${o.type === k ? "selected" : ""}>${esc(t(n))}</option>`).join("")}</select></label>
    <label class="f a-f">${t("Dal")}<input type="date" id="orgF" value="${esc(o.from)}"></label><label class="f a-to">${t("Al")}<input type="date" id="orgTo" value="${esc(o.to)}"></label>
    <label class="f a-p">${t("Referente")}<input type="text" id="orgP" maxlength="80" data-vrule="person" value="${esc(o.person || "")}" placeholder="${t("es. Responsabile scouting")}"></label>
    <label class="f a-e">${t("Email")}<input type="email" id="orgE" maxlength="120" value="${esc(o.email || "")}" placeholder="nome@esempio.ch"></label>
    <label class="f full">${t("Cosa ti chiede")}<textarea id="orgW" maxlength="1500" placeholder="${t("es. terzini sinistri U19 per l'estate, 2 report al mese, campionati svizzeri")}">${esc(o.want || "")}</textarea></label>
    <label class="f full">${t("Accordo e note")}<textarea id="orgNo" maxlength="1500" placeholder="${t("es. rimborso trasferte, scadenze dei report, a chi mandarli")}">${esc(o.note || "")}</textarea></label></div>
   <div class="row between">${id ? `<button class="btn danger" id="orgDel">${t("Elimina")}</button>` : "<span></span>"}<div class="row"><button class="btn" data-a="closeSheetBtn">${t("Annulla")}</button><button class="btn pri" id="orgSave">${t("Salva")}</button></div></div>`);
  $("#orgSave").onclick = () => { const n = $("#orgN").value.trim(); if (!n) { toast(t("Scrivi il nome")); $("#orgN").focus(); return; } if (!vCheck($("#orgN"), false) || !vCheck($("#orgE"), false) || !vCheck($("#orgF"), false) || !vCheck($("#orgTo"), false)) return;
    const no = { ...(id ? Orgs.get(id) : {}), id: id || uid(), name: n, type: $("#orgT").value, color: $("#orgC").value, from: $("#orgF").value, to: $("#orgTo").value, person: $("#orgP").value.trim(), email: $("#orgE").value.trim(), want: $("#orgW").value.trim(), note: $("#orgNo").value.trim() };
    const l = Orgs.list().filter(x => x.id !== no.id); l.push(no); saveOrgs(l, Orgs.active() || no.id); closeSheet(); toast(t("Salvato")); render(true); };
  if ($("#orgDel")) $("#orgDel").onclick = () => { const n = ORG_COLLS.reduce((s, c) => s + orgRec(c, id).length, 0);
    confirmSheet(t("Eliminare il committente «{n}»? I {k} elementi collegati restano, ma senza committente.", { n: o.name, k: n }), () => { for (const c of ORG_COLLS) for (const [rid, x] of orgRec(c, id)) { const r = { ...x }; delete r[ORG_F(c)]; put(c, rid, r); }
      saveOrgs(Orgs.list().filter(x => x.id !== id), Orgs.active() === id ? "" : Orgs.active()); if (ui.orgSel === id) ui.orgSel = null; closeSheet(); toast(t("Committente eliminato")); render(true); }, t("Elimina")); };
};

/* ---------- 2. ogni elemento nuovo riceve il committente (quello filtrato o quello attivo) ---------- */
let ORG_P = null;
window.put = (orig => function (coll, id, v) {
  if (v && typeof v === "object" && !v.example && ORG_COLLS.includes(coll)) { const f = ORG_F(coll);
    if (ORG_P && ORG_P.coll === coll) { if (ORG_P.v) v[f] = ORG_P.v; else delete v[f]; }
    else if (!(f in v) && !S[coll].has(id) && Orgs.cur()) v[f] = Orgs.cur();
    // chi l'ha creato e quando l'ha modificato: per giocatori, partite e report lo fa già put(), qui per tutto il resto
    if (!["players", "matches", "evals"].includes(coll) && window.Author) try { Author.stamp(v); } catch (e) { }
  }
  return orig.apply(this, arguments);
})(window.put);
put = window.put;
const ORG_SHEETS = [["taskSheet", "tasks", "#tkSave"], ["meetSheet", "meetings", "#mtSave"], ["todoSheet", "todos", '[data-a="todoSave"]'], ["noteSheet", "notes", '[data-a="noteSave"]'], ["staffSheet", "staff", "#sfSave"]];
for (const [fn, coll] of ORG_SHEETS) if (typeof window[fn] === "function") {
  window[fn] = (orig => function (id) { const r = orig.apply(this, arguments); try { if (Orgs.list().length && !$("#xOrgSel")) { const rec = id ? S[coll].get(id) : null; const v = rec ? orgOf(coll, rec) : Orgs.cur();
      const html = `<label class="f xorg">${t("Per conto di")}<select id="xOrgSel"><option value="">— ${t("nessuno")} —</option>${Orgs.list().map(o => `<option value="${o.id}" ${o.id === v ? "selected" : ""}>${esc(o.name)}</option>`).join("")}</select></label>`;
      const grid = $("#sheetRoot .fgrid"); if (grid) grid.insertAdjacentHTML("beforeend", html); else { const acts = [...$$("#sheetRoot .row.between")].pop(); if (acts) acts.insertAdjacentHTML("beforebegin", `<div class="fgrid">${html}</div>`); } } } catch (e) { } return r; })(window[fn]);
}
taskSheet = window.taskSheet; meetSheet = window.meetSheet; todoSheet = window.todoSheet; noteSheet = window.noteSheet; staffSheet = window.staffSheet;
document.addEventListener("click", e => { const s = $("#xOrgSel"); if (!s) return; for (const [, coll, sel] of ORG_SHEETS) if (e.target.closest && e.target.closest("#sheetRoot " + sel)) { ORG_P = { coll, v: s.value }; setTimeout(() => { ORG_P = null; }, 0); return; } }, true);

// negli elenchi si vede per chi è (solo se hai almeno un committente)
const orgTag = (o, c) => { const id = orgOf(c || "players", o); const g = id && Orgs.get(id); return g ? ` <span class="orgtag" style="--oc:${esc(orgColor(g))}" title="${t("per conto di {n}", { n: esc(g.name) })}">${esc(g.name)}</span>` : ""; };
const addOrgTag = (h, o) => { const tg = orgTag(o); if (!tg) return h; const i = h.indexOf('<div class="m">'); if (i < 0) return h; const j = h.indexOf("</div>", i); return j < 0 ? h : h.slice(0, j) + tg + h.slice(j); };
window.playerItem = (orig => function (id, p) { return addOrgTag(orig.apply(this, arguments), p); })(window.playerItem); playerItem = window.playerItem;
window.matchItem = (orig => function (id, m) { return addOrgTag(orig.apply(this, arguments), m); })(window.matchItem); matchItem = window.matchItem;
window.evalItem = (orig => function (id, e) { return addOrgTag(orig.apply(this, arguments), e); })(window.evalItem); evalItem = window.evalItem;

/* ---------- 3. pagina «Committenti» ---------- */
ICONS.committenti = '<path d="M3 21V7l7-4v4l7-4v4h4v14zm2-2h4v-3h2v3h8V9h-4V6.5l-5 2.9V6.5L5 9.4zm2-8h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/>';
PAGE_DESC.committenti = "Per chi lavori: club, agenzie, agenti o progetti personali. Qui vedi giocatori, partite, report e incarichi divisi per committente.";
if (typeof VIEW_L !== "undefined") VIEW_L.committenti = "Committenti";
window.views = (orig => function () { const v = orig(); if (!v.some(x => x !== "-" && x[0] === "committenti")) { const i = v.findIndex(x => x !== "-" && x[0] === "staff"); v.splice(i >= 0 ? i + 1 : v.length, 0, ["committenti", t("Committenti")]); } return v; })(window.views);
views = window.views;
if (typeof NAV_GROUPS !== "undefined") { const g = NAV_GROUPS.find(x => x[1].includes("staff")) || NAV_GROUPS[1]; if (!g[1].includes("committenti")) g[1].splice(g[1].indexOf("staff") + 1, 0, "committenti"); }

const sCnt = (n, l, a, v) => `<button type="button" class="ocnt" data-a="orgJump" data-v="${a}" data-id="${v}"><b>${n}</b><span>${l}</span></button>`;
function orgCard(o, act, sel) {
  const s = orgStats(o.id); const per = o.from && o.to ? fmtDate(o.from) + " – " + fmtDate(o.to) : o.from ? t("dal {d}", { d: fmtDate(o.from) }) : o.to ? t("fino al {d}", { d: fmtDate(o.to) }) : "";
  return `<div class="ocard${sel ? " on" : ""}" style="--oc:${esc(orgColor(o))}"><div class="row between" style="gap:8px;flex-wrap:nowrap"><button type="button" class="grow otitle" data-a="orgOpen" data-id="${o.id}"><b>${esc(o.name)}${o.example ? ` <span class="ex">${t("Esempio")}</span>` : ""}</b>${act ? ` <span class="pill c-good">${t("attivo")}</span>` : ""}<span class="m">${esc(orgTypeL(o))}${per ? " · " + per : ""}${o.person ? " · " + esc(o.person) : ""}</span></button><button class="btn sm ghost" data-a="editOrg" data-id="${o.id}" aria-label="${t("Modifica")}">✎</button></div>
   <div class="ocnts">${sCnt(s.tasks + s.todos, t("da fare"), "todo", o.id)}${sCnt(s.next, t("partite in programma"), "match", o.id)}${sCnt(s.players, t("giocatori"), "pl", o.id)}${sCnt(s.evals, t("report"), "ev", o.id)}</div>
   <div class="row" style="gap:6px;margin-top:8px"><button class="btn sm${sel ? " pri" : ""}" data-a="orgOpen" data-id="${o.id}">${t("Apri")}</button>${act ? "" : `<button class="btn sm ghost" data-a="setActOrg" data-id="${o.id}">${t("Rendi attivo")}</button>`}</div></div>`;
}
function orgDetail(oid) {
  const o = oid === "_none" ? { id: "_none", name: t("Senza committente") } : Orgs.get(oid); if (!o) return "";
  const td = today(); const tasks = orgRec("tasks", oid).filter(([, x]) => x.status !== "done").sort((a, b) => (a[1].due || "9").localeCompare(b[1].due || "9"));
  const todos = orgRec("todos", oid).filter(([, x]) => !x.done && x.status !== "done").sort((a, b) => (a[1].due || "9").localeCompare(b[1].due || "9"));
  const ms = orgRec("matches", oid).sort((a, b) => (b[1].date || "").localeCompare(a[1].date || "")); const next = ms.filter(([, m]) => m.status !== "vista" && (m.date || "") >= td).reverse(), seen = ms.filter(([, m]) => m.status === "vista");
  const pls = orgRec("players", oid).sort((a, b) => pname(a[1]).localeCompare(pname(b[1]))); const evs = orgRec("evals", oid).sort((a, b) => (b[1].date || "").localeCompare(a[1].date || "")); const ns = orgRec("notes", oid);
  const mts = orgRec("meetings", oid).sort((a, b) => (b[1].date || "").localeCompare(a[1].date || "")); const sf = orgRec("staff", oid).sort((a, b) => cmpTxt(a[1].name || "", b[1].name || "")); const ids = orgRec("ideals", oid);
  const sec = (k, title, n, body, add) => `<section class="panel osec" id="osec-${k}"><div class="row between"><h2>${title} <span class="m">${n}</span></h2>${add || ""}</div>${n ? body : `<p class="m">${t("Ancora niente qui.")}</p>`}</section>`;
  const pl = id => { const p = P(id); return p ? esc(pname(p)) : ""; };
  const taskRow = ([id, x]) => `<div class="item click" data-a="editTask" data-id="${id}"><span class="pill">🎯</span><div class="grow"><div class="t">${pl(x.playerId) || t("Incarico")}${x.position ? ` · ${esc(x.position)}` : ""}</div><div class="m">${x.due ? `${x.due < td ? `<b class="tm">${t("scaduto")}</b> · ` : ""}${t("entro il {d}", { d: fmtDate(x.due) })} · ` : ""}${esc(x.what || "")}</div></div></div>`;
  const todoRow = ([id, x]) => `<div class="item click" data-a="todoEdit" data-id="${id}"><span class="pill">☑️</span><div class="grow"><div class="t">${esc(x.title || x.text || "")}</div><div class="m">${x.due ? (x.due < td ? `<b class="tm">${t("scaduto")}</b> · ` : "") + fmtDate(x.due) : t("senza data")}</div></div></div>`;
  const info = o.id === "_none" ? `<p class="m">${t("Elementi creati senza committente: aprili e scegli «Per conto di» per assegnarli.")}</p>` : `${o.want ? `<div class="banner info small" style="margin-top:8px"><b>${t("Cosa ti chiede")}:</b> ${esc(exOrgTxt(o, "want"))}</div>` : ""}${o.note ? `<p class="m" style="margin-top:6px"><b>${t("Accordo e note")}:</b> ${esc(exOrgTxt(o, "note"))}</p>` : ""}${o.email ? `<p class="m"><a href="mailto:${esc(o.email)}">${esc(o.email)}</a></p>` : ""}`;
  const newBtns = o.id === "_none" ? "" : `<div class="row" style="gap:6px;margin-top:10px;flex-wrap:wrap"><button class="btn sm pri" data-a="orgNew" data-k="task" data-id="${o.id}">+ ${t("Incarico")}</button><button class="btn sm" data-a="orgNew" data-k="todo" data-id="${o.id}">+ ${t("Impegno")}</button><button class="btn sm" data-a="orgNew" data-k="match" data-id="${o.id}">+ ${t("Partita")}</button><button class="btn sm" data-a="orgNew" data-k="meet" data-id="${o.id}">+ ${t("Riunione")}</button><button class="btn sm" data-a="orgNew" data-k="note" data-id="${o.id}">+ ${t("Nota")}</button><button class="btn sm" data-a="orgNew" data-k="staff" data-id="${o.id}">+ ${t("Contatto")}</button><button class="btn sm ghost" data-a="orgCopy" data-id="${o.id}">⧉ ${t("Copia riepilogo")}</button></div>
    <div class="ojump"><span class="m small">${t("Apri le pagine solo con il suo lavoro")}:</span>${[["panoramica", "Panoramica"], ["calendario", "Agenda"], ["partite", "Partite"], ["giocatori", "Giocatori"], ["report", "Report"], ["staff", "Staff e riunioni"], ["dati", "Dati"]].map(([v, n]) => `<button type="button" class="lnk" data-a="orgView" data-id="${o.id}" data-v="${v}">${t(n)}</button>`).join("")}</div>`;
  return `<section class="panel odetail" style="--oc:${esc(orgColor(o))}"><div class="row between"><h2><span class="tdot" style="background:var(--oc)"></span> ${esc(o.name)}</h2><button class="btn sm ghost" data-a="orgOpen" data-id="">${t("Chiudi")}</button></div>${info}${newBtns}</section>
   ${sec("todo", t("Da fare e incarichi"), tasks.length + todos.length, `<div class="list">${tasks.map(taskRow).join("")}${todos.map(todoRow).join("")}</div>`)}
   ${sec("match", t("Partite"), ms.length, `${next.length ? `<h3 class="dhead">${t("In programma")}</h3><div class="list">${next.map(([id, m]) => matchItem(id, m)).join("")}</div>` : ""}${seen.length ? `<h3 class="dhead">${t("Già viste")}</h3><div class="list">${seen.slice(0, 20).map(([id, m]) => matchItem(id, m)).join("")}</div>` : ""}`)}
   ${sec("pl", t("Giocatori"), pls.length, `<div class="list">${pls.slice(0, 60).map(([id, p]) => playerItem(id, p)).join("")}</div>`)}
   ${sec("ev", t("Report"), evs.length, `<div class="list">${evs.slice(0, 30).map(([id, e]) => evalItem(id, e, true)).join("")}</div>`)}
   ${sec("ideal", t("Profili ideali"), ids.length, `<div class="list">${ids.map(([id, x]) => `<div class="item click" data-a="openIdeal" data-id="${id}"><span class="pill">⭐</span><div class="grow"><div class="t">${esc(x.name || "—")}</div><div class="m">${esc(roleL(x.role) || "—")}${x.system ? " · " + esc(x.system) : ""} · ${t("{n} requisiti", { n: (x.req || []).length })}</div></div></div>`).join("")}</div>`)}
   ${sec("meet", t("Riunioni"), mts.length, `<div class="list">${mts.slice(0, 30).map(([id, m]) => meetingItem(id, m)).join("")}</div>`)}
   ${sec("staff", t("Contatti"), sf.length, `<div class="list">${sf.map(([id, x]) => `<div class="item click" data-a="editStaff" data-id="${id}"><div class="avatar">${esc((x.name || "?").split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase())}</div><div class="grow"><div class="t">${esc(x.name || "—")}</div><div class="m">${esc(staffRoleL(x.role))}${x.email ? " · " + esc(x.email) : ""}${x.phone ? " · " + esc(x.phone) : ""}</div></div></div>`).join("")}</div>`)}
   ${sec("note", t("Note"), ns.length, `<div class="ngrid">${ns.map(([id, n]) => noteCard(id, n)).join("")}</div>`)}`;
}
R.committenti = () => {
  const l = Orgs.list(), act = Orgs.active(); const none = orgStats("_none"); const noneN = none.players + none.next + none.seen + none.evals + none.tasks + none.todos + none.notes + none.meets + none.staff + none.ideals;
  if (ui.orgSel && ui.orgSel !== "_none" && !Orgs.get(ui.orgSel)) ui.orgSel = null;
  const head = `<div class="head"><div><h1>${t("Committenti")}</h1><p class="sub">${t(PAGE_DESC.committenti)}</p></div><button class="btn pri" data-a="editOrg">+ ${t("Aggiungi committente")}</button></div>`;
  if (!l.length) return head + `<section class="panel"><div class="empty">🏢 ${t("Ancora nessun committente.")}<br><span class="m">${t("Aggiungi il club, l'agenzia o l'agente per cui lavori. Se lavori da freelance, aggiungine uno per ogni cliente e, se vuoi, «Lavoro personale» per la tua pratica.")}</span><div class="row" style="justify-content:center;margin-top:12px;gap:8px"><button class="btn pri" data-a="editOrg">+ ${t("Aggiungi committente")}</button></div></div></section>`;
  return head + `<section class="panel"><div class="row between" style="flex-wrap:wrap;gap:8px"><h2>${t("Committente attivo")}</h2><span class="m small">${t("Tutto quello che crei viene segnato con il committente attivo. Lo puoi cambiare su ogni elemento.")}</span></div>
     <div class="seg oseg" role="group" style="margin-top:8px"><button data-a="setActOrg" data-id="" aria-pressed="${!act}">${t("Nessuno")}</button>${l.map(o => `<button data-a="setActOrg" data-id="${o.id}" aria-pressed="${act === o.id}"><span class="tdot" style="background:${esc(orgColor(o))}"></span>${esc(o.name)}</button>`).join("")}</div></section>
   <div class="ogrid">${l.map(o => orgCard(o, o.id === act, ui.orgSel === o.id)).join("")}${noneN ? `<div class="ocard onone${ui.orgSel === "_none" ? " on" : ""}"><button type="button" class="otitle" data-a="orgOpen" data-id="_none"><b>${t("Senza committente")}</b><span class="m">${t("{n} elementi tuoi da assegnare", { n: noneN })}</span></button><div class="row" style="margin-top:8px"><button class="btn sm" data-a="orgOpen" data-id="_none">${t("Apri")}</button></div></div>` : ""}</div>
   ${ui.orgSel ? orgDetail(ui.orgSel) : `<p class="m">${t("Tocca «Apri» su un committente per vedere tutto il lavoro per lui.")}</p>`}`;
};
function orgSummary(oid) {
  const o = Orgs.get(oid); if (!o) return ""; const td = today(); const L1 = [];
  L1.push(t("Riepilogo del lavoro per {n}", { n: o.name }) + " · " + fmtDate(td)); L1.push("");
  const tasks = orgRec("tasks", oid).filter(([, x]) => x.status !== "done"); if (tasks.length) { L1.push(t("Incarichi aperti") + ":"); for (const [, x] of tasks) L1.push("- " + [P(x.playerId) ? pname(P(x.playerId)) : "", x.position, x.due ? t("entro il {d}", { d: fmtDate(x.due) }) : ""].filter(Boolean).join(" · ")); L1.push(""); }
  const tds = orgRec("todos", oid).filter(([, x]) => x.status !== "done"); if (tds.length) { L1.push(t("Da fare") + ":"); for (const [, x] of tds) L1.push("- " + [x.title, x.due ? t("entro il {d}", { d: fmtDate(x.due) }) : ""].filter(Boolean).join(" · ")); L1.push(""); }
  const next = orgRec("matches", oid).filter(([, m]) => m.status !== "vista" && (m.date || "") >= td).sort((a, b) => (a[1].date || "").localeCompare(b[1].date || "")); if (next.length) { L1.push(t("Partite in programma") + ":"); for (const [, m] of next) L1.push(`- ${fmtDate(m.date)} ${m.home || "?"} – ${m.away || "?"}`); L1.push(""); }
  const evs = orgRec("evals", oid).sort((a, b) => (b[1].date || "").localeCompare(a[1].date || "")).slice(0, 15); if (evs.length) { L1.push(t("Report") + ":"); for (const [, e] of evs) L1.push(`- ${fmtDate(e.date)} ${P(e.playerId) ? pname(P(e.playerId)) : ""} · ${f1(evalRating(e))}`); L1.push(""); }
  const mt = orgRec("meetings", oid).filter(([, m]) => (m.date || "") >= td).sort((a, b) => (a[1].date || "").localeCompare(b[1].date || "")); if (mt.length) { L1.push(t("Prossime riunioni") + ":"); for (const [, m] of mt) L1.push(`- ${fmtDate(m.date)}${m.time ? " " + m.time : ""} ${m.title || t("Riunione")}`); L1.push(""); }
  L1.push(t("Giocatori seguiti: {n}", { n: orgRec("players", oid).length })); return L1.join("\n");
}
Object.assign(A, {
  orgOpen: el => { ui.orgSel = el.dataset.id || null; render(true); if (ui.orgSel) setTimeout(() => { const d = $("#view .odetail"); if (d) d.scrollIntoView({ behavior: "smooth", block: "start" }); }, 30); },
  orgJump: el => { ui.orgSel = el.dataset.id; render(true); setTimeout(() => { const d = $("#osec-" + el.dataset.v); if (d) d.scrollIntoView({ behavior: "smooth", block: "start" }); }, 30); },
  orgNew: el => { const oid = el.dataset.id, k = el.dataset.k;
    if (k === "task") taskSheet(null); else if (k === "todo") todoSheet(null); else if (k === "note") noteSheet(null); else if (k === "meet") meetSheet(null); else if (k === "staff") staffSheet(null); else matchForm(null);
    const s = $("#xOrgSel") || $("#mOrg"); if (s) s.value = oid; },
  orgCopy: el => { const txt = orgSummary(el.dataset.id); navigator.clipboard.writeText(txt).then(() => toast(t("Riepilogo copiato"))).catch(() => { sheet(`<h2>${t("Riepilogo")}</h2><textarea id="orgSum" style="min-height:260px">${esc(txt)}</textarea><button class="btn" data-a="closeSheetBtn">${t("Chiudi")}</button>`); $("#orgSum").select(); }); }
});
// il vecchio riquadro nel Profilo scout rimanda alla nuova pagina
R.profilo = (orig => () => { const h = orig(); const old = orgsPanel(); if (!h.includes(old)) return h; const l = Orgs.list();
  return h.replace(old, `<section class="panel"><div class="row between"><div><h2>${t("Per chi lavoro")}</h2><p class="sub small">${l.length ? l.map(o => esc(o.name)).join(" · ") : t("Nessun committente.")}</p></div><button class="btn sm" data-a="menuGo" data-v="committenti">${t("Gestisci i committenti")} →</button></div></section>`); })(R.profilo);

/* ---------- 4. profili ideali: anche loro hanno il committente ---------- */
if (typeof window.idealEditor === "function") {
  window.idealEditor = (orig => function () { const d = ui.idraft; if (d && !("org" in d) && !d._id && Orgs.cur()) d.org = Orgs.cur(); let h = orig.apply(this, arguments);
    if (Orgs.list().length && d) { const i = h.indexOf("</div></section>"); if (i > 0) h = h.slice(0, i) + `<label class="f">${t("Per conto di")}<select id="idOrg"><option value="">— ${t("nessuno")} —</option>${Orgs.list().map(o => `<option value="${o.id}" ${o.id === d.org ? "selected" : ""}>${esc(o.name)}</option>`).join("")}</select></label>` + h.slice(i); }
    return h; })(window.idealEditor);
  idealEditor = window.idealEditor;
}
if (typeof window.syncIdeal === "function") { window.syncIdeal = (orig => function () { orig.apply(this, arguments); const s = $("#idOrg"); if (s && ui.idraft) { if (s.value) ui.idraft.org = s.value; else delete ui.idraft.org; } })(window.syncIdeal); syncIdeal = window.syncIdeal; }

/* ---------- 5. etichetta del committente su tutti gli elenchi ----------
   giocatori, partite e report la mettono già i loro elenchi; qui aggiungo riunioni, incarichi,
   cose da fare, note, contatti dello staff e profili ideali, ovunque compaiano (anche in Agenda e Panoramica). */
// la riga grigia (.m) non viene mai tagliata con «…»: l'etichetta resta sempre leggibile
const ORG_DECO = [["todoEdit", "todos", ".m, .t"], ["openMeet", "meetings", ".m, .t"], ["noteOpen", "notes", ".nm"], ["openIdeal", "ideals", ".m, h2, .t"], ["runTask", "tasks", ".m, .t", ".item"], ["editStaff", "staff", ".m, .t", ".item"]];
function orgDecorate(root) {
  if (!root || !Orgs.list().length) return;
  for (const [a, c, tsel, up] of ORG_DECO) for (const el of root.querySelectorAll(`[data-a="${a}"][data-id]`)) {
    const box = up ? el.closest(up) : el; if (!box || box.dataset.og) continue; box.dataset.og = "1";
    const x = S[c].get(el.dataset.id); const tg = orgTag(x, c); if (!tg) continue; const tgt = tsel.split(",").map(q => box.querySelector(q.trim())).find(Boolean); if (tgt && !tgt.querySelector(".orgtag")) tgt.insertAdjacentHTML("beforeend", tg);
  }
}
let orgDecoQ = 0;
const orgDecoRun = () => { if (orgDecoQ) return; orgDecoQ = requestAnimationFrame(() => { orgDecoQ = 0; try { orgDecorate($("#view")); orgDecorate($("#sheetRoot")); } catch (e) { } }); };
try { const mo = new MutationObserver(orgDecoRun); for (const sel of ["#view", "#sheetRoot"]) { const n = $(sel); if (n) mo.observe(n, { childList: true, subtree: true }); } } catch (e) { }

/* ---------- 6. «Lavoro per»: ogni pagina mostra solo il lavoro di un committente ----------
   Il filtro vale per la sessione: Panoramica, Agenda, Partite, Giocatori, Report, Staff e riunioni,
   Profili ideali, Note e Dati. I nuovi elementi creati con il filtro attivo vanno a quel committente. */
const ORG_PAGES = { panoramica: ["players", "matches", "evals", "tasks", "todos", "notes", "meetings"], calendario: ["matches", "todos", "meetings", "tasks"], partite: ["matches"], giocatori: ["players"], report: ["evals"],
  staff: ["meetings", "tasks", "staff", "ideals"], profili: ["ideals"], note: ["notes"], dati: ["players", "evals", "matches"] };
// Map «filtrata»: negli elenchi vedi solo il committente scelto, ma get/has e i salvataggi lavorano sui dati veri
class OrgView extends Map {
  constructor(real, keep) { super(); this._r = real; for (const [k, v] of real) if (keep(v)) super.set(k, v); }
  get(k) { return this._r.get(k); } has(k) { return this._r.has(k); }
  set(k, v) { this._r.set(k, v); return super.set(k, v); } delete(k) { this._r.delete(k); return super.delete(k); } clear() { this._r.clear(); return super.clear(); }
}
// nelle pagine di dettaglio (un giocatore, una partita, una riunione…) il filtro non serve
const ORG_SUB = { giocatori: () => ui.playerId || ui.pdraft, partite: () => ui.matchId, report: () => ui.edraft, staff: () => ui.meetId, profili: () => ui.idraft || ui.idealId };
const orgSub = pg => !!(ORG_SUB[pg] && ORG_SUB[pg]());
function orgBar() {
  const f = ui.orgF || "", g = Orgs.get(f); const opts = `<option value="">${t("Tutti i committenti")}</option>${Orgs.list().map(o => `<option value="${o.id}" ${o.id === f ? "selected" : ""}>${esc(o.name)}</option>`).join("")}<option value="_none" ${f === "_none" ? "selected" : ""}>${t("Senza committente")}</option>`;
  return `<div class="orgbar${f ? " on" : ""} noprint" style="--oc:${esc(g ? orgColor(g) : "var(--muted)")}"><label for="orgFSel">${f ? "<span class=\"tdot\" style=\"background:var(--oc)\"></span>" : ""}${t("Mostra il lavoro di")}</label><select id="orgFSel" data-orgf>${opts}</select>${f ? `<span class="m small grow">${t("Vedi solo questo lavoro.")}</span><button type="button" class="btn sm ghost" data-a="orgFClear" aria-label="${t("Mostra tutto")}" title="${t("Mostra tutto")}">✕<span class="obt"> ${t("Mostra tutto")}</span></button>` : ""}</div>`;
}
for (const [pg, colls] of Object.entries(ORG_PAGES)) if (typeof R[pg] === "function") R[pg] = (orig => function () {
  if (!Orgs.list().length) { if (ui.orgF) ui.orgF = ""; return orig.apply(this, arguments); }
  if (ui.orgF && ui.orgF !== "_none" && !Orgs.get(ui.orgF)) ui.orgF = "";
  if (orgSub(pg)) return orig.apply(this, arguments);
  const f = ui.orgF; if (!f) return orgBar() + orig.apply(this, arguments);
  const keep = c => x => x && (f === "_none" ? !orgOf(c, x) : orgOf(c, x) === f); const saved = {};
  for (const c of colls) { saved[c] = S[c]; S[c] = new OrgView(saved[c], keep(c)); }
  try { return orgBar() + orig.apply(this, arguments); } finally { for (const c of colls) S[c] = saved[c]; }
})(R[pg]);
document.addEventListener("change", e => { if (e.target && e.target.id === "orgFSel") { ui.orgF = e.target.value; render(true); } });
A.orgFClear = () => { ui.orgF = ""; render(true); };
// dal Committente si può aprire direttamente ogni pagina già filtrata
A.orgView = el => { ui.orgF = el.dataset.id; resetSub(); closeSheet(); go(el.dataset.v || "panoramica"); };

"use strict";
/* =========================================================
   MM Scout — staff, riunioni e incarichi:
   · contatti dello staff (direttore sportivo, capo scout,
     direttore tecnico, allenatore…);
   · riunioni nel calendario, con ordine del giorno,
     giocatori da discutere e decisioni;
   · incarichi di visione singola: chi guardare, in quale
     partita, cosa osservare, per chi, entro quando. Con
     «Avvia visione» si apre la partita con un solo
     giocatore in primo piano per tutta la gara.
   ========================================================= */
const STAFF_ROLES = [["ds", "Direttore sportivo"], ["chief", "Capo scout"], ["dt", "Direttore tecnico"], ["coach", "Allenatore"], ["scout", "Scout"], ["analyst", "Match analyst"], ["agent", "Agente"], ["other", "Altro"]];
const TASK_ST = [["todo", "Da fare", "c-blue"], ["doing", "In corso", "c-amber"], ["done", "Fatto", "c-good"]];
const staffRoleL = k => t((STAFF_ROLES.find(x => x[0] === k) || ["", ""])[1]);
const staffName = id => { const s = S.staff.get(id); return s ? s.name : ""; };
const taskSt = k => TASK_ST.find(x => x[0] === k) || TASK_ST[0];

/* ---------- pagina «Staff e riunioni» ---------- */
R.staff = () => {
  const tab = ui.stTab || "meet"; const tabs = [["meet", t("Riunioni")], ["tasks", t("Incarichi")], ["people", t("Staff")]];
  const add = { meet: `<button class="btn pri" data-a="editMeet">+ ${t("Riunione")}</button>`, tasks: `<button class="btn pri" data-a="editTask">+ ${t("Incarico")}</button>`, people: `<button class="btn pri" data-a="editStaff">+ ${t("Contatto")}</button>` }[tab];
  return `<div class="head"><div><h1>${t("Staff e riunioni")}</h1><p class="sub">${t("Le persone con cui lavori, le riunioni e gli incarichi: chi guardare, dove e perché.")}</p></div>${add}</div>
   <div class="tabs">${tabs.map(([k, n]) => `<button data-a="stTab" data-t="${k}" aria-pressed="${tab === k}">${n}</button>`).join("")}</div>
   ${tab === "meet" ? meetingsList() : tab === "tasks" ? tasksList() : staffList()}`;
};
function staffList() {
  const l = [...S.staff.entries()].sort((a, b) => (a[1].name || "").localeCompare(b[1].name || ""));
  return `<section class="panel"><div class="list">${l.map(([id, s]) => `<div class="item"><div class="avatar">${esc((s.name || "?").split(/\s+/).map(x => x[0]).join("").slice(0, 2).toUpperCase())}</div><div class="grow"><div class="t">${esc(s.name)}${exB(s)}</div><div class="m">${esc(staffRoleL(s.role))}${s.org ? " · " + esc(s.org) : ""}</div><div class="row small" style="margin-top:4px">${s.email ? `<a href="mailto:${esc(s.email)}">✉ ${esc(s.email)}</a>` : ""}${s.phone ? `<a href="tel:${esc(s.phone.replace(/\s/g, ""))}">☎ ${esc(s.phone)}</a>` : ""}</div></div><button class="btn sm ghost" data-a="editStaff" data-id="${id}">${t("Modifica")}</button></div>`).join("") || `<div class="empty">${t("Nessun contatto. Aggiungi direttore sportivo, capo scout, allenatore…")}</div>`}</div></section>`;
}
function meetingItem(id, mt) {
  const tasks = [...S.tasks.values()].filter(x => x.meetingId === id);
  return `<div class="item click" data-a="openMeet" data-id="${id}"><div class="mono small" style="width:54px">${fmtDate(mt.date).slice(0, 5)}<br>${esc(mt.time || "")}</div><div class="grow"><div class="t">${esc(mt.title || t("Riunione"))}${exB(mt)}</div><div class="m">${(mt.people || []).map(staffName).filter(Boolean).map(esc).join(", ") || "—"}${(mt.players || []).length ? " · " + t("{n} giocatori", { n: mt.players.length }) : ""}${tasks.length ? " · " + t("{n} incarichi", { n: tasks.length }) : ""}</div></div><span class="pill ${mt.date < today() ? "c-grey" : "c-blue"}">${mt.date < today() ? t("Fatta") : t("In programma")}</span></div>`;
}
function meetingsList() {
  if (ui.meetId && S.meetings.has(ui.meetId)) return meetingPage(ui.meetId);
  const l = [...S.meetings.entries()].sort((a, b) => (b[1].date || "").localeCompare(a[1].date || "")); const up = l.filter(([, m]) => m.date >= today()).reverse(), past = l.filter(([, m]) => m.date < today());
  return `<div class="grid2"><section class="panel"><h2>${t("Prossime riunioni")}</h2><div class="list" style="margin-top:6px">${up.map(([id, m]) => meetingItem(id, m)).join("") || `<div class="empty">${t("Nessuna riunione in programma.")}</div>`}</div></section>
   <section class="panel"><h2>${t("Riunioni passate")}</h2><div class="list" style="margin-top:6px">${past.map(([id, m]) => meetingItem(id, m)).join("") || `<div class="empty">${t("Nessuna riunione.")}</div>`}</div></section></div>`;
}
function meetingPage(id) {
  const mt = S.meetings.get(id); const tasks = [...S.tasks.entries()].filter(([, x]) => x.meetingId === id);
  return `<div class="row between noprint"><button class="btn ghost sm" data-a="closeMeet">← ${t("Riunioni")}</button><div class="row"><button class="btn sm" data-a="icsMeet" data-id="${id}">${t("Aggiungi al Calendario")}</button><button class="btn sm" data-a="editMeet" data-id="${id}">${t("Modifica")}</button></div></div>
   <div class="head"><div><h1>${esc(mt.title || t("Riunione"))}${exB(mt)}</h1><p class="sub">${fmtDate(mt.date)} ${esc(mt.time || "")}${mt.place ? " · " + esc(mt.place) : ""}</p></div></div>
   <div class="grid2"><section class="panel"><h2>${t("Partecipanti")}</h2><div class="list" style="margin-top:6px">${(mt.people || []).map(sid => { const s = S.staff.get(sid); return s ? `<div class="item"><div class="grow"><div class="t">${esc(s.name)}</div><div class="m">${esc(staffRoleL(s.role))}</div></div>${s.email ? `<a class="btn sm" href="mailto:${esc(s.email)}">✉</a>` : ""}${s.phone ? `<a class="btn sm" href="tel:${esc(s.phone.replace(/\s/g, ""))}">☎</a>` : ""}</div>` : ""; }).join("") || `<p class="m">—</p>`}</div>
     ${mt.agenda ? `<h3 style="margin-top:12px">${t("Ordine del giorno")}</h3><p style="white-space:pre-wrap">${esc(mt.agenda)}</p>` : ""}${mt.notes ? `<h3 style="margin-top:12px">${t("Decisioni e note")}</h3><p style="white-space:pre-wrap">${esc(mt.notes)}</p>` : ""}</section>
    <section class="panel"><h2>${t("Giocatori da discutere")}</h2><div class="list" style="margin-top:6px">${(mt.players || []).filter(P).map(pid => playerItem(pid, P(pid))).join("") || `<p class="m">—</p>`}</div></section></div>
   <section class="panel"><div class="row between"><h2>${t("Incarichi decisi")}</h2><button class="btn sm" data-a="editTask" data-meet="${id}">+ ${t("Incarico")}</button></div><div class="list" style="margin-top:6px">${tasks.map(([tid, x]) => taskItem(tid, x)).join("") || `<p class="m">${t("Nessun incarico.")}</p>`}</div></section>`;
}
function taskItem(id, x) {
  const p = P(x.playerId), m = x.matchId ? S.matches.get(x.matchId) : null; const st = taskSt(x.status);
  return `<div class="item"><div class="grow"><div class="t">${p ? esc(pname(p)) : t("Giocatore da definire")}${x.position ? ` <span class="m">· ${esc(x.position)}</span>` : ""}${exB(x)}</div>
   <div class="m">${m ? `${fmtDate(m.date)} · ${esc(m.home)} – ${esc(m.away)}` : x.league ? esc(x.league) : t("Partita da scegliere")}${x.by ? " · " + t("per {n}", { n: esc(staffName(x.by)) }) : ""}${x.due ? " · " + t("entro il {d}", { d: fmtDate(x.due) }) : ""}</div>${x.what ? `<div class="small" style="margin-top:3px">🎯 ${esc(x.what)}</div>` : ""}</div>
   <span class="pill ${st[2]}">${t(st[1])}</span><div class="col" style="gap:4px"><button class="btn sm pri" data-a="runTask" data-id="${id}">▶ ${t("Avvia visione")}</button><button class="btn sm ghost" data-a="editTask" data-id="${id}">${t("Modifica")}</button></div></div>`;
}
function tasksList() {
  const l = [...S.tasks.entries()].sort((a, b) => (a[1].status === "done") - (b[1].status === "done") || (a[1].due || "9").localeCompare(b[1].due || "9"));
  return `<section class="panel"><p class="sub small">${t("Visione singola: un giocatore, per tutta la partita, con gli obiettivi decisi con lo staff.")}</p><div class="list" style="margin-top:8px">${l.map(([id, x]) => taskItem(id, x)).join("") || `<div class="empty">${t("Nessun incarico. Crea il primo: scegli il giocatore e cosa osservare.")}</div>`}</div></section>`;
}
/* ---------- schede di modifica ---------- */
function staffSheet(id) {
  const s = id ? S.staff.get(id) : { role: "ds" };
  sheet(`<h2>${id ? t("Modifica contatto") : t("Nuovo contatto")}</h2><div class="fgrid"><label class="f">${t("Nome e cognome")}<input type="text" id="sfN" value="${esc(s.name)}"></label><label class="f">${t("Ruolo")}<select id="sfR">${STAFF_ROLES.map(([k, n]) => `<option value="${k}" ${s.role === k ? "selected" : ""}>${esc(t(n))}</option>`).join("")}</select></label>
   <label class="f">${t("Club o agenzia")}<input type="text" id="sfO" value="${esc(s.org)}"></label><label class="f">${t("Email")}<input type="email" id="sfE" value="${esc(s.email)}"></label><label class="f">${t("Telefono")}<input type="tel" id="sfP" value="${esc(s.phone)}"></label><label class="f full">${t("Note")}<textarea id="sfNo">${esc(s.notes)}</textarea></label></div>
   <div class="row between">${id ? `<button class="btn danger" id="sfDel">${t("Elimina")}</button>` : "<span></span>"}<div class="row"><button class="btn" data-a="closeSheetBtn">${t("Annulla")}</button><button class="btn pri" id="sfSave">${t("Salva")}</button></div></div>`);
  $("#sfSave").onclick = () => { const n = $("#sfN").value.trim(); if (!n) { toast(t("Scrivi il nome")); return; } put("staff", id || uid(), { ...(id ? S.staff.get(id) : {}), name: n, role: $("#sfR").value, org: $("#sfO").value.trim(), email: $("#sfE").value.trim(), phone: $("#sfP").value.trim(), notes: $("#sfNo").value }); closeSheet(); render(true); };
  if ($("#sfDel")) $("#sfDel").onclick = () => { del("staff", id); closeSheet(); render(true); };
}
const chipsPick = (cid, items, sel) => `<input type="search" class="chipq" data-for="${cid}" placeholder="${t("Filtra")}" style="margin-bottom:6px"><div class="chips" id="${cid}" style="max-height:170px;overflow:auto">${items.map(([v, n]) => `<button type="button" class="chip" data-v="${v}" data-n="${esc(n.toLowerCase())}" aria-pressed="${sel.includes(v)}">${esc(n)}</button>`).join("") || `<span class="m">—</span>`}</div>`;
function bindChips() { $$(".chips[id]").forEach(c => c.onclick = e => { const b = e.target.closest(".chip"); if (b && b.dataset.v) b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") !== "true"); }); $$(".chipq").forEach(q => q.oninput = () => { const v = q.value.toLowerCase(); $$("#" + q.dataset.for + " .chip").forEach(x => x.hidden = !x.dataset.n.includes(v)); }); }
const picked = cid => $$("#" + cid + " .chip[aria-pressed=true]").map(b => b.dataset.v);
const playersOpts = () => [...S.players.entries()].filter(([, p]) => !p.archived).sort((a, b) => pname(a[1]).localeCompare(pname(b[1]))).map(([id, p]) => [id, pname(p)]);
function meetSheet(id, date) {
  const mt = id ? S.meetings.get(id) : { date: date || today(), time: "10:00", people: [], players: [] };
  sheet(`<h2>${id ? t("Modifica riunione") : t("Nuova riunione")}</h2><div class="fgrid"><label class="f full">${t("Titolo")}<input type="text" id="mtT" value="${esc(mt.title)}" placeholder="${t("es. Riunione mercato di gennaio")}"></label><label class="f">${t("Data")}<input type="date" id="mtD" value="${esc(mt.date)}"></label><label class="f">${t("Ora")}<input type="time" id="mtH" value="${esc(mt.time)}"></label><label class="f full">${t("Luogo o link della videochiamata")}<input type="text" id="mtP" value="${esc(mt.place)}"></label>
   <div class="full"><div class="m" style="font-weight:600;margin-bottom:6px">${t("Partecipanti")}</div>${chipsPick("mtPeople", [...S.staff.entries()].map(([sid, s]) => [sid, s.name + " · " + staffRoleL(s.role)]), mt.people || [])}</div>
   <div class="full"><div class="m" style="font-weight:600;margin-bottom:6px">${t("Giocatori da discutere")}</div>${chipsPick("mtPl", playersOpts(), mt.players || [])}</div>
   <label class="f full">${t("Ordine del giorno")}<textarea id="mtA">${esc(mt.agenda)}</textarea></label><label class="f full">${t("Decisioni e note")}<textarea id="mtN">${esc(mt.notes)}</textarea></label></div>
   <div class="row between">${id ? `<button class="btn danger" id="mtDel">${t("Elimina")}</button>` : "<span></span>"}<div class="row"><button class="btn" data-a="closeSheetBtn">${t("Annulla")}</button><button class="btn pri" id="mtSave">${t("Salva")}</button></div></div>`, true);
  bindChips();
  $("#mtSave").onclick = () => { const nid = id || uid(); put("meetings", nid, { ...(id ? S.meetings.get(id) : {}), title: $("#mtT").value.trim(), date: $("#mtD").value, time: $("#mtH").value, place: $("#mtP").value.trim(), people: picked("mtPeople"), players: picked("mtPl"), agenda: $("#mtA").value, notes: $("#mtN").value }); closeSheet(); ui.view = "staff"; ui.stTab = "meet"; ui.meetId = nid; render(); };
  if ($("#mtDel")) $("#mtDel").onclick = () => { del("meetings", id); ui.meetId = null; closeSheet(); render(true); };
}
function taskSheet(id, preset) {
  const x = id ? S.tasks.get(id) : { status: "todo", ...(preset || {}) }; const pl = playersOpts();
  const ms = [...S.matches.entries()].filter(([, m]) => !m.archived && (m.status !== "vista" || m.id === x.matchId)).sort((a, b) => (a[1].date || "").localeCompare(b[1].date || ""));
  sheet(`<h2>${id ? t("Modifica incarico") : t("Nuovo incarico di visione")}</h2><div class="fgrid">
   <label class="f">${t("Giocatore")}<select id="tkP"><option value="">—</option>${pl.map(([v, n]) => `<option value="${v}" ${x.playerId === v ? "selected" : ""}>${esc(n)}</option>`).join("")}</select></label>
   <label class="f">${t("Partita")}<select id="tkM"><option value="">${t("Da scegliere")}</option>${ms.map(([mid, m]) => `<option value="${mid}" ${x.matchId === mid ? "selected" : ""}>${fmtDate(m.date)} · ${esc(m.home)} – ${esc(m.away)}</option>`).join("")}</select></label>
   <label class="f">${t("Posizione da osservare")}<input type="text" id="tkPos" value="${esc(x.position)}" placeholder="${t("es. quinto sinistro")}"></label><label class="f">${t("Campionato")}<input type="text" id="tkL" value="${esc(x.league)}"></label>
   <label class="f">${t("Richiesto da")}<select id="tkBy"><option value="">—</option>${[...S.staff.entries()].map(([sid, s]) => `<option value="${sid}" ${x.by === sid ? "selected" : ""}>${esc(s.name)} · ${esc(staffRoleL(s.role))}</option>`).join("")}</select></label><label class="f">${t("Entro il")}<input type="date" id="tkDue" value="${esc(x.due)}"></label>
   <label class="f">${t("Stato")}<select id="tkSt">${TASK_ST.map(([k, n]) => `<option value="${k}" ${x.status === k ? "selected" : ""}>${esc(t(n))}</option>`).join("")}</select></label>
   <label class="f full">${t("Cosa osservare")}<textarea id="tkW" placeholder="${t("es. comportamento senza palla, duelli aerei, reazione dopo l'errore")}">${esc(x.what)}</textarea></label></div>
   <div class="row between">${id ? `<button class="btn danger" id="tkDel">${t("Elimina")}</button>` : "<span></span>"}<div class="row"><button class="btn" data-a="closeSheetBtn">${t("Annulla")}</button><button class="btn pri" id="tkSave">${t("Salva")}</button></div></div>`, true);
  $("#tkSave").onclick = () => { const nid = id || uid(); const o = { ...(id ? S.tasks.get(id) : {}), meetingId: x.meetingId || "", playerId: $("#tkP").value, matchId: $("#tkM").value, position: $("#tkPos").value.trim(), league: $("#tkL").value.trim(), by: $("#tkBy").value, due: $("#tkDue").value, status: $("#tkSt").value, what: $("#tkW").value.trim() };
    if (!o.playerId) { toast(t("Scegli prima il giocatore")); return; } put("tasks", nid, o); linkTask(o); closeSheet(); render(true); toast(t("Salvato")); };
  if ($("#tkDel")) $("#tkDel").onclick = () => { del("tasks", id); closeSheet(); render(true); };
}
// collega l'incarico alla partita: il giocatore diventa da osservare con il suo obiettivo
function linkTask(x) { if (!x.matchId || !x.playerId) return; const m = S.matches.get(x.matchId); if (!m) return; const tg = new Set(m.targets || []); tg.add(x.playerId); const pre = { ...(m.pre || {}), players: { ...((m.pre || {}).players || {}) } }; pre.players[x.playerId] = { ...(pre.players[x.playerId] || {}), goal: x.what, role: pre.players[x.playerId]?.role || "" }; put("matches", x.matchId, { ...m, targets: [...tg], pre }); }
Object.assign(A, {
  stTab: el => { ui.stTab = el.dataset.t; ui.meetId = null; render(); }, openMeet: el => { ui.view = "staff"; ui.stTab = "meet"; ui.meetId = el.dataset.id; render(); window.scrollTo(0, 0); }, closeMeet: () => { ui.meetId = null; render(); },
  editStaff: el => staffSheet(el.dataset.id), editMeet: el => meetSheet(el.dataset.id, el.dataset.d), editTask: el => taskSheet(el.dataset.id, el.dataset.meet ? { meetingId: el.dataset.meet } : el.dataset.p ? { playerId: el.dataset.p } : null),
  runTask: el => { const x = S.tasks.get(el.dataset.id); if (!x) return; if (!x.matchId) { taskSheet(el.dataset.id); toast(t("Scegli prima la partita")); return; } linkTask(x); if (x.status === "todo") put("tasks", el.dataset.id, { ...x, status: "doing" }); ui.view = "partite"; ui.matchId = x.matchId; ui.mtab = "live"; ui.liveP = x.playerId; ui.focusP = x.playerId; history.replaceState(null, "", "#partite"); render(); window.scrollTo(0, 0); },
  icsMeet: el => { const mt = S.meetings.get(el.dataset.id); const d = mt.date.replace(/-/g, ""), tm = (mt.time || "10:00").replace(":", "") + "00"; const ppl = (mt.players || []).map(x => pname(P(x))).filter(Boolean);
    const desc = [mt.agenda, ppl.length ? t("Giocatori da discutere") + ": " + ppl.join(", ") : "", (mt.people || []).map(staffName).filter(Boolean).join(", ")].filter(Boolean).join("\n");
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//MM Scout//IT", "BEGIN:VEVENT", "UID:" + el.dataset.id + "@mm-scout", "DTSTAMP:" + new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z", `DTSTART:${d}T${tm}`, "DURATION:PT1H", "SUMMARY:" + icsEsc(mt.title || t("Riunione")), "LOCATION:" + icsEsc(mt.place || ""), "DESCRIPTION:" + icsEsc(desc), "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + icsEsc(mt.title || ""), "TRIGGER:-PT30M", "END:VALARM", "END:VEVENT", "END:VCALENDAR"].map(icsFold).join("\r\n");
    download("riunione-" + mt.date + ".ics", ics, "text/calendar"); toast(t("Aprilo per aggiungerlo al Calendario")); },
  focusToggle: () => { ui.focusP = ui.focusP ? null : ui.liveP; render(true); }
});
// menu: nuova voce dopo Calendario
ICONS.staff = '<path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm7 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM9 13c-3.3 0-7 1.7-7 4v2h14v-2c0-2.3-3.7-4-7-4zm7 0c-.6 0-1.2.1-1.7.2 1.6.9 2.7 2.2 2.7 3.8v2h5v-2c0-2.2-3.1-4-6-4z"/>';
window.views = (orig => function () { const v = orig(); const i = v.findIndex(x => x !== "-" && x[0] === "calendario"); v.splice(i + 1, 0, ["staff", t("Staff e riunioni")]); return v; })(window.views);
// liste: accesso rapido agli incarichi di visione singola
R.liste = (orig => () => { const h = orig(); if (ui.listId) return h; const n = [...S.tasks.values()].filter(x => x.status !== "done").length; return `<div class="banner info row between"><span>🎯 ${t("Visione singola: {n} incarichi aperti", { n })}</span><button class="btn sm pri" data-a="menuGoTasks">${t("Apri incarichi")}</button></div>` + h; })(R.liste);
A.menuGoTasks = () => { ui.stTab = "tasks"; ui.meetId = null; go("staff"); };
// scheda giocatore: crea incarico
window.playerPage = (orig => function (id) { return orig(id).replace(`<button class="btn sm pri" data-a="newEval" data-id="${id}">`, `<button class="btn sm" data-a="editTask" data-p="${id}">🎯 ${t("Incarico")}</button><button class="btn sm pri" data-a="newEval" data-id="${id}">`); })(window.playerPage);

/* ---------- visione singola durante la partita ---------- */
window.liveView = (orig => function (id, m) {
  const fp = ui.focusP && (m.targets || []).includes(ui.focusP) ? ui.focusP : null;
  if (!fp) { const h = orig(id, m); return (m.targets || []).length ? h.replace('<div class="lplayers" id="lplayers">', `<div class="row end" style="margin:-4px 0 6px"><button class="btn sm ghost" data-a="focusToggle">🎯 ${t("Visione singola")}</button></div><div class="lplayers" id="lplayers">`) : h; }
  ui.liveP = fp; const p = P(fp); const task = [...S.tasks.values()].find(x => x.matchId === id && x.playerId === fp); const goal = (task && task.what) || ((((m.pre || {}).players || {})[fp]) || {}).goal || "";
  const pe = (m.events || []).filter(e => e.p === fp), pos = pe.filter(e => evOutcome(e) === "+").length, neg = pe.filter(e => evOutcome(e) === "-").length;
  const h = orig(id, { ...m, targets: [fp] });
  return `<div class="focusbar"><div class="row between"><div class="row">${avatar(p)}<div><div class="m">🎯 ${t("Visione singola")}</div><b>${esc(pname(p))}</b> <span class="m">${esc(roleL(mainRole(p)) || "")}</span></div></div><div class="row"><span class="pill c-good">✓ ${pos}</span><span class="pill c-bad">✗ ${neg}</span><button class="btn sm" data-a="focusToggle">${t("Tutti i giocatori")}</button></div></div>${goal ? `<div class="small" style="margin-top:6px">${t("Cosa osservare")}: <b>${esc(goal)}</b>${task && task.by ? " · " + t("per {n}", { n: esc(staffName(task.by)) }) : ""}</div>` : ""}</div>` + h;
})(window.liveView);
// in visione singola i pulsanti mostrano solo il giocatore scelto
window.livePlayersHtml = (orig => function (m) { if (ui.focusP && (m.targets || []).includes(ui.focusP)) { const h = orig({ ...m, targets: [ui.focusP] }); return h.replace(/<select id="addTarget"[\s\S]*$/, ""); } return orig(m); })(window.livePlayersHtml);

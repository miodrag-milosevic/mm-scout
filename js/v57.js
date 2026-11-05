"use strict";
/* =========================================================
   MM Scout 5.7 — © 2026 Miodrag Milosevic. Tutti i diritti riservati.
   Vietato copiare, modificare o divulgare senza il consenso dell'autore.
   ---------------------------------------------------------
   1. Esempi sempre nella lingua scelta
   2. Agenda: oggi · calendario · bacheca degli impegni (kanban)
   3. Note di lavoro e personali, con importazione da altre app
   4. Nota scritta veloce durante la partita
   5. Menu laterale riducibile, con nomi al passaggio del mouse
   6. Email nel piè di pagina · statistiche cliccabili
   ========================================================= */
const MY_EMAIL = "miodrag.milosevic@ik.me";
let AG_HIDE = 0; const agWrap = fn => function () { AG_HIDE++; try { return fn.apply(this, arguments); } finally { AG_HIDE--; } };
if (typeof VIEW_L !== "undefined") { VIEW_L.note = "Note"; VIEW_L.calendario = "Agenda"; }
const v57x = s => esc(s == null ? "" : String(s));
const v57ago = d => { const x = new Date(d + "T12:00:00"); return isNaN(x) ? "" : x.toLocaleDateString(LOC(), { day: "2-digit", month: "2-digit" }); };

/* ---------- 1. Esempi nella lingua scelta ---------- */
const RELANG_SKIP = new Set(["id", "type", "status", "verdict", "level", "roles", "role", "c", "o", "kind", "rank", "matchType", "teamCat", "cat", "foot", "sex", "pos", "by", "owner", "ownerId", "playerId", "matchId", "meetingId", "mediaId", "blobId", "focus", "date", "time", "sys", "sysHome", "sysAway", "nat", "nat2", "photo", "signature", "color", "league", "club", "first", "last", "alias", "email", "phone", "url", "linkStream", "linkTickets", "linkInfo"]);
function relangAll() {
  const to = Prefs.lang; const dicts = { en: window.I18N_EN, de: window.I18N_DE, sr: window.I18N_SR, es: window.I18N_ES, fr: window.I18N_FR }; const rev = new Map(); const itKeys = new Set(Object.keys(dicts.en || {}));
  for (const l of ["en", "de", "sr", "es", "fr"]) { const d = dicts[l] || {}; for (const k in d) { const v = d[k]; if (typeof v === "string" && v !== k && !rev.has(v)) rev.set(v, k); } }
  const tr = s => { if (typeof s !== "string" || s.length < 6 || !/\s/.test(s)) return s; const it = itKeys.has(s) ? s : rev.get(s); if (!it) return s; const out = to === "it" ? it : ((dicts[to] || {})[it] || it); return out; };
  const walk = (o, depth) => { if (!o || typeof o !== "object" || depth > 5) return false; let ch = false;
    for (const k of Object.keys(o)) { if (RELANG_SKIP.has(k)) continue; const v = o[k]; if (typeof v === "string") { const n = tr(v); if (n !== v) { o[k] = n; ch = true; } } else if (v && typeof v === "object") { if (walk(v, depth + 1)) ch = true; } } return ch; };
  const prevBusy = Undo.busy; Undo.busy = true; let n = 0;
  try {
    for (const c of COLLS) { if (c === "settings" || c === "media" || !S[c]) continue; for (const [id, o] of [...S[c]]) { if (!o || !o.example) continue; const x = clone(o); if (walk(x, 0)) { S[c].set(id, x); Store.write(c, id); n++; } } }
    const act = S.settings.get("activity"); if (act && act.items) { let ch = false; for (const it of act.items) if (it.ex && typeof it.l === "string") { const v = tr(it.l); if (v !== it.l) { it.l = v; ch = true; } } if (ch) Store.write("settings", "activity"); }
  } finally { Undo.busy = prevBusy; }
  return n;
}
A.setLang = (orig => function (el) { const r = orig.apply(this, arguments); try { if (App.unlocked && relangAll()) render(true); } catch (e) { } return r; })(A.setLang);
Lock.enter = (orig => async function () { const r = await orig.apply(this, arguments); setTimeout(() => { try { if (App.unlocked && relangAll()) render(true); } catch (e) { } }, 700); return r; })(Lock.enter);
Examples.load = (orig => function () { const r = orig.apply(this, arguments); setTimeout(() => { try { relangAll(); } catch (e) { } }, 200); return r; })(Examples.load);

/* ---------- 2. Agenda ---------- */
ICONS.note = '<path d="M5 3h10l4 4v14H5zm9 1.5V8h3.5zM8 11v1.6h8V11zm0 3.4V16h8v-1.6zm0 3.4V19h5v-1.2z"/>';
ICONS.mail = '<path d="M3 5h18v14H3zm2 2v.4l7 4.6 7-4.6V7zm14 2.8-7 4.6-7-4.6V17h14z"/>';
ICONS.sidel = '<path d="M15.4 6 9.4 12l6 6-1.4 1.4L6.6 12 14 4.6z"/>';
ICONS.sider = '<path d="m8.6 18 6-6-6-6L10 4.6l7.4 7.4-7.4 7.4z"/>';
const TD_KINDS = [["match", "Partita da vedere", "🏟"], ["video", "Video da guardare", "🎬"], ["report", "Report da scrivere", "📝"], ["call", "Telefonata o messaggio", "📞"], ["travel", "Viaggio", "🚆"], ["meet", "Riunione", "👥"], ["study", "Studio e formazione", "📚"], ["admin", "Amministrazione", "🗂"], ["other", "Altro", "📌"]];
const TD_COLS = [["todo", "Da fare"], ["doing", "In corso"], ["done", "Fatto"]];
const TD_PRIO = [[1, "Alta"], [2, "Media"], [3, "Bassa"]];
const tdKind = k => TD_KINDS.find(x => x[0] === k) || TD_KINDS[TD_KINDS.length - 1];
const todos = () => [...S.todos.entries()].filter(([, x]) => x && !x.archived);
const tdOpen = x => x.status !== "done";
const tdSort = (a, b) => (a[1].prio || 2) - (b[1].prio || 2) || cmpTxt(a[1].due || "9999", b[1].due || "9999") || cmpTxt(a[1].time || "", b[1].time || "");
const agMode = () => ui.agMode || Prefs.get("agMode", "") || (innerWidth >= 1100 ? "split" : "oggi");
function tdMeta(x, withDate = true) {
  const td = today(); const over = x.due && x.due < td && tdOpen(x); const parts = [];
  if (withDate && x.due) parts.push(`<span class="${over ? "over" : ""}">${over ? "⚠ " : ""}${x.due === td ? t("oggi") : v57ago(x.due)}${x.time ? " " + v57x(x.time) : ""}</span>`);
  else if (x.time) parts.push(v57x(x.time));
  const steps = x.steps || []; if (steps.length) parts.push(`☑ ${steps.filter(s => s.d).length}/${steps.length}`);
  return parts.join(" · ");
}
function tdChips(x) {
  const out = []; if (x.playerId && P(x.playerId)) out.push(`<button type="button" class="kchip" data-a="openPlayer" data-id="${x.playerId}">👤 ${v57x(pname(P(x.playerId)))}</button>`);
  const m = x.matchId && S.matches.get(x.matchId); if (m) out.push(`<button type="button" class="kchip" data-a="openMatch" data-id="${x.matchId}">🏟 ${v57x(m.home)} – ${v57x(m.away)}</button>`);
  return out.length ? `<div class="kchips">${out.join("")}</div>` : "";
}
function kCard(src, id, x) {
  const isT = src === "tasks"; const k = isT ? ["task", "Incarico di visione", "🎯"] : tdKind(x.kind); const title = isT ? (pname(P(x.playerId)) + (x.position ? " · " + x.position : "")) : x.title;
  const st = x.status || "todo"; const i = TD_COLS.findIndex(c => c[0] === st);
  return `<article class="kcard p${x.prio || 2}${isT ? " ktask" : ""}${st === "done" ? " kdone" : ""}" draggable="true" data-kid="${src}:${id}" data-a="${isT ? "editTask" : "todoEdit"}" data-id="${id}" tabindex="0">
   <div class="khead"><span class="kic" title="${v57x(t(k[1]))}">${k[2]}</span><b class="kt">${v57x(title || t("Senza titolo"))}${x.example ? ` <span class="ex">${t("Esempio")}</span>` : ""}</b></div>
   ${isT && x.what ? `<div class="kd">${v57x(x.what)}</div>` : !isT && x.notes ? `<div class="kd">${v57x(String(x.notes).slice(0, 110))}</div>` : ""}
   ${isT ? (x.due ? `<div class="km">${tdMeta({ due: x.due, status: st })}</div>` : "") : `<div class="km">${tdMeta(x)}</div>`}${tdChips(x)}
   <div class="kfoot"><button type="button" class="kmv" data-a="kMove" data-k="${src}:${id}" data-d="-1" ${i <= 0 ? "disabled" : ""} aria-label="${t("Sposta a sinistra")}">‹</button><span class="kst">${t(TD_COLS[Math.max(0, i)][1])}</span><button type="button" class="kmv" data-a="kMove" data-k="${src}:${id}" data-d="1" ${i >= TD_COLS.length - 1 ? "disabled" : ""} aria-label="${t("Sposta a destra")}">›</button></div></article>`;
}
function boardHtml(maxPer) {
  const lim = daysAgo(14); const cards = { todo: [], doing: [], done: [] };
  for (const [id, x] of todos().sort(tdSort)) { const st = cards[x.status] ? x.status : "todo"; if (st === "done" && !ui.kAll && (x.doneAt ? new Date(x.doneAt).toISOString().slice(0, 10) : x.due || "") < lim) continue; cards[st].push(kCard("todos", id, x)); }
  for (const [id, x] of [...S.tasks.entries()].filter(([, x]) => P(x.playerId)).sort((a, b) => cmpTxt(a[1].due || "9", b[1].due || "9"))) { const st = cards[x.status] ? x.status : "todo"; if (st === "done" && !ui.kAll && (x.due || "") < lim) continue; cards[st].push(kCard("tasks", id, x)); }
  return `<div class="kb" role="list">${TD_COLS.map(([k, n]) => `<section class="kcol kc-${k}" role="listitem"><header><b>${t(n)}</b><span class="kn">${cards[k].length}</span></header><div class="kcards" data-drop="${k}">${(maxPer && cards[k].length > maxPer ? cards[k].slice(0, maxPer).join("") + `<button type="button" class="kadd ghost" data-a="agMode" data-v="board">${t("+{n} altre: apri la bacheca", { n: cards[k].length - maxPer })}</button>` : cards[k].join("")) || `<div class="kempty">${k === "todo" ? t("Niente da fare: aggiungi un impegno.") : k === "doing" ? t("Trascina qui quello che stai facendo.") : t("Qui finiscono le cose fatte.")}</div>`}</div>${k === "todo" ? `<button type="button" class="kadd" data-a="todoNew">+ ${t("Impegno")}</button>` : k === "done" ? `<button type="button" class="kadd ghost" data-a="kAll">${ui.kAll ? t("Mostra solo le ultime due settimane") : t("Mostra anche i più vecchi")}</button>` : ""}</section>`).join("")}</div>`;
}
function todayHtml(compact) {
  const td = today();
  const ms = [...S.matches.entries()].filter(([, m]) => !m.archived && m.date === td).sort((a, b) => cmpTxt(a[1].time, b[1].time));
  const mt = [...S.meetings.entries()].filter(([, x]) => x.date === td);
  const tds = todos().filter(([, x]) => tdOpen(x) && (x.due ? x.due <= td : x.status === "doing")).sort(tdSort);
  const tks = [...S.tasks.entries()].filter(([, x]) => x.status !== "done" && x.due && x.due <= td && P(x.playerId));
  const checks = [...S.players.entries()].filter(([, p]) => !p.archived && p.nextCheck && p.nextCheck <= td);
  const row = (id, x) => `<div class="item trow"><button type="button" class="tchk" data-a="todoToggle" data-id="${id}" aria-label="${t("Segna come fatto")}" title="${t("Segna come fatto")}"></button><div class="grow click" data-a="todoEdit" data-id="${id}"><div class="t">${tdKind(x.kind)[2]} ${v57x(x.title)}${x.example ? ` <span class="ex">${t("Esempio")}</span>` : ""}</div><div class="m">${tdMeta(x) || t(tdKind(x.kind)[1])}</div></div></div>`;
  const list = [...ms.map(([id, m]) => matchItem(id, m)), ...mt.map(([id, x]) => meetingItem(id, x)), ...tds.map(([id, x]) => row(id, x)),
    ...tks.map(([id, x]) => `<div class="item click" data-a="editTask" data-id="${id}"><span class="vico">🎯</span><div class="grow"><div class="t">${v57x(pname(P(x.playerId)))}</div><div class="m">${v57x(x.what || "")} · ${t("entro il {d}", { d: fmtDate(x.due) })}</div></div></div>`),
    ...checks.slice(0, 3).map(([id, p]) => `<div class="item click" data-a="openPlayer" data-id="${id}"><span class="vico">🔁</span><div class="grow"><div class="t">${t("Rivedere {n}", { n: v57x(pname(p)) })}</div><div class="m">${fmtDate(p.nextCheck)}</div></div></div>`)];
  const dl = new Date().toLocaleDateString(LOC(), { weekday: "long", day: "numeric", month: "long" });
  return `<div class="row between"><div><h2>${t("Oggi")}</h2><p class="m cap1">${v57x(dl)}</p></div>${compact ? `<button class="btn sm ghost" data-a="agOpen" data-v="oggi">${t("Agenda")} →</button>` : ""}</div>
   <div class="qadd"><input type="text" id="qTodo" maxlength="120" placeholder="${t("Aggiungi un impegno per oggi e premi Invio")}" aria-label="${t("Nuovo impegno per oggi")}"><button type="button" class="btn pri" data-a="todoQuick" aria-label="${t("Aggiungi")}">+</button></div>
   <div class="list" style="margin-top:6px">${list.join("") || `<div class="empty">${t("Giornata libera: niente in programma per oggi.")}</div>`}</div>`;
}
function weekAhead() {
  const td = today(), in7 = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10); const rows = [];
  for (const [id, m] of S.matches) if (!m.archived && m.date > td && m.date <= in7) rows.push([m.date + (m.time || ""), matchItem(id, m)]);
  for (const [id, x] of S.meetings) if (x.date > td && x.date <= in7) rows.push([x.date + (x.time || ""), meetingItem(id, x)]);
  for (const [id, x] of todos()) if (tdOpen(x) && x.due > td && x.due <= in7) rows.push([x.due + (x.time || ""), `<div class="item click" data-a="todoEdit" data-id="${id}"><div class="mono small" style="width:54px">${v57ago(x.due)}<br>${v57x(x.time || "")}</div><div class="grow"><div class="t">${tdKind(x.kind)[2]} ${v57x(x.title)}</div><div class="m">${t(tdKind(x.kind)[1])}</div></div></div>`]);
  rows.sort((a, b) => cmpTxt(a[0], b[0]));
  return `<h2>${t("Prossimi 7 giorni")}</h2><div class="list" style="margin-top:6px">${rows.map(r => r[1]).join("") || `<div class="empty">${t("Niente in programma nei prossimi 7 giorni.")}</div>`}</div>`;
}
const AG_MODES = [["oggi", "Oggi"], ["split", "Calendario e bacheca"], ["cal", "Calendario"], ["board", "Bacheca"]];
R.calendario = (orig => () => {
  const h = orig(); const mode = agMode(); const selD = ui.calDay || today();
  const a = h.indexOf('<section class="panel"><div class="row between"><button class="btn sm" data-a="calMove"'); const b = a >= 0 ? h.indexOf("</section>", a) + 10 : -1;
  let cal = a >= 0 ? h.slice(a, b) : ""; const rest = b > 0 ? h.slice(b) : "";
  const byDay = {}; for (const [id, x] of todos()) if (x.due) (byDay[x.due] = byDay[x.due] || []).push([id, x]);
  cal = cal.replace(/(<button class="cal-c[^"]*" data-a="calDay" data-d="(\d{4}-\d\d-\d\d)">)([\s\S]*?)(<\/button>)/g, (all, o, d, inner, c) => { const l = (byDay[d] || []).sort(tdSort); return o.replace('data-a="calDay"', `data-a="calDay" data-dropday="${d}"`) + inner + l.slice(0, 2).map(([, x]) => `<span class="cal-ev todo${x.status === "done" ? " seen" : ""}">${tdKind(x.kind)[2]} ${v57x((x.title || "").slice(0, 12))}</span>`).join("") + (l.length > 2 ? `<span class="m">+${l.length - 2}</span>` : "") + c; });
  const big = m => `<button class="btn sm ghost" data-a="agMode" data-v="${mode === m ? "split" : m}" title="${mode === m ? t("Affianca calendario e bacheca") : t("Ingrandisci")}" aria-label="${mode === m ? t("Affianca calendario e bacheca") : t("Ingrandisci")}">${mode === m ? "⇆" : "⤢"}</button>`;
  cal = cal.replace('<div class="row"><button class="btn sm ghost" data-a="calToday">', `<div class="row">${big("cal")}<button class="btn sm ghost" data-a="calToday">`);
  const up = [...S.matches.values()].filter(m => !m.archived && m.date >= today() && m.status !== "vista").length;
  const head = `<div class="head"><div><h1>${t("Agenda")}</h1><p class="sub">${t(PAGE_DESC.calendario)}</p></div><div class="row"><button class="btn" data-a="icsAll" ${up ? "" : "disabled"}>📅 ${t("Esporta nel Calendario ({n})", { n: up })}</button><button class="btn" data-a="todoNew" data-d="${selD}">+ ${t("Impegno")}</button><button class="btn pri" data-a="newMatchOn" data-d="${selD}">+ ${t("Partita")}</button></div></div>
   <div class="seg agseg" role="group" aria-label="${t("Vista")}">${AG_MODES.map(([k, n]) => `<button data-a="agMode" data-v="${k}" aria-pressed="${mode === k}">${t(n)}</button>`).join("")}</div>`;
  const boardP = `<section class="panel agb"><div class="row between"><div><h2>${t("Bacheca impegni")}</h2><p class="m">${t("Trascina le schede da una colonna all'altra o su un giorno del calendario. Su telefono usa ‹ ›.")}</p></div>${big("board")}</div>${boardHtml(mode === "split" ? 5 : 0)}</section>`;
  if (mode === "oggi") return head + `<div class="grid2"><section class="panel">${todayHtml(false)}</section><section class="panel">${weekAhead()}</section></div>` + boardP;
  if (mode === "board") return head + boardP;
  if (mode === "cal") return head + cal + rest;
  return head + `<div class="agsplit"><div class="agc">${cal}</div><div class="agk">${boardP}</div></div>`;
})(R.calendario);
PAGE_DESC.calendario = "Organizza le giornate: cosa fare oggi, partite e riunioni nel calendario, impegni nella bacheca. Tutto si esporta nel Calendario del Mac o dell'iPhone.";

function todoSheet(id, preset) {
  const x = id ? S.todos.get(id) : { title: "", kind: "other", status: "todo", prio: 2, due: today(), time: "", notes: "", steps: [], ...(preset || {}) }; if (!x) return;
  const pls = [...S.players.entries()].filter(([, p]) => !p.archived).sort((a, b) => pname(a[1]).localeCompare(pname(b[1])));
  const mss = [...S.matches.entries()].filter(([, m]) => !m.archived).sort((a, b) => cmpTxt(b[1].date, a[1].date)).slice(0, 80);
  ui.tdSteps = clone(x.steps || []);
  sheet(`<div class="row between"><h2>${id ? t("Modifica impegno") : t("Nuovo impegno")}</h2><button class="btn sm ghost" data-a="closeSheetBtn" aria-label="${t("Chiudi")}">✕</button></div>
   <div class="fgrid"><label class="f full">${t("Cosa devi fare")}<input type="text" id="tdTitle" maxlength="140" value="${v57x(x.title)}" placeholder="${t("es. Rivedere il video di Brunner, chiamare il responsabile giovanili")}"></label>
   <label class="f">${t("Tipo")}<select id="tdKind">${TD_KINDS.map(([k, n, i]) => `<option value="${k}" ${x.kind === k ? "selected" : ""}>${i} ${t(n)}</option>`).join("")}</select></label>
   <label class="f">${t("Priorità")}<select id="tdPrio">${TD_PRIO.map(([k, n]) => `<option value="${k}" ${+x.prio === k ? "selected" : ""}>${t(n)}</option>`).join("")}</select></label>
   <label class="f">${t("Giorno")}<input type="date" id="tdDue" value="${v57x(x.due || "")}"></label><label class="f">${t("Ora")}<input type="time" id="tdTime" value="${v57x(x.time || "")}"></label>
   <label class="f">${t("Stato")}<select id="tdSt">${TD_COLS.map(([k, n]) => `<option value="${k}" ${x.status === k ? "selected" : ""}>${t(n)}</option>`).join("")}</select></label>
   <label class="f">${t("Giocatore (facoltativo)")}<select id="tdP"><option value="">—</option>${pls.map(([pid, p]) => `<option value="${pid}" ${x.playerId === pid ? "selected" : ""}>${v57x(pname(p))}${p.club ? " · " + v57x(p.club) : ""}</option>`).join("")}</select></label>
   <label class="f full">${t("Partita (facoltativa)")}<select id="tdM"><option value="">—</option>${mss.map(([mid, m]) => `<option value="${mid}" ${x.matchId === mid ? "selected" : ""}>${fmtDate(m.date)} · ${v57x(m.home)} – ${v57x(m.away)}</option>`).join("")}</select></label>
   <label class="f full">${t("Note")}<textarea id="tdNotes" rows="3" maxlength="2000">${v57x(x.notes || "")}</textarea></label></div>
   <div class="tdsteps"><b>${t("Passi")}</b> <span class="m">${t("una piccola lista di controllo")}</span><div id="tdStepList">${stepsHtml()}</div><div class="qadd"><input type="text" id="tdStepIn" maxlength="120" placeholder="${t("Aggiungi un passo e premi Invio")}"><button type="button" class="btn" data-a="tdStepAdd">+</button></div></div>
   <div class="row between" style="margin-top:12px">${id ? `<button class="btn danger" data-a="todoDel" data-id="${id}">${t("Elimina")}</button>` : "<span></span>"}<div class="row"><button class="btn" data-a="closeSheetBtn">${t("Annulla")}</button><button class="btn pri" data-a="todoSave" data-id="${id || ""}">${t("Salva")}</button></div></div>`);
  setTimeout(() => { const i = $("#tdTitle"); if (i && !id) i.focus(); }, 30);
}
function stepsHtml() { return (ui.tdSteps || []).map((s, i) => `<label class="chk tdstep"><input type="checkbox" data-step="${i}" ${s.d ? "checked" : ""}> <span>${v57x(s.t)}</span><button type="button" class="lnk" data-a="tdStepDel" data-i="${i}" aria-label="${t("Elimina")}">✕</button></label>`).join(""); }
function tdSet(src, id, st) {
  const o = S[src] && S[src].get(id); if (!o || o.status === st) return;
  put(src, id, { ...o, status: st, ...(src === "todos" ? { doneAt: st === "done" ? Date.now() : null } : {}) });
  toast(st === "done" ? t("Fatto ✓") : t("Spostato in «{c}»", { c: t((TD_COLS.find(c => c[0] === st) || TD_COLS[0])[1]) })); render(true);
}
Object.assign(A, {
  agMode: el => { ui.agMode = el.dataset.v; Prefs.set("agMode", el.dataset.v); render(true); },
  agOpen: el => { ui.agMode = el.dataset.v || ""; closeSheet(); resetSub(); go("calendario"); },
  todoNew: el => { closeSheet(); todoSheet(null, el && el.dataset && el.dataset.d ? { due: el.dataset.d } : null); },
  todoEdit: el => { closeSheet(); todoSheet(el.dataset.id); },
  todoSave: el => {
    const title = $("#tdTitle").value.trim(); if (!title) { toast(t("Scrivi cosa devi fare")); $("#tdTitle").focus(); return; }
    $$("#tdStepList [data-step]").forEach(c => { const s = ui.tdSteps[+c.dataset.step]; if (s) s.d = c.checked; });
    const id = el.dataset.id || uid(); const old = S.todos.get(id) || { created: Date.now() }; const st = $("#tdSt").value;
    put("todos", id, { ...old, title, kind: $("#tdKind").value, prio: +$("#tdPrio").value, due: $("#tdDue").value, time: $("#tdTime").value, status: st, doneAt: st === "done" ? (old.doneAt || Date.now()) : null, playerId: $("#tdP").value, matchId: $("#tdM").value, notes: $("#tdNotes").value.trim(), steps: ui.tdSteps || [] });
    closeSheet(); toast(el.dataset.id ? t("Impegno aggiornato") : t("Impegno aggiunto")); render(true);
  },
  todoDel: el => { const id = el.dataset.id; confirmSheet(t("Eliminare questo impegno? Subito dopo puoi ancora annullare."), () => { del("todos", id); closeSheet(); toast(t("Eliminato")); render(true); }, t("Elimina")); },
  todoToggle: el => { const id = el.dataset.id; const o = S.todos.get(id); if (o) tdSet("todos", id, o.status === "done" ? "todo" : "done"); },
  todoQuick: () => { const i = $("#qTodo"); const v = i && i.value.trim(); if (!v) { if (i) i.focus(); return; } put("todos", uid(), { title: v, kind: "other", status: "todo", prio: 2, due: today(), time: "", notes: "", steps: [], created: Date.now() }); toast(t("Impegno aggiunto")); render(true); setTimeout(() => { const n = $("#qTodo"); if (n) n.focus(); }, 30); },
  kMove: (el, e) => { if (e) e.stopPropagation(); const [src, id] = el.dataset.k.split(":"); const o = S[src].get(id); if (!o) return; const i = TD_COLS.findIndex(c => c[0] === (o.status || "todo")); const n = TD_COLS[Math.max(0, Math.min(TD_COLS.length - 1, i + +el.dataset.d))]; tdSet(src, id, n[0]); },
  kAll: () => { ui.kAll = !ui.kAll; render(true); },
  tdStepAdd: () => { const i = $("#tdStepIn"); const v = i.value.trim(); if (!v) return; (ui.tdSteps = ui.tdSteps || []).push({ t: v, d: false }); i.value = ""; $("#tdStepList").innerHTML = stepsHtml(); i.focus(); },
  tdStepDel: (el, e) => { if (e) e.preventDefault(); ui.tdSteps.splice(+el.dataset.i, 1); $("#tdStepList").innerHTML = stepsHtml(); }
});
document.addEventListener("keydown", e => { if (e.key !== "Enter" || !e.target || !e.target.id) return; if (e.target.id === "qTodo") { e.preventDefault(); A.todoQuick(); } else if (e.target.id === "tdStepIn") { e.preventDefault(); A.tdStepAdd(); } else if (e.target.id === "tdTitle") { e.preventDefault(); const b = $('[data-a="todoSave"]'); if (b) b.click(); } });
// trascina e rilascia: tra le colonne o su un giorno del calendario
let kDrag = null;
document.addEventListener("dragstart", e => { const c = e.target.closest && e.target.closest(".kcard"); if (!c) return; kDrag = c.dataset.kid; try { e.dataTransfer.setData("text/plain", kDrag); e.dataTransfer.effectAllowed = "move"; } catch (x) { } c.classList.add("drag"); document.body.classList.add("kdragging"); });
document.addEventListener("dragend", () => { kDrag = null; $$(".kcard.drag").forEach(c => c.classList.remove("drag")); $$(".over").forEach(z => z.classList.remove("over")); document.body.classList.remove("kdragging"); });
document.addEventListener("dragover", e => { if (!kDrag) return; const z = e.target.closest && e.target.closest("[data-drop],[data-dropday]"); if (!z) return; e.preventDefault(); $$(".over").forEach(o => o !== z && o.classList.remove("over")); z.classList.add("over"); });
document.addEventListener("drop", e => { if (!kDrag) return; const z = e.target.closest && e.target.closest("[data-drop],[data-dropday]"); if (!z) return; e.preventDefault(); const [src, id] = kDrag.split(":"); kDrag = null;
  if (z.dataset.drop) tdSet(src, id, z.dataset.drop);
  else { const o = S[src].get(id); if (o) { put(src, id, { ...o, due: z.dataset.dropday }); toast(t("Spostato al {d}", { d: fmtDate(z.dataset.dropday) })); render(true); } } });
// giorno del calendario: anche gli impegni
A.calDay = (orig => function (el) { orig(el); const d = el.dataset.d; const l = todos().filter(([, x]) => x.due === d).sort(tdSort); const list = $("#sheetRoot .sheet .list"); if (!list) return;
  if (l.length) { list.querySelector(".empty") && list.querySelector(".empty").remove(); list.insertAdjacentHTML("beforeend", l.map(([id, x]) => `<div class="item trow"><button type="button" class="tchk ${x.status === "done" ? "on" : ""}" data-a="todoToggle" data-id="${id}" aria-label="${t("Segna come fatto")}"></button><div class="grow click" data-a="todoEdit" data-id="${id}"><div class="t">${tdKind(x.kind)[2]} ${v57x(x.title)}</div><div class="m">${t(tdKind(x.kind)[1])}${x.time ? " · " + v57x(x.time) : ""}</div></div></div>`).join("")); }
  const r = $("#sheetRoot .sheet .row.end"); if (r) r.insertAdjacentHTML("afterbegin", `<button class="btn" data-a="todoNew" data-d="${d}">+ ${t("Impegno")}</button>`); })(A.calDay);
// Panoramica: «Oggi» in cima
R.panoramica = (orig => () => { const h = orig(); const i = h.indexOf('<div class="stats">'); if (i < 0) return h; return h.slice(0, i) + `<section class="panel today">${agWrap(todayHtml)(true)}</section>` + h.slice(i); })(R.panoramica);
// azioni di «Da fare» e attività
A.actOpen = (orig => function (el) { const c = el.dataset.c, id = el.dataset.id; if (c === "todos") { closeSheet(); todoSheet(id); return; } if (c === "notes") { closeSheet(); resetSub(); go("note"); setTimeout(() => noteSheet(id), 30); return; } return orig(el); })(A.actOpen);

/* ---------- 3. Note ---------- */
const NOTE_KINDS = [["lavoro", "Lavoro"], ["personale", "Personale"]];
PAGE_DESC.note = "Appunti di lavoro e personali, cifrati come tutto il resto. Puoi importarli da Note di Apple, Google Keep, Evernote, Word o da file di testo.";
window.views = (orig => function () { const v = orig().map(x => x !== "-" && x[0] === "calendario" ? ["calendario", t("Agenda")] : x); if (!v.some(x => x !== "-" && x[0] === "note")) { const i = v.findIndex(x => x !== "-" && x[0] === "report"); v.splice(i >= 0 ? i + 1 : v.length, 0, ["note", t("Note")]); } return v; })(window.views);
if (typeof NAV_GROUPS !== "undefined" && !NAV_GROUPS[0][1].includes("note")) NAV_GROUPS[0][1].push("note");
function mdInline(s) { return v57x(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/(^|[\s(])\*(?!\s)(.+?)\*(?=[\s).,;:!?]|$)/g, "$1<i>$2</i>").replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)])/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'); }
function mdHtml(src) {
  const lines = String(src || "").split("\n"); let out = "", list = null;
  const close = () => { if (list) { out += `</${list}>`; list = null; } };
  for (const raw of lines) { const l = raw.replace(/\s+$/, ""); let m;
    if ((m = l.match(/^\s*[-*]\s+\[( |x|X)\]\s+(.*)$/))) { if (list !== "ul") { close(); out += '<ul class="mdck">'; list = "ul"; } out += `<li class="${m[1] === " " ? "" : "on"}">${m[1] === " " ? "☐" : "☑"} ${mdInline(m[2])}</li>`; continue; }
    if ((m = l.match(/^\s*[-*•]\s+(.*)$/))) { if (list !== "ul") { close(); out += "<ul>"; list = "ul"; } out += `<li>${mdInline(m[1])}</li>`; continue; }
    if ((m = l.match(/^\s*\d+[.)]\s+(.*)$/))) { if (list !== "ol") { close(); out += "<ol>"; list = "ol"; } out += `<li>${mdInline(m[1])}</li>`; continue; }
    close();
    if ((m = l.match(/^(#{1,3})\s+(.*)$/))) { out += `<h${m[1].length + 2}>${mdInline(m[2])}</h${m[1].length + 2}>`; continue; }
    if (/^\s*(-{3,}|_{3,})\s*$/.test(l)) { out += "<hr>"; continue; }
    out += l.trim() ? `<p>${mdInline(l)}</p>` : ""; }
  close(); return out;
}
// testo pulito: elenchi, caselle, spazi, titolo dalla prima riga
function cleanText(s) {
  return String(s || "").replace(/\r\n?/g, "\n").replace(/\u00a0/g, " ").replace(/\u2028|\u2029/g, "\n")
    .split("\n").map(l => l.replace(/\s+$/, "").replace(/^(\s*)[•◦▪▫●○■□‣⁃–—]\s+/, "$1- ").replace(/^(\s*)[☐❑]\s*/, "$1- [ ] ").replace(/^(\s*)[☑✓✔☒✅]\s*/, "$1- [x] ")).join("\n")
    .replace(/\n{3,}/g, "\n\n").trim();
}
function splitTitle(body, fallback) { const lines = body.split("\n"); const i = lines.findIndex(l => l.trim()); if (i < 0) return { title: fallback || t("Nota senza titolo"), body: "" }; const first = lines[i].replace(/^#+\s*|^- (\[.\] )?/g, "").replace(/\*\*|__/g, "").replace(/^\*(.+)\*$/, "$1").trim(); if (first.length <= 90) return { title: first, body: lines.slice(i + 1).join("\n").trim() }; return { title: first.slice(0, 60) + "…", body: body.trim() }; }
function htmlToMd(html) {
  let doc; try { doc = new DOMParser().parseFromString(String(html), "text/html"); } catch (e) { return cleanText(String(html).replace(/<[^>]+>/g, " ")); }
  doc.querySelectorAll("script,style,head,title,meta,noscript").forEach(n => n.remove());
  const walk = (n, ctx) => {
    if (n.nodeType === 3) return n.nodeValue.replace(/\s+/g, " ");
    if (n.nodeType !== 1) return ""; const tg = n.tagName.toLowerCase(); const kids = c => [...n.childNodes].map(k => walk(k, c || ctx)).join("");
    if (tg === "br") return "\n";
    if (/^h[1-6]$/.test(tg)) return "\n\n" + "#".repeat(Math.min(3, +tg[1])) + " " + kids().trim() + "\n\n";
    if (tg === "ul" || tg === "ol") { let i = 0; return "\n" + [...n.children].filter(c => c.tagName === "LI").map(li => { i++; const ck = li.querySelector('input[type="checkbox"]'); const cls = (li.className || "") + " " + (n.className || ""); const done = ck ? ck.checked || ck.hasAttribute("checked") : /checked|done|completed/.test(li.className || ""); const box = ck || /check|todo/i.test(cls) ? (done ? "[x] " : "[ ] ") : ""; const inner = [...li.childNodes].map(k => walk(k, ctx)).join("").trim().replace(/\n+/g, " "); return (tg === "ol" && !box ? i + ". " : "- " + box) + inner; }).join("\n") + "\n"; }
    if (tg === "li") return "\n- " + kids().trim();
    if (tg === "input" && n.type === "checkbox") return n.checked ? "[x] " : "[ ] ";
    if (tg === "b" || tg === "strong") { const s = kids(); return s.trim() ? "**" + s.trim() + "** " : s; }
    if (tg === "i" || tg === "em") { const s = kids(); return s.trim() ? "*" + s.trim() + "* " : s; }
    if (tg === "a") { const s = kids().trim(); const href = n.getAttribute("href") || ""; return /^https?:/.test(href) && href !== s ? `${s} (${href})` : s; }
    if (tg === "hr") return "\n---\n";
    if (tg === "img") return "";
    if (tg === "tr") return "\n" + [...n.children].map(c => walk(c, ctx).trim()).join(" | ");
    if (["p", "div", "section", "article", "blockquote", "pre", "table", "tbody", "thead", "header", "footer", "en-note"].includes(tg)) return "\n" + kids() + "\n";
    return kids();
  };
  return cleanText(walk(doc.body || doc.documentElement, {}).replace(/[ \t]+\n/g, "\n").replace(/\n[ \t]+/g, "\n"));
}
function rtfToText(r) {
  let s = String(r);
  const dropGroup = re => { let m; while ((m = re.exec(s))) { let i = m.index, d = 0, j = i; for (; j < s.length; j++) { if (s[j] === "\\") { j++; continue; } if (s[j] === "{") d++; else if (s[j] === "}") { d--; if (!d) break; } } s = s.slice(0, i) + s.slice(j + 1); re.lastIndex = 0; } };
  dropGroup(/\{\\\*/g); dropGroup(/\{\\(fonttbl|colortbl|stylesheet|info|expandedcolortbl)/g);
  s = s.replace(/\\'([0-9a-f]{2})/gi, (_, h) => { const c = parseInt(h, 16); const cp = { 128: "€", 130: "‚", 132: "„", 133: "…", 145: "‘", 146: "’", 147: "“", 148: "”", 149: "•", 150: "–", 151: "—" }; return cp[c] || String.fromCharCode(c); });
  s = s.replace(/\\u(-?\d+)\??/g, (_, n) => String.fromCharCode(+n < 0 ? 65536 + +n : +n)).replace(/\\(par|line)\b ?/g, "\n").replace(/\\tab\b ?/g, "\t").replace(/\\[a-z]+-?\d* ?/gi, "").replace(/\\([{}\\])/g, "$1").replace(/[{}]/g, "");
  return cleanText(s);
}
async function fileToNotes(f) {
  const name = f.name || ""; const ext = (name.split(".").pop() || "").toLowerCase(); const base = name.replace(/\.[^.]+$/, ""); const when = f.lastModified || Date.now();
  if (ext === "pdf") { const lib = await Sheet.loadPdf(); const doc = await lib.getDocument({ data: new Uint8Array(await f.arrayBuffer()), isEvalSupported: false }).promise; const pages = [];
    for (let p = 1; p <= Math.min(doc.numPages, 40); p++) { const pg = await doc.getPage(p); const tc = await pg.getTextContent(); const rows = []; for (const it of tc.items) { if (!it.str) continue; const y = Math.round(it.transform[5]); let r = rows.find(r => Math.abs(r.y - y) <= 3); if (!r) rows.push(r = { y, s: [] }); r.s.push([it.transform[4], it.str]); } rows.sort((a, b) => b.y - a.y); pages.push(rows.map(r => r.s.sort((a, b) => a[0] - b[0]).map(x => x[1]).join(" ").replace(/\s+/g, " ").trim()).join("\n")); }
    return [{ title: base, body: cleanText(pages.join("\n\n")), when }]; }
  const txt = await f.text();
  if (ext === "enex") { const x = new DOMParser().parseFromString(txt, "application/xml"); return [...x.getElementsByTagName("note")].map(n => { const tt = (n.getElementsByTagName("title")[0] || {}).textContent || base; const c = (n.getElementsByTagName("content")[0] || {}).textContent || ""; const cr = ((n.getElementsByTagName("created")[0] || {}).textContent || "").match(/^(\d{4})(\d\d)(\d\d)/); return { title: tt.trim(), body: htmlToMd(c), when: cr ? Date.parse(`${cr[1]}-${cr[2]}-${cr[3]}T12:00:00`) : when }; }); }
  if (ext === "json") { let j; try { j = JSON.parse(txt); } catch (e) { return [{ title: base, body: cleanText(txt), when }]; } const arr = Array.isArray(j) ? j : [j];
    return arr.filter(o => o && typeof o === "object").map(o => ({ title: (o.title || base || "").trim(), body: cleanText([o.textContent || o.text || o.body || o.content || "", ...(o.listContent || []).map(li => `- [${li.isChecked ? "x" : " "}] ${li.text || ""}`)].filter(Boolean).join("\n")), when: o.userEditedTimestampUsec ? Math.round(o.userEditedTimestampUsec / 1000) : when, tags: (o.labels || []).map(l => l.name).filter(Boolean) })); }
  if (ext === "html" || ext === "htm") { const d = new DOMParser().parseFromString(txt, "text/html"); const kt = d.querySelector(".title"); const tt = (kt && kt.textContent.trim()) || (d.querySelector("title") || {}).textContent || base; if (kt) kt.remove(); const md = htmlToMd(d.body ? d.body.innerHTML : txt); if (!kt && !(d.querySelector("title") || {}).textContent) { const sp = splitTitle(md, base); return [{ title: sp.title, body: sp.body, when }]; } return [{ title: String(tt).trim() || base, body: md, when }]; }
  if (ext === "rtf") { const b = rtfToText(txt); const s = splitTitle(b, base); return [{ title: s.title, body: s.body, when }]; }
  const b = cleanText(txt); if (ext === "md" || ext === "txt" || ext === "text" || ext === "markdown" || !ext) { const s = splitTitle(b, base); return [{ title: s.title === base ? base : s.title, body: s.title === base ? b : s.body, when }]; }
  throw new Error("formato");
}
const notesList = () => [...S.notes.entries()].filter(([, n]) => n && !n.archived);
function noteCard(id, n) {
  const txt = String(n.body || "").replace(/^\s*[-*]\s+\[( |x)\]\s+/gm, m => m.includes("x") ? "☑ " : "☐ ").replace(/[#*]/g, "").trim();
  const s = (n.title + " " + (n.body || "") + " " + (n.tags || []).join(" ") + " " + (n.playerId && P(n.playerId) ? pname(P(n.playerId)) : "")).toLowerCase();
  return `<article class="ncard k-${n.kind || "lavoro"}${n.pinned ? " pin" : ""}" data-a="noteOpen" data-id="${id}" data-s="${v57x(s)}" tabindex="0">
   <div class="row between"><b class="nt">${v57x(n.title || t("Nota senza titolo"))}</b><button type="button" class="npin" data-a="notePin" data-id="${id}" aria-pressed="${!!n.pinned}" title="${n.pinned ? t("Togli dalle fissate") : t("Fissa in alto")}" aria-label="${n.pinned ? t("Togli dalle fissate") : t("Fissa in alto")}">${n.pinned ? "★" : "☆"}</button></div>
   <p class="np">${v57x(txt.slice(0, 220))}${txt.length > 220 ? "…" : ""}</p>
   <div class="nm"><span class="pill ${n.kind === "personale" ? "c-blue" : "c-good"}">${t(n.kind === "personale" ? "Personale" : "Lavoro")}</span>${n.playerId && P(n.playerId) ? `<button type="button" class="kchip" data-a="openPlayer" data-id="${n.playerId}">👤 ${v57x(pname(P(n.playerId)))}</button>` : ""}${(n.tags || []).slice(0, 3).map(tg => `<span class="tag"><i></i>${v57x(tg)}</span>`).join("")}<span class="m">${fmtDate(new Date(n.updated || n.created || Date.now()).toISOString().slice(0, 10))}</span>${n.example ? `<span class="ex">${t("Esempio")}</span>` : ""}</div></article>`;
}
R.note = () => {
  const f = ui.nf || "all"; let ns = notesList(); const cnt = { all: ns.length, lavoro: ns.filter(([, n]) => (n.kind || "lavoro") === "lavoro").length, personale: ns.filter(([, n]) => n.kind === "personale").length, pin: ns.filter(([, n]) => n.pinned).length };
  if (f === "pin") ns = ns.filter(([, n]) => n.pinned); else if (f !== "all") ns = ns.filter(([, n]) => (n.kind || "lavoro") === f);
  ns.sort((a, b) => (!!b[1].pinned - !!a[1].pinned) || ((b[1].updated || 0) - (a[1].updated || 0)));
  return `<div class="head"><div><h1>${t("Note")}</h1><p class="sub">${t(PAGE_DESC.note)}</p></div><div class="row"><button class="btn" data-a="noteImport">⇪ ${t("Importa")}</button><button class="btn pri" data-a="noteNew">+ ${t("Nuova nota")}</button></div></div>
   <div class="row between ntools"><div class="seg" role="group" aria-label="${t("Filtro")}">${[["all", "Tutte"], ["lavoro", "Lavoro"], ["personale", "Personali"], ["pin", "Fissate"]].map(([k, n]) => `<button data-a="noteF" data-v="${k}" aria-pressed="${f === k}">${t(n)} <span class="m">${cnt[k]}</span></button>`).join("")}</div>
   <label class="nsearch">${ico("cerca")}<input type="search" id="nq" placeholder="${t("Cerca nelle note…")}" value="${v57x(ui.nq || "")}" autocomplete="off" aria-label="${t("Cerca nelle note")}"></label></div>
   ${ns.length ? `<div class="ngrid" id="ngrid">${ns.map(([id, n]) => noteCard(id, n)).join("")}</div><div class="empty" id="nnone" hidden>${t("Nessuna nota trovata.")}</div>` : `<div class="empty">${cnt.all ? t("Nessuna nota in questa sezione.") : t("Ancora nessuna nota. Scrivine una o importale da Note di Apple, Google Keep, Evernote o da un file.")}<div class="row" style="justify-content:center;margin-top:10px"><button class="btn" data-a="noteImport">⇪ ${t("Importa")}</button><button class="btn pri" data-a="noteNew">+ ${t("Nuova nota")}</button></div></div>`}`;
};
const noteFilterDom = () => { const q = (ui.nq || "").toLowerCase().trim(); let vis = 0; $$("#ngrid .ncard").forEach(c => { const ok = !q || q.split(/\s+/).every(w => c.dataset.s.includes(w)); c.hidden = !ok; if (ok) vis++; }); const nn = $("#nnone"); if (nn) nn.hidden = vis > 0; };
document.addEventListener("input", e => { if (e.target && e.target.id === "nq") { ui.nq = e.target.value; noteFilterDom(); } });
function noteSheet(id, preset) {
  const n = id ? S.notes.get(id) : { title: "", body: "", kind: "lavoro", tags: [], ...(preset || {}) }; if (!n) return;
  const pls = [...S.players.entries()].filter(([, p]) => !p.archived).sort((a, b) => pname(a[1]).localeCompare(pname(b[1]))); ui.nPrev = false;
  sheet(`<div class="row between"><h2>${id ? t("Nota") : t("Nuova nota")}</h2><button class="btn sm ghost" data-a="closeSheetBtn" aria-label="${t("Chiudi")}">✕</button></div>
   <div class="fgrid"><label class="f full">${t("Titolo")}<input type="text" id="nTitle" maxlength="140" value="${v57x(n.title)}" placeholder="${t("es. Idee per il report di Brunner")}"></label>
   <label class="f">${t("Tipo")}<select id="nKind">${NOTE_KINDS.map(([k, l]) => `<option value="${k}" ${(n.kind || "lavoro") === k ? "selected" : ""}>${t(l)}</option>`).join("")}</select></label>
   <label class="f">${t("Giocatore (facoltativo)")}<select id="nP"><option value="">—</option>${pls.map(([pid, p]) => `<option value="${pid}" ${n.playerId === pid ? "selected" : ""}>${v57x(pname(p))}</option>`).join("")}</select></label>
   <label class="f full">${t("Tag (separati da virgola)")}<input type="text" id="nTags" value="${v57x((n.tags || []).join(", "))}" placeholder="${t("es. mercato, U19, video")}"></label></div>
   <div class="ntb" role="toolbar" aria-label="${t("Formattazione")}"><button type="button" class="btn sm" data-a="nFmt" data-f="h" title="${t("Titoletto")}">H</button><button type="button" class="btn sm" data-a="nFmt" data-f="b" title="${t("Grassetto")}"><b>B</b></button><button type="button" class="btn sm" data-a="nFmt" data-f="li" title="${t("Elenco")}">•</button><button type="button" class="btn sm" data-a="nFmt" data-f="ck" title="${t("Casella da spuntare")}">☐</button><button type="button" class="btn sm" data-a="nFmt" data-f="hr" title="${t("Linea")}">―</button><span class="ntbsep" aria-hidden="true"></span><button type="button" class="btn sm" data-a="nUndo" id="nUndoB" title="${t("Annulla")} (⌘Z)" aria-label="${t("Annulla")}" disabled>↶</button><button type="button" class="btn sm" data-a="nRedo" id="nRedoB" title="${t("Ripeti")} (⇧⌘Z)" aria-label="${t("Ripeti")}" disabled>↷</button><span class="grow"></span><button type="button" class="btn sm" data-a="nPrev" aria-pressed="false">${t("Anteprima")}</button></div>
   <textarea id="nBody" rows="12" maxlength="60000" placeholder="${t("Scrivi qui. Puoi usare: # titoletto, - elenco, - [ ] casella, **grassetto**.")}">${v57x(n.body || "")}</textarea><div id="nPrevBox" class="mdview" hidden></div>
   ${n.source ? `<p class="m">${t("Origine")}: ${v57x(n.source)}</p>` : ""}
   <div class="row between" style="margin-top:12px"><div class="row">${id ? `<button class="btn danger" data-a="noteDel" data-id="${id}">${t("Elimina")}</button><button class="btn" data-a="noteMd" data-id="${id}">⇩ ${t("Scarica .md")}</button>` : ""}</div><div class="row"><button class="btn" data-a="closeSheetBtn">${t("Annulla")}</button><button class="btn pri" data-a="noteSave" data-id="${id || ""}">${t("Salva")}</button></div></div>`, true);
  setTimeout(() => { const i = $(id ? "#nBody" : "#nTitle"); if (i) i.focus(); }, 30);
}
function importSheet() {
  sheet(`<div class="row between"><h2>${t("Importa note")}</h2><button class="btn sm ghost" data-a="closeSheetBtn" aria-label="${t("Chiudi")}">✕</button></div>
   <p class="sub small">${t("Le note vengono pulite e messe in un formato ordinato: titolo, paragrafi, elenchi e caselle da spuntare. Restano solo su questo dispositivo, cifrate.")}</p>
   <div class="fgrid"><label class="f">${t("Salva come")}<select id="impKind">${NOTE_KINDS.map(([k, l]) => `<option value="${k}">${t(l)}</option>`).join("")}</select></label></div>
   <h3 class="h3s">1 · ${t("Da file")}</h3><p class="m">${t("File .txt, .md, .rtf, .html, .pdf, Evernote (.enex) e Google Keep (Takeout: .json o .html). Puoi sceglierne tanti insieme.")}</p>
   <label class="btn pri filebtn">⇪ ${t("Scegli i file")}<input type="file" id="impFiles" multiple accept=".txt,.md,.markdown,.text,.rtf,.html,.htm,.pdf,.enex,.json,text/plain,text/markdown,text/html,application/rtf,application/pdf,application/json" hidden></label>
   <h3 class="h3s">2 · ${t("Copia e incolla")}</h3><p class="m">${t("Da Note di Apple, Pages, Word, Google Docs o una mail: seleziona il testo (⌘A), copialo (⌘C) e incollalo qui sotto (⌘V). Grassetti, elenchi e caselle restano.")}</p>
   <div id="impPaste" class="pastebox" contenteditable="true" role="textbox" aria-multiline="true" aria-label="${t("Incolla qui il testo")}" data-ph="${t("Incolla qui il testo…")}"></div>
   <div class="row end" style="margin-top:10px"><button class="btn" data-a="closeSheetBtn">${t("Annulla")}</button><button class="btn pri" data-a="impPasteSave">${t("Converti e salva")}</button></div>
   <details class="howto"><summary>${t("Come esportare da Note di Apple, Google Keep ed Evernote")}</summary><ul class="small plist"><li><b>${t("Note di Apple")}</b>: ${t("apri la nota, seleziona tutto e copia, poi incolla qui. Su iPhone puoi anche usare Condividi › Salva su File (.txt) e poi importare il file.")}</li><li><b>Google Keep</b>: ${t("takeout.google.com › seleziona solo Keep › scarica: dentro ci sono i file .json e .html da importare.")}</li><li><b>Evernote</b>: ${t("seleziona le note › Esporta › formato .enex.")}</li><li><b>Word / Pages</b>: ${t("copia e incolla il testo, oppure esporta in .rtf o .pdf.")}</li></ul></details>`, true);
}
const saveImported = (arr, src) => { const kind = ($("#impKind") || {}).value || "lavoro"; let n = 0; for (const x of arr) { if (!x || (!x.title && !x.body)) continue; put("notes", uid(), { title: (x.title || t("Nota senza titolo")).slice(0, 140), body: x.body || "", kind, tags: x.tags || [], source: src, created: x.when || Date.now(), updated: x.when || Date.now() }); n++; } return n; };
document.addEventListener("change", async e => { if (!e.target || e.target.id !== "impFiles") return; const files = [...e.target.files]; let n = 0; const bad = [];
  for (const f of files) { try { n += saveImported(await fileToNotes(f), t("file «{f}»", { f: f.name })); } catch (x) { bad.push(f.name); } }
  closeSheet(); ui.nf = "all"; if (ui.view !== "note") { resetSub(); go("note"); } else render(true);
  toast(n ? t("Importate {n} note", { n }) + (bad.length ? " · " + t("non letti: {f}", { f: bad.join(", ") }) : "") : t("Nessuna nota trovata nei file scelti."), 4500); });
document.addEventListener("paste", e => { const box = e.target && e.target.closest && e.target.closest("#impPaste"); if (!box) return; e.preventDefault(); const cd = e.clipboardData; const html = cd && cd.getData("text/html"); const txt = cd && cd.getData("text/plain");
  box.dataset.md = html ? htmlToMd(html) : cleanText(txt || ""); box.innerHTML = mdHtml(box.dataset.md) || v57x(box.dataset.md); });
Object.assign(A, {
  noteNew: () => { closeSheet(); noteSheet(null, ui.nf === "personale" ? { kind: "personale" } : null); },
  noteOpen: el => noteSheet(el.dataset.id),
  noteF: el => { ui.nf = el.dataset.v; render(true); },
  notePin: (el, e) => { if (e) e.stopPropagation(); const n = S.notes.get(el.dataset.id); if (!n) return; put("notes", el.dataset.id, { ...n, pinned: !n.pinned }); render(true); },
  noteSave: el => { const title = $("#nTitle").value.trim(), body = $("#nBody").value.replace(/\s+$/, ""); if (!title && !body.trim()) { toast(t("La nota è vuota")); return; }
    const id = el.dataset.id || uid(); const old = S.notes.get(id) || { created: Date.now() }; const s = title ? { title, body } : splitTitle(cleanText(body));
    put("notes", id, { ...old, title: s.title, body: title ? body : s.body, kind: $("#nKind").value, playerId: $("#nP").value, tags: $("#nTags").value.split(",").map(x => x.trim()).filter(Boolean).slice(0, 12), updated: Date.now() });
    closeSheet(); toast(el.dataset.id ? t("Nota aggiornata") : t("Nota salvata")); if (ui.view === "note") render(true); },
  noteDel: el => { const id = el.dataset.id; confirmSheet(t("Eliminare questa nota? Subito dopo puoi ancora annullare."), () => { del("notes", id); closeSheet(); toast(t("Eliminata")); render(true); }, t("Elimina")); },
  noteMd: el => { const n = S.notes.get(el.dataset.id); if (!n) return; const blob = new Blob([`# ${n.title}\n\n${n.body || ""}\n`], { type: "text/markdown" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = (n.title || "nota").replace(/[\\/:*?"<>|]+/g, " ").trim().slice(0, 60) + ".md"; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); },
  noteImport: () => importSheet(),
  impPasteSave: () => { const box = $("#impPaste"); const md = box.dataset.md != null ? box.dataset.md : cleanText(box.innerText || ""); if (!md.trim()) { toast(t("Incolla prima un testo")); box.focus(); return; } const s = splitTitle(md); const n = saveImported([{ title: s.title, body: s.body, when: Date.now() }], t("copia e incolla")); closeSheet(); ui.nf = "all"; if (ui.view !== "note") { resetSub(); go("note"); } else render(true); toast(t("Importate {n} note", { n })); },
  nPrev: el => { ui.nPrev = !ui.nPrev; el.setAttribute("aria-pressed", ui.nPrev); const ta = $("#nBody"), pv = $("#nPrevBox"); pv.innerHTML = mdHtml(ta.value) || `<p class="m">${t("Niente da mostrare.")}</p>`; pv.hidden = !ui.nPrev; ta.hidden = ui.nPrev; },
  nFmt: el => { const ta = $("#nBody"); if (!ta || ta.hidden) return; const f = el.dataset.f; const s = ta.selectionStart, e = ta.selectionEnd, v = ta.value; const sel = v.slice(s, e); const ls = v.lastIndexOf("\n", s - 1) + 1;
    let nv, cur; if (f === "b") { nv = v.slice(0, s) + "**" + (sel || t("testo")) + "**" + v.slice(e); cur = s + 2 + (sel || t("testo")).length; }
    else if (f === "hr") { nv = v.slice(0, e) + "\n---\n" + v.slice(e); cur = e + 5; }
    else { const pre = f === "h" ? "## " : f === "li" ? "- " : "- [ ] "; nv = v.slice(0, ls) + pre + v.slice(ls); cur = e + pre.length; }
    ta.value = nv; ta.focus(); ta.setSelectionRange(cur, cur); if (window.nHistPush) nHistPush(true); }
});
// nel profilo del giocatore: le sue note
window.playerPage = (orig => function (id) { const h = orig(id); const ns = notesList().filter(([, n]) => n.playerId === id); if (!ns.length) return h; return h + `<section class="panel noprint"><div class="row between"><h2>📝 ${t("Note su questo giocatore")} <span class="m">${ns.length}</span></h2><button class="btn sm" data-a="noteNewFor" data-id="${id}">+ ${t("Nota")}</button></div><div class="ngrid" style="margin-top:8px">${ns.map(([nid, n]) => noteCard(nid, n)).join("")}</div></section>`; })(window.playerPage);
A.noteNewFor = el => noteSheet(null, { playerId: el.dataset.id });

/* ---------- 4. Nota scritta durante la partita ---------- */
Voice.btn = (orig => function () { const v = orig.call(this); return this._noW ? v : v + `<button class="btn" data-a="quickNote" title="${t("Nota scritta")}">✍ ${t("Nota scritta")}</button>`; })(Voice.btn);
Voice.updBtn = function () { const b = $("#voiceBtn"); if (b) { this._noW = true; try { b.outerHTML = this.btn(); } finally { this._noW = false; } } };
A.quickNote = () => {
  if (!ui.liveP) { toast(t("Scegli prima il giocatore")); return; } const p = P(ui.liveP); const min = ui.timer ? minuteOf(ui.timer) : 0;
  sheet(`<div class="row between"><h2>✍ ${t("Nota scritta")}</h2><button class="btn sm ghost" data-a="closeSheetBtn" aria-label="${t("Chiudi")}">✕</button></div><p class="m">${v57x(pname(p))} · ${min}'</p>
   <textarea id="qnText" rows="4" maxlength="500" placeholder="${t("es. chiede palla tra le linee e si gira bene sul piede debole")}"></textarea>
   <div class="chips" style="margin-top:8px">${["Ottima lettura", "Comunica molto", "Calo fisico", "Reazione dopo l'errore", "Da rivedere in video"].map(s => `<button type="button" class="chip" data-a="qnChip" data-v="${v57x(t(s))}">${v57x(t(s))}</button>`).join("")}</div>
   <div class="row end" style="margin-top:10px"><button class="btn" data-a="closeSheetBtn">${t("Annulla")}</button><button class="btn pri" data-a="quickNoteSave" data-min="${min}">${t("Salva")}</button></div>`);
  setTimeout(() => { const i = $("#qnText"); if (i) i.focus(); }, 30);
};
A.qnChip = el => { const i = $("#qnText"); i.value = (i.value.trim() ? i.value.trim() + " · " : "") + el.dataset.v; i.focus(); };
A.quickNoteSave = el => { const v = ($("#qnText").value || "").trim(); if (!v) { toast(t("Scrivi la nota")); return; } const m = S.matches.get(ui.matchId); if (!m) { closeSheet(); return; }
  put("matches", ui.matchId, { ...m, events: [...(m.events || []), { id: uid(), t: +el.dataset.min || 0, h: (ui.timer || {}).half || 1, p: ui.liveP, c: "Nota scritta", o: "=", n: v }] }); closeSheet(); toast(t("Nota scritta salvata")); if (window.renderLive) renderLive(); else render(true); };
document.addEventListener("keydown", e => { if (e.target && e.target.id === "qnText" && e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); const b = $('[data-a="quickNoteSave"]'); if (b) b.click(); } });

/* ---------- 5. Menu laterale riducibile ---------- */
const sideMin = () => !!Prefs.get("sideMin", false);
const applySide = () => { const r = $("#appRoot"); if (r) r.classList.toggle("sidemin", sideMin()); const b = $("#side .sidetog"); if (b) { b.innerHTML = ico(sideMin() ? "sider" : "sidel"); b.setAttribute("aria-label", sideMin() ? t("Espandi il menu") : t("Riduci il menu")); b.setAttribute("aria-expanded", String(!sideMin())); b.dataset.tip = sideMin() ? t("Espandi il menu") : t("Riduci il menu"); } const f = $("#side .sidefold"); if (f) f.innerHTML = `${ico(sideMin() ? "sider" : "sidel")}<span>${sideMin() ? t("Espandi il menu") : t("Riduci il menu")}</span>`; };
window.renderShell = (orig => function () {
  orig(); const side = $("#side"); if (!side) return;
  const br = side.querySelector(".brand"); if (br && !side.querySelector(".sidetog")) br.insertAdjacentHTML("afterend", `<button type="button" class="sidetog" data-a="sideToggle"></button>`);
  side.querySelectorAll(".nav a").forEach(a => { a.dataset.tip = a.textContent.trim(); const lab = [...a.childNodes].find(n => n.nodeType === 3 && n.nodeValue.trim()); if (lab) { const s = document.createElement("span"); s.className = "nl"; s.textContent = lab.nodeValue; lab.replaceWith(s); } });
  const sc = side.querySelector(".scoutcard"); if (sc) sc.dataset.tip = (sc.querySelector("b") || {}).textContent || t("Il tuo profilo");
  const sf = side.querySelector(".side-foot"); if (sf) { const lk = sf.querySelector('[data-a="lockNow"]'); if (lk && !lk.querySelector("svg")) { lk.innerHTML = `${ico("lock")}<span>${lk.textContent}</span>`; lk.dataset.tip = t("Blocca ora"); } if (!sf.querySelector(".sidefold")) sf.insertAdjacentHTML("beforeend", `<button type="button" class="sidefold" data-a="sideToggle"></button>`); }
  applySide();
})(window.renderShell);
A.sideToggle = () => { Prefs.set("sideMin", !sideMin()); applySide(); sideTipHide(); };
let sideTipEl = null;
const sideTipHide = () => { if (sideTipEl) sideTipEl.hidden = true; };
const sideTipShow = el => { if (!sideMin() || !el || !el.dataset.tip) return; if (!sideTipEl) { sideTipEl = document.createElement("div"); sideTipEl.className = "sidetip"; sideTipEl.setAttribute("role", "tooltip"); document.body.appendChild(sideTipEl); } const r = el.getBoundingClientRect(); sideTipEl.textContent = el.dataset.tip; sideTipEl.style.top = Math.round(r.top + r.height / 2) + "px"; sideTipEl.style.left = Math.round(r.right + 10) + "px"; sideTipEl.hidden = false; };
document.addEventListener("mouseover", e => { const el = e.target.closest && e.target.closest("#side [data-tip]"); if (el) sideTipShow(el); else sideTipHide(); });
document.addEventListener("focusin", e => { const el = e.target.closest && e.target.closest("#side [data-tip]"); if (el) sideTipShow(el); else sideTipHide(); });
document.addEventListener("scroll", sideTipHide, true);

/* ---------- 6. Email nel piè di pagina ---------- */
window.footHtml = (orig => function () { const h = orig(); const mail = `<a class="fmail" href="mailto:${MY_EMAIL}" title="${t("Scrivimi una email")}" aria-label="${t("Email")}: ${MY_EMAIL}"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect width="24" height="24" rx="4" fill="#0A3B5C"/><path fill="#fff" d="M5 7.5h14v9H5zm1.6 1.2v.2L12 12.4l5.4-3.5v-.2zm10.8 1.6L12 13.8l-5.4-3.5v5h10.8z"/></svg></a>`;
  return h.indexOf('<a class="fli-ico"') >= 0 ? h.replace('<a class="fli-ico"', mail + '<a class="fli-ico"') : h.replace('<div class="fcopy">', mail + '<div class="fcopy">'); })(window.footHtml);
footHtml = window.footHtml;
setTimeout(() => { try { const f = document.querySelector("#lockRoot .appfoot"); if (f && !f.querySelector(".fmail")) f.innerHTML = footHtml(); } catch (e) { } }, 0);
window.addEventListener("load", () => setTimeout(() => { try { const f = document.querySelector("#lockRoot .appfoot"); if (f && !f.querySelector(".fmail")) f.innerHTML = footHtml(); } catch (e) { } }, 120));
A.legalInfo = (orig => () => { orig(); const r = $("#sheetRoot .sheet .row.end"); if (r) r.insertAdjacentHTML("afterbegin", `<a class="btn" href="mailto:${MY_EMAIL}">✉ ${t("Email")}</a>`); })(A.legalInfo);

/* ---------- 7. Statistiche: ogni dato porta all'elenco ---------- */
const PF_RESET = { q: "", role: "", verdict: "", level: "", tag: "", list: "", foot: "", nat: "", ageMin: "", ageMax: "", rMin: "", contract: "" };
A.statGo = el => { const f = JSON.parse(el.dataset.f || "{}"); closeSheet(); resetSub(); if (f.search) { A.searchSet({ dataset: { q: f.search } }); return; } if (f.view) { go(f.view); return; } ui.pf = { ...(ui.pf || {}), ...PF_RESET, ...f }; if (f.g) { ui.pgroup = f.g; delete ui.pf.g; } go("giocatori"); toast(t("Elenco filtrato: puoi togliere i filtri in alto")); };
const statLink = (row, f) => { row.classList.add("click"); row.dataset.a = "statGo"; row.dataset.f = JSON.stringify(f); row.setAttribute("role", "button"); row.tabIndex = 0; row.title = t("Apri l'elenco"); };
const decorate = (map) => { for (const blk of $$("#sheetRoot .sblock")) { const h = (blk.querySelector("h3") || {}).textContent || ""; const fn = map[h]; if (!fn) continue; blk.querySelectorAll(".sbar").forEach(r => { const f = fn((r.querySelector(".sl") || {}).textContent || ""); if (f) statLink(r, f); }); } };
STATS.players = (orig => function () { orig();
  const bands = { "≤ 17": { ageMax: 17 }, "18–21": { ageMin: 18, ageMax: 21 }, "22–25": { ageMin: 22, ageMax: 25 }, "26–29": { ageMin: 26, ageMax: 29 }, "30+": { ageMin: 30 } };
  decorate({ [t("Per reparto")]: () => ({ g: "dept" }), [t("Per età")]: l => bands[l], [t("Per giudizio")]: l => { const v = Cfg.get().verdicts.find(x => L(x) === l); return v ? { verdict: v.id } : null; }, [t("Campionati più seguiti")]: l => ({ q: l }) });
  const k = $$("#sheetRoot .skpi > div"); if (k[0]) statLink(k[0], {}); if (k[4]) statLink(k[4], { contract: 12 }); })(STATS.players);
STATS.seen = (orig => function () { orig(); decorate({ [t("Per competizione")]: l => ({ search: l }) }); const k = $$("#sheetRoot .skpi > div"); if (k[0]) statLink(k[0], { view: "partite" }); })(STATS.seen);
STATS.next = (orig => function () { orig(); decorate({ [t("Per competizione")]: l => ({ search: l }) }); const k = $$("#sheetRoot .skpi > div"); if (k[0]) statLink(k[0], { view: "calendario" }); })(STATS.next);
STATS.evals = (orig => function () { orig(); const k = $$("#sheetRoot .skpi > div"); if (k[0]) statLink(k[0], { view: "report" }); })(STATS.evals);
document.addEventListener("keydown", e => { if (e.key === "Enter" && e.target && e.target.dataset && e.target.dataset.a === "statGo") { e.preventDefault(); e.target.click(); } });
// ricerca: anche note e impegni
R.cerca = (orig => () => { const h = orig(); const raw = (ui.q || "").trim().toLowerCase(); if (raw.length < 2) return h;
  const ns = notesList().filter(([, n]) => (n.title + " " + (n.body || "") + " " + (n.tags || []).join(" ")).toLowerCase().includes(raw)).slice(0, 8);
  const ts = todos().filter(([, x]) => (x.title + " " + (x.notes || "")).toLowerCase().includes(raw)).slice(0, 8);
  if (!ns.length && !ts.length) return h;
  const sec = `${ns.length ? `<section class="panel"><h2>${t("Note")} <span class="m">${ns.length}</span></h2><div class="list">${ns.map(([id, n]) => `<div class="item click" data-a="noteGo" data-id="${id}"><span class="vico">📝</span><div class="grow"><div class="t">${v57x(n.title)}</div><div class="m">${v57x(String(n.body || "").replace(/\s+/g, " ").slice(0, 90))}</div></div></div>`).join("")}</div></section>` : ""}${ts.length ? `<section class="panel"><h2>${t("Impegni")} <span class="m">${ts.length}</span></h2><div class="list">${ts.map(([id, x]) => `<div class="item click" data-a="todoEdit" data-id="${id}"><span class="vico">${tdKind(x.kind)[2]}</span><div class="grow"><div class="t">${v57x(x.title)}</div><div class="m">${tdMeta(x) || t(tdKind(x.kind)[1])}</div></div></div>`).join("")}</div></section>` : ""}`;
  return h.replace(`<div class="empty">${t("Nessun risultato.")}</div>`, "") + sec; })(R.cerca);
A.noteGo = el => { const id = el.dataset.id; resetSub(); go("note"); setTimeout(() => noteSheet(id), 30); };

/* ---------- esempi: qualche impegno e nota (solo giocatori inventati) ---------- */
const ficPlayers = () => [...S.players.entries()].filter(([, p]) => p.example && /^Esempio\b/.test(p.club || "")).sort((a, b) => cmpTxt(a[1].last, b[1].last));
// nell'Agenda niente nomi veri: gli incarichi di esempio vanno su giocatori inventati
function exTasksFictional() { const fic = ficPlayers(); if (!fic.length) return; let i = 0; const q = Activity.quiet, ub = Undo.busy; Activity.quiet = true; Undo.busy = true;
  try { for (const [tid, x] of [...S.tasks]) { if (!x.example) continue; const p = P(x.playerId); if (p && /^Esempio\b/.test(p.club || "")) continue; const [fid, fp] = fic[i++ % fic.length]; put("tasks", tid, { ...x, playerId: fid, matchId: "", position: roleL(mainRole(fp)) || x.position, league: fp.league || x.league }); } } finally { Activity.quiet = q; Undo.busy = ub; } }
Lock.enter = (orig => async function () { const r = await orig.apply(this, arguments); setTimeout(() => { try { exTasksFictional(); } catch (e) { } }, 800); return r; })(Lock.enter);
Examples.load = (orig => function () { const r = orig.apply(this, arguments); try { if (![...S.todos.values()].some(x => x.example)) {
  const d = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10); const pl = ficPlayers(); const pid = i => (pl[i] || [])[0] || "";
  const q = Activity.quiet, ub = Undo.busy; Activity.quiet = true; Undo.busy = true;
  try {
    [[t("Rivedere il video della partita di sabato (esempio)"), "video", "todo", 1, d(0), "", pid(0)], [t("Telefonare al responsabile del settore giovanile (esempio)"), "call", "todo", 2, d(1), "10:00", ""], [t("Scrivere il report sul terzino sinistro (esempio)"), "report", "doing", 1, d(0), "", pid(2)], [t("Prenotare il treno per la trasferta (esempio)"), "travel", "todo", 3, d(3), "", ""], [t("Preparare le domande per la riunione di mercato (esempio)"), "meet", "done", 2, d(-1), "", ""]]
      .forEach(([title, kind, status, prio, due, time, playerId]) => put("todos", uid(), { title, kind, status, prio, due, time, playerId, matchId: "", notes: "", steps: kind === "report" ? [{ t: t("Rileggere gli appunti"), d: true }, { t: t("Scegliere tre evidenze"), d: false }, { t: t("Firmare e condividere"), d: false }] : [], example: true, created: Date.now(), doneAt: status === "done" ? Date.now() : null }));
    put("notes", uid(), { title: t("Metodo per le partite giovanili (esempio)"), body: t("## Prima della partita\n- Controllare la distinta e i numeri di maglia\n- Scegliere un solo giocatore obiettivo\n\n## Durante\n- [ ] Comportamento senza palla\n- [ ] Reazione dopo l'errore\n- [ ] Comunicazione con i compagni\n\n**Ricorda:** per i minorenni annota solo ciò che vedi in campo."), kind: "lavoro", tags: [t("metodo"), "U17"], pinned: true, example: true, created: Date.now(), updated: Date.now() });
    put("notes", uid(), { title: t("Libri e corsi da finire (esempio)"), body: t("- [x] Introduzione allo scouting\n- [ ] Analisi dell'avversario\n- [ ] Capitolo sul pressing"), kind: "personale", tags: [t("studio")], example: true, created: Date.now() - 864e5, updated: Date.now() - 864e5 });
  } finally { Activity.quiet = q; Undo.busy = ub; } } } catch (e) { } return r; })(Examples.load);
Examples.load = (orig => function () { const r = orig.apply(this, arguments); try { exTasksFictional(); } catch (e) { } return r; })(Examples.load);

/* ---------- versione beta: uso personale, non commerciale ---------- */
const BETA_TXT = () => t("Versione beta di prova: possono esserci errori, anche gravi · non commerciale · vietato copiare o duplicare l'app senza consenso");
window.renderShell = (orig => function () { orig(); const m = $("#appRoot main"); if (m && !m.querySelector(".betabar")) m.insertAdjacentHTML("afterbegin", `<button type="button" class="betabar noprint" data-a="legalInfo"><span class="bpill">BETA</span><span class="btxt">${BETA_TXT()}</span></button>`); else if (m) { const b = m.querySelector(".betabar .btxt"); if (b) b.textContent = BETA_TXT(); } })(window.renderShell);
const lockBeta = () => { try { const box = document.querySelector("#lockRoot .lockbox"); if (box && !box.querySelector(".lbeta")) box.insertAdjacentHTML("beforeend", `<p class="lbeta"><span class="bpill">BETA</span> ${BETA_TXT()}</p>`); } catch (e) { } };
Lock.render = (orig => function (html) { orig.call(this, html); lockBeta(); })(Lock.render);
setTimeout(lockBeta, 0); window.addEventListener("load", () => setTimeout(lockBeta, 150));
A.legalInfo = (orig => () => { orig(); const ul = $("#sheetRoot .sheet .plist"); if (ul) ul.insertAdjacentHTML("afterbegin", `<li><b>${t("Versione beta, non commerciale.")}</b> ${t("MM Scout è in fase di prova: è pensata per l'uso personale dell'autore e per i tester che lui invita. Non è in vendita e non può essere duplicata, copiata o distribuita senza il suo consenso.")}</li>`); })(A.legalInfo);
window.footHtml = (orig => function () { return orig().replace(`${t("Tutti i diritti riservati")} · <button data-a="legalInfo">`, `${t("Tutti i diritti riservati")} · ${t("Beta, uso personale")} · <button data-a="legalInfo">`); })(window.footHtml);
footHtml = window.footHtml;

/* ---------- Agenda senza nomi reali degli esempi ---------- */
// nell'Agenda gli esempi usano solo giocatori inventati e i tuoi
window.matchPlayers = (orig => function (id, m) { if (!AG_HIDE || !m) return orig(id, m); const ok = pid => { const p = P(pid); return !p || !p.example || /^Esempio\b/.test(p.club || ""); };
  return orig(id, { ...m, focus: ok(m.focus) ? m.focus : "", targets: (m.targets || []).filter(ok), events: (m.events || []).filter(e => ok(e.p)) }); })(window.matchPlayers);
matchPlayers = window.matchPlayers;
R.calendario = agWrap(R.calendario);
A.calDay = agWrap(A.calDay);

/* ---------- profilo demo per chi vuole solo provare ---------- */
const DEMO = { email: "demo@mmscout.example", pw: "Demo-Scout-2026", name: "Scout Demo" };
async function demoEnter() {
  const btn = $('[data-a="demoEnter"]'); if (btn) { btn.disabled = true; btn.textContent = t("Preparazione della demo…"); }
  try {
    let acc = Accounts.byEmail(DEMO.email);
    if (acc) { Prefs.set("lastEmail", DEMO.email); Lock._pick = false; await Lock.show(); const pw = $("#pw"); if (!pw) return; pw.value = DEMO.pw; const em = $("#lgEmail"); if (em && !em.value) em.value = DEMO.email; const b = $("#unlockBtn"); if (b) b.click(); return; }
    acc = { id: uid(), email: DEMO.email, name: DEMO.name, db: "ms-scout-" + uid(), created: new Date().toISOString(), demo: true };
    await Store.open(acc.db); await Store.setup(DEMO.pw); Accounts.add(acc); Accounts.acc = acc; Prefs.set("lastEmail", DEMO.email);
    await Store.loadAll(); Migrate.config(); App.unlocked = true;
    put("settings", "profile", { ...Profile.get(), name: DEMO.name, email: DEMO.email, title: t("Profilo di prova"), initials: "SD" });
    Examples.load(true); try { Undo.clear(); } catch (e) { } App.touch(); Lock.hide(); if (window.Backup) Backup.afterUnlock(); render();
    setTimeout(() => toast(t("Benvenuto nella demo: ci sono tutti gli esempi. Non inserire dati veri."), 5000), 300);
  } catch (e) { toast(t("Non è stato possibile creare la demo su questo dispositivo.")); if (btn) { btn.disabled = false; btn.textContent = "▶ " + t("Entra nella demo"); } }
}
A.demoEnter = () => demoEnter();
const lockDemo = () => { try { const box = document.querySelector("#lockRoot .lockbox"); if (!box || box.querySelector(".ldemo")) return; if (!box.querySelector("#s1, #loginForm, .acct")) return;
  box.insertAdjacentHTML("beforeend", `<div class="ldemo"><b>${t("Vuoi solo provarla?")}</b><p>${t("Entra nel profilo demo: è già pieno di esempi inventati (giocatori, squadre e partite), con impegni e note. Resta solo su questo dispositivo.")}</p>
   <div class="dcred"><span>${t("Email")}: <code>${DEMO.email}</code></span><span>${t("Password provvisoria")}: <code>${DEMO.pw}</code></span></div>
   <button type="button" class="btn" data-a="demoEnter">▶ ${t("Entra nella demo")}</button><button type="button" class="lnk" data-a="hardRefresh">${t("Vedi una versione vecchia? Svuota la cache")}</button></div>`); } catch (e) { } };
Lock.render = (orig => function (html) { orig.call(this, html); lockDemo(); })(Lock.render);
setTimeout(lockDemo, 0); window.addEventListener("load", () => setTimeout(lockDemo, 160));
// nel profilo demo un promemoria in cima
window.renderShell = (orig => function () { orig(); const m = $("#appRoot main .betabar .btxt"); if (m && Accounts.acc && Accounts.acc.email === DEMO.email) m.textContent = BETA_TXT() + " · " + t("profilo demo: non inserire dati veri"); })(window.renderShell);

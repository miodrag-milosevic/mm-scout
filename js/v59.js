"use strict";
/* =========================================================
   MM Scout 5.9 — © 2026 Miodrag Milosevic. Tutti i diritti riservati.
   Vietato copiare, modificare o divulgare senza il consenso dell'autore.
   ---------------------------------------------------------
   · frecce ← → per tornare alle pagine viste · dopo l'accesso: Panoramica
   · lingue in ordine IT, EN, DE, ES, SR · nuovi tag dentro i moduli
   · storico: togliere una voce (con conferma) · note: annulla / ripeti
   · ordinamento coerente in Giocatori e Report
   ========================================================= */

/* ---------- lingue: italiano, inglese, tedesco, spagnolo, serbo ---------- */
(() => { const order = ["it", "en", "de", "fr", "es", "sr"]; LANGS.sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0])); })();

/* ---------- frecce avanti / indietro tra le pagine ---------- */
const NAVH = { stack: [], i: -1, moving: false };
const navLoc = () => (ui.edraft || ui.pdraft || !App.unlocked) ? null : { v: ui.view, p: ui.playerId || null, pt: ui.ptab, m: ui.matchId || null, mt: ui.mtab, l: ui.listId || null, id: ui.idealId || null, me: ui.meetId || null, tg: ui.tagSel || null, q: ui.view === "cerca" ? (ui.q || "") : "" };
const navKey = L => [L.v, L.p, L.m, L.l, L.id, L.me, L.tg, L.q].join("|");
function navArrowBtns() { const b = $("#navBack"), f = $("#navFwd"); const busy = !!(ui.edraft || ui.pdraft); if (b) b.disabled = busy || NAVH.i <= 0; if (f) f.disabled = busy || NAVH.i >= NAVH.stack.length - 1; }
function navRecord() {
  const L = navLoc(); if (!L) { navArrowBtns(); return; }
  if (NAVH.moving) { NAVH.moving = false; if (NAVH.stack[NAVH.i]) NAVH.stack[NAVH.i] = L; navArrowBtns(); return; }
  const cur = NAVH.stack[NAVH.i]; if (cur && navKey(cur) === navKey(L)) NAVH.stack[NAVH.i] = L; else { NAVH.stack = NAVH.stack.slice(0, NAVH.i + 1); NAVH.stack.push(L); if (NAVH.stack.length > 60) NAVH.stack.shift(); NAVH.i = NAVH.stack.length - 1; }
  navArrowBtns();
}
function navGo(d) {
  if (ui.edraft || ui.pdraft) { toast(t("Salva o annulla prima la modifica in corso.")); return; }
  const j = NAVH.i + d; const L = NAVH.stack[j]; if (!L) return; NAVH.i = j; NAVH.moving = true; closeSheet();
  Object.assign(ui, { playerId: L.p, ptab: L.pt || ui.ptab, matchId: L.m, mtab: L.mt || ui.mtab, listId: L.l, idealId: L.id, meetId: L.me, tagSel: L.tg }); if (L.v === "cerca") { ui.q = L.q; const g = $("#gq"); if (g) g.value = L.q; }
  go(L.v);
}
A.navBack = () => navGo(-1); A.navFwd = () => navGo(1);
window.render = (orig => function () { const r = orig.apply(this, arguments); try { navRecord(); } catch (e) { } return r; })(window.render);
render = window.render;
window.renderShell = (orig => function () {
  orig(); const tb = $("#topbar"); if (!tb || tb.querySelector(".navarrows")) { navArrowBtns(); return; } const s = tb.querySelector(".search");
  const h = `<div class="navarrows" role="group" aria-label="${t("Navigazione")}"><button type="button" class="iconbtn" id="navBack" data-a="navBack" title="${t("Pagina precedente")} (Alt+←)" aria-label="${t("Pagina precedente")}">←</button><button type="button" class="iconbtn" id="navFwd" data-a="navFwd" title="${t("Pagina successiva")} (Alt+→)" aria-label="${t("Pagina successiva")}">→</button></div>`;
  if (s) s.insertAdjacentHTML("beforebegin", h); else tb.insertAdjacentHTML("afterbegin", h); navArrowBtns();
})(window.renderShell);
document.addEventListener("keydown", e => { if (!App.unlocked || !e.altKey || e.metaKey || e.ctrlKey) return; const tg = e.target && e.target.tagName; if (/INPUT|TEXTAREA|SELECT/.test(tg || "")) return; if (e.key === "ArrowLeft") { e.preventDefault(); navGo(-1); } else if (e.key === "ArrowRight") { e.preventDefault(); navGo(1); } });

/* ---------- dopo l'accesso si parte sempre dalla Panoramica ---------- */
Lock.enter = (orig => async function () {
  const r = await orig.apply(this, arguments);
  try { if (App.unlocked) { resetSub(); Object.assign(ui, { listId: null, idealId: null, meetId: null, tagSel: null, q: "", view: "panoramica" }); NAVH.stack = []; NAVH.i = -1; closeSheet(); history.replaceState(null, "", "#panoramica"); render(); window.scrollTo(0, 0); } } catch (e) { }
  return r;
})(Lock.enter);

/* ---------- nuovi tag direttamente nei moduli (partita, valutazione…) ---------- */
function enhanceTagChips(root) {
  (root || document).querySelectorAll(".chips").forEach(box => {
    if (!box.querySelector("[data-tag]") || box.querySelector('[data-a="newTagInline"], .tagadd, .taginl')) return;
    box.insertAdjacentHTML("beforeend", `<button type="button" class="tagadd" data-a="tagInline">+ ${t("Nuovo tag")}</button>`);
  });
}
window.sheet = (orig => function () { const r = orig.apply(this, arguments); try { enhanceTagChips($("#sheetRoot")); } catch (e) { } return r; })(window.sheet);
sheet = window.sheet;
window.render = (orig => function () { const r = orig.apply(this, arguments); try { enhanceTagChips($("#view")); } catch (e) { } return r; })(window.render);
render = window.render;
A.tagInline = (el, e) => { if (e) { e.preventDefault(); e.stopPropagation(); } const span = document.createElement("span"); span.className = "taginl";
  span.innerHTML = `<input type="text" maxlength="40" data-vrule="tag" placeholder="${t("Nome del tag")}" aria-label="${t("Nome del tag")}"><button type="button" class="btn sm pri" data-a="tagInlineOk">✓</button><button type="button" class="btn sm ghost" data-a="tagInlineNo" aria-label="${t("Annulla")}">✕</button>`;
  el.replaceWith(span); span.querySelector("input").focus(); };
A.tagInlineNo = (el, e) => { if (e) { e.preventDefault(); e.stopPropagation(); } const span = el.closest(".taginl"); span.insertAdjacentHTML("afterend", `<button type="button" class="tagadd" data-a="tagInline">+ ${t("Nuovo tag")}</button>`); span.remove(); };
A.tagInlineOk = (el, e) => { if (e) { e.preventDefault(); e.stopPropagation(); } const span = el.closest(".taginl"); const inp = span.querySelector("input"); const name = inp.value.trim();
  if (!name) { inp.focus(); return; } if (!vCheck(inp, false)) { inp.focus(); return; } const c = clone(Cfg.get()); if (c.tags.some(x => nrm(x.name) === nrm(name))) { vShow(inp, t("Esiste già un tag con questo nome")); return; }
  const tg = { id: uid(), name, color: TAG_COLORS[c.tags.length % TAG_COLORS.length] }; c.tags.push(tg); Cfg.save(c);
  span.insertAdjacentHTML("beforebegin", `<button type="button" class="chip" data-tag="${tg.id}" aria-pressed="true">${v58x(tg.name)}</button>`);
  span.insertAdjacentHTML("afterend", `<button type="button" class="tagadd" data-a="tagInline">+ ${t("Nuovo tag")}</button>`); span.remove(); toast(t("Tag creato: {n}", { n: name })); };
document.addEventListener("keydown", e => { const i = e.target; if (!i || !i.closest || !i.closest(".taginl")) return; if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); A.tagInlineOk(i, e); } else if (e.key === "Escape") { e.preventDefault(); A.tagInlineNo(i, e); } }, true);

/* ---------- storico: togliere una voce creata per sbaglio ---------- */
A.actDel = (el, e) => { if (e) { e.preventDefault(); e.stopPropagation(); } const at = +el.dataset.at, c = el.dataset.c, id = el.dataset.id;
  confirmSheet(t("Togliere questa voce dallo storico? Sparisce solo la riga del diario: i dati del giocatore, della partita o del report restano come sono."), () => {
    const keep = x => !(x.at === at && x.c === c && x.id === id); Activity.buf = Activity.buf.filter(keep); const a = S.settings.get("activity");
    if (a && a.items) { S.settings.set("activity", { ...a, items: a.items.filter(keep), _t: Date.now() }); try { Store.write("settings", "activity"); } catch (x) { } }
    closeSheet(); toast(t("Voce tolta dallo storico")); render(true); }, t("Togli")); };

/* ---------- note: annulla / ripeti ---------- */
const NH = { st: [], i: 0, t: null };
window.nHistPush = function (now) { const ta = $("#nBody"); if (!ta) return; const go = () => { const v = ta.value; if (NH.st[NH.i] === v) return; NH.st = NH.st.slice(0, NH.i + 1); NH.st.push(v); if (NH.st.length > 200) NH.st.shift(); NH.i = NH.st.length - 1; nHistBtns(); }; clearTimeout(NH.t); if (now) go(); else NH.t = setTimeout(go, 450); };
const nHistBtns = () => { const u = $("#nUndoB"), r = $("#nRedoB"); if (u) u.disabled = NH.i <= 0; if (r) r.disabled = NH.i >= NH.st.length - 1; };
const nHistSet = j => { const ta = $("#nBody"); if (!ta || j < 0 || j >= NH.st.length) return; clearTimeout(NH.t); NH.i = j; ta.value = NH.st[j]; ta.focus(); nHistBtns(); const pv = $("#nPrevBox"); if (pv && !pv.hidden) pv.innerHTML = mdHtml(ta.value); };
window.noteSheet = (orig => function () { const r = orig.apply(this, arguments); setTimeout(() => { const ta = $("#nBody"); NH.st = [ta ? ta.value : ""]; NH.i = 0; nHistBtns(); }, 0); return r; })(window.noteSheet);
noteSheet = window.noteSheet;
A.nUndo = () => { nHistPush(true); nHistSet(NH.i - 1); }; A.nRedo = () => nHistSet(NH.i + 1);
document.addEventListener("input", e => { if (e.target && e.target.id === "nBody") nHistPush(false); });
document.addEventListener("keydown", e => { if (!e.target || e.target.id !== "nBody" || !(e.metaKey || e.ctrlKey) || (e.key !== "z" && e.key !== "Z" && e.key !== "y")) return; e.preventDefault(); e.stopPropagation(); if (e.key === "y" || e.shiftKey) A.nRedo(); else A.nUndo(); }, true);

/* ---------- ordinamento coerente in Giocatori e Report ---------- */
const SORT_HEAD = [["name", "Nome (A-Z)"], ["last", "Cognome (A-Z)"], ["role", "Posizione"], ["created", "Ultima creazione"], ["updated", "Ultima modifica"]];
SORTS["pf.sort"] = [...SORT_HEAD, ["rating", "Rating più alto"], ["age", "Età"], ["club", "Club (A-Z)"], ["verdict", "Giudizio"], ["recent", "Ultima valutazione"], ["contract", "Scadenza contratto"]];
SORTS["rf.sort"] = [...SORT_HEAD, ["rating", "Rating più alto"], ["rating_asc", "Rating più basso"], ["date", "Data partita: più recenti"], ["date_asc", "Data partita: meno recenti"], ["match", "Partita (A-Z)"]];
const updatedAt = o => o.updatedOn || (o.updatedAt ? new Date(o.updatedAt).toISOString() : "") || (o._t ? new Date(o._t).toISOString() : "") || createdAt(o);
const roleIdx = p => { const r = mainRole(p); const i = Cfg.get().roles.findIndex(x => x.id === r); return i < 0 ? 99 : i; };
window.sortPlayers = (orig => function (rows, k) { if (k === "updated") return rows.sort((a, b) => cmpTxt(updatedAt(b[1]), updatedAt(a[1]))); return orig(rows, k); })(window.sortPlayers);
sortPlayers = window.sortPlayers;
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
  const pl = e => P(e.playerId) || {};
  const so = { name: (a, b) => cmpTxt(pname(pl(a[1])), pname(pl(b[1]))) || cmpTxt(b[1].date, a[1].date), last: (a, b) => cmpTxt(pl(a[1]).last, pl(b[1]).last) || cmpTxt(pl(a[1]).first, pl(b[1]).first), role: (a, b) => roleIdx(pl(a[1])) - roleIdx(pl(b[1])) || cmpTxt(pname(pl(a[1])), pname(pl(b[1]))),
    created: (a, b) => cmpTxt(createdAt(b[1]), createdAt(a[1])), updated: (a, b) => cmpTxt(updatedAt(b[1]), updatedAt(a[1])),
    date: (a, b) => cmpTxt(b[1].date, a[1].date), date_asc: (a, b) => cmpTxt(a[1].date, b[1].date), rating: (a, b) => (evalRating(b[1]) ?? -1) - (evalRating(a[1]) ?? -1), rating_asc: (a, b) => (evalRating(a[1]) ?? 99) - (evalRating(b[1]) ?? 99), match: (a, b) => cmpTxt((a[1].home || "") + a[1].away, (b[1].home || "") + b[1].away) };
  if (!so[f.sort]) f.sort = "date"; rows.sort(so[f.sort]);
  return `<div class="head"><div><h1>${t("Report")}</h1><p class="sub">${t("Tutte le valutazioni scritte: {n}.", { n: rows.length })}</p></div><button class="btn pri" data-a="pickEvalPlayer">+ ${t("Valutazione")}</button></div>
  <section class="panel"><div class="fgrid">
   <label class="f">${t("Cerca")}<input type="search" id="rfq" value="${esc(f.q)}" placeholder="${t("Giocatore, squadra, sintesi")}"></label>
   <label class="f">${t("Dal")}<input type="date" id="rf_from" value="${esc(f.from)}"></label><label class="f">${t("Al")}<input type="date" id="rf_to" value="${esc(f.to)}"></label>
   <label class="f">${t("Valutato da")}<input type="text" id="rf_by" value="${esc(f.by)}"></label>
   <label class="f">${t("Tipologia")}${sel("rf_type", c.matchTypes, f.type, t("Tutte"))}</label>
   <label class="f">${t("Tag")}<select id="rf_tag"><option value="">${t("Tutti")}</option>${c.tags.map(x => `<option value="${x.id}" ${f.tag === x.id ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select></label>
   <label class="f">${t("Rating minimo")}<input type="number" step="0.5" id="rf_rMin" value="${esc(f.rMin)}"></label>
   <label class="chk" style="align-self:end"><input type="checkbox" id="rf_showArch" ${f.showArch ? "checked" : ""}> ${t("Mostra archiviati")}</label></div>
   <div class="row between vbar" style="margin-top:10px"><span class="m">${t("{n} valutazioni", { n: rows.length })}</span>${sortSel("rf.sort")}</div></section>
  <section class="panel"><div class="list">${rows.map(([id, e]) => evalItem(id, e, true).replace(/<\/div>$/, `<button class="iconbtn sm del" data-a="delItem" data-coll="evals" data-id="${id}" title="${t("Elimina")}" aria-label="${t("Elimina")}">${ico("trash")}</button></div>`)).join("") || `<div class="empty">${t("Nessuna valutazione trovata.")}</div>`}</div></section>`;
};
window.filterPlayers = (orig => function (f) { const rows = orig(f); return ["role", "updated", "name"].includes(f.sort) ? sortPlayers(rows, f.sort) : rows; })(window.filterPlayers);
filterPlayers = window.filterPlayers;

/* ---------- benvenuto: riepilogo della giornata con link all'Agenda ---------- */
function welcomeStats() {
  const td = today(), in7 = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  const up = [...S.matches.values()].filter(m => !m.archived && m.status !== "vista" && m.date >= td);
  const items = [...todos().map(([, x]) => x), ...[...S.tasks.values()].filter(x => P(x.playerId))];
  const todo = items.filter(x => (x.status || "todo") === "todo").length, doing = items.filter(x => x.status === "doing").length;
  const late = items.filter(x => x.status !== "done" && x.due && x.due < td).length, todayN = items.filter(x => x.status !== "done" && x.due === td).length;
  return { tot: up.length, w: up.filter(m => m.date <= in7).length, todo, doing, late, todayN };
}
window.welcomeCard = function () {
  if (!App.unlocked) return; const s = welcomeStats(); const pl = (n, one, many) => n === 1 ? t(one) : t(many, { n });
  const parts = [];
  if (s.tot) parts.push(`<li><span class="wi">🏟</span><span>${pl(s.tot, "1 partita in programma", "{n} partite in programma")}${s.w && s.w !== s.tot ? ` <span class="m">· ${pl(s.w, "1 nei prossimi 7 giorni", "{n} nei prossimi 7 giorni")}</span>` : s.w ? ` <span class="m">· ${t("tutte nei prossimi 7 giorni")}</span>` : ""}</span></li>`);
  if (s.todo) parts.push(`<li><span class="wi">📋</span><span>${pl(s.todo, "1 cosa da fare", "{n} cose da fare")}${s.todayN ? ` <span class="m">· ${pl(s.todayN, "1 per oggi", "{n} per oggi")}</span>` : ""}</span></li>`);
  if (s.doing) parts.push(`<li><span class="wi">⏳</span><span>${pl(s.doing, "1 impegno in corso", "{n} impegni in corso")}</span></li>`);
  if (s.late) parts.push(`<li class="wlate"><span class="wi">⚠</span><span>${pl(s.late, "1 in ritardo", "{n} in ritardo")}</span></li>`);
  let el = $("#welcomeCard"); if (!el) { el = document.createElement("div"); el.id = "welcomeCard"; el.className = "wcard noprint"; el.setAttribute("role", "status"); el.setAttribute("aria-live", "polite"); document.body.appendChild(el); }
  el.innerHTML = `<div class="wtop"><b>${esc(greet(firstName()))} 👋</b><button type="button" class="wx" data-a="wcClose" aria-label="${t("Chiudi")}">✕</button></div>
   ${parts.length ? `<ul class="wlist">${parts.join("")}</ul>` : `<p class="m">${t("Niente in programma e nessuna cosa da fare: buon lavoro!")}</p>`}
   <div class="wact"><button type="button" class="btn sm pri" data-a="wcAgenda">${t("Apri l'Agenda")} →</button></div>`;
  el.hidden = false; el.classList.remove("in"); void el.offsetWidth; el.classList.add("in");
  clearTimeout(welcomeCard.t); const arm = () => { clearTimeout(welcomeCard.t); welcomeCard.t = setTimeout(() => { el.hidden = true; }, 9000); };
  el.onmouseenter = () => clearTimeout(welcomeCard.t); el.onmouseleave = arm; el.onfocusin = () => clearTimeout(welcomeCard.t); arm();
};
A.wcClose = () => { const el = $("#welcomeCard"); if (el) el.hidden = true; };
A.wcAgenda = () => { A.wcClose(); ui.agMode = "oggi"; closeSheet(); resetSub(); go("calendario"); };
document.addEventListener("keydown", e => { if (e.key === "Escape") { const el = $("#welcomeCard"); if (el && !el.hidden) A.wcClose(); } });
if (App && App.lock) App.lock = (orig => function () { A.wcClose(); return orig.apply(this, arguments); })(App.lock);

/* ---------- a ogni accesso il menu laterale riparte dall'alto (dal logo) ---------- */
const sideTop = () => { const s = $("#side"); if (s) s.scrollTop = 0; window.scrollTo(0, 0); };
Lock.hide = (orig => function () { const r = orig.apply(this, arguments); sideTop(); setTimeout(sideTop, 60); return r; })(Lock.hide);
App.lock = (orig => function () { sideTop(); return orig.apply(this, arguments); })(App.lock);

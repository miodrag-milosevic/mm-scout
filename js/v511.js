/* MM Scout 5.10.1 — controllo dei dati: limiti di età e anni coerenti, date plausibili, errori che non spostano i campi,
   elenco «Per quale giocatore?» stabile, anteprima delle note stabile, tag nelle note.
   © Miodrag Milosevic. Vietato divulgare, copiare o modificare senza consenso dell'autore. */
"use strict";

/* ---------- 1. limiti unici per tutta l'app ---------- */
const AGE_MIN = 6, AGE_MAX = 50;              // dalle giovanili (6 anni) a fine carriera (50)
const YR = new Date().getFullYear();
const BY_MIN = YR - AGE_MAX, BY_MAX = YR - AGE_MIN; // anno di nascita
const isoToday = () => today();
const isoShift = (years) => { const d = new Date(); d.setFullYear(d.getFullYear() + years); return d.toISOString().slice(0, 10); };
const y1 = y => `${y}-01-01`, y31 = y => `${y}-12-31`;
// numeri: [min, max] per id
Object.assign(VRANGE, {
  pBirthYear: [BY_MIN, BY_MAX], qpYear: [BY_MIN, BY_MAX], qnYear: [BY_MIN, BY_MAX],
  pf_ageMin: [AGE_MIN, AGE_MAX], pf_ageMax: [AGE_MIN, AGE_MAX], df_age: [AGE_MIN, AGE_MAX], idAgeMin: [AGE_MIN, AGE_MAX], idAgeMax: [AGE_MIN, AGE_MAX],
  pH: [100, 230], pW: [15, 140], idH: [100, 230],
  pShirt: [1, 99], qpShirt: [1, 99], qnShirt: [1, 99], eShirt: [1, 99],
  eMin: [0, 130], manMin: [0, 130], ldT: [0, 130], phMin: [0, 130],
  pf_rMin: [1, 10], rf_rMin: [1, 10], pf_contract: [0, 120], df_min: [0, 20000], sDays: [0, 400]
});
// numeri senza id: per chiave data-k
const KRANGE = { from: [YR - 45, YR + 1], to: [YR - 45, YR + 1], apps: [0, 100], goals: [0, 100], ast: [0, 100], minutes: [0, 130] };
// date: [min, max] per id (funzioni, così «oggi» è sempre aggiornato)
const DRANGE = {
  pBirth: () => [y1(BY_MIN), isoShift(-AGE_MIN)],
  rf_from: () => ["2000-01-01", isoToday()], rf_to: () => ["2000-01-01", isoToday()],
  eDate: () => ["2000-01-01", isoToday()], mdDate: () => ["2000-01-01", isoToday()], sDate: () => ["2000-01-01", isoToday()], cdDate: () => ["2000-01-01", isoToday()],
  mDate: () => [y1(YR - 10), y31(YR + 2)], nmD: () => [y1(YR - 10), y31(YR + 2)], of_date: () => [y1(YR - 10), y31(YR + 2)], shDate: () => [y1(YR - 10), y31(YR + 2)],
  mtD: () => [y1(YR - 5), y31(YR + 3)], tkDue: () => [y1(YR - 5), y31(YR + 3)], tdDue: () => [y1(YR - 5), y31(YR + 3)], pNext: () => [y1(YR - 5), y31(YR + 3)],
  shExp: () => [isoToday(), y31(YR + 3)], cUntil: () => [y1(YR - 5), y31(YR + 10)],
  orgF: () => ["1990-01-01", y31(YR + 1)], orgTo: () => ["1990-01-01", y31(YR + 1)]
};
const DDEF = () => ["1950-01-01", y31(YR + 5)];
// coppie «da – a»
const PAIRS = [["rf_from", "rf_to", "d"], ["orgF", "orgTo", "d"], ["pf_ageMin", "pf_ageMax", "n"], ["idAgeMin", "idAgeMax", "n"]];

function rangeOf(el) {
  if (el.type === "date") return (DRANGE[el.id] || DDEF)();
  if (el.type === "number") { if (VRANGE[el.id]) return VRANGE[el.id]; const k = el.dataset && el.dataset.k; if (k && KRANGE[k] && el.closest(".carrow, .lrow, form, .sheet")) return KRANGE[k]; }
  return null;
}
// mette min/max sugli input: così anche le frecce del campo numerico rispettano i limiti
function vAttrs(root) {
  (root || document).querySelectorAll('input[type="number"], input[type="date"]').forEach(el => {
    if (el.classList.contains("vnum")) return; const r = rangeOf(el); if (!r) return;
    const [a, b] = r; if (a != null && el.min !== String(a)) el.min = a; if (b != null && el.max !== String(b)) el.max = b; if (el.type === "number" && !el.step) el.step = "1";
  });
}
let vaT = 0; new MutationObserver(() => { if (vaT) return; vaT = requestAnimationFrame(() => { vaT = 0; try { vAttrs(document); } catch (e) { } }); }).observe(document.documentElement, { childList: true, subtree: true });

/* ---------- 2. controlli: date, limiti, coppie «da – a» ---------- */
const DMSG = {
  range: (a, b) => t("Inserisci una data tra il {a} e il {b}.", { a: fmtDate(a), b: fmtDate(b) }),
  future: () => t("Questa data non può essere nel futuro: al massimo oggi."),
  past: () => t("Questa data non può essere nel passato: almeno oggi."),
  bad: () => t("Data incompleta o non valida."),
  order: () => t("La data di inizio non può essere dopo quella di fine."),
  nOrder: () => t("Il minimo non può essere maggiore del massimo."),
  yOrder: () => t("L'anno di inizio non può essere dopo quello di fine."),
  birth: () => t("Età fuori dai limiti: sono ammessi giocatori tra {a} e {b} anni.", { a: AGE_MIN, b: AGE_MAX })
};
const BIRTH_IDS = ["pBirth", "pBirthYear", "qpYear", "qnYear"];
function pairOf(el) {
  for (const [a, b, k] of PAIRS) { if (el.id === a) return [el, document.getElementById(b), k]; if (el.id === b) return [document.getElementById(a), el, k]; }
  const row = el.closest && el.closest(".carrow"); if (row && (el.dataset.k === "from" || el.dataset.k === "to")) return [row.querySelector('[data-k="from"]'), row.querySelector('[data-k="to"]'), "y"];
  return null;
}
function dCheck(el, live) {
  const v = el.value; let msg = "";
  if (!v) { if (!live && el.validity && el.validity.badInput) msg = DMSG.bad(); }
  else if (!live) {
    const [a, b] = rangeOf(el) || DDEF(); const td = isoToday();
    if (v < a || v > b) msg = BIRTH_IDS.includes(el.id) ? DMSG.birth() : (b === td && v > td) ? DMSG.future() : (a === td && v < td) ? DMSG.past() : DMSG.range(a, b);
  }
  vShow(el, msg); return !msg;
}
window.vCheck = (orig => function (el, live) {
  if (!el || el.tagName !== "INPUT") return orig.apply(this, arguments);
  let ok;
  if (el.type === "date") ok = dCheck(el, live);
  else {
    ok = orig.apply(this, arguments);
    // anni di nascita: messaggio chiaro sull'età
    if (!ok && !live && BIRTH_IDS.includes(el.id) && /^\d+$/.test(el.value.trim())) { vShow(el, DMSG.birth()); }
    // numero valido ma fuori dai limiti scritti sull'input (es. data-k senza id)
    if (ok && !live && el.type === "number" && el.value.trim() && !VRANGE[el.id]) { const r = rangeOf(el); const n = +el.value.replace(",", "."); if (r && ((r[0] != null && n < r[0]) || (r[1] != null && n > r[1]))) { vShow(el, VMSG.range(r[0], r[1])); ok = false; } }
  }
  // coppia «da – a»: controllo solo quando entrambi sono corretti
  if (ok && !live) { const p = pairOf(el); if (p && p[0] && p[1] && p[0].value && p[1].value && !p[0].classList.contains("vbad") && !p[1].classList.contains("vbad")) {
    const A = p[2] === "d" ? p[0].value : +p[0].value, B = p[2] === "d" ? p[1].value : +p[1].value;
    if (A > B) { vShow(el, p[2] === "d" ? DMSG.order() : p[2] === "y" ? DMSG.yOrder() : DMSG.nOrder()); ok = false; }
    else { const other = el === p[0] ? p[1] : p[0]; const box = other.nextElementSibling; if (box && box.classList.contains("vmsg2") && [DMSG.order(), DMSG.yOrder(), DMSG.nOrder()].some(m => box.textContent.includes(m))) vShow(other, ""); } } }
  return ok;
})(window.vCheck);
vCheck = window.vCheck;

// il messaggio d'errore galleggia sotto il campo: non sposta più gli altri campi
window.vShow = (orig => function (el, msg) { if (msg && el && el.parentElement) el.parentElement.classList.add("vhost"); return orig.apply(this, arguments); })(window.vShow);
vShow = window.vShow;

// date: controllo anche quando cambiano (frecce, calendario) e mai valori sbagliati nei filtri
let dTimer = new WeakMap();
document.addEventListener("input", e => { const el = e.target; if (!el || el.tagName !== "INPUT" || el.type !== "date") return; clearTimeout(dTimer.get(el)); dTimer.set(el, setTimeout(() => { if (document.contains(el)) vCheck(el, false); }, 900)); vShow(el, ""); });
document.addEventListener("change", e => {
  const el = e.target; if (!el || el.tagName !== "INPUT" || (el.type !== "date" && el.type !== "number") || el.classList.contains("vnum")) return;
  if (el.type === "date") { clearTimeout(dTimer.get(el)); }
  const typing = el.type === "date" && document.activeElement === el;
  const valid = el.type === "date" ? (() => { const v = el.value; if (!v) return true; const [a, b] = rangeOf(el) || DDEF(); return v >= a && v <= b; })() : vCheck(el, false);
  if (!valid) { e.stopImmediatePropagation(); e.stopPropagation(); if (typing) dTimer.set(el, setTimeout(() => { if (document.contains(el)) vCheck(el, false); }, 900)); else vCheck(el, false); return; }
  if (el.type === "date") vCheck(el, false);
  const p = pairOf(el); if (p && p[0] && p[1] && p[0].value && p[1].value) { const A = p[2] === "d" ? p[0].value : +p[0].value, B = p[2] === "d" ? p[1].value : +p[1].value; if (A > B) { e.stopImmediatePropagation(); e.stopPropagation(); vCheck(el, false); } }
}, true);
// all'uscita dal campo data: controllo completo
document.addEventListener("focusout", e => { const el = e.target; if (el && el.tagName === "INPUT" && el.type === "date") { clearTimeout(dTimer.get(el)); vCheck(el, false); } });
// il controllo prima di salvare comprende anche i campi data
document.addEventListener("click", e => { const b = e.target.closest && e.target.closest("button"); if (!b) return; const a = b.dataset.a || ""; const isSave = SAVE_RE.test(a) || (b.classList.contains("pri") && (b.type === "submit" || b.closest("form")));
  if (!isSave) return; const scope = b.closest(".sheet, form, #view, .lockbox") || document; const bad = [...scope.querySelectorAll('input[type="date"]')].filter(i => i.offsetParent !== null && !vCheck(i, false));
  if (!bad.length) return; e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); toast(t("Correggi i campi segnati in rosso prima di salvare."), 4000); bad[0].focus(); }, true);

/* ---------- 3. «Per quale giocatore?»: l'elenco non cambia altezza ---------- */
window.playerPicker = (orig => function () {
  const r = orig.apply(this, arguments); const list = $("#ppList"), q = $("#ppQ"); if (!list || !q) return r;
  requestAnimationFrame(() => { const h = list.offsetHeight; if (h) { list.style.height = h + "px"; list.style.maxHeight = h + "px"; } });
  list.insertAdjacentHTML("beforeend", `<div class="empty ppempty" hidden>${t("Nessun giocatore trovato.")}</div>`);
  q.oninput = e => { const s = e.target.value.toLowerCase().trim(); let n = 0; $$("#ppList .item").forEach(x => { x.hidden = !x.dataset.n.includes(s); if (!x.hidden) n++; }); const em = $("#ppList .ppempty"); if (em) em.hidden = n > 0; };
  return r;
})(window.playerPicker);
playerPicker = window.playerPicker;

/* ---------- 4. note: l'anteprima resta della stessa misura ---------- */
A.nPrev = (orig => function (el) { const ta = $("#nBody"), pv = $("#nPrevBox"); if (ta && pv && !ta.hidden) { const h = ta.offsetHeight; if (h) pv.style.height = h + "px"; } return orig.apply(this, arguments); })(A.nPrev);

/* ---------- 5. note: scegliere e creare tag ---------- */
const nTagNames = () => ($("#nTags") ? $("#nTags").value.split(",").map(x => x.trim()).filter(Boolean) : []);
function nTagAll() { const m = new Map(); for (const tg of (Cfg.get().tags || [])) m.set(nrm(tg.name), tg.name); for (const [, n] of S.notes) for (const s of (n.tags || [])) if (!m.has(nrm(s))) m.set(nrm(s), s); for (const s of nTagNames()) if (!m.has(nrm(s))) m.set(nrm(s), s); return [...m.values()].sort((a, b) => a.localeCompare(b)); }
function nTagSync() { const on = new Set(nTagNames().map(nrm)); $$("#nTagChips .chip[data-tname]").forEach(c => c.setAttribute("aria-pressed", on.has(nrm(c.dataset.tname)))); }
function nTagChipsHtml() { return nTagAll().map(n => `<button type="button" class="chip" data-tname="${esc(n)}" aria-pressed="false">#${esc(n)}</button>`).join("") + `<button type="button" class="tagadd" data-a="nTagNew">+ ${t("Nuovo tag")}</button>`; }
window.noteSheet = (orig => function () { const r = orig.apply(this, arguments); const inp = $("#nTags"); if (inp && !$("#nTagChips")) { const lab = inp.closest("label") || inp; lab.insertAdjacentHTML("afterend", `<div class="f full"><div class="chips ntagchips" id="nTagChips" role="group" aria-label="${t("Tag")}">${nTagChipsHtml()}</div></div>`); nTagSync(); } return r; })(window.noteSheet);
noteSheet = window.noteSheet;
document.addEventListener("click", e => { const c = e.target.closest && e.target.closest("#nTagChips .chip[data-tname]"); if (!c) return; e.preventDefault(); e.stopPropagation();
  const name = c.dataset.tname; let list = nTagNames(); const has = list.some(x => nrm(x) === nrm(name)); list = has ? list.filter(x => nrm(x) !== nrm(name)) : [...list, name]; $("#nTags").value = list.join(", "); nTagSync(); }, true);
document.addEventListener("input", e => { if (e.target && e.target.id === "nTags") nTagSync(); });
A.nTagNew = (el, e) => { if (e) { e.preventDefault(); e.stopPropagation(); } const span = document.createElement("span"); span.className = "ntaginl";
  span.innerHTML = `<input type="text" maxlength="40" data-vrule="tag" placeholder="${t("Nome del tag")}" aria-label="${t("Nome del tag")}"><button type="button" class="btn sm pri" data-a="nTagOk">✓</button><button type="button" class="btn sm ghost" data-a="nTagNo" aria-label="${t("Annulla")}">✕</button>`;
  el.replaceWith(span); span.querySelector("input").focus(); };
A.nTagNo = (el, e) => { if (e) { e.preventDefault(); e.stopPropagation(); } const span = el.closest(".ntaginl"); span.insertAdjacentHTML("afterend", `<button type="button" class="tagadd" data-a="nTagNew">+ ${t("Nuovo tag")}</button>`); span.remove(); };
A.nTagOk = (el, e) => { if (e) { e.preventDefault(); e.stopPropagation(); } const span = el.closest(".ntaginl"); const inp = span.querySelector("input"); const name = inp.value.trim();
  if (!name) { inp.focus(); return; } if (!vCheck(inp, false)) { inp.focus(); return; }
  const c = clone(Cfg.get()); let tg = c.tags.find(x => nrm(x.name) === nrm(name)); if (!tg) { tg = { id: uid(), name, color: TAG_COLORS[c.tags.length % TAG_COLORS.length] }; c.tags.push(tg); Cfg.save(c); toast(t("Tag creato: {n}", { n: name })); }
  const list = nTagNames(); if (!list.some(x => nrm(x) === nrm(tg.name))) $("#nTags").value = [...list, tg.name].join(", ");
  $("#nTagChips").innerHTML = nTagChipsHtml(); nTagSync(); };
document.addEventListener("keydown", e => { const i = e.target; if (!i || !i.closest || !i.closest("#nTagChips .ntaginl")) return; if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); A.nTagOk(i, e); } else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); A.nTagNo(i, e); } }, true);

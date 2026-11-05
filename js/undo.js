"use strict";
/* =========================================================
   MM Scout — annulla / ripeti (↶ ↷) per ogni modifica:
   giocatori, valutazioni, partite, azioni registrate, liste,
   profili ideali, opzioni. Le modifiche fatte insieme (entro
   0,7 secondi) si annullano in un solo passo.
   Scorciatoie: ⌘Z / Ctrl+Z e ⇧⌘Z / Ctrl+Y.
   ========================================================= */
const Undo = {
  stack: [], redoStack: [], group: null, gt: 0, busy: false, max: 80,
  rec(coll, id) {
    if (this.busy || !App.unlocked || !S[coll]) return; const now = Date.now();
    if (!this.group || now - this.gt > 700) { this.group = { ch: new Map(), at: now }; this.stack.push(this.group); if (this.stack.length > this.max) this.stack.shift(); this.redoStack = []; }
    this.gt = now; const k = coll + "/" + id;
    if (!this.group.ch.has(k)) this.group.ch.set(k, { coll, id, before: S[coll].has(id) ? clone(S[coll].get(id)) : undefined });
    clearTimeout(this._u); this._u = setTimeout(() => this.upd(), 50);
  },
  apply(g) {
    this.busy = true; const inv = { ch: new Map(), at: Date.now() };
    for (const [k, c] of [...g.ch].reverse()) { inv.ch.set(k, { coll: c.coll, id: c.id, before: S[c.coll].has(c.id) ? clone(S[c.coll].get(c.id)) : undefined }); if (c.before === undefined) del(c.coll, c.id); else put(c.coll, c.id, clone(c.before)); }
    this.busy = false; this.group = null; return inv;
  },
  undo() { const g = this.stack.pop(); if (!g) { toast(t("Niente da annullare")); return; } this.redoStack.push(this.apply(g)); this.after(t("Modifica annullata"), g); },
  redo() { const g = this.redoStack.pop(); if (!g) { toast(t("Niente da ripetere")); return; } this.stack.push(this.apply(g)); this.after(t("Modifica ripetuta"), g); },
  after(msg, g) {
    // se l'elemento aperto non esiste più, torna all'elenco
    if (ui.playerId && !S.players.has(ui.playerId)) ui.playerId = null; if (ui.matchId && !S.matches.has(ui.matchId)) ui.matchId = null;
    if ([...g.ch.keys()].some(k => k.startsWith("settings/config"))) Migrate.config();
    ui.pdraft = null; ui.edraft = null; ui.idraft = null; try { cfgDraft = null; } catch (e) { } closeSheet(); toast(msg); render(true); this.upd();
  },
  clear() { this.stack = []; this.redoStack = []; this.group = null; this.upd(); },
  upd() { const u = $("#undoBtn"), r = $("#redoBtn"); if (u) u.disabled = !this.stack.length; if (r) r.disabled = !this.redoStack.length; }
};
window.put = (orig => function (coll, id, v, keepT) { Undo.rec(coll, id); return orig(coll, id, v, keepT); })(window.put);
window.del = (orig => function (coll, id, noTomb) { Undo.rec(coll, id); return orig(coll, id, noTomb); })(window.del);
// i file multimediali vengono cancellati davvero solo al prossimo accesso, così l'annullamento li ritrova
Store.delBlob = async function (id) { if (this.urls.has(id)) { URL.revokeObjectURL(this.urls.get(id)); this.urls.delete(id); } };
Store.gcBlobs = async function () { try { const used = new Set([...S.media.values()].map(m => m.blobId).filter(Boolean)); for (const k of await this.keys("blob")) if (!used.has(k)) await this.del("blob", k); } catch (e) { } };
document.addEventListener("keydown", e => {
  if (!App.unlocked || !(e.metaKey || e.ctrlKey)) return; const tag = (e.target.tagName || "").toLowerCase(); if (tag === "input" || tag === "textarea" || tag === "select" || e.target.isContentEditable) return;
  const k = e.key.toLowerCase(); if (k === "z" && !e.shiftKey) { e.preventDefault(); Undo.undo(); } else if ((k === "z" && e.shiftKey) || k === "y") { e.preventDefault(); Undo.redo(); }
});

/* ---------- barra in alto: annulla, ripeti, sincronizza, tema, lingua ---------- */
ICONS.undo = '<path d="M7.8 7H14a6 6 0 0 1 0 12H8v-2h6a4 4 0 0 0 0-8H7.8l3.1 3.1-1.4 1.4L4 8l5.5-5.5 1.4 1.4z"/>';
ICONS.redo = '<path d="M16.2 7H10a6 6 0 0 0 0 12h6v-2h-6a4 4 0 0 1 0-8h6.2l-3.1 3.1 1.4 1.4L20 8l-5.5-5.5-1.4 1.4z"/>';
ICONS.sync = '<path d="M12 4a8 8 0 0 1 7.4 5H17v2h6V5h-2v2.3A10 10 0 0 0 2.1 11h2A8 8 0 0 1 12 4zm7.9 9A8 8 0 0 1 4.6 15H7v-2H1v6h2v-2.3A10 10 0 0 0 21.9 13z"/>';
ICONS.sun = '<path d="M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zM11 1h2v3h-2zm0 19h2v3h-2zM1 11h3v2H1zm19 0h3v2h-3zM4.2 2.8l2.1 2.1-1.4 1.4-2.1-2.1zm13.5 13.5 2.1 2.1-1.4 1.4-2.1-2.1zM2.8 19.8l2.1-2.1 1.4 1.4-2.1 2.1zM16.3 5.7l2.1-2.1 1.4 1.4-2.1 2.1z"/>';
ICONS.moon = '<path d="M14.5 2a9 9 0 1 0 7.5 13.9A8 8 0 0 1 14.5 2z"/>';
ICONS.auto = '<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 2v16a8 8 0 0 1 0-16z"/>';
function themeIcon() { return ico(Prefs.theme === "dark" ? "moon" : Prefs.theme === "light" ? "sun" : "auto"); }
function themeLabel() { return Prefs.theme === "dark" ? t("Scuro") : Prefs.theme === "light" ? t("Chiaro") : t("Automatico"); }
window.renderShell = (orig => function () {
  orig();
  const tb = $("#topbar"); if (!tb) return;
  const search = tb.querySelector(".search"); const lang = tb.querySelector("#langSel");
  const tools = document.createElement("div"); tools.className = "tbtools";
  tools.innerHTML = `<button class="iconbtn" id="undoBtn" data-a="undo" title="${t("Annulla")} (⌘Z)" aria-label="${t("Annulla")}" ${Undo.stack.length ? "" : "disabled"}>${ico("undo")}</button><button class="iconbtn" id="redoBtn" data-a="redo" title="${t("Ripeti")} (⇧⌘Z)" aria-label="${t("Ripeti")}" ${Undo.redoStack.length ? "" : "disabled"}>${ico("redo")}</button>
    <button class="iconbtn" data-a="syncTop" title="${t("Sincronizza ora")}" aria-label="${t("Sincronizza ora")}">${ico("sync")}</button><button class="iconbtn" data-a="themeCycle" title="${t("Tema")}: ${themeLabel()}" aria-label="${t("Tema")}: ${themeLabel()}">${themeIcon()}</button>`;
  [...tb.children].forEach(el => { if (el !== search) tools.appendChild(el); });
  tb.appendChild(tools);
  if (lang) lang.onchange = e => A.setLang({ dataset: { v: e.target.value } });
})(window.renderShell);
Object.assign(A, {
  undo: () => Undo.undo(), redo: () => Undo.redo(),
  themeCycle: () => { const order = ["system", "light", "dark"]; const n = order[(order.indexOf(Prefs.theme) + 1) % 3]; Prefs.set("theme", n); applyTheme(); render(true); toast(t("Tema") + ": " + themeLabel()); },
  syncTop: () => { if (Sync.dir && !Sync.needPerm) Sync.auto(true).then(() => render(true)); else if (Sync.dir && Sync.needPerm) Sync.regrant(); else Sync.manual(); }
});

/* ---------- all'accesso: pulizia file orfani, esempi aggiornati ---------- */
const EX_VERSION = 5;
Lock.enter = (orig => async function () {
  await orig.apply(this, arguments); Undo.clear(); Store.gcBlobs();
  try { const hasEx = [...S.players.values()].some(p => p.example); const v = (S.settings.get("exVer") || {}).v || 0;
    if (hasEx && v < EX_VERSION) { Examples.load(true); put("settings", "exVer", { v: EX_VERSION }); Undo.clear(); render(); toast(t("Dati di esempio aggiornati")); } } catch (e) { }
})(Lock.enter);
// carico esempi nuovi: segna la versione
Examples.load = (orig => function (silent) { const r = orig.call(this, silent); put("settings", "exVer", { v: EX_VERSION }); Undo.clear(); return r; })(Examples.load);
Examples.clear = (orig => function () { const r = orig.call(this); Undo.clear(); return r; })(Examples.clear);

/* ---------- aggiornamento pulito: svuota la cache dell'app ---------- */
async function hardRefresh() {
  try { if (window.caches) for (const k of await caches.keys()) await caches.delete(k); } catch (e) { }
  try { if (navigator.serviceWorker) for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister(); } catch (e) { }
  location.reload();
}
(() => { const v = Prefs.get("appVer", ""); if (v !== APP_VERSION) { Prefs.set("appVer", APP_VERSION); if (v && window.caches) caches.keys().then(ks => ks.filter(k => !k.endsWith(APP_VERSION)).forEach(k => caches.delete(k))).catch(() => { }); } })();
A.hardRefresh = () => confirmSheet(t("Ricaricare l'app scaricando di nuovo tutti i file? I tuoi dati restano dove sono."), hardRefresh);
SET.info = (orig => () => orig() + `<section class="panel"><h2>${t("Aggiornamento dell'app")}</h2><p class="sub small">${t("Se dopo un aggiornamento vedi ancora la versione vecchia, svuota la cache dell'app: i file vengono riscaricati, i tuoi dati non vengono toccati.")}</p><div class="row" style="margin-top:8px"><button class="btn" data-a="hardRefresh">${t("Svuota cache e ricarica")}</button><button class="btn" data-a="refreshExamples">${t("Aggiorna i dati di esempio")}</button></div></section>`)(SET.info);
A.refreshExamples = () => confirmSheet(t("Sostituire i dati di esempio con quelli aggiornati? I tuoi dati non vengono toccati."), () => { Examples.load(false); });

/* ---------- dati di esempio nella lingua scelta ---------- */
// traduce solo i testi degli esempi che l'app conosce (carriera, paesi, note, nomi delle liste…), mai gli identificativi
function relangExamples(from, to) {
  if (from === to) return; const dl = l => l === "it" ? null : window["I18N_" + l.toUpperCase()];
  const fwd = dl(from); const rev = new Map(); if (fwd) for (const k in fwd) rev.set(fwd[k], k);
  const tr = s => { if (typeof s !== "string" || !s) return s; const it = from === "it" ? s : rev.get(s); if (it == null) return s; const d2 = dl(to); return to === "it" ? it : (d2 && d2[it]) || s; };
  const F = { players: ["quick", "notes", "nat", "nat2", "birthCountry", "birthCity"], matches: ["home", "away", "competition", "venue", "goal", "notes"], evals: ["summary", "home", "away"], lists: ["name", "note"], lineups: ["name", "note"] };
  Undo.busy = true;
  try {
    for (const c in F) for (const [id, o] of [...S[c]]) { if (!o || !o.example) continue; const n = clone(o); let ch = false;
      for (const f of F[c]) { const v = tr(n[f]); if (v !== n[f]) { n[f] = v; ch = true; } }
      if (c === "players") for (const f of ["pros", "cons"]) if (Array.isArray(n[f])) { const a = n[f].map(tr); if (a.join("|") !== n[f].join("|")) { n[f] = a; ch = true; } }
      if (c === "matches" && Array.isArray(n.events)) n.events = n.events.map(e => { const v = tr(e.n); if (v !== e.n) { ch = true; return { ...e, n: v }; } return e; });
      if (ch) { S[c].set(id, n); Store.write(c, id); } }
  } finally { Undo.busy = false; }
}
A.setLang = (orig => function (el) { const from = Prefs.lang; const r = orig(el); try { if (App.unlocked) { relangExamples(from, Prefs.lang); render(true); } } catch (e) { } return r; })(A.setLang);

/* sigle dei ruoli sul campo nelle 4 lingue */
const POS_CODES = {"POR": ["GK", "TW", "GK"], "TD": ["RB", "RV", "DB"], "DC": ["CB", "IV", "ŠT"], "TS": ["LB", "LV", "LB"], "MED": ["DM", "DM", "DVZ"], "MEZ": ["CM", "ZM", "CVZ"], "REG": ["DLP", "SPM", "PLM"], "CC": ["CM", "ZM", "CVZ"], "ED": ["RM", "RM", "DVZ"], "ES": ["LM", "LM", "LVZ"], "AD": ["RW", "RA", "DK"], "AS": ["LW", "LA", "LK"], "TRQ": ["AM", "OM", "OVZ"], "PC": ["ST", "MS", "CF"], "ATT": ["FW", "ST", "NAP"], "QD": ["RWB", "RSP", "DBK"], "QS": ["LWB", "LSP", "LBK"]};
function posCode(c) { const r = POS_CODES[c]; if (!r) return c; return { it: c, en: r[0], de: r[1], sr: r[2], es: (POS_ES[c] || r[0]) }[Prefs.lang] || c; }
const POS_ES = { POR: "POR", TD: "LD", DC: "DFC", TS: "LI", MED: "MCD", MEZ: "MC", REG: "MCD", CC: "MC", ED: "MD", ES: "MI", AD: "ED", AS: "EI", TRQ: "MP", PC: "DC", ATT: "DEL", QD: "CAD", QS: "CAI" };

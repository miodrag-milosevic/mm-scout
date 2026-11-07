"use strict";
/* =========================================================
   MM Scout — applicazione: accesso, struttura, giocatori,
   valutazioni.
   ========================================================= */
const ui = {
  view: "panoramica", playerId: null, ptab: "profilo", pdraft: null, edraft: null, evalSel: null,
  matchId: null, mtab: "live", liveP: null, liveCat: null, timer: null, timerFor: null,
  q: "", pf: { q: "", role: "", verdict: "", level: "", tag: "", list: "", foot: "", nat: "", ageMin: "", ageMax: "", rMin: "", contract: "", sort: "rating", showArch: false, open: false },
  rf: { q: "", from: "", to: "", by: "", type: "", tag: "", rMin: "", sort: "date", showArch: false },
  mf: { q: "", status: "", type: "", tag: "", showArch: false },
  listId: null, cmp: [], lineupId: null, setTab: "generale", openAreas: null, archTab: "players", actRange: 12
};

/* ---------- impostazioni del dispositivo ---------- */
const DEVICE_DEFAULTS = { autoLockMin: 10, lockOnHide: false, backupEveryMin: 10, keepSnapshots: 20, publicUrl: "", backupReminderDays: 7, autoFolder: false, hideNeutral: false };
const App = {
  cfgDevice() { return { ...DEVICE_DEFAULTS, ...Prefs.get("device", {}) }; },
  setDevice(patch) { Prefs.set("device", { ...this.cfgDevice(), ...patch }); },
  unlocked: false,
  onDirty() { if (window.Backup) Backup.schedule(); },
  idleTimer: null,
  touch() { if (!this.unlocked) return; clearTimeout(this.idleTimer); const m = this.cfgDevice().autoLockMin; if (m > 0) this.idleTimer = setTimeout(() => this.lock(t("Bloccato per inattività")), m * 60000); },
  async lock(msg) {
    if (!this.unlocked) return;
    try { await Store.pending; if (Store.dirty) await Store.snapshot("lock"); } catch (e) { }
    this.unlocked = false; clearTimeout(this.idleTimer); Store.lock(); ui.pdraft = null; ui.edraft = null;
    closeSheet(); Lock.show(msg);
  }
};
["pointerdown", "keydown", "touchstart"].forEach(ev => document.addEventListener(ev, () => App.touch(), { passive: true }));
document.addEventListener("visibilitychange", () => { if (document.hidden && App.unlocked && App.cfgDevice().lockOnHide) App.lock(); });

/* =========================================================
   ACCESSO: prima configurazione, sblocco, verifica in due passaggi
   ========================================================= */
const Lock = {
  root() { return $("#lockRoot"); },
  render(html) { $("#appRoot").hidden = true; const r = this.root(); r.hidden = false; r.innerHTML = `<div class="lock"><div class="lockbox">${html}</div></div>`; const f = r.querySelector("input"); if (f) f.focus(); },
  hide() { this.root().hidden = true; this.root().innerHTML = ""; $("#appRoot").hidden = false; },
  brand() { return appBrand(t("Il tuo archivio personale di scouting")); },
  langTheme() {
    return `<div class="row between"><div class="seg" role="group" aria-label="${t("Lingua")}">${LANGS.map(([k]) => `<button data-a="setLang" data-v="${k}" aria-pressed="${Prefs.lang === k}">${k.toUpperCase()}</button>`).join("")}</div>
    <div class="seg" role="group" aria-label="${t("Tema")}">${[["system", t("Auto")], ["light", t("Chiaro")], ["dark", t("Scuro")]].map(([k, n]) => `<button data-a="setTheme" data-v="${k}" aria-pressed="${Prefs.theme === k}">${n}</button>`).join("")}</div></div>`;
  },
  async show(msg) {
    const m = await Store.meta();
    if (!m) return this.setup1();
    const wait = this.waitLeft();
    this.render(`${this.brand()}${this.langTheme()}
      ${msg ? `<div class="banner info">${esc(msg)}</div>` : ""}
      <form id="unlockForm" class="col"><label class="f">${t("Password")}<input type="password" id="pw" autocomplete="current-password" required></label>
      <div id="lockErr" class="warn">${wait ? t("Troppi tentativi. Riprova tra {s} secondi.", { s: wait }) : ""}</div>
      <button class="btn pri" id="unlockBtn">${t("Sblocca")}</button></form>
      <button class="btn ghost sm" data-a="lockRecovery">${t("Password dimenticata? Usa il codice di recupero")}</button>`);
    $("#unlockForm").onsubmit = e => { e.preventDefault(); this.tryUnlock($("#pw").value); };
  },
  waitLeft() { const until = Prefs.get("lockUntil", 0); return until > Date.now() ? Math.ceil((until - Date.now()) / 1000) : 0; },
  async fail() {
    const n = Prefs.get("fails", 0) + 1; Prefs.set("fails", n);
    const m = await Store.meta();
    if (m.wipeAfter && n >= m.wipeAfter) { await Lock.wipeAll(); return; }
    if (n >= 5) Prefs.set("lockUntil", Date.now() + Math.min(3600, 30 * 2 ** (n - 5)) * 1000);
    $("#lockErr").textContent = n >= 5 ? t("Troppi tentativi. Riprova tra {s} secondi.", { s: this.waitLeft() }) : t("Password errata.") + (m.wipeAfter ? " " + t("Tentativi rimasti prima della cancellazione: {n}", { n: m.wipeAfter - n }) : "");
  },
  async wipeAll() { Store.db.close(); Store.db = null; await new Promise(r => { const q = indexedDB.deleteDatabase("taccuino-scout-v3"); q.onsuccess = q.onerror = q.onblocked = r; }); Prefs.set("fails", 0); Prefs.set("lockUntil", 0); await Store.open(); this.setup1(); toast(t("Dati cancellati dopo troppi tentativi.")); },
  async tryUnlock(pw) {
    if (this.waitLeft()) { $("#lockErr").textContent = t("Troppi tentativi. Riprova tra {s} secondi.", { s: this.waitLeft() }); return; }
    const btn = $("#unlockBtn"); btn.disabled = true; btn.textContent = t("Verifica…");
    let raw;
    try { raw = await Store.unwrap(pw); } catch (e) { btn.disabled = false; btn.textContent = t("Sblocca"); await this.fail(); return; }
    await Store.useRaw(raw); raw.fill(0);
    const m = await Store.meta();
    if (m.totp) return this.askTotp();
    this.enter();
  },
  askTotp() {
    this.render(`${this.brand()}<h2>${t("Verifica in due passaggi")}</h2><p class="sub">${t("Apri la tua app di autenticazione (es. Ente Auth, Bitwarden, Proton Pass) e inserisci il codice a 6 cifre di MM Scout.")}</p>
      <form id="totpForm" class="col"><input type="text" id="totp" inputmode="numeric" autocomplete="one-time-code" maxlength="7" placeholder="123 456" class="mono" style="font-size:22px;text-align:center;letter-spacing:.2em" required>
      <div id="lockErr" class="warn"></div><button class="btn pri">${t("Conferma")}</button></form>
      <button class="btn ghost sm" data-a="lockCancel">${t("Annulla")}</button>`);
    $("#totpForm").onsubmit = async e => {
      e.preventDefault(); const m = await Store.meta();
      try { const secret = await C.decRaw(Store.key, m.totp); if (await C.verifyTotp(secret, $("#totp").value)) { this.enter(); return; } } catch (err) { }
      await this.fail(); $("#totp").value = "";
    };
  },
  async enter() {
    Prefs.set("fails", 0); Prefs.set("lockUntil", 0);
    await Store.loadAll(); Migrate.config();
    App.unlocked = true; App.touch(); this.hide();
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { }
    if (window.Backup) Backup.afterUnlock();
    render();
  },
  recovery() {
    this.render(`${this.brand()}<h2>${t("Codice di recupero")}</h2><p class="sub">${t("Inserisci il codice di recupero che hai salvato alla prima configurazione. Poi sceglierai una nuova password.")}</p>
      <form id="recForm" class="col"><input type="text" id="rec" class="mono" placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX" autocomplete="off" required><div id="lockErr" class="warn"></div><button class="btn pri">${t("Continua")}</button></form>
      <button class="btn ghost sm" data-a="lockCancel">${t("Torna allo sblocco")}</button>`);
    $("#recForm").onsubmit = async e => {
      e.preventDefault(); if (this.waitLeft()) return;
      let raw; try { raw = await Store.unwrapRecovery($("#rec").value); } catch (err) { await this.fail(); return; }
      this.newPassword(async pw => { await Store.rewrap(raw, pw); await Store.useRaw(raw); raw.fill(0); toast(t("Nuova password impostata")); const m = await Store.meta(); if (m.totp) this.askTotp(); else this.enter(); });
    };
  },
  pwFields() {
    return `<label class="f">${t("Password (almeno 10 caratteri)")}<input type="password" id="np1" autocomplete="new-password" required minlength="10"></label>
      <div class="strength"><i id="pwBar" style="width:0"></i></div><div class="m" id="pwHint">${t("Consiglio: una frase di 4-5 parole facile da ricordare per te.")}</div>
      <label class="f">${t("Ripeti la password")}<input type="password" id="np2" autocomplete="new-password" required></label><div id="lockErr" class="warn"></div>`;
  },
  bindPw() {
    $("#np1").oninput = () => { const s = pwStrength($("#np1").value); const cols = ["var(--bad)", "var(--bad)", "var(--amber)", "var(--good)", "var(--accent)"]; $("#pwBar").style.width = (s * 25) + "%"; $("#pwBar").style.background = cols[s]; $("#pwHint").textContent = [t("Troppo debole"), t("Debole"), t("Discreta"), t("Buona"), t("Ottima")][s]; };
  },
  checkPw() { const a = $("#np1").value, b = $("#np2").value; if (a.length < 10) { $("#lockErr").textContent = t("La password deve avere almeno 10 caratteri."); return null; } if (a !== b) { $("#lockErr").textContent = t("Le due password non coincidono."); return null; } if (pwStrength(a) < 2) { $("#lockErr").textContent = t("Password troppo debole: allungala o aggiungi numeri e simboli."); return null; } return a; },
  newPassword(done) {
    this.render(`${this.brand()}<h2>${t("Nuova password")}</h2><form id="npForm" class="col">${this.pwFields()}<button class="btn pri">${t("Salva password")}</button></form>`);
    this.bindPw(); $("#npForm").onsubmit = e => { e.preventDefault(); const pw = this.checkPw(); if (pw) done(pw); };
  },
  setup1() {
    this.render(`${this.brand()}${this.langTheme()}<h2>${t("Benvenuto")}</h2>
      <p class="sub">${t("MM Scout funziona sul tuo dispositivo, anche senza internet. Tutti i dati vengono cifrati con la tua password: senza di essa nessuno può leggerli, nemmeno chi ha accesso al computer.")}</p>
      <form id="s1" class="col">${this.pwFields()}<button class="btn pri">${t("Crea archivio cifrato")}</button></form>`);
    this.bindPw();
    $("#s1").onsubmit = async e => { e.preventDefault(); const pw = this.checkPw(); if (!pw) return; const b = e.target.querySelector("button.pri"); b.disabled = true; b.textContent = t("Creazione…"); const rec = await Store.setup(pw); this.setup2(rec); };
  },
  setup2(rec) {
    this.render(`${this.brand()}<h2>${t("Il tuo codice di recupero")}</h2>
      <p class="sub">${t("Se dimentichi la password, solo questo codice può aprire l'archivio. Salvalo ora in un posto sicuro (es. Bitwarden). Non verrà mostrato di nuovo.")}</p>
      <div class="recovery" id="recCode">${esc(rec)}</div>
      <div class="row"><button class="btn sm" data-a="copyText" data-target="recCode">${t("Copia")}</button></div>
      <label class="chk"><input type="checkbox" id="recOk"> ${t("Ho salvato il codice in un posto sicuro")}</label>
      <button class="btn pri" id="recNext" disabled>${t("Continua")}</button>`);
    $("#recOk").onchange = e => $("#recNext").disabled = !e.target.checked;
    $("#recNext").onclick = () => this.setup3();
  },
  setup3() {
    this.render(`${this.brand()}<h2>${t("Verifica in due passaggi")}</h2>
      <p class="sub">${t("Oltre alla password, all'apertura ti verrà chiesto un codice a 6 cifre generato da un'app di autenticazione (Ente Auth, Bitwarden, Proton Pass, Google Authenticator…). Puoi attivarla anche dopo dalle impostazioni.")}</p>
      <button class="btn pri" data-a="setupTotp">${t("Attiva ora")}</button><button class="btn" data-a="setup4">${t("Più tardi")}</button>`);
  },
  async setupTotpScreen(after) {
    const secret = C.rand(20); const b32 = C.b32(secret);
    const prof = Profile.get(); const label = encodeURIComponent(appName() + ":" + (prof.email || prof.name || "scout"));
    const uri = `otpauth://totp/${label}?secret=${b32}&issuer=${encodeURIComponent(appName())}&algorithm=SHA1&digits=6&period=30`;
    let qr = ""; try { const q = qrcode(0, "M"); q.addData(uri); q.make(); qr = q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); } catch (e) { }
    const html = `<h2>${t("Collega l'app di autenticazione")}</h2>
      <p class="sub">${t("1. Nell'app di autenticazione aggiungi un nuovo account scansionando il codice QR, oppure inserendo a mano la chiave.")}</p>
      <div class="qr" style="width:200px">${qr}</div>
      <div class="m">${t("Chiave da inserire a mano")}</div><div class="recovery" style="font-size:14px" id="totpKey">${b32.match(/.{1,4}/g).join(" ")}</div>
      <p class="sub">${t("2. Scrivi qui il codice a 6 cifre che vedi nell'app.")}</p>
      <form id="totpSet" class="col"><input type="text" id="totpC" inputmode="numeric" maxlength="7" class="mono" style="font-size:22px;text-align:center;letter-spacing:.2em" required><div id="lockErr" class="warn"></div><button class="btn pri">${t("Attiva")}</button></form>`;
    return { html, bind: () => { $("#totpSet").onsubmit = async e => { e.preventDefault(); if (!(await C.verifyTotp(secret, $("#totpC").value))) { $("#lockErr").textContent = t("Codice non valido. Controlla che l'ora del dispositivo sia corretta e riprova."); return; } const m = await Store.meta(); m.totp = await C.encRaw(Store.key, secret); await Store.put("meta", "sec", m); toast(t("Verifica in due passaggi attivata")); after(); }; } };
  },
  async setup4() {
    let hasOld = false;
    try { if (indexedDB.databases) hasOld = (await indexedDB.databases()).some(d => d.name === "taccuino-scout"); } catch (e) { }
    this.render(`${this.brand()}<h2>${t("Tutto pronto")}</h2>
      <label class="f">${t("Il tuo nome (comparirà nei report e nelle condivisioni)")}<input type="text" id="meName" placeholder="Miodrag Milosevic"></label>
      ${hasOld ? `<div class="banner info">${t("Ho trovato i dati della versione precedente su questo dispositivo.")}<div class="row" style="margin-top:8px"><label class="chk"><input type="checkbox" id="impOld" checked> ${t("Importali nell'archivio cifrato")}</label></div></div>` : ""}
      <label class="chk"><input type="checkbox" id="loadEx" checked> ${t("Carica anche gli esempi (tutti inventati): giocatori, partite e squadre di fantasia, giovanili comprese, profili ideali, riunioni, impegni e note")}</label>
      <button class="btn pri" id="goApp">${t("Apri l'archivio")}</button>`);
    $("#goApp").onclick = async () => {
      const name = $("#meName").value.trim(); const imp = $("#impOld") && $("#impOld").checked; const ex = $("#loadEx").checked;
      await Store.loadAll(); Migrate.config();
      if (name) put("settings", "profile", { ...Profile.get(), name });
      if (imp) await Migrate.fromV2DB();
      if (ex) Examples.load(true);
      App.unlocked = true; App.touch(); this.hide(); if (window.Backup) Backup.afterUnlock(); render();
    };
  }
};

/* ---------- migrazioni ---------- */
const Migrate = {
  config() {
    const c = S.settings.get("config"); const d = defaultConfig();
    if (!c) { put("settings", "config", d); return; }
    let changed = false; for (const k in d) if (c[k] === undefined) { c[k] = d[k]; changed = true; }
    if (changed) put("settings", "config", c);
  },
  async fromV2DB() {
    try {
      const db = await new Promise((res, rej) => { const r = indexedDB.open("taccuino-scout"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
      if (!db.objectStoreNames.contains("rec")) return;
      const rows = await new Promise((res, rej) => { const out = []; const c = db.transaction("rec").objectStore("rec").openCursor(); c.onsuccess = () => { const cur = c.result; if (cur) { out.push([cur.key, cur.value]); cur.continue(); } else res(out); }; c.onerror = () => rej(c.error); });
      const o = { players: {}, evals: {}, matches: {}, settings: {} };
      for (const [k, v] of rows) { const i = k.indexOf("/"); const coll = k.slice(0, i); if (o[coll]) o[coll][k.slice(i + 1)] = v; }
      const n = Migrate.importV2(o); db.close(); toast(t("{n} voci importate dalla versione precedente", { n }));
    } catch (e) { toast(t("Importazione della versione precedente non riuscita")); }
  },
  importV2(o) {
    let n = 0; const listByName = new Map([...S.lists.entries()].map(([id, l]) => [l.name, id]));
    const listId = name => { if (!listByName.has(name)) { const id = uid(); put("lists", id, { name, parentId: null, color: "#1E6A47", note: "", created: today() }); listByName.set(name, id); } return listByName.get(name); };
    const vm = { raccomandato: "prendere", monitorare: "seguire", osservare: "rivedere", scartato: "no" };
    for (const [id, p0] of Object.entries(o.players || {})) {
      let p = { ...p0 };
      if (!p.first && !p.last && p.name) { const parts = String(p.name).trim().split(/\s+/); p.first = parts.length > 1 ? parts.slice(0, -1).join(" ") : parts[0]; p.last = parts.length > 1 ? parts[parts.length - 1] : ""; p.birthYear = p.birth; delete p.birth; p.nat = p.nationality; p.roles = p.role ? [p.role] : []; p.verdict = vm[p.status] || ""; delete p.name; }
      p.listIds = [...new Set([...(p.listIds || []), ...(p.lists || []).map(listId)])]; delete p.lists;
      for (const m of (p.media || [])) { put("media", m.id || uid(), { owner: "player", ownerId: id, kind: m.kind === "video" ? "link" : (m.kind || "link"), name: m.title || m.url, url: m.url, note: "", date: m.date || today() }); }
      delete p.media; p.tags = p.tags || [];
      if (p.roles) p.roles = p.roles.map(r => ({ "Punta centrale": "Punta centrale", "Centravanti": "Punta centrale", "Esterno a tutta fascia": "Quinto sinistro", "Terzino": "Terzino destro", "Ala": "Ala destra" }[r] || r));
      put("players", id, p); n++;
    }
    for (const [id, e] of Object.entries(o.evals || {})) { put("evals", id, e); n++; }
    for (const [id, m] of Object.entries(o.matches || {})) { put("matches", id, { ...m, type: m.type || "Campionato" }); n++; }
    const lu = (o.settings || {}).lineup; if (lu && lu.slots) { const slots = {}; for (const k in lu.slots) slots[k] = { main: lu.slots[k], alt: [] }; put("lineups", uid(), { name: t("Squadra ombra"), formation: lu.formation || "4-3-3", slots, example: lu.example }); }
    const me = (o.settings || {}).me; if (me && typeof me === "string") put("settings", "profile", { ...Profile.get(), initials: me });
    return n;
  }
};

/* =========================================================
   CALCOLI E FORMATTAZIONE
   ========================================================= */
const P = id => S.players.get(id);
const pname = p => p ? ([p.first, p.last].filter(Boolean).join(" ") || t("Senza nome")) : t("Giocatore eliminato");
const mainRole = p => ((p && p.roles) || [])[0];
const isGK = p => !!(p && (p.roles || []).some(r => (Cfg.role(r) || {}).gk));
const roleL = r => L(Cfg.role(r)) || r;
function visAreas(p) { return Cfg.get().areas.filter(a => !a.hidden && (!a.gk || isGK(p))); }
function visParams(p, a) { const hide = new Set((Cfg.get().roleHide || {})[mainRole(p)] || []); return a.params.filter(x => !x.hidden && !hide.has(a.id + "|" + x.id)); }
function paramL(a, id) { const x = a.params.find(q => q.id === id); return x ? L(x) : id; }
function age(p) { if (!p) return null; let y = null; if (p.birth) y = +String(p.birth).slice(0, 4); else if (p.birthYear) y = +p.birthYear; if (!y) return null; let a = new Date().getFullYear() - y; if (p.birth && p.birth.length === 10) { const b = new Date(p.birth), n = new Date(); if (n < new Date(n.getFullYear(), b.getMonth(), b.getDate())) a--; } return a; }
function evalArea(e, aid) { return mean(Object.values((e.r || {})[aid] || {})); }
function areaWeight(aid) { const w = (Cfg.get().areaWeights || {})[aid]; return w == null || isNaN(+w) ? 1 : +w; }
function wmean(pairs) { let s = 0, w = 0; for (const [v, k] of pairs) if (v != null && !isNaN(v) && k > 0) { s += v * k; w += k; } return w ? s / w : null; }
function evalRating(e) { const p = P(e.playerId); return wmean(visAreas(p).map(a => [evalArea(e, a.id), areaWeight(a.id)])); }
function playerEvals(pid, withArch) { return [...S.evals.entries()].filter(([, e]) => e.playerId === pid && (withArch || !e.archived)).sort((a, b) => (a[1].date || "").localeCompare(b[1].date || "")); }
const _profCache = new Map();
function profile(pid) {
  const p = P(pid); const es = playerEvals(pid).map(x => x[1]); const attr = {}, area = {};
  for (const a of visAreas(p)) { attr[a.id] = {}; for (const x of a.params) attr[a.id][x.id] = mean(es.map(e => ((e.r || {})[a.id] || {})[x.id])); area[a.id] = mean(es.map(e => evalArea(e, a.id))); }
  return { attr, area, rating: wmean(Object.keys(area).map(k => [area[k], areaWeight(k)])), n: es.length, last: es.length ? es[es.length - 1].date : null };
}
function pct(v) { const s = Cfg.get().scale; return v == null ? 0 : Math.max(0, Math.min(1, (v - s.min) / (s.max - s.min))); }
const sc = v => v == null ? "" : pct(v) >= 0.72 ? "s-hi" : pct(v) >= 0.5 ? "s-md" : "s-lo";
const vpill = id => { const v = Cfg.verdict(id); return v ? `<span class="pill c-${v.color || "grey"}">${esc(L(v))}</span>` : ""; };
const exB = o => o && o.example ? `<span class="ex">${t("Esempio")}</span>` : "";
const archB = o => o && o.archived ? `<span class="arch">${t("Archiviato")}</span>` : "";
const initials = p => (((p.first || "")[0] || "") + ((p.last || "")[0] || "")).toUpperCase();
// senza foto: una maglia stilizzata con numero (o iniziali) e colore costante per squadra
const JCOL = ["#2F6690", "#1E6A47", "#7A4E9E", "#B8730F", "#3D5A80", "#5C7A29", "#8C3B3B", "#2D6E6E", "#6B5B95", "#4A4A4A"];
function jersey(p) { p = p || {}; let h = 0; for (const ch of String(p.club || p.last || "x")) h = (h * 31 + ch.charCodeAt(0)) >>> 0; const c = JCOL[h % JCOL.length]; const lbl = esc(String(p.shirt || initials(p) || "?").slice(0, 3));
  return `<svg viewBox="0 0 48 48" class="jersey" aria-hidden="true"><path d="M16 6l-10 6 4 9 4-2v23h20V19l4 2 4-9-10-6c-1 3-4 5-8 5s-7-2-8-5z" fill="${c}"/><path d="M16 6c1 3 4 5 8 5s7-2 8-5" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1.6"/><text x="24" y="${lbl.length > 2 ? 32 : 33}" text-anchor="middle" font-size="${lbl.length > 2 ? 10 : 13}" font-weight="800" fill="#fff" font-family="system-ui,sans-serif">${lbl}</text></svg>`; }
const avatar = (p, cls = "avatar") => p && p.photo ? `<img class="${cls}" src="${p.photo}" alt="">` : `<div class="${cls} jav">${jersey(p)}</div>`;
function tagsHtml(ids) { return (ids || []).map(id => Cfg.tag(id)).filter(Boolean).map(tg => `<span class="tag" style="color:${esc(tg.color)};background:color-mix(in srgb,${esc(tg.color)} 14%,transparent)"><i></i>${esc(tg.name)}</span>`).join(" "); }
const levelL = id => { const l = Cfg.level(id); return l ? id + " · " + L(l) : ""; };
function contractMonths(p) { const u = p.contract && p.contract.until; if (!u) return null; return (new Date(u) - new Date()) / (30.44 * 864e5); }

/* ---------- grafici ---------- */
function pitchSVG(dots, o = {}) {
  const Lc = "var(--pitch-line)";
  const d = (dots || []).map(p => `<circle cx="${p.x * 1.05}" cy="${p.y * 0.68}" r="2.6" fill="#F2C14E" stroke="#17221C" stroke-width=".6"/>`).join("");
  return `<svg class="pitch ${o.edit ? "edit" : ""}" ${o.id ? `id="${o.id}"` : ""} viewBox="-3 -3 111 74" role="img" aria-label="${t("Campo con le posizioni")}"><rect x="-3" y="-3" width="111" height="74" fill="var(--pitch)"/>
  <g fill="none" stroke="${Lc}" stroke-width=".5"><rect x="0" y="0" width="105" height="68"/><line x1="52.5" y1="0" x2="52.5" y2="68"/><circle cx="52.5" cy="34" r="9.15"/><rect x="0" y="13.84" width="16.5" height="40.32"/><rect x="0" y="24.84" width="5.5" height="18.32"/><rect x="88.5" y="13.84" width="16.5" height="40.32"/><rect x="99.5" y="24.84" width="5.5" height="18.32"/></g>
  <text x="102" y="66" fill="${Lc}" font-size="3.2" text-anchor="end">${t("attacco")} →</text>${d}</svg>`;
}
function pitchPoint(svg, ev) { const r = svg.getBoundingClientRect(); const x = ((ev.clientX - r.left) / r.width * 111 - 3) / 1.05, y = ((ev.clientY - r.top) / r.height * 74 - 3) / 0.68; return { x: Math.max(0, Math.min(100, Math.round(x))), y: Math.max(0, Math.min(100, Math.round(y))) }; }
function radar(series, labels, colors = ["var(--accent)"]) {
  const s = Cfg.get().scale; const n = labels.length, many = n > 8, W = many ? 380 : 320, H = many ? 340 : 280, cx = W / 2, cy = H / 2, r = many ? 110 : 96;
  const pt = (i, v) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; const k = Math.max(0, (v - s.min) / (s.max - s.min)); return [cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k]; };
  const rings = [0.2, 0.4, 0.6, 0.8, 1].map(k => s.min + k * (s.max - s.min));
  let g = ""; for (const k of rings) g += `<polygon points="${labels.map((_, i) => pt(i, k).join(",")).join(" ")}" fill="none" stroke="var(--line)" stroke-width="1"/>`;
  labels.forEach((l, i) => { const [x, y] = pt(i, s.max); const a = -Math.PI / 2 + i * 2 * Math.PI / n; const lx = cx + Math.cos(a) * (r + (many ? 12 : 16)), ly = cy + Math.sin(a) * (r + (many ? 12 : 16)); const anc = Math.abs(lx - cx) < 8 ? "middle" : lx < cx ? "end" : "start"; g += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="var(--line)"/><text x="${lx}" y="${ly + 3}" text-anchor="${anc}" ${many ? 'style="font-size:8.5px"' : ""}>${esc(l)}</text>`; });
  series.forEach((ser, j) => { const c = colors[j % colors.length]; const pts = ser.vals.map((v, i) => pt(i, v ?? s.min).join(",")).join(" "); g += `<polygon points="${pts}" fill="${c}" fill-opacity=".16" stroke="${c}" stroke-width="2"/>` + ser.vals.map((v, i) => { if (v == null) return ""; const [x, y] = pt(i, v); return `<circle cx="${x}" cy="${y}" r="3" fill="${c}"/>`; }).join(""); });
  return `<svg class="radar" viewBox="${many ? "-75 0 530 340" : "-30 0 380 280"}" style="width:100%;max-width:${many ? 460 : 360}px;display:block;margin:4px auto" role="img" aria-label="${t("Grafico radar")}">${g}</svg>`;
}
function lineChart(points, o = {}) { // points: [{label, v}]
  const s = Cfg.get().scale; const W = 520, H = 170, pl = 30, pr = 12, pt = 12, pb = 26; const n = points.length; if (n < 2) return "";
  const x = i => pl + i * (W - pl - pr) / (n - 1), y = v => pt + (1 - pct(v)) * (H - pt - pb);
  let g = ""; for (const k of [0, .25, .5, .75, 1]) { const v = s.min + k * (s.max - s.min); g += `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${pl - 6}" y="${y(v) + 3}" text-anchor="end">${f1(v)}</text>`; }
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.v)}`).join(" ");
  g += `<path d="${path} L${x(n - 1)},${H - pb} L${x(0)},${H - pb} Z" fill="var(--accent)" fill-opacity=".12"/><path d="${path}" fill="none" stroke="var(--accent)" stroke-width="2"/>`;
  points.forEach((p, i) => { g += `<circle cx="${x(i)}" cy="${y(p.v)}" r="${i === n - 1 ? 4.5 : 3}" fill="var(--accent)"/>`; if (n <= 12 || i % Math.ceil(n / 8) === 0 || i === n - 1) g += `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${esc(p.label)}</text>`; });
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" style="width:100%;display:block" role="img" aria-label="${esc(o.label || t("Andamento"))}">${g}</svg>`;
}
function barChart(rows, o = {}) { // rows: [{label, a, b}]
  const W = 560, H = 190, pl = 26, pb = 26, pt = 10; const n = rows.length; const top = Math.max(...rows.map(r => Math.max(r.a || 0, r.b || 0)), 0); const max = Math.max(2, Math.ceil(top / 2) * 2);
  const bw = (W - pl - 10) / n; let g = "";
  for (const k of [0, .5, 1]) { const yy = pt + (1 - k) * (H - pt - pb); g += `<line x1="${pl}" x2="${W - 10}" y1="${yy}" y2="${yy}" stroke="var(--line)"/><text x="${pl - 5}" y="${yy + 3}" text-anchor="end">${Math.round(max * k)}</text>`; }
  rows.forEach((r, i) => { const x0 = pl + i * bw + bw * 0.15, w = bw * 0.33; const h1 = (r.a || 0) / max * (H - pt - pb), h2 = (r.b || 0) / max * (H - pt - pb);
    g += `<rect x="${x0}" y="${H - pb - h1}" width="${w}" height="${h1}" rx="2" fill="var(--accent)"/><rect x="${x0 + w + 2}" y="${H - pb - h2}" width="${w}" height="${h2}" rx="2" fill="var(--amber)"/><text x="${x0 + w}" y="${H - 9}" text-anchor="middle">${esc(r.label)}</text>`; });
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" style="width:100%;display:block" role="img" aria-label="${esc(o.label || "")}">${g}</svg>`;
}

/* =========================================================
   STRUTTURA E NAVIGAZIONE
   ========================================================= */
const ICONS = {
  panoramica: '<path d="M3 13h8V3H3zm10 8h8V11h-8zM3 21h8v-6H3zm10-18v6h8V3z"/>',
  cerca: '<path d="M10 3a7 7 0 0 1 5.6 11.2l5.1 5.1-1.4 1.4-5.1-5.1A7 7 0 1 1 10 3zm0 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10z"/>',
  giocatori: '<path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-4 0-8 2-8 5v1h16v-1c0-3-4-5-8-5z"/>',
  partite: '<path d="M7 2v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2zm-2 8h14v10H5z"/>',
  report: '<path d="M6 2h9l5 5v15H6zm8 1.5V8h4.5M8 12h8v1.6H8zm0 4h8v1.6H8z"/>',
  liste: '<path d="M3 5h7l2 2h9v12H3zm2 4v8h14V9z"/>',
  confronto: '<path d="M5 20V10h3v10zm5.5 0V4h3v16zM16 20v-7h3v7z"/>',
  squadre: '<path d="M4 3h16v18H4zm2 2v6h12V5zm0 8v6h12v-6zm6-6.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z"/>',
  attivita: '<path d="M3 12h4l3-8 4 16 3-8h4v2h-2.6L14 22 10 8l-1.6 6H3z"/>',
  portfolio: '<path d="M9 3h6l1 3h4a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4zm1 1.6L9.4 6h5.2L14 4.6zM5 8v10h14V8z"/>',
  archivio: '<path d="M3 3h18v5H3zm1 6h16v12H4zm5 3v2h6v-2z"/>',
  profilo: '<path d="M12 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 12c5 0 9 2.5 9 5.5V22H3v-2.5C3 16.5 7 14 12 14zm6.5-5.5 1.4-1.4 1.4 1.4 2.8-2.8 1.4 1.4-4.2 4.2z"/>',
  impostazioni: '<path d="M19.4 13a7.5 7.5 0 0 0 0-2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-1.7-1L15 3.5h-4l-.4 2.5a7 7 0 0 0-1.7 1l-2.4-1-2 3.4L6.6 11a7.5 7.5 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 1.7 1l.4 2.5h4l.4-2.5a7 7 0 0 0 1.7-1l2.4 1 2-3.4zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z"/>',
  calendario: '<path d="M7 2v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2zM5 9h14v11H5zm2 2v3h3v-3z"/>',
  profili: '<path d="M12 2l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 16.9 6.1 20l1.2-6.5L2.5 8.9 9.1 8z"/>',
  lock: '<path d="M7 10V7a5 5 0 0 1 10 0v3h2v12H5V10zm2 0h6V7a3 3 0 0 0-6 0zm3 4a2 2 0 0 0-1 3.7V19h2v-1.3A2 2 0 0 0 12 14z"/>',
  menu: '<path d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z"/>',
  share: '<path d="M18 16a3 3 0 0 0-2.4 1.2l-6.7-3.4a3 3 0 0 0 0-1.6l6.7-3.4A3 3 0 1 0 15 7l-6.7 3.4a3 3 0 1 0 0 3.2L15 17a3 3 0 1 0 3-1z"/>'
};
const ico = (k, cls = "ico") => `<svg class="${cls}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${ICONS[k] || ""}</svg>`;
function views() {
  return [["panoramica", t("Panoramica")], ["giocatori", t("Giocatori")], ["partite", t("Partite")], ["report", t("Report")], ["liste", t("Liste")], ["calendario", t("Calendario")], "-", ["profili", t("Profili ideali")], ["confronto", t("Confronto")], ["squadre", t("Squadre ombra")], ["attivita", t("Attività")], ["portfolio", t("Portfolio")], ["archivio", t("Archivio")], ["profilo", t("Profilo scout")], ["impostazioni", t("Impostazioni")]];
}
function renderShell() {
  const prof = Profile.get();
  $("#side").innerHTML = `${appBrand()}<a class="scoutcard" href="#profilo" data-a="menuGo" data-v="profilo">${prof.photo ? `<img src="${prof.photo}" alt="">` : `<span class="ini">${esc(((prof.name || "?").split(/\s+/).map(x => x[0]).join("")).slice(0, 2).toUpperCase())}</span>`}<span class="grow"><b>${esc(prof.name || t("Il tuo profilo"))}</b><small>${esc(prof.title || prof.email || t("Completa il profilo scout"))}</small></span></a>
    <nav class="nav">${views().map(v => v === "-" ? '<div class="sep"></div>' : `<a href="#${v[0]}" ${ui.view === v[0] ? 'aria-current="page"' : ""}>${ico(v[0])}${v[1]}</a>`).join("")}</nav>
    <div class="side-foot"><div id="saveState">${saveStateText()}</div><button data-a="lockNow">${t("Blocca ora")}</button></div>`;
  const mb = [["panoramica", t("Home")], ["giocatori", t("Giocatori")], ["partite", t("Partite")], ["report", t("Report")]];
  $("#mbar").innerHTML = mb.map(([k, n]) => `<a href="#${k}" ${ui.view === k ? 'aria-current="page"' : ""}>${ico(k)}${n}</a>`).join("") + `<button data-a="moreMenu" ${!mb.some(m => m[0] === ui.view) ? 'aria-current="page"' : ""}>${ico("menu")}${t("Altro")}</button>`;
  $("#topbar").innerHTML = `<label class="search">${ico("cerca")}<input type="search" id="gq" placeholder="${t("Cerca giocatori, partite, report, note…")}" value="${esc(ui.q)}" autocomplete="off"></label>
    <select class="langsel" id="langSel" aria-label="${t("Lingua")}">${LANGS.map(([k, n]) => `<option value="${k}" ${Prefs.lang === k ? "selected" : ""} title="${n}">${k.toUpperCase()}</option>`).join("")}</select><button class="iconbtn" data-a="quickAdd" title="${t("Aggiungi")}">+</button><button class="iconbtn" data-a="lockNow" title="${t("Blocca ora")}" aria-label="${t("Blocca ora")}">${ico("lock")}</button>`;
  $("#langSel").onchange = e => A.setLang({ dataset: { v: e.target.value } });
  const gq = $("#gq"); gq.oninput = () => { ui.q = gq.value; if (ui.view !== "cerca") { ui.view = "cerca"; history.replaceState(null, "", "#cerca"); renderShellNav(); } $("#view").innerHTML = R.cerca(); };
}
function renderShellNav() { $$(".nav a,.mbar a").forEach(a => { if (a.getAttribute("href") === "#" + ui.view) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); }); }
function saveStateText() { const last = Prefs.get("lastBackup", null); return `${t("Dati cifrati su questo dispositivo")}${last ? "<br>" + t("Ultimo backup: {d}", { d: fmtDate(last.slice(0, 10)) }) : ""}`; }
function render(keepScroll) {
  if (!App.unlocked) return;
  const y = window.scrollY; if (ui.view !== "impostazioni" || ui.setTab !== "personalizza") cfgDraft = null; renderShell();
  const fn = R[ui.view] || R.panoramica; $("#view").innerHTML = fn(); bindView(); afterRender();
  if (keepScroll) window.scrollTo(0, y); else { const v = $("#view"); v.classList.remove("enter"); void v.offsetWidth; v.classList.add("enter"); }
}
function go(view, extra = {}) { ui.view = view; Object.assign(ui, extra); if (location.hash !== "#" + view) history.replaceState(history.state, "", "#" + view); render(); window.scrollTo(0, 0); }
function resetSub() { ui.playerId = null; ui.pdraft = null; ui.edraft = null; ui.matchId = null; }
document.addEventListener("click", e => {
  const a = e.target.closest(".nav a,.mbar a"); if (!a) return; e.preventDefault();
  const h = a.getAttribute("href").slice(1); resetSub(); closeSheet(); go(h);
});
window.addEventListener("hashchange", () => { const h = location.hash.slice(1); if (h === ui.view) return; if (App.unlocked && views().some(v => v[0] === h)) { resetSub(); go(h); } });
const R = {};
// dopo il disegno: carica le miniature cifrate
async function afterRender() { if (window.bindSigPad) bindSigPad(); if (window.fillSignBoxes) fillSignBoxes(); if (window.bindLive) bindLive(); for (const el of $$("[data-blob]")) { const id = el.dataset.blob; el.removeAttribute("data-blob"); try { const u = await Store.blobURL(id); if (u) { if (el.tagName === "IMG" || el.tagName === "VIDEO" || el.tagName === "AUDIO") el.src = u; else if (el.tagName === "IFRAME") el.src = u; } } catch (e) { } } }

/* =========================================================
   GIOCATORI
   ========================================================= */
function playerItem(id, p, extra = "") {
  const pr = profile(id);
  return `<div class="item click pl" data-a="openPlayer" data-id="${id}">${avatar(p)}<div class="grow"><div class="t">${esc(pname(p))}${exB(p)}${archB(p)}</div><div class="m">${esc(roleL(mainRole(p)) || t("Ruolo n.d."))}${p.club ? " · " + esc(p.club) : ""}${age(p) != null ? " · " + t("{n} anni", { n: age(p) }) : ""}${p.level ? " · " + esc(levelL(p.level)) : ""}</div>${(p.tags || []).length ? `<div style="margin-top:3px">${tagsHtml(p.tags)}</div>` : ""}</div>${extra}${vpill(p.verdict)}<div class="score ${sc(pr.rating)}">${f1(pr.rating)}</div></div>`;
}
function filterPlayers(f) {
  const q = (f.q || "").toLowerCase();
  let rows = [...S.players.entries()].filter(([id, p]) => {
    if (!f.showArch && p.archived) return false;
    if (q && !(pname(p) + " " + (p.club || "") + " " + (p.nat || "") + " " + ((p.contract || {}).agent || "") + " " + (p.notes || "") + " " + (p.league || "")).toLowerCase().includes(q)) return false;
    if (f.role && !(p.roles || []).includes(f.role)) return false;
    if (f.verdict && p.verdict !== f.verdict) return false;
    if (f.level && p.level !== f.level) return false;
    if (f.tag && !(p.tags || []).includes(f.tag)) return false;
    if (f.list && !listContains(f.list, id)) return false;
    if (f.foot && p.foot !== f.foot) return false;
    if (f.nat && !(String(p.nat || "") + " " + (p.nat2 || "")).toLowerCase().includes(f.nat.toLowerCase())) return false;
    const a = age(p); if (f.ageMin && (a == null || a < +f.ageMin)) return false; if (f.ageMax && (a == null || a > +f.ageMax)) return false;
    if (f.rMin) { const r = profile(id).rating; if (r == null || r < +f.rMin) return false; }
    if (f.contract) { const m = contractMonths(p); if (m == null || m > +f.contract) return false; }
    return true;
  });
  const sorters = { rating: (a, b) => (profile(b[0]).rating ?? -1) - (profile(a[0]).rating ?? -1), name: (a, b) => pname(a[1]).localeCompare(pname(b[1])), age: (a, b) => (age(a[1]) ?? 99) - (age(b[1]) ?? 99), recent: (a, b) => (profile(b[0]).last || "").localeCompare(profile(a[0]).last || ""), contract: (a, b) => (contractMonths(a[1]) ?? 999) - (contractMonths(b[1]) ?? 999) };
  return rows.sort(sorters[f.sort] || sorters.rating);
}
function listContains(listId, pid) { const ids = new Set([listId, ...listDescendants(listId)]); return (P(pid).listIds || []).some(x => ids.has(x)); }
function listDescendants(id) { const out = []; for (const [cid, l] of S.lists) if (l.parentId === id) out.push(cid, ...listDescendants(cid)); return out; }
function listPath(id) { const out = []; let cur = S.lists.get(id); let guard = 0; while (cur && guard++ < 20) { out.unshift([id, cur]); id = cur.parentId; cur = id ? S.lists.get(id) : null; } return out; }
function sel(id, items, value, empty) { return `<select id="${id}">${empty !== undefined ? `<option value="">${esc(empty)}</option>` : ""}${items.map(it => { const v = typeof it === "string" ? it : it.id; const n = typeof it === "string" ? it : L(it); return `<option value="${esc(v)}" ${value === v ? "selected" : ""}>${esc(n)}</option>`; }).join("")}</select>`; }
function listOptions(value, empty) { const rows = []; const walk = (pid, depth) => { for (const [id, l] of [...S.lists.entries()].filter(([, l]) => (l.parentId || null) === pid && !l.archived && !l.smart).sort((a, b) => a[1].name.localeCompare(b[1].name))) { rows.push(`<option value="${id}" ${value === id ? "selected" : ""}>${"— ".repeat(depth)}${esc(l.name)}</option>`); walk(id, depth + 1); } }; walk(null, 0); return `<option value="">${esc(empty)}</option>` + rows.join(""); }

R.giocatori = () => {
  if (ui.pdraft) return playerEditor();
  if (ui.edraft) return evalEditor();
  if (ui.playerId && P(ui.playerId)) return playerPage(ui.playerId);
  const f = ui.pf; const rows = filterPlayers(f); const c = Cfg.get();
  const active = ["role", "verdict", "level", "tag", "list", "foot", "nat", "ageMin", "ageMax", "rMin", "contract"].filter(k => f[k]).length;
  return `<div class="head"><div><h1>${t("Giocatori")}</h1><p class="sub">${t("{n} di {tot} giocatori", { n: rows.length, tot: [...S.players.values()].filter(p => !p.archived).length })}</p></div><div class="row"><button class="btn" data-a="exportCsv">${t("Esporta CSV")}</button><button class="btn pri" data-a="newPlayer">+ ${t("Nuovo giocatore")}</button></div></div>
  <div class="row"><input type="search" id="pfq" placeholder="${t("Cerca nome, club, nazionalità, agente, note")}" value="${esc(f.q)}" style="flex:2 1 240px;width:auto">
    <select id="pfsort" style="flex:0 1 190px;width:auto">${[["rating", t("Ordina: rating")], ["name", t("Ordina: nome")], ["age", t("Ordina: età")], ["recent", t("Ordina: ultima valutazione")], ["contract", t("Ordina: scadenza contratto")]].map(([k, n]) => `<option value="${k}" ${f.sort === k ? "selected" : ""}>${n}</option>`).join("")}</select>
    <button class="btn" data-a="toggleFilters" aria-expanded="${f.open}">${t("Filtri")}${active ? ` (${active})` : ""}</button></div>
  ${f.open ? `<section class="panel"><div class="fgrid">
    <label class="f">${t("Ruolo")}${sel("pf_role", c.roles, f.role, t("Tutti"))}</label>
    <label class="f">${t("Giudizio")}${sel("pf_verdict", c.verdicts, f.verdict, t("Tutti"))}</label>
    <label class="f">${t("Livello")}${sel("pf_level", c.levels.map(l => ({ ...l, it: l.id + " · " + l.it, en: l.id + " · " + l.en })), f.level, t("Tutti"))}</label>
    <label class="f">${t("Tag")}<select id="pf_tag"><option value="">${t("Tutti")}</option>${c.tags.map(tg => `<option value="${tg.id}" ${f.tag === tg.id ? "selected" : ""}>${esc(tg.name)}</option>`).join("")}</select></label>
    <label class="f">${t("Lista")}<select id="pf_list">${listOptions(f.list, t("Tutte"))}</select></label>
    <label class="f">${t("Piede")}${sel("pf_foot", [opt("Destro", "Destro", "Right"), opt("Sinistro", "Sinistro", "Left"), opt("Ambidestro", "Ambidestro", "Both")], f.foot, t("Tutti"))}</label>
    <label class="f">${t("Nazionalità")}<input type="text" id="pf_nat" value="${esc(f.nat)}"></label>
    <label class="f">${t("Età da")}<input type="number" id="pf_ageMin" value="${esc(f.ageMin)}"></label>
    <label class="f">${t("Età fino a")}<input type="number" id="pf_ageMax" value="${esc(f.ageMax)}"></label>
    <label class="f">${t("Rating minimo")}<input type="number" step="0.5" id="pf_rMin" value="${esc(f.rMin)}"></label>
    <label class="f">${t("Contratto in scadenza entro (mesi)")}<input type="number" id="pf_contract" value="${esc(f.contract)}"></label>
    <label class="chk" style="align-self:end"><input type="checkbox" id="pf_showArch" ${f.showArch ? "checked" : ""}> ${t("Mostra archiviati")}</label></div>
    <div class="row end" style="margin-top:12px"><button class="btn ghost" data-a="clearFilters">${t("Azzera filtri")}</button><button class="btn" data-a="saveSmart">${t("Salva come lista intelligente")}</button></div></section>` : ""}
  <section class="panel"><div class="list">${rows.map(([id, p]) => playerItem(id, p)).join("") || `<div class="empty">${t("Nessun giocatore trovato.")}</div>`}</div></section>`;
};

function playerPage(id) {
  const p = P(id), pr = profile(id), c = p.contract || {};
  const facts = [p.sex === "Donna" ? t("Donna") : p.sex ? t("Uomo") : "", p.birth ? fmtDate(p.birth) : p.birthYear, age(p) != null ? t("{n} anni", { n: age(p) }) : "", p.height ? p.height + " cm" : "", p.weight ? p.weight + " kg" : "", L(Cfg.get().somatotypes.find(x => x.id === p.soma))].filter(Boolean);
  const facts2 = [[p.nat, p.nat2].filter(Boolean).join(" / "), [p.birthCity, p.birthCountry].filter(Boolean).join(", "), semester(p) ? t("{n}° semestre", { n: semester(p) }) : "", p.morpho ? L(o3(MORPHO).find(x => x.id === p.morpho)) : "", p.maturity ? t("Maturazione: {m}", { m: L(Cfg.get().maturity.find(x => x.id === p.maturity)) || p.maturity }) : "", p.shirt ? t("Maglia {n}", { n: p.shirt }) : ""].filter(Boolean);
  const lists = (p.listIds || []).map(l => S.lists.get(l)).filter(Boolean);
  const tabs = [["profilo", t("Profilo")], ["caratteristiche", t("Caratteristiche")], ["relazione", t("Relazione")], ["infortuni", t("Infortuni")], ["fisica", t("Struttura fisica")], ["procontro", t("Pro & contro")], ["azioni", t("Partite e azioni")], ["statistiche", t("Statistiche")], ["contratto", t("Contratto")], ["multimedia", t("Multimedia")]];
  const cm = contractMonths(p);
  return `<div class="row between noprint"><button class="btn ghost sm" data-a="backList">← ${t("Giocatori")}</button>
    <div class="row"><button class="btn sm" data-a="print">${t("Stampa / PDF")}</button><button class="btn sm" data-a="shareItem" data-kind="player" data-id="${id}">${ico("share")} ${t("Condividi")}</button><button class="btn sm" data-a="toggleArchive" data-coll="players" data-id="${id}">${p.archived ? t("Ripristina") : t("Archivia")}</button><button class="btn sm" data-a="editPlayer" data-id="${id}">${t("Modifica")}</button><button class="btn sm pri" data-a="newEval" data-id="${id}">+ ${t("Valutazione")}</button></div></div>
  ${p.archived ? `<div class="banner">${t("Questo giocatore è nell'archivio.")}</div>` : ""}
  <section class="panel card">
   <div class="cphoto">${p.photo ? `<img class="photo" src="${p.photo}" alt="">` : `<div class="photo jav">${jersey(p)}<button class="btn sm phadd noprint" data-a="editPlayer" data-id="${id}">${t("Aggiungi foto")}</button></div>`}
    <div class="rbox r-rating"><span>${t("Rating")}</span><b>${f1(pr.rating)}</b></div>
    ${p.level ? `<div class="rbox r-level"><b>${esc(p.level)}</b><span>${esc(L(Cfg.level(p.level)))}</span></div>` : ""}${p.potential ? `<div class="rbox r-level" style="background:var(--blue-soft);color:var(--blue)"><b>${esc(p.potential)}</b><span>${t("Potenziale")}</span></div>` : ""}</div>
   <div class="cinfo"><h1>${esc(pname(p))}${exB(p)}</h1>${p.alias ? `<div class="m">«${esc(p.alias)}»</div>` : ""}<div class="row" style="margin-top:6px">${formPill(p.form)}${reliabilityPill(id)}${p.eu ? `<span class="pill c-grey">${esc(L(o3(EUSTATUS).find(x => x.id === p.eu)))}</span>` : ""}</div>${Author.line(p)}
    <div class="facts">${facts.map(x => `<span>${esc(x)}</span>`).join("")}</div>
    <div class="facts" style="margin-top:-6px">${facts2.map(x => `<span>${esc(x)}</span>`).join("")}</div>
    <dl class="kv"><dt>${t("Club attuale")}</dt><dd>${esc(p.club || "—")}${p.league ? " · " + esc(p.league) : ""}</dd><dt>${t("Club 1ª osservazione")}</dt><dd>${esc(p.clubFirst || "—")}</dd><dt>${t("Piede preferito")}</dt><dd>${esc(p.foot ? t(p.foot) : "—")}</dd><dt>${t("Giudizio")}</dt><dd>${vpill(p.verdict) || "—"}</dd>${p.nextCheck ? `<dt>${t("Prossima verifica")}</dt><dd>${fmtDate(p.nextCheck)}</dd>` : ""}</dl>
    ${(p.tags || []).length ? `<div style="margin-top:8px">${tagsHtml(p.tags)}</div>` : ""}</div>
   <div class="cpitch"><div class="pitchbox">${pitchSVG(p.pos ? [p.pos] : [])}</div><div class="row" style="margin-top:8px"><b>${t("Ruoli")}</b>${(p.roles || []).map((r, i) => `<span class="tag ${i ? "c-grey" : "c-good"}">${esc(roleL(r))}</span>`).join("") || '<span class="muted">—</span>'}</div>${p.archetype ? `<div class="m" style="margin-top:4px">${t("Interpretazione")}: <b>${esc(archL(p.archetype))}</b></div>` : ""}</div>
   <div class="cradar"><h3 style="text-align:center">${t("Rating per area")}</h3>${pr.n ? radar([{ vals: visAreas(p).map(a => pr.area[a.id]) }], visAreas(p).map(a => L(a) + " " + f1(pr.area[a.id]))) : `<div class="empty small" style="margin-top:8px">${t("Nessuna valutazione.")}</div>`}</div>
  </section>
  <section class="panel plists">
   <div class="row"><b>${t("Liste")}</b>${lists.map(l => `<button class="tag c-good" style="border:0" data-a="openList" data-id="${(p.listIds || []).find(x => S.lists.get(x) === l)}">${esc(l.name)}</button>`).join("") || `<span class="muted">${t("nessuna")}</span>`}<button class="btn sm ghost noprint" data-a="pickLists" data-id="${id}">${t("Gestisci liste")}</button></div></section>
  <div class="tabs noprint" role="tablist">${tabs.map(([k, n]) => `<button data-a="ptab" data-t="${k}" aria-pressed="${ui.ptab === k}">${n}</button>`).join("")}</div>
  ${ptab(id, p, pr)}`;
}
function ptab(id, p, pr) {
  const evs = playerEvals(id);
  switch (ui.ptab) {
    case "caratteristiche": return caratteristiche(id, p, pr, evs);
    case "relazione": return (window.offFieldPanel ? offFieldPanel(id, p) : "") + subList(id, p, "relations", t("Relazioni"), t("Relazione"), r => `<div class="grow"><div class="t">${esc(r.title)}</div><div class="m">${esc(r.author || "")} · ${fmtDate(r.date)}</div><p style="white-space:pre-wrap;margin-top:6px">${esc(r.text)}</p></div>`, t("Scrivi la relazione testuale: qualità fisico-atletiche, tecniche, tattiche e comportamento in campo."));
    case "infortuni": return subList(id, p, "injuries", t("Infortuni"), t("Infortunio"), r => `<div class="grow"><div class="t">${esc(r.type || t("Infortunio"))} · ${esc(L(Cfg.get().injuryTypes.find(x => x.id === r.part)) || r.part || "")}</div><div class="m">${fmtDate(r.date)}${r.days ? " · " + t("{n} giorni di stop", { n: esc(r.days) }) : ""}</div>${r.notes ? `<p class="small" style="margin-top:4px">${esc(r.notes)}</p>` : ""}</div>`, t("Nessun infortunio registrato."));
    case "fisica": { const f = p.physique || {}; return `<section class="panel"><div class="row between"><h2>${t("Struttura fisica")}</h2><button class="btn sm noprint" data-a="editPlayer" data-id="${id}">${t("Modifica")}</button></div><div class="fgrid" style="margin-top:10px">
      <div><div class="m">${t("Altezza")}</div><b>${esc(p.height || "—")} cm</b></div><div><div class="m">${t("Peso")}</div><b>${esc(p.weight || "—")} kg</b></div><div><div class="m">${t("Somatotipo")}</div><b>${esc(L(Cfg.get().somatotypes.find(x => x.id === p.soma)) || "—")}</b></div><div><div class="m">${t("Maturazione biologica")}</div><b>${esc(L(Cfg.get().maturity.find(x => x.id === p.maturity)) || "—")}</b></div><div><div class="m">${t("Struttura")}</div><b>${esc(f.build || "—")}</b></div><div><div class="m">${t("Muscolatura")}</div><b>${esc(f.muscle || "—")}</b></div></div>
      ${f.notes ? `<p style="margin-top:12px;white-space:pre-wrap">${esc(f.notes)}</p>` : ""}</section>`; }
    case "procontro": return `<section class="panel"><div class="row between"><h2>${t("Pro & contro")}</h2><button class="btn sm noprint" data-a="editPlayer" data-id="${id}">${t("Modifica")}</button></div><div class="grid2" style="margin-top:10px"><div><h3 style="color:var(--good)">${t("Pro")}</h3><ul>${(p.pros || []).map(x => `<li>${esc(x)}</li>`).join("") || '<li class="muted">—</li>'}</ul></div><div><h3 style="color:var(--bad)">${t("Contro")}</h3><ul>${(p.cons || []).map(x => `<li>${esc(x)}</li>`).join("") || '<li class="muted">—</li>'}</ul></div></div></section>`;
    case "contratto": { const c = p.contract || {}; const cm = contractMonths(p); return `<section class="panel"><div class="row between"><h2>${t("Info contrattuali")}</h2><button class="btn sm noprint" data-a="editPlayer" data-id="${id}">${t("Modifica")}</button></div><p class="sub small">${t("Dati di contorno: utili quando il club decide, dopo la valutazione tecnica.")}</p><div class="fgrid" style="margin-top:10px">
   <div><div class="m">${t("Data di scadenza")}</div><b>${fmtDate(c.until)}</b>${cm != null && cm <= 12 ? ` <span class="pill ${cm <= 6 ? "c-bad" : "c-amber"}">${cm < 0 ? t("Scaduto") : t("{n} mesi", { n: Math.max(0, Math.round(cm)) })}</span>` : ""}</div>
   <div><div class="m">${t("Prestito")}</div><b>${c.loan ? t("Sì") + (c.owner ? " (" + t("di proprietà {c}", { c: esc(c.owner) }) + ")" : "") : t("No")}</b></div>
   <div><div class="m">${t("Agente")}</div><b>${esc(c.agent || "—")}</b></div><div><div class="m">${t("Contatto agente")}</div><b>${esc(c.agentContact || "—")}</b></div><div><div class="m">${t("Valore di mercato")}</div><b>${esc(c.value || "—")}</b></div><div><div class="m">${t("Stipendio / note")}</div><b>${esc(c.salary || "—")}</b></div></div></section>`; }
    case "multimedia": return mediaSection("player", id);
    default: {
      const sim = similarPlayers(id);
      return `${p.quick ? `<section class="panel"><h2>${t("Nota rapida")}</h2><p style="white-space:pre-wrap;margin-top:6px">${esc(p.quick)}</p></section>` : ""}${window.idealMatchPanel ? idealMatchPanel(id) : ""}<section class="panel"><div class="row between"><h2>${t("Valutazioni")}</h2><button class="btn sm pri noprint" data-a="newEval" data-id="${id}">+ ${t("Valutazione")}</button></div><div class="list" style="margin-top:6px">${evs.slice().reverse().map(([eid, e]) => evalItem(eid, e)).join("") || `<div class="empty">${t("Nessuna valutazione.")}</div>`}</div>
        ${evs.length >= 2 ? `<h3 style="margin-top:14px">${t("Andamento del rating")}</h3>${lineChart(evs.map(([, e]) => ({ label: fmtDate(e.date).slice(0, 5), v: evalRating(e) })).filter(x => x.v != null))}` : ""}</section>
      ${liveSummary(id)}
      ${sim.length ? `<section class="panel"><h2>${t("Giocatori simili")}</h2><p class="sub small">${t("Calcolato sul profilo medio delle valutazioni.")}</p><div class="list" style="margin-top:6px">${sim.map(([sid, sp, s]) => playerItem(sid, sp, `<span class="pill c-blue">${Math.round(s * 100)}%</span>`)).join("")}</div></section>` : ""}
      ${p.notes ? `<section class="panel"><h2>${t("Note")}</h2><p style="white-space:pre-wrap;margin-top:6px">${esc(p.notes)}</p></section>` : ""}`;
    }
  }
}
function caratteristiche(id, p, pr, evs) {
  if (!evs.length) return `<div class="empty">${t("Nessuna valutazione.")} <button class="btn sm pri" data-a="newEval" data-id="${id}">+ ${t("Valutazione")}</button></div>`;
  const selId = ui.evalSel && S.evals.has(ui.evalSel) && S.evals.get(ui.evalSel).playerId === id ? ui.evalSel : "media";
  const e = selId === "media" ? null : S.evals.get(selId);
  const getV = (a, x) => e ? ((e.r || {})[a.id] || {})[x.id] ?? null : pr.attr[a.id][x.id];
  const areaV = a => e ? evalArea(e, a.id) : pr.area[a.id];
  const rating = e ? evalRating(e) : pr.rating;
  return `<section class="panel"><div class="row between"><div class="tabs" style="border:0">${[["media", t("Media")]].concat(evs.map(([eid], i) => [eid, t("Valutazione {n}", { n: i + 1 })])).map(([k, n]) => `<button data-a="evalSel" data-id="${k}" aria-pressed="${selId === k}">${n}</button>`).join("")}</div>
    ${e ? `<div class="row noprint"><button class="btn sm" data-a="shareItem" data-kind="eval" data-id="${selId}">${ico("share")} ${t("Condividi")}</button><button class="btn sm" data-a="editEval" data-id="${selId}">${t("Modifica valutazione")}</button></div>` : ""}</div>
    ${e ? Author.line(e) + evalHeader(e) : `<p class="sub" style="margin-top:8px">${t("Media di {n} valutazioni.", { n: evs.length })}</p>`}
    <div class="rbox r-rating" style="max-width:220px;margin-top:12px"><span>${t("Rating")}</span><b>${f1(rating)}</b></div>
    ${visAreas(p).map(a => { const vals = visParams(p, a).map(x => [x, getV(a, x)]).filter(z => z[1] != null); const s = Cfg.get().scale; return `<div class="areah"><h2>${esc(L(a))}</h2><span class="mono">${t("media")} ${f1(areaV(a))}</span></div>
      ${vals.length ? `<div class="pgrid"><div class="params">${vals.map(([x, v]) => `<div class="pb"><div class="lab"><span>${esc(L(x))}</span><span class="mono">${f1(v)}/${s.max}</span></div><div class="bar"><i style="width:${pct(v) * 100}%"></i></div></div>`).join("")}</div><div>${vals.length >= 3 ? radar([{ vals: vals.map(z => z[1]) }], vals.map(z => L(z[0]))) : ""}</div></div>` : `<p class="muted small">${t("Nessun parametro valutato.")}</p>`}
      ${e && e.notes && e.notes[a.id] ? `<p style="margin-top:8px;white-space:pre-wrap"><b>${t("Note")}:</b> ${esc(e.notes[a.id])}</p>` : ""}
      ${e ? (e.evidence || []).filter(x => x.area === a.id).map(x => `<div class="small" style="margin-top:4px"><span class="code">${esc(x.min || "–")}'</span> ${esc(x.text)}</div>`).join("") : ""}`; }).join("")}
    ${e && e.summary ? `<div class="areah"><h2>${t("Sintesi")}</h2></div><p style="white-space:pre-wrap">${esc(e.summary)}</p>` : ""}
    ${e ? `<div class="areah"><h2>${t("Multimedia")}</h2></div>${mediaGrid("eval", selId)}` : ""}</section>${e && typeof SignX !== "undefined" ? SignX.footer("evals", selId) : ""}`;
}
function evalHeader(e) {
  const c = Cfg.get();
  return `<div class="grid2" style="margin-top:12px"><dl class="kv"><dt>${t("Valutato da")}</dt><dd>${esc(e.by || "—")}</dd><dt>${t("Data partita")}</dt><dd>${fmtDate(e.date)}</dd><dt>${t("Partita")}</dt><dd>${esc(e.home || "")} – ${esc(e.away || "")}${e.score ? " " + esc(e.score) : ""}</dd><dt>${t("Tipologia")}</dt><dd>${esc(L(c.matchTypes.find(x => x.id === e.matchType)) || e.matchType || "—")} · ${esc(e.cat === "Nazionale" ? t("Nazionale") : t("Club"))}</dd><dt>${t("Categoria squadra")}</dt><dd>${esc(L(c.teamCats.find(x => x.id === e.teamCat)) || e.teamCat || "—")}</dd><dt>${t("Sistemi di gioco")}</dt><dd>${t("casa")} ${esc(e.sysHome || "—")} · ${t("trasferta")} ${esc(e.sysAway || "—")}</dd><dt>${t("N° maglia / minuti")}</dt><dd>${esc(e.shirt || "—")} / ${esc(e.minutes || "—")}'</dd><dt>${t("Fonte")}</dt><dd>${esc(e.source ? t(e.source) : "—")}</dd></dl>${contextView(e.context)}${conclusionView(e.concl)}<div style="margin-top:8px">${eqPill(evidenceQuality(e))}</div><div class="pitchbox">${pitchSVG(e.positions || [])}<div class="m" style="margin-top:4px">${t("Posizioni nella partita")}</div></div></div>${(e.tags || []).length ? `<div style="margin-top:8px">${tagsHtml(e.tags)}</div>` : ""}`;
}
function evalItem(id, e, withName) {
  const p = P(e.playerId); const r = evalRating(e);
  return `<div class="item click" data-a="${withName ? "openEvalPlayer" : "evalSelOpen"}" data-id="${id}"><div class="score ${sc(r)}">${f1(r)}</div><div class="grow"><div class="t">${withName ? esc(pname(p)) : esc(e.home && e.away ? e.home + " – " + e.away : t("Valutazione"))}${e.signature ? ` <span class="pill c-good" title="${t("Firmata")}">✍ ${t("Firmata")}</span>` : ""}${exB(e)}${archB(e)}</div><div class="m">${fmtDate(e.date)} · ${esc(L(Cfg.get().matchTypes.find(x => x.id === e.matchType)) || e.matchType || "")}${e.by ? " · " + t("valutato da {b}", { b: esc(e.by) }) : ""}${withName && e.home ? " · " + esc(e.home) + " – " + esc(e.away) : ""}</div>${(e.tags || []).length ? `<div style="margin-top:3px">${tagsHtml(e.tags)}</div>` : ""}</div></div>`;
}
function subList(id, p, key, title, label, rowFn, emptyTxt) {
  const arr = (p[key] || []).slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  return `<section class="panel"><div class="row between"><h2>${title}</h2><button class="btn sm pri noprint" data-a="addSub" data-k="${key}">+ ${label}</button></div>
  <div class="list" style="margin-top:6px">${arr.map(r => `<div class="item">${rowFn(r)}<div class="row noprint"><button class="btn sm ghost" data-a="editSub" data-k="${key}" data-sid="${r.id}">${t("Modifica")}</button></div></div>`).join("") || `<div class="empty">${emptyTxt}</div>`}</div></section>`;
}
function liveSummary(pid) {
  const evs = []; for (const [, m] of S.matches) for (const e of (m.events || [])) if (e.p === pid) evs.push(e);
  if (!evs.length) return ""; const pos = evs.filter(e => e.o === "+").length;
  return `<section class="panel"><h2>${t("Azioni registrate dal vivo")}</h2><p class="sub">${t("{n} azioni, {p}% positive.", { n: evs.length, p: Math.round(pos / evs.length * 100) })}</p>${liveTable(evs)}</section>`;
}
function liveCatL(id) { return L(Cfg.get().liveCats.find(x => x.id === id)) || t(id); }
function liveTable(evs) {
  const by = {}; for (const e of evs) { by[e.c] = by[e.c] || { "+": 0, "=": 0, "-": 0 }; by[e.c][e.o]++; }
  return `<div class="tw"><table><thead><tr><th>${t("Azione")}</th><th class="n">+</th><th class="n">=</th><th class="n">−</th><th class="n">${t("% positive")}</th></tr></thead><tbody>${Object.entries(by).map(([c, v]) => { const tt = v["+"] + v["="] + v["-"]; return `<tr><td>${esc(liveCatL(c))}</td><td class="n">${v["+"]}</td><td class="n">${v["="]}</td><td class="n">${v["-"]}</td><td class="n">${Math.round(v["+"] / tt * 100)}%</td></tr>`; }).join("")}</tbody></table></div>`;
}
function similarPlayers(id) {
  const me = profile(id); if (!me.n) return [];
  const vec = pr => { const v = {}; for (const a in pr.attr) for (const k in pr.attr[a]) if (pr.attr[a][k] != null) v[a + "|" + k] = pr.attr[a][k]; return v; };
  const mv = vec(me); const out = [];
  for (const [oid, op] of S.players) { if (oid === id || op.archived) continue; const pr = profile(oid); if (!pr.n) continue; const ov = vec(pr); const keys = Object.keys(mv).filter(k => k in ov); if (keys.length < 8) continue;
    const s = Cfg.get().scale; const c = (s.min + s.max) / 2; let dot = 0, na = 0, nb = 0; for (const k of keys) { const a = mv[k] - c, b = ov[k] - c; dot += a * b; na += a * a; nb += b * b; }
    const cos = dot / (Math.sqrt(na * nb) || 1); const sim = (cos + 1) / 2 * (1 - Math.abs((me.rating || 0) - (pr.rating || 0)) / (s.max - s.min)); out.push([oid, op, sim]); }
  return out.sort((a, b) => b[2] - a[2]).slice(0, 5);
}

/* ---------- editor giocatore ---------- */
function newPlayerDraft() { return { first: "", last: "", sex: "Uomo", roles: [], listIds: ui.listId ? [ui.listId] : [], tags: [], contract: {}, physique: {}, pros: [], cons: [], injuries: [], relations: [] }; }
function playerEditor() {
  const d = ui.pdraft, c = d.contract || {}, f = d.physique || {}, cfg = Cfg.get();
  return `<div class="row"><button class="btn ghost sm" data-a="cancelPlayer">← ${t("Annulla")}</button></div>
  <div class="head"><h1>${d._id ? t("Modifica giocatore") : t("Nuovo giocatore")}</h1><div class="row">${d._id ? `<button class="btn danger" data-a="delPlayer">${t("Elimina")}</button>` : ""}<button class="btn" data-a="cancelPlayer">${t("Annulla")}</button><button class="btn pri" data-a="savePlayer">${t("Salva")}</button></div></div>
  <section class="panel"><h2>${t("Anagrafica")}</h2><div class="row" style="margin:12px 0;gap:14px">${d.photo ? `<img class="avatar" style="width:84px;height:84px" src="${d.photo}" alt="">` : '<div class="avatar" style="width:84px;height:84px"></div>'}<button class="btn sm" data-a="pickPhoto">${d.photo ? t("Cambia foto profilo") : t("Aggiungi foto profilo")}</button>${d.photo ? `<button class="btn sm ghost" data-a="rmPhoto">${t("Rimuovi")}</button>` : ""}</div>
   <div class="fgrid">
    <label class="f">${t("Nome")}<input type="text" id="pFirst" value="${esc(d.first)}"></label>
    <label class="f">${t("Cognome")}<input type="text" id="pLast" value="${esc(d.last)}"></label>
    <label class="f">${t("Alias / nome noto")}<input type="text" id="pAlias" value="${esc(d.alias)}"></label>
    <label class="f">${t("Data di nascita")}<input type="date" id="pBirth" value="${esc(d.birth || "")}"></label>
    <label class="f">${t("Anno (se non sai la data)")}<input type="number" id="pBirthYear" min="1970" max="2030" value="${esc(d.birthYear || "")}"></label>
    <label class="f">${t("Sesso")}${sel("pSex", [opt("Uomo", "Uomo", "Male"), opt("Donna", "Donna", "Female")], d.sex)}</label>
    <label class="f">${t("Piede preferito")}${sel("pFoot", [opt("Destro", "Destro", "Right"), opt("Sinistro", "Sinistro", "Left"), opt("Ambidestro", "Ambidestro", "Both")], d.foot, "—")}</label>
    <label class="f">${t("N° maglia")}<input type="number" id="pShirt" min="0" max="99" value="${esc(d.shirt)}"></label>
    <label class="f">${t("Nazionalità")}<input type="text" id="pNat" value="${esc(d.nat)}"></label>
    <label class="f">${t("Seconda nazionalità")}<input type="text" id="pNat2" value="${esc(d.nat2)}"></label>
    <label class="f">${t("Status")}${sel("pEu", o3(EUSTATUS), d.eu, "—")}</label>
    <label class="f">${t("Club attuale")}<input type="text" id="pClub" value="${esc(d.club)}"></label>
    <label class="f">${t("Campionato")}<input type="text" id="pLeague" value="${esc(d.league)}"></label>
    <label class="f">${t("Club 1ª osservazione")}<input type="text" id="pClubFirst" value="${esc(d.clubFirst)}"></label>
    <label class="f">${t("Città di nascita")}<input type="text" id="pBirthCity" value="${esc(d.birthCity)}"></label>
    <label class="f">${t("Paese di nascita")}<input type="text" id="pBirthCountry" value="${esc(d.birthCountry)}"></label>
   </div></section>
  <section class="panel"><h2>${t("Ruoli e posizione")}</h2><p class="sub small">${t("Il primo ruolo scelto è quello principale e decide quali parametri vedi nelle valutazioni. Tocca il campo per segnare la posizione abituale.")}</p>
   <div class="chips" id="pRoles" style="margin:10px 0">${cfg.roles.map(r => `<button type="button" class="chip" data-role="${esc(r.id)}" aria-pressed="${(d.roles || []).includes(r.id)}">${(d.roles || []).indexOf(r.id) === 0 ? "★ " : ""}${esc(L(r))}</button>`).join("")}</div>
   <div class="pitchbox">${pitchSVG(d.pos ? [d.pos] : [], { edit: true, id: "pPitch" })}</div></section>
  <section class="panel"><h2>${t("Struttura fisica")}</h2><div class="fgrid" style="margin-top:10px">
    <label class="f">${t("Altezza (cm)")}<input type="number" id="pH" value="${esc(d.height)}"></label>
    <label class="f">${t("Peso (kg)")}<input type="number" id="pW" value="${esc(d.weight)}"></label>
    <label class="f">${t("Somatotipo")}${sel("pSoma", cfg.somatotypes, d.soma, "—")}</label>
    <label class="f">${t("Maturazione biologica")}${sel("pMat", cfg.maturity, d.maturity, "—")}</label>
    <label class="f">${t("Morfologia")}${sel("pMorpho", o3(MORPHO), d.morpho, "—")}</label>
    <label class="f">${t("Struttura")}<input type="text" id="pBuild" value="${esc(f.build)}"></label>
    <label class="f">${t("Muscolatura")}<input type="text" id="pMuscle" value="${esc(f.muscle)}"></label>
    <label class="f full">${t("Note sulla struttura fisica")}<textarea id="pPhysNotes">${esc(f.notes)}</textarea></label></div></section>
  <section class="panel"><h2>${t("Giudizio, tag e liste")}</h2><div class="fgrid" style="margin-top:10px">
    <label class="f">${t("Livello")}${sel("pLevel", cfg.levels.map(l => ({ ...l, it: l.id + " · " + l.it, en: l.id + " · " + l.en })), d.level, "—")}</label>
    <label class="f">${t("Giudizio")}${sel("pVerdict", cfg.verdicts, d.verdict, "—")}</label>
    <label class="f">${t("Prossima verifica")}<input type="date" id="pNext" value="${esc(d.nextCheck || "")}"></label>
    <label class="f">${t("Livello potenziale")}${sel("pPot", cfg.levels.map(l => ({ ...l, it: l.id + " · " + l.it, en: l.id + " · " + l.en })), d.potential, "—")}</label>
    <label class="f">${t("Stato di forma")}${sel("pForm", FORM.map(([id, it, en, s]) => ({ id, it: s + " " + it, en: s + " " + en })), d.form, "—")}</label>
    <label class="f">${t("Interpretazione del ruolo")}${sel("pArch", archetypesFor((d.roles || [])[0]), d.archetype, "—")}</label>
    <label class="f full">${t("Nota rapida (chi è, in poche righe)")}<textarea id="pQuick" style="min-height:60px">${esc(d.quick)}</textarea></label>${window.Orgs ? Orgs.sel("pOrg", d.org ?? Orgs.cur()) : ""}</div>
    <div class="m" style="margin-top:12px;font-weight:600">${t("Tag")}</div><div class="chips" id="pTags" style="margin-top:6px">${cfg.tags.map(tg => `<button type="button" class="chip" data-tag="${tg.id}" aria-pressed="${(d.tags || []).includes(tg.id)}" style="${(d.tags || []).includes(tg.id) ? `background:${esc(tg.color)};border-color:${esc(tg.color)};color:#fff` : ""}">${esc(tg.name)}</button>`).join("")}<button type="button" class="chip" data-a="newTagInline">+ ${t("Nuovo tag")}</button></div>
    <div class="m" style="margin-top:12px;font-weight:600">${t("Liste")}</div><div class="chips" id="pLists" style="margin-top:6px">${[...S.lists.entries()].filter(([, l]) => !l.smart && !l.archived).map(([lid, l]) => `<button type="button" class="chip" data-list="${lid}" aria-pressed="${(d.listIds || []).includes(lid)}">${esc(listPath(lid).map(x => x[1].name).join(" › "))}</button>`).join("") || `<span class="muted small">${t("Crea le liste dalla sezione Liste.")}</span>`}</div></section>
  <section class="panel"><h2>${t("Pro & contro")}</h2><div class="fgrid" style="margin-top:10px">
    <label class="f">${t("Pro (uno per riga)")}<textarea id="pPros">${esc((d.pros || []).join("\n"))}</textarea></label>
    <label class="f">${t("Contro (uno per riga)")}<textarea id="pCons">${esc((d.cons || []).join("\n"))}</textarea></label>
    <label class="f full">${t("Note generali")}<textarea id="pNotes">${esc(d.notes)}</textarea></label></div></section>
  <section class="panel"><h2>${t("Info contrattuali")}</h2><div class="fgrid" style="margin-top:10px">
    <label class="f">${t("Data di scadenza")}<input type="date" id="cUntil" value="${esc(c.until || "")}"></label>
    <label class="f">${t("Prestito")}<select id="cLoan"><option value="">${t("No")}</option><option value="1" ${c.loan ? "selected" : ""}>${t("Sì")}</option></select></label>
    <label class="f">${t("Club proprietario (se in prestito)")}<input type="text" id="cOwner" value="${esc(c.owner)}"></label>
    <label class="f">${t("Agente / agenzia")}<input type="text" id="cAgent" value="${esc(c.agent)}"></label>
    <label class="f">${t("Contatto agente")}<input type="text" id="cAgentContact" value="${esc(c.agentContact)}"></label>
    <label class="f">${t("Valore di mercato")}<input type="text" id="cValue" value="${esc(c.value)}"></label>
    <label class="f">${t("Stipendio / note")}<input type="text" id="cSalary" value="${esc(c.salary)}"></label></div></section>
  <div class="row end editfoot"><button class="btn" data-a="cancelPlayer">${t("Annulla")}</button><button class="btn pri" data-a="savePlayer">${t("Salva")}</button></div>`;
}
function syncPlayer() {
  const d = ui.pdraft; if (!d || !$("#pFirst")) return; const v = s => $(s) ? $(s).value.trim() : "";
  if ($("#pOrg")) d.org = $("#pOrg").value;
  Object.assign(d, { eu: v("#pEu"), alias: v("#pAlias"), birthCity: v("#pBirthCity"), birthCountry: v("#pBirthCountry"), morpho: v("#pMorpho"), potential: v("#pPot"), form: v("#pForm"), archetype: v("#pArch"), quick: $("#pQuick").value }, { first: v("#pFirst"), last: v("#pLast"), sex: v("#pSex"), birth: v("#pBirth"), birthYear: v("#pBirthYear"), nat: v("#pNat"), nat2: v("#pNat2"), shirt: v("#pShirt"), club: v("#pClub"), league: v("#pLeague"), clubFirst: v("#pClubFirst"), foot: v("#pFoot"), height: v("#pH"), weight: v("#pW"), soma: v("#pSoma"), maturity: v("#pMat"), level: v("#pLevel"), verdict: v("#pVerdict"), nextCheck: v("#pNext"), notes: $("#pNotes").value,
    pros: $("#pPros").value.split("\n").map(x => x.trim()).filter(Boolean), cons: $("#pCons").value.split("\n").map(x => x.trim()).filter(Boolean) });
  d.physique = { build: v("#pBuild"), muscle: v("#pMuscle"), notes: $("#pPhysNotes").value };
  d.contract = { until: v("#cUntil"), loan: !!v("#cLoan"), owner: v("#cOwner"), agent: v("#cAgent"), agentContact: v("#cAgentContact"), value: v("#cValue"), salary: v("#cSalary") };
  d.tags = $$("#pTags .chip[data-tag][aria-pressed=true]").map(b => b.dataset.tag);
  d.listIds = $$("#pLists .chip[aria-pressed=true]").map(b => b.dataset.list);
}

/* ---------- editor valutazione ---------- */
function newEvalDraft(pid, matchId) {
  const p = P(pid), m = S.matches.get(matchId); const prof = Profile.get();
  return { playerId: pid, matchId: matchId || "", by: prof.initials || (prof.name ? prof.name.split(/\s+/).map(x => x[0]).join("").toUpperCase() : ""), date: m ? m.date : today(), matchType: m ? m.type || "Campionato" : "Campionato", cat: "Club", teamCat: m && m.teamCat || "Prima squadra", home: m ? m.home : "", away: m ? m.away : "", score: m ? m.score || "" : "", sysHome: m ? m.sysHome || "" : "", sysAway: m ? m.sysAway || "" : "", shirt: p ? p.shirt || "" : "", minutes: "", source: "Dal vivo", positions: p && p.pos ? [{ ...p.pos }] : [], r: {}, notes: {}, evidence: [], summary: "", tags: [] };
}
function evalEditor() {
  const d = ui.edraft, p = P(d.playerId), cfg = Cfg.get(), s = cfg.scale;
  const ms = [...S.matches.entries()].filter(([, m]) => !m.archived).sort((a, b) => (b[1].date || "").localeCompare(a[1].date || ""));
  const evN = aid => (d.evidence || []).filter(e => e.area === aid && e.text.trim()).length;
  const hasLive = d.matchId && (S.matches.get(d.matchId)?.events || []).some(e => e.p === d.playerId);
  const sysOpts = cfg.systems.map(x => ({ id: x, it: x, en: x }));
  return `<div class="row"><button class="btn ghost sm" data-a="cancelEval">← ${t("Annulla")}</button></div>
  <div class="head"><div><h1>${d._id ? t("Modifica valutazione") : t("Nuova valutazione")}</h1><p class="sub">${esc(pname(p))} · ${t("scala {a}-{b}", { a: s.min, b: s.max })}. ${t("Valuta solo ciò che hai visto: i parametri lasciati su «–» non entrano nella media.")}</p></div>
   <div class="row">${d._id ? `<button class="btn" data-a="copyEval">${t("Copia testo")}</button><button class="btn danger" data-a="delEval">${t("Elimina")}</button>` : ""}<button class="btn" data-a="cancelEval">${t("Annulla")}</button><button class="btn pri" data-a="saveEval">${t("Salva")}</button></div></div>
  ${d.signature ? `<div class="banner">${t("Questa valutazione è firmata: se ne modifichi il contenuto, la firma verrà rimossa e potrai firmarla di nuovo.")}</div>` : ""}
  ${liveSuggestBanner(d)}
  <section class="panel"><h2>${t("Dati della partita")}</h2><div class="fgrid" style="margin-top:10px">
   <label class="f">${t("Partita nell'archivio")}<select id="eMatch"><option value="">${t("Nessuna (inserisci a mano)")}</option>${ms.map(([id, m]) => `<option value="${id}" ${d.matchId === id ? "selected" : ""}>${fmtDate(m.date)} ${esc(m.home)}–${esc(m.away)}</option>`).join("")}</select></label>
   <label class="f">${t("Data partita")}<input type="date" id="eDate" value="${esc(d.date)}"></label>
   <label class="f">${t("Fonte")}${sel("eSrc", [opt("Dal vivo", "Dal vivo", "Live"), opt("Video completo", "Video completo", "Full video"), opt("Highlights", "Highlights", "Highlights"), opt("Dati", "Dati", "Data")], d.source)}</label>
   <label class="f">${t("Squadra di casa")}<input type="text" id="eHome" value="${esc(d.home)}"></label>
   <label class="f">${t("Squadra in trasferta")}<input type="text" id="eAway" value="${esc(d.away)}"></label>
   <label class="f">${t("Risultato")}<input type="text" id="eScore" value="${esc(d.score)}" placeholder="2-1"></label>
   <label class="f">${t("Tipologia partita")}${sel("eType", cfg.matchTypes, d.matchType)}</label>
   <label class="f">${t("Categoria")}${sel("eCat", [opt("Club", "Club", "Club"), opt("Nazionale", "Nazionale", "National team")], d.cat)}</label>
   <label class="f">${t("Categoria squadra")}${sel("eTeamCat", cfg.teamCats, d.teamCat)}</label>
   <label class="f">${t("Sistema di gioco casa")}${sel("eSysH", sysOpts, d.sysHome, "—")}</label>
   <label class="f">${t("Sistema di gioco trasferta")}${sel("eSysA", sysOpts, d.sysAway, "—")}</label>
   <label class="f">${t("N° maglia")}<input type="number" id="eShirt" value="${esc(d.shirt)}"></label>
   <label class="f">${t("Minuti giocati")}<input type="number" id="eMin" value="${esc(d.minutes)}"></label>
   <label class="f">${t("Valutato da")}<input type="text" id="eBy" value="${esc(d.by)}"></label>${window.Orgs ? Orgs.sel("eOrg", d.org ?? Orgs.cur()) : ""}</div>
   <div class="m" style="margin-top:12px;font-weight:600">${t("Tag")}</div><div class="chips" id="eTags" style="margin-top:6px">${cfg.tags.map(tg => `<button type="button" class="chip" data-tag="${tg.id}" aria-pressed="${(d.tags || []).includes(tg.id)}">${esc(tg.name)}</button>`).join("")}</div>
   <div style="margin-top:12px"><div class="row between"><b class="small">${t("Posizioni nella partita")}</b><button class="btn sm ghost" data-a="clearPos">${t("Cancella punti")}</button></div><p class="m">${t("Tocca il campo per aggiungere le zone occupate; tocca un punto per toglierlo.")}</p><div class="pitchbox" style="margin-top:6px">${pitchSVG(d.positions, { edit: true, id: "ePitch" })}</div></div></section>
  ${visAreas(p).map(a => { const av = evalArea(d, a.id); const n = evN(a.id); const nr = Object.keys(d.r[a.id] || {}).length; const ps = visParams(p, a); return `<details class="area" ${ui.openAreas?.[a.id] !== false ? "open" : ""} data-ak="${a.id}"><summary><h2>${esc(L(a))}</h2><span class="row"><span class="m" id="cnt-${a.id}">${t("{n}/{tot} valutati", { n: nr, tot: ps.length })}</span><span class="score ${sc(av)}" id="avg-${a.id}">${f1(av)}</span></span></summary>
    ${ps.map(x => { const v = (d.r[a.id] || {})[x.id]; return `<div class="slrow ${v == null ? "unset" : ""}"><span>${esc(L(x))}${liveHint(d, a.id, x.id)}</span><input type="range" min="${s.min}" max="${s.max}" step="${s.step}" value="${v ?? (s.min + s.max) / 2}" data-ak="${a.id}" data-at="${esc(x.id)}" aria-label="${esc(L(x))}"><button class="vchip" data-a="clrParam" data-ak="${a.id}" data-at="${esc(x.id)}" title="${t("Tocca per togliere il voto")}">${v == null ? "–" : f1(v)}</button></div>`; }).join("")}
    <label class="f" style="margin:10px 0">${t("Note su {a}", { a: L(a).toLowerCase() })}<textarea id="note-${a.id}" style="min-height:60px">${esc((d.notes || {})[a.id] || "")}</textarea></label>
    <div style="margin-bottom:12px">${nr ? (n >= cfg.minEvidence ? `<span class="okc">✓ ${t("{n} evidenze a supporto", { n })}</span>` : `<span class="warn">${t("Servono almeno {m} evidenze per questo giudizio (ora {n}).", { m: cfg.minEvidence, n })}</span>`) : ""}</div></details>`; }).join("")}
  <section class="panel"><div class="row between"><h2>${t("Evidenze")}</h2><div class="row">${hasLive ? `<button class="btn sm" data-a="importEv">${t("Importa dal registro live")}</button>` : ""}<button class="btn sm" data-a="addEv">+ ${t("Evidenza")}</button></div></div>
   <p class="sub small">${t("Un fatto osservabile per riga: area, minuto e cosa è successo.")}</p>
   <div style="display:flex;flex-direction:column;gap:8px;margin-top:10px">${(d.evidence || []).map((e, i) => `<div class="ev"><select data-ev="${i}" data-k="area">${visAreas(p).map(a => `<option value="${a.id}" ${e.area === a.id ? "selected" : ""}>${esc(L(a))}</option>`).join("")}</select><input type="text" class="mono" data-ev="${i}" data-k="min" value="${esc(e.min)}" placeholder="min"><input type="text" data-ev="${i}" data-k="text" value="${esc(e.text)}" placeholder="${t("Es. riceve spalle alla porta sotto pressione, si gira e verticalizza")}"><button class="btn sm ghost" data-a="rmEv" data-i="${i}" aria-label="${t("Rimuovi")}">✕</button></div>`).join("") || `<div class="empty">${t("Nessuna evidenza.")}</div>`}</div></section>
  <section class="panel"><h2>${t("Contesto della partita")}</h2><p class="sub small">${t("Quanto era difficile la gara? Lo stesso gesto vale di più in un contesto difficile.")}</p>${contextEdit("e", d.context)}</section>
  <section class="panel"><h2>${t("Conclusione")}</h2>${conclusionEdit(d.concl)}<div style="margin-top:10px">${eqPill(evidenceQuality(d)) || `<span class="m">${t("La qualità delle evidenze compare quando valuti i parametri.")}</span>`}</div></section>${window.projEdit ? projEdit(d.proj) : ""}
  <section class="panel"><label class="f">${t("Sintesi finale (2-3 frasi chiare per tutto lo staff)")}<textarea id="eSum">${esc(d.summary)}</textarea></label>
   <div class="row between" style="margin-top:12px"><span>${t("Rating di questa valutazione")}: <b class="mono" id="evRating">${f1(evalRating(d))}</b></span></div></section>
  ${d._id ? `<section class="panel"><h2>${t("Multimedia")}</h2>${mediaGrid("eval", d._id)}</section>` : `<div class="banner info">${t("Potrai aggiungere foto e video dopo il primo salvataggio.")}</div>`}
  <div class="row end editfoot"><button class="btn" data-a="cancelEval">${t("Annulla")}</button><button class="btn pri" data-a="saveEval">${t("Salva valutazione")}</button></div>`;
}
function syncEval() {
  const d = ui.edraft; if (!d || !$("#eBy")) return; const v = s => $(s) ? $(s).value.trim() : "";
  Object.assign(d, { matchId: v("#eMatch"), by: v("#eBy"), date: v("#eDate"), source: v("#eSrc"), matchType: v("#eType"), cat: v("#eCat"), teamCat: v("#eTeamCat"), home: v("#eHome"), away: v("#eAway"), score: v("#eScore"), sysHome: v("#eSysH"), sysAway: v("#eSysA"), shirt: v("#eShirt"), minutes: v("#eMin"), summary: $("#eSum").value });
  if ($("#pjNow")) d.proj = readProj(); if ($("#eOrg")) d.org = $("#eOrg").value;
  d.notes = d.notes || {}; for (const a of Cfg.get().areas) { const tx = $("#note-" + a.id); if (tx) d.notes[a.id] = tx.value; }
  $$("[data-ev]").forEach(el => { const e = d.evidence[+el.dataset.ev]; if (e) e[el.dataset.k] = el.value; });
  d.tags = $$("#eTags .chip[aria-pressed=true]").map(b => b.dataset.tag);
  if ($("[data-ctx='e']")) d.context = readContext("e"); if ($("[data-concl]")) d.concl = readConclusion();
  ui.openAreas = {}; $$("details.area").forEach(x => ui.openAreas[x.dataset.ak] = x.open);
}
function updAvg(aid) {
  const d = ui.edraft, p = P(d.playerId); const av = evalArea(d, aid); const el = $("#avg-" + aid); if (el) { el.textContent = f1(av); el.className = "score " + sc(av); }
  const r = $("#evRating"); if (r) r.textContent = f1(evalRating(d));
  const a = Cfg.area(aid); const c = $("#cnt-" + aid); if (c) c.textContent = t("{n}/{tot} valutati", { n: Object.keys(d.r[aid] || {}).length, tot: visParams(p, a).length });
}
function evalText(e) {
  const p = P(e.playerId) || {}; const s = Cfg.get().scale; const prof = Profile.get(); const out = [];
  out.push(`${t("SCOUTING REPORT")} – ${pname(p)}`);
  out.push([(p.roles || []).map(roleL).join(", "), p.club, age(p) != null ? t("{n} anni", { n: age(p) }) : "", p.foot ? t("piede {f}", { f: t(p.foot).toLowerCase() }) : "", p.height ? p.height + " cm" : ""].filter(Boolean).join(" · "));
  out.push(`${t("Partita")}: ${e.home || ""} – ${e.away || ""}${e.score ? " " + e.score : ""} (${fmtDate(e.date)}) · ${t("Valutato da")}: ${e.by || prof.name || "–"} · ${t("Minuti")}: ${e.minutes || "–"}`);
  out.push(`\n${t("RATING")}: ${f1(evalRating(e))}/${s.max}`);
  for (const a of visAreas(p)) { const av = evalArea(e, a.id); if (av == null) continue; out.push(`\n${L(a).toUpperCase()} – ${t("media")} ${f1(av)}/${s.max}`); for (const [k, x] of Object.entries((e.r || {})[a.id] || {})) out.push(`  ${paramL(a, k)}: ${f1(x)}`);
    if (e.notes && e.notes[a.id]) out.push(`  ${t("Note")}: ${e.notes[a.id]}`); const ev = (e.evidence || []).filter(x => x.area === a.id && x.text); if (ev.length) { out.push("  " + t("Evidenze") + ":"); ev.forEach(x => out.push(`   - ${x.min ? x.min + "' " : ""}${x.text}`)); } }
  if (e.summary) out.push(`\n${t("Sintesi")}: ${e.summary}`);
  if (p.verdict) out.push(`${t("Giudizio")}: ${L(Cfg.verdict(p.verdict))}${p.level ? " · " + t("Livello") + " " + levelL(p.level) : ""}`);
  if (prof.name) out.push(`\n— ${prof.name}${prof.title ? ", " + prof.title : ""}`);
  return out.join("\n");
}

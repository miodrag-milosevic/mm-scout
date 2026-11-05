"use strict";
/* =========================================================
   MM Scout — profili scout: accesso con email e
   password, creazione profilo, più profili sullo stesso
   dispositivo (ognuno con il suo archivio cifrato separato).
   ========================================================= */
const Accounts = {
  acc: null,
  list() { return Prefs.get("accounts", []); },
  save(l) { Prefs.set("accounts", l); },
  byEmail(e) { e = String(e || "").trim().toLowerCase(); return e ? this.list().find(a => a.email === e) : null; },
  add(a) { const l = this.list(); l.push(a); this.save(l); },
  update(id, patch) { const l = this.list().map(a => a.id === id ? { ...a, ...patch } : a); this.save(l); if (this.acc && this.acc.id === id) this.acc = { ...this.acc, ...patch }; },
  remove(id) { this.save(this.list().filter(a => a.id !== id)); },
  validEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e).trim()); },
  async init() {
    let l = this.list();
    if (!l.length) { // archivio della versione 3 già presente su questo dispositivo
      let has = false; try { if (indexedDB.databases) has = (await indexedDB.databases()).some(d => d.name === "taccuino-scout-v3"); } catch (e) { }
      if (has) { await Store.open("taccuino-scout-v3"); const m = await Store.meta(); if (m) { l = [{ id: "legacy", email: "", name: "", db: "taccuino-scout-v3", created: m.created }]; this.save(l); } }
    }
  },
  failKey(k) { return k + "_" + (Store.dbName || "x"); }
};

/* ---------- autore (chi ha creato e modificato) ---------- */
const Author = {
  me() { const p = Profile.get(); return { id: (Accounts.acc || {}).id || "", name: p.name || (Accounts.acc || {}).email || "", initials: p.initials || (p.name ? p.name.split(/\s+/).map(x => x[0]).join("").toUpperCase() : "") }; },
  stamp(v) { if (!App.unlocked) return; const me = this.me(); const now = new Date().toISOString(); if (!v.createdBy) { v.createdBy = me; v.createdOn = v.createdOn || now; } v.updatedBy = me; v.updatedOn = now; },
  line(o) {
    if (!o || !o.createdBy) return "";
    const p = Profile.get(); const mine = o.createdBy.id && o.createdBy.id === (Accounts.acc || {}).id;
    const av = mine && p.photo ? `<img src="${p.photo}" alt="" class="miniav">` : `<span class="miniav">${esc(o.createdBy.initials || "?")}</span>`;
    const upd = o.updatedOn && o.updatedOn.slice(0, 10) !== (o.createdOn || "").slice(0, 10) ? " · " + t("modificato il {d}", { d: fmtDate(o.updatedOn.slice(0, 10)) }) + (o.updatedBy && o.updatedBy.name !== o.createdBy.name ? " " + t("da {n}", { n: esc(o.updatedBy.name) }) : "") : "";
    return `<div class="authline">${av}<span>${t("Creato da {n} il {d}", { n: `<b>${esc(o.createdBy.name || "—")}</b>`, d: fmtDate((o.createdOn || "").slice(0, 10)) })}${upd}</span></div>`;
  }
};
// visibile anche come window.Author: put() lo usa per segnare chi ha creato e modificato giocatori, partite e report
window.Author = Author;

/* ---------- schermate di accesso ---------- */
Object.assign(Lock, {
  waitLeft() { const until = Prefs.get(Accounts.failKey("lockUntil"), 0); return until > Date.now() ? Math.ceil((until - Date.now()) / 1000) : 0; },
  async fail() {
    const k = Accounts.failKey("fails"); const n = Prefs.get(k, 0) + 1; Prefs.set(k, n);
    const m = await Store.meta();
    if (m && m.wipeAfter && n >= m.wipeAfter) { await Lock.wipeAll(); return; }
    if (n >= 5) Prefs.set(Accounts.failKey("lockUntil"), Date.now() + Math.min(3600, 30 * 2 ** (n - 5)) * 1000);
    const el = $("#lockErr"); if (el) el.textContent = n >= 5 ? t("Troppi tentativi. Riprova tra {s} secondi.", { s: this.waitLeft() }) : t("Email o password errate.") + (m && m.wipeAfter ? " " + t("Tentativi rimasti prima della cancellazione: {n}", { n: m.wipeAfter - n }) : "");
  },
  async wipeAll() {
    const name = Store.dbName; const acc = Accounts.list().find(a => a.db === name);
    try { Store.db.close(); } catch (e) { } Store.db = null;
    await new Promise(r => { const q = indexedDB.deleteDatabase(name); q.onsuccess = q.onerror = q.onblocked = r; });
    if (acc) Accounts.remove(acc.id); Prefs.set(Accounts.failKey("fails"), 0); Prefs.set(Accounts.failKey("lockUntil"), 0);
    Accounts.acc = null; Store.dbName = null; toast(t("Profilo e dati cancellati da questo dispositivo.")); this.show();
  },
  async show(msg) {
    const l = Accounts.list();
    if (!l.length) return this.signup(true);
    const last = Prefs.get("lastEmail", "");
    this.render(`${this.brand()}${this.langTheme()}
      ${msg ? `<div class="banner info">${esc(msg)}</div>` : ""}
      <h2>${t("Accedi")}</h2>
      ${l.length > 1 || (l[0] && l[0].email) ? `<div class="col" style="gap:6px">${l.map(a => `<button type="button" class="acct" data-a="pickAcct" data-email="${esc(a.email)}" data-id="${a.id}"><span class="miniav">${esc(((a.name || a.email || "?").split(/\s+/).map(x => x[0]).join("")).slice(0, 2).toUpperCase())}</span><span class="grow"><b>${esc(a.name || t("Profilo senza nome"))}</b><small>${esc(a.email || t("email da impostare"))}</small></span></button>`).join("")}</div>` : ""}
      <form id="loginForm" class="col">
        <label class="f">${t("Email")}<input type="email" id="lgEmail" autocomplete="username" value="${esc(last)}" ${l.length === 1 && !l[0].email ? `placeholder="${t("la tua email (la imposti ora)")}"` : ""}></label>
        <label class="f">${t("Password")}<input type="password" id="pw" autocomplete="current-password" required></label>
        <div id="lockErr" class="warn">${""}</div>
        <button class="btn pri" id="unlockBtn">${t("Accedi")}</button></form>
      <div class="row between"><button class="btn ghost sm" data-a="lockRecovery">${t("Password dimenticata?")}</button><button class="btn ghost sm" data-a="signup">${t("Crea un nuovo profilo scout")}</button></div>
      <button class="btn sm" data-a="syncJoin">${t("Collega un dispositivo (dati dal cloud)")}</button>
      <p class="m">${t("Il profilo resta su questo dispositivo: l'email serve a riconoscerti e a firmare i tuoi report, non viene inviata da nessuna parte.")}</p>`);
    if (last) $("#pw").focus();
    $("#loginForm").onsubmit = e => { e.preventDefault(); this.login($("#lgEmail").value, $("#pw").value); };
  },
  async findAcc(email) {
    const l = Accounts.list(); let acc = Accounts.byEmail(email);
    if (!acc) { const noMail = l.filter(a => !a.email); if (noMail.length === 1 && (l.length === 1 || email)) acc = noMail[0]; }
    return acc;
  },
  async login(email, pw) {
    const acc = await this.findAcc(email); const err = $("#lockErr");
    if (!acc) { err.textContent = t("Nessun profilo con questa email su questo dispositivo."); return; }
    await Store.open(acc.db);
    if (this.waitLeft()) { err.textContent = t("Troppi tentativi. Riprova tra {s} secondi.", { s: this.waitLeft() }); return; }
    if (!acc.email && email && !Accounts.validEmail(email)) { err.textContent = t("Scrivi un indirizzo email valido."); return; }
    const btn = $("#unlockBtn"); btn.disabled = true; btn.textContent = t("Verifica…");
    let raw; try { raw = await Store.unwrap(pw); } catch (e) { btn.disabled = false; btn.textContent = t("Accedi"); await this.fail(); return; }
    await Store.useRaw(raw); raw.fill(0);
    if (!acc.email && email) { Accounts.update(acc.id, { email: email.trim().toLowerCase() }); acc.email = email.trim().toLowerCase(); }
    Accounts.acc = acc; Prefs.set("lastEmail", acc.email || "");
    const m = await Store.meta(); if (m.totp) return this.askTotp();
    this.enter();
  },
  async enter() {
    Prefs.set(Accounts.failKey("fails"), 0); Prefs.set(Accounts.failKey("lockUntil"), 0);
    await Store.loadAll(); Migrate.config();
    const acc = Accounts.acc; const prof = Profile.get();
    if (acc) { const patch = {}; if (!prof.email && acc.email) patch.email = acc.email; if (!prof.name && acc.name) patch.name = acc.name; if (Object.keys(patch).length) put("settings", "profile", { ...prof, ...patch }); if (prof.name && prof.name !== acc.name) Accounts.update(acc.id, { name: prof.name }); }
    App.unlocked = true; App.touch(); this.hide();
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { }
    if (window.Backup) Backup.afterUnlock();
    render();
  },
  recovery() {
    this.render(`${this.brand()}<h2>${t("Codice di recupero")}</h2><p class="sub">${t("Inserisci la tua email e il codice di recupero salvato alla creazione del profilo. Poi sceglierai una nuova password.")}</p>
      <form id="recForm" class="col"><input type="email" id="recEmail" placeholder="${t("Email")}" value="${esc(Prefs.get("lastEmail", ""))}"><input type="text" id="rec" class="mono" placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX" autocomplete="off" required><div id="lockErr" class="warn"></div><button class="btn pri">${t("Continua")}</button></form>
      <button class="btn ghost sm" data-a="lockCancel">${t("Torna all'accesso")}</button>`);
    $("#recForm").onsubmit = async e => {
      e.preventDefault(); const acc = await this.findAcc($("#recEmail").value); if (!acc) { $("#lockErr").textContent = t("Nessun profilo con questa email su questo dispositivo."); return; }
      await Store.open(acc.db); if (this.waitLeft()) return;
      let raw; try { raw = await Store.unwrapRecovery($("#rec").value); } catch (err) { await this.fail(); return; }
      Accounts.acc = acc;
      this.newPassword(async pw => { await Store.rewrap(raw, pw); await Store.useRaw(raw); raw.fill(0); toast(t("Nuova password impostata")); const m = await Store.meta(); if (m.totp) this.askTotp(); else this.enter(); });
    };
  },
  signup(first) {
    this.render(`${this.brand()}${this.langTheme()}<h2>${first ? t("Benvenuto") : t("Nuovo profilo scout")}</h2>
      <p class="sub">${t("Crea il tuo profilo da osservatore. I dati restano sul tuo dispositivo, cifrati con la tua password: senza di essa nessuno può leggerli.")}</p>
      <form id="s1" class="col"><label class="f">${t("Nome e cognome")}<input type="text" id="suName" autocomplete="name" required></label>
      <label class="f">${t("Email")}<input type="email" id="suEmail" autocomplete="email" required></label>
      ${this.pwFields()}<button class="btn pri">${t("Crea profilo")}</button></form>
      ${first ? `<button class="btn sm" data-a="syncJoin">${t("Hai già il profilo su un altro dispositivo? Collegalo")}</button>` : `<button class="btn ghost sm" data-a="lockCancel">${t("Ho già un profilo: accedi")}</button>`}`);
    this.bindPw();
    $("#s1").onsubmit = async e => {
      e.preventDefault(); const name = $("#suName").value.trim(), email = $("#suEmail").value.trim().toLowerCase();
      if (!Accounts.validEmail(email)) { $("#lockErr").textContent = t("Scrivi un indirizzo email valido."); return; }
      if (Accounts.byEmail(email)) { $("#lockErr").textContent = t("Esiste già un profilo con questa email su questo dispositivo."); return; }
      const pw = this.checkPw(); if (!pw) return;
      const b = e.target.querySelector("button.pri"); b.disabled = true; b.textContent = t("Creazione…");
      const acc = { id: uid(), email, name, db: "ms-scout-" + uid(), created: new Date().toISOString() };
      await Store.open(acc.db); const rec = await Store.setup(pw); Accounts.add(acc); Accounts.acc = acc; Prefs.set("lastEmail", email);
      this.setup2(rec);
    };
  },
  async setup4() {
    let hasOld = false;
    try { if (indexedDB.databases) hasOld = (await indexedDB.databases()).some(d => d.name === "taccuino-scout"); } catch (e) { }
    this.render(`${this.brand()}<h2>${t("Tutto pronto")}</h2>
      <div class="row" style="gap:14px"><div class="avatar" id="suPhotoPrev" style="width:72px;height:72px;border-radius:50%">${esc(((Accounts.acc || {}).name || "?").split(/\s+/).map(x => x[0]).join("").slice(0, 2).toUpperCase())}</div><button class="btn sm" id="suPhoto">${t("Aggiungi la tua foto")}</button></div>
      <label class="f">${t("Qualifica (compare nei report)")}<input type="text" id="suTitle" placeholder="${t("es. Osservatore calcistico")}"></label>
      ${hasOld ? `<label class="chk"><input type="checkbox" id="impOld" checked> ${t("Importa i dati della versione precedente trovati su questo dispositivo")}</label>` : ""}
      <label class="chk"><input type="checkbox" id="loadEx" checked> ${t("Carica anche gli esempi (tutti inventati): giocatori, partite e squadre di fantasia, giovanili comprese, profili ideali, riunioni, impegni e note")}</label>
      <button class="btn pri" id="goApp">${t("Apri l'app")}</button>`);
    let photo = "";
    $("#suPhoto").onclick = async () => { const [f] = await pickFile("image/*"); if (!f) return; photo = await photoToDataURL(f, 300); $("#suPhotoPrev").innerHTML = `<img src="${photo}" alt="" style="width:72px;height:72px;border-radius:50%;object-fit:cover">`; };
    $("#goApp").onclick = async () => {
      const acc = Accounts.acc || {}; const imp = $("#impOld") && $("#impOld").checked; const ex = $("#loadEx").checked;
      await Store.loadAll(); Migrate.config();
      App.unlocked = true;
      put("settings", "profile", { ...Profile.get(), name: acc.name || "", email: acc.email || "", title: $("#suTitle").value.trim(), photo, initials: (acc.name || "").split(/\s+/).map(x => x[0]).join("").toUpperCase() });
      if (imp) await Migrate.fromV2DB();
      if (ex) Examples.load(true);
      App.touch(); this.hide(); if (window.Backup) Backup.afterUnlock(); render();
    };
  }
});

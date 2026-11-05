"use strict";
/* =========================================================
   MM Scout — sincronizzazione tra computer, telefono e tablet tramite
   un file cifrato in una cartella cloud (iCloud Drive, OneDrive,
   Google Drive, Dropbox, kDrive). Unione a due vie: per ogni
   voce vince la modifica più recente; le cancellazioni si
   propagano. Il file è leggibile solo con la tua password.
   Computer (Chrome/Edge/Brave): automatica su una cartella.
   Telefono e tablet: un tocco con «Sincronizza ora».
   ========================================================= */
const Sync = {
  dir: null, needPerm: false, busy: false, timer: null, last: null,
  ser(o) { if (o instanceof Uint8Array) return { __u8: C.b64(o) }; if (Array.isArray(o)) return o.map(x => this.ser(x)); if (o && typeof o === "object") { const r = {}; for (const k in o) r[k] = this.ser(o[k]); return r; } return o; },
  des(o) { if (o && typeof o === "object") { if (typeof o.__u8 === "string") return C.unb64(o.__u8); if (Array.isArray(o)) return o.map(x => this.des(x)); const r = {}; for (const k in o) r[k] = this.des(o[k]); return r; } return o; },
  // il nome del file resta lo stesso anche se poi cambi l'email di accesso (gli altri dispositivi lo ritrovano)
  fname() { const k = "syncFile_" + Store.dbName; const f = Prefs.get(k, ""); if (f) return f; const e = ((Accounts.acc || {}).email || "profilo").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); const n = `mm-scout-sync-${e}.mmsync`; if (Store.dbName) Prefs.set(k, n); return n; },
  fsOk() { return !!window.showDirectoryPicker; },

  /* ----- costruzione del file ----- */
  async build() {
    await Store.pending; const m = await Store.meta(); const meta = { ...m }; delete meta.wipeAfter;
    const recs = {}; for (const c of COLLS) for (const [id, v] of S[c]) recs[c + "/" + id] = v;
    const data = await C.encJSON(Store.key, { recs, tombs: Store.tombs });
    const blobs = {}; for (const [k, b] of await Store.all("blob")) blobs[k] = { iv: C.b64(b.iv), ct: C.b64(b.ct), mime: b.mime, size: b.size };
    const acc = Accounts.acc || {};
    return JSON.stringify({ app: "mm-scout", kind: "sync", v: 1, saved: new Date().toISOString(), device: this.devName(), acc: { email: acc.email || "", name: acc.name || "" }, meta: this.ser(meta), data: { iv: C.b64(data.iv), ct: C.b64(data.ct) }, blobs });
  },
  devName() { const u = navigator.userAgent; return /iPad/.test(u) || (/Macintosh/.test(u) && navigator.maxTouchPoints > 1) ? "iPad" : /iPhone/.test(u) ? "iPhone" : /Mac/.test(u) ? "Mac" : /Android/.test(u) ? "Android" : "PC"; },
  parse(text) { let o; try { o = JSON.parse(text); } catch (e) { return null; } return o && o.app === "mm-scout" && o.kind === "sync" ? o : null; },

  /* ----- unione ----- */
  async merge(o) { const prev = this.busy; this.busy = true; try { return await this.merge0(o); } finally { this.busy = prev; } },
  async merge0(o) {
    let remote; try { remote = await C.decJSON(Store.key, { iv: C.unb64(o.data.iv), ct: C.unb64(o.data.ct) }); } catch (e) { throw new Error("key"); }
    let changed = 0; const tombs = Store.tombs;
    for (const [k, ts] of Object.entries(remote.tombs || {})) {
      if ((tombs[k] || 0) < ts) tombs[k] = ts;
      const i = k.indexOf("/"), c = k.slice(0, i), id = k.slice(i + 1); if (!S[c]) continue;
      const loc = S[c].get(id); if (loc && (loc._t || 0) <= ts) { S[c].delete(id); Store.write(c, id); changed++; }
    }
    for (const [k, v] of Object.entries(remote.recs || {})) {
      const i = k.indexOf("/"), c = k.slice(0, i), id = k.slice(i + 1); if (!S[c] || !v) continue;
      if ((tombs[k] || 0) >= (v._t || 0) && tombs[k]) continue;
      const loc = S[c].get(id); if (!loc || (v._t || 0) > (loc._t || 0)) { S[c].set(id, v); Store.write(c, id); changed++; }
    }
    Store.saveTombs();
    const have = new Set(await Store.keys("blob"));
    for (const [k, b] of Object.entries(o.blobs || {})) if (!have.has(k)) { try { await Store.put("blob", k, { iv: C.unb64(b.iv), ct: C.unb64(b.ct), mime: b.mime, size: b.size }); changed++; } catch (e) { } }
    // password / codice di recupero / verifica in due passaggi cambiati su un altro dispositivo
    const lm = await Store.meta(); const rm = this.des(o.meta);
    if ((rm.mt || 0) > (lm.mt || 0)) { this.keepMt = true; await Store.put("meta", "sec", { ...rm, wipeAfter: lm.wipeAfter || 0 }); this.keepMt = false; }
    await Store.pending; return changed;
  },

  /* ----- Mac: cartella automatica ----- */
  async afterUnlock() {
    try { this.dir = await Store.get("misc", "syncDir") || null; } catch (e) { this.dir = null; }
    if (!this.dir) return;
    try { this.needPerm = (await this.dir.queryPermission({ mode: "readwrite" })) !== "granted"; } catch (e) { this.needPerm = true; }
    if (!this.needPerm) this.auto(false);
  },
  async chooseDir() {
    if (!this.fsOk()) { toast(t("Questo browser non permette di scegliere una cartella.")); return; }
    try { const h = await window.showDirectoryPicker({ id: "mm-scout-sync", mode: "readwrite" }); await Store.put("misc", "syncDir", h); this.dir = h; this.needPerm = false; await this.auto(true); render(true); } catch (e) { if (e.name !== "AbortError") toast(t("Cartella non disponibile")); }
  },
  async regrant() { try { this.needPerm = (await this.dir.requestPermission({ mode: "readwrite" })) !== "granted"; if (!this.needPerm) await this.auto(true); } catch (e) { } render(true); },
  async off() { await Store.del("misc", "syncDir"); this.dir = null; this.needPerm = false; render(true); },
  schedule() { if (!this.dir || this.needPerm) return; clearTimeout(this.timer); this.timer = setTimeout(() => { this.timer = null; this.auto(false); }, 20000); },
  // se chiudi o lasci l'app prima dei 20 secondi, sincronizza subito: niente modifiche rimaste indietro
  flush() { if (!this.timer) return; clearTimeout(this.timer); this.timer = null; this.auto(false); },
  async auto(showToast) {
    if (!this.dir || this.busy || !App.unlocked || !Store.key) return; this.busy = true; let changed = 0;
    try {
      if ((await this.dir.queryPermission({ mode: "readwrite" })) !== "granted") { this.needPerm = true; return; }
      let fh; try { fh = await this.dir.getFileHandle(this.fname()); } catch (e) { fh = null; }
      if (fh) { const o = this.parse(await (await fh.getFile()).text()); if (o) changed = await this.merge(o); }
      fh = await this.dir.getFileHandle(this.fname(), { create: true }); const w = await fh.createWritable(); await w.write(await this.build()); await w.close();
      this.last = new Date().toISOString(); Prefs.set("lastSync_" + Store.dbName, this.last);
      if (changed) { render(true); toast(t("Sincronizzato: {n} novità da altri dispositivi", { n: changed })); } else if (showToast) toast(t("Sincronizzazione completata"));
    } catch (e) { if (e.message === "key") toast(t("Il file di sincronizzazione appartiene a un altro profilo.")); else if (showToast) toast(t("Sincronizzazione non riuscita")); }
    finally { this.busy = false; }
  },

  /* ----- iPhone / iPad: manuale ----- */
  async manual() {
    const [f] = await pickFile(""); if (!f) return; const o = this.parse(await f.text()); if (!o) { toast(t("File non riconosciuto")); return; }
    let changed; try { changed = await this.merge(o); } catch (e) { toast(t("Il file di sincronizzazione appartiene a un altro profilo.")); return; }
    render(true); this.saveSheet(t("Unione completata: {n} novità ricevute.", { n: changed }));
  },
  saveSheet(msg) {
    sheet(`<h2>${t("Salva il file aggiornato")}</h2>${msg ? `<p class="banner info">${esc(msg)}</p>` : ""}<p class="sub">${t("Ora salva il file nella stessa cartella del cloud, con lo stesso nome. Se ti chiede, scegli «Sostituisci».")}</p>
     <div class="row end"><button class="btn" data-a="closeSheetBtn">${t("Più tardi")}</button><button class="btn pri" id="syncSave">${t("Salva il file")}</button></div>`);
    $("#syncSave").onclick = async () => { await this.saveOut(); closeSheet(); };
  },
  async saveOut() {
    const f = new File([await this.build()], this.fname(), { type: "application/octet-stream" });
    try { if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: this.fname() }); this.done(); return; } } catch (e) { if (e.name === "AbortError") return; }
    download(f.name, f); this.done();
  },
  done() { this.last = new Date().toISOString(); Prefs.set("lastSync_" + Store.dbName, this.last); toast(t("File di sincronizzazione salvato")); },

  /* ----- collegare un nuovo dispositivo ----- */
  joinScreen() {
    Lock.render(`${Lock.brand()}<h2>${t("Collega questo dispositivo")}</h2>
      <p class="sub">${t("Scegli il file di sincronizzazione creato sull'altro dispositivo (nella cartella del cloud) e inserisci la password del tuo profilo. Ritroverai qui tutti i tuoi dati.")}</p>
      <div class="row"><button class="btn" id="jFile" type="button">${t("Scegli il file…")}</button><span class="m" id="jFn"></span></div>
      <form id="jForm" class="col"><label class="f">${t("Password")}<input type="password" id="jPw" autocomplete="current-password" required></label><div id="lockErr" class="warn"></div><button class="btn pri" id="jGo">${t("Collega")}</button></form>
      <button class="btn ghost sm" data-a="lockCancel">${t("Torna all'accesso")}</button>`);
    let o = null;
    let fnm = ""; $("#jFile").onclick = async () => { const [f] = await pickFile(""); if (!f) return; fnm = f.name || ""; o = this.parse(await f.text()); $("#jFn").textContent = o ? `${f.name} · ${o.acc.email || ""} · ${t("salvato il {d}", { d: fmtDate(o.saved.slice(0, 10)) })}` : t("File non riconosciuto"); };
    $("#jForm").onsubmit = async e => {
      e.preventDefault(); const err = $("#lockErr"); if (!o) { err.textContent = t("Scegli prima il file di sincronizzazione."); return; }
      if (o.acc.email && Accounts.byEmail(o.acc.email)) { err.textContent = t("Questo profilo è già su questo dispositivo: accedi e usa Impostazioni › Sincronizzazione."); return; }
      const meta = this.des(o.meta); const b = $("#jGo"); b.disabled = true; b.textContent = t("Verifica…"); let raw;
      try { raw = await C.decRaw(await C.kek($("#jPw").value, meta.salt, meta.iter), meta.wrapped); } catch (x) { b.disabled = false; b.textContent = t("Collega"); err.textContent = t("Password errata."); return; }
      const acc = { id: uid(), email: o.acc.email || "", name: o.acc.name || "", db: "ms-scout-" + uid(), created: new Date().toISOString() };
      await Store.open(acc.db); this.keepMt = true; await Store.put("meta", "sec", { ...meta, wipeAfter: 0 }); this.keepMt = false;
      await Store.useRaw(raw); raw.fill(0); await Store.loadAll(); await this.merge(o);
      Accounts.add(acc); Accounts.acc = acc; Prefs.set("lastEmail", acc.email); Prefs.set("lastSync_" + acc.db, new Date().toISOString()); if (/\.mmsync$/i.test(fnm)) Prefs.set("syncFile_" + acc.db, fnm);
      toast(t("Dispositivo collegato")); if (meta.totp) Lock.askTotp(); else Lock.enter();
    };
  }
};
// la data di modifica della chiave (password, recupero, 2FA) viaggia con il file
(orig => { Store.put = function (s, k, v) { if (s === "meta" && k === "sec" && v && !Sync.keepMt) v.mt = Date.now(); return orig.call(this, s, k, v); }; })(Store.put);
// dopo ogni modifica: sincronizza dopo 20 secondi di calma
(orig => { App.onDirty = function () { orig.call(this); try { if (!Sync.busy) Prefs.set("dirtyAt_" + Store.dbName, Date.now()); } catch (e) { } Sync.schedule(); }; })(App.onDirty);
document.addEventListener("visibilitychange", () => { if (!App.unlocked || !Sync.dir || Sync.needPerm) return; if (document.hidden) Sync.flush(); else Sync.auto(false); });
window.addEventListener("pagehide", () => { if (App.unlocked && Sync.dir && !Sync.needPerm) Sync.flush(); });
// dopo l'accesso
(orig => { Lock.enter = async function () { await orig.apply(this, arguments); Sync.afterUnlock(); }; })(Lock.enter);

function syncReminder() {
  if (Sync.needPerm && Sync.dir) return `<div class="banner row between">${t("La sincronizzazione automatica è in pausa: il browser chiede di nuovo il permesso per la cartella.")} <button class="btn sm pri" data-a="syncRegrant">${t("Riattiva")}</button></div>`;
  // telefono e tablet (sincronizzazione con un tocco): ti avviso se ci sono modifiche non ancora portate sugli altri dispositivi
  const last = Prefs.get("lastSync_" + Store.dbName, null), dirty = +Prefs.get("dirtyAt_" + Store.dbName, 0);
  if (!Sync.dir && last && dirty > Date.parse(last) + 2000) return `<div class="banner info row between">${t("Hai modifiche non ancora sincronizzate con gli altri dispositivi.")} <button class="btn sm pri" data-a="syncManual">${t("Sincronizza ora")}</button></div>`;
  return "";
}
SET.sync = () => {
  const last = Prefs.get("lastSync_" + Store.dbName, null);
  return `<section class="panel"><h2>${t("Sincronizzazione tra computer, telefono e tablet")}</h2>
   <p class="sub small">${t("I tuoi dati viaggiano in un unico file cifrato, in una cartella che scegli tu: iCloud Drive, OneDrive, Google Drive, Dropbox, kDrive o una cartella del computer. Ogni dispositivo lo legge, unisce le novità (vince la modifica più recente) e lo riscrive. Senza la tua password il file è illeggibile.")}</p>
   <p class="m">${t("Ultima sincronizzazione: {d}", { d: last ? fmtDate(last.slice(0, 10)) + " " + last.slice(11, 16) : t("mai") })} · ${t("File")}: <span class="mono">${esc(Sync.fname())}</span></p></section>
  <section class="panel"><h2>${t("Computer (Mac, Windows, Linux) — automatica")}</h2>
   ${Sync.fsOk() ? `<p class="sub small">${t("Scegli una cartella «MM Scout» dentro il tuo cloud (iCloud Drive, OneDrive, Google Drive, Dropbox, kDrive). L'app sincronizza da sola: all'accesso, 20 secondi dopo ogni modifica e quando torni sull'app.")}</p>
   <div class="row" style="margin-top:8px"><button class="btn pri" data-a="syncDir">${Sync.dir ? t("Cambia cartella") : t("Scegli cartella")}</button>${Sync.dir ? `<button class="btn" data-a="syncNow">${t("Sincronizza ora")}</button><button class="btn ghost" data-a="syncOff">${t("Disattiva")}</button>` : ""}</div>
   ${Sync.dir ? `<p class="m" style="margin-top:6px">${t("Cartella: {n}", { n: esc(Sync.dir.name) })} · ${Sync.needPerm ? t("in pausa (permesso)") : t("attiva")}</p>` : ""}`
    : `<p class="sub small">${t("Questo browser non permette la sincronizzazione automatica. Sul computer usa Chrome, Edge o Brave (in Brave attiva brave://flags/#file-system-access-api). Qui puoi usare la sincronizzazione con un tocco qui sotto.")}</p>`}</section>
  <section class="panel"><h2>${t("iPhone, iPad e Android — un tocco")}</h2>
   <p class="sub small">${t("Sul telefono e sul tablet il browser non permette alle app web di scrivere da sole nel cloud. Quando apri l'app: «Sincronizza ora» › scegli il file nella cartella del cloud › poi «Salva il file» e sostituisci quello vecchio. Fallo prima e dopo la partita.")}</p>
   <div class="row" style="margin-top:8px"><button class="btn pri" data-a="syncManual">${t("Sincronizza ora (scegli il file)")}</button><button class="btn" data-a="syncCreate">${t("Crea il file per la prima volta")}</button></div></section>
  <section class="panel"><h2>${t("Nuovo dispositivo")}</h2><p class="sub small">${t("Sul nuovo dispositivo apri l'app e, nella schermata di accesso, tocca «Collega un dispositivo»: scegli il file e inserisci la password.")}</p></section>`;
};
Object.assign(A, {
  syncDir: () => Sync.chooseDir(), syncNow: () => Sync.auto(true).then(() => render(true)), syncOff: () => Sync.off(),
  syncRegrant: () => Sync.regrant(), syncManual: () => Sync.manual(), syncCreate: () => Sync.saveOut(),
  syncJoin: () => Sync.joinScreen()
});

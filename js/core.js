"use strict";
/* =========================================================
   MM Scout — nucleo: utilità, lingua, crittografia,
   archivio cifrato, configurazione modificabile.
   ========================================================= */
const APP_VERSION = "0.9.1";

/* ---------- utilità ---------- */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const today = () => new Date().toISOString().slice(0, 10);
const clone = o => JSON.parse(JSON.stringify(o));
const mean = a => { a = a.filter(x => x != null && !isNaN(x)); return a.length ? a.reduce((s, x) => s + x, 0) / a.length : null; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
function toast(msg, ms) { const el = $("#toast"); el.textContent = msg; el.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => el.hidden = true, ms || 2800); }
function fmtDate(d) { if (!d) return "—"; if (/^\d{4}$/.test(d)) return d; const [y, m, g] = String(d).slice(0, 10).split("-"); if (!g) return d; return Prefs.lang === "en" ? `${g}/${m}/${y}` : `${g}/${m}/${y}`; }
function fmtSize(b) { if (b == null) return ""; if (b < 1024) return b + " B"; if (b < 1048576) return (b / 1024).toFixed(0) + " KB"; return (b / 1048576).toFixed(1) + " MB"; }
const f1 = v => v == null ? "–" : (Math.round(v * 10) / 10).toString().replace(".", Prefs.lang === "en" ? "." : ",");
function download(name, data, type = "application/octet-stream") { const b = data instanceof Blob ? data : new Blob([data], { type }); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }

/* ---------- preferenze del dispositivo (non sensibili) ---------- */
const Prefs = {
  get(k, d) { try { const v = localStorage.getItem("ts3_" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem("ts3_" + k, JSON.stringify(v)); } catch (e) { } },
  get lang() { const n = (navigator.language || "it").toLowerCase().slice(0, 2); return this.get("lang", ["it", "en", "de", "sr", "es", "fr"].includes(n) ? n : n === "hr" || n === "bs" ? "sr" : ["ca", "gl", "eu"].includes(n) ? "es" : "en"); },
  get theme() { return this.get("theme", "system"); }
};
function applyTheme() { const t = Prefs.theme; if (t === "system") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t; const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = getComputedStyle(document.documentElement).getPropertyValue("--side").trim() || "#17221C"; }

/* ---------- lingua ---------- */
// Le stringhe sono scritte in italiano; I18N_EN contiene le traduzioni inglesi.
const LANGS = [["it", "Italiano", "IT"], ["en", "English", "EN"], ["de", "Deutsch", "DE"], ["sr", "Srpski", "SR"], ["es", "Español", "ES"], ["fr", "Français", "FR"]];
function dict() { const l = Prefs.lang; return l === "it" ? null : window["I18N_" + l.toUpperCase()] || null; }
function t(s, vars) { const d = dict(); let out = (d && d[s]) || s; if (vars) for (const k in vars) out = out.split("{" + k + "}").join(vars[k]); return out.indexOf("MM Scout") >= 0 ? out.split("MM Scout").join(appName()) : out; }
const DEFAULT_APP_NAME = "MM Scout";
function appName() { return DEFAULT_APP_NAME; }
// logo: «moderno» (predefinito, vettoriale) oppure «classico» (erba), da Impostazioni › Generale
const logoSrc = () => (Prefs.get("logoStyle", "modern") === "classic" ? "img/logo.jpg" : "img/logo.svg");
function appBrand(sub) { const n = esc(appName()); const i = n.indexOf(" "); return `<div class="brand"><img class="logo" src="${logoSrc()}" alt="" width="44" height="44">${i > 0 ? n.slice(0, i) + "<br>" + n.slice(i + 1) : n}${sub !== undefined ? `<small>${sub}</small>` : ""}</div>`; }
const L = item => { if (!item) return ""; const l = Prefs.lang; if (item[l]) return item[l]; if (l === "it") return item.it || item.id || ""; const d = dict(); return (d && item.it && d[item.it]) || item.en || item.it || item.id || ""; };

/* ---------- crittografia (WebCrypto) ---------- */
const C = {
  te: new TextEncoder(), td: new TextDecoder(),
  rand(n) { return crypto.getRandomValues(new Uint8Array(n)); },
  b64(u8) { let s = ""; const ch = 0x8000; for (let i = 0; i < u8.length; i += ch) s += String.fromCharCode.apply(null, u8.subarray(i, i + ch)); return btoa(s); },
  unb64(s) { const b = atob(s); const u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; },
  b64url(u8) { return C.b64(u8).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); },
  unb64url(s) { s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; return C.unb64(s); },
  async kek(pass, salt, iterations) {
    const base = await crypto.subtle.importKey("raw", C.te.encode(pass.normalize("NFC")), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  },
  async encRaw(key, u8) { const iv = C.rand(12); const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, u8)); return { iv, ct }; },
  async decRaw(key, x) { return new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: x.iv }, key, x.ct)); },
  async encJSON(key, o) { return C.encRaw(key, C.te.encode(JSON.stringify(o))); },
  async decJSON(key, x) { return JSON.parse(C.td.decode(await C.decRaw(key, x))); },
  importKey(raw) { return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]); },
  async deflate(u8) { if (!window.CompressionStream) return null; const s = new Blob([u8]).stream().pipeThrough(new CompressionStream("deflate-raw")); return new Uint8Array(await new Response(s).arrayBuffer()); },
  async inflate(u8) { const s = new Blob([u8]).stream().pipeThrough(new DecompressionStream("deflate-raw")); return new Uint8Array(await new Response(s).arrayBuffer()); },
  // Base32 e TOTP (RFC 6238) per la verifica in due passaggi
  B32: "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",
  b32(u8) { let bits = 0, val = 0, out = ""; for (const b of u8) { val = (val << 8) | b; bits += 8; while (bits >= 5) { out += C.B32[(val >>> (bits - 5)) & 31]; bits -= 5; } } if (bits > 0) out += C.B32[(val << (5 - bits)) & 31]; return out; },
  unb32(s) { s = s.replace(/[\s=-]/g, "").toUpperCase(); let bits = 0, val = 0; const out = []; for (const c of s) { const i = C.B32.indexOf(c); if (i < 0) continue; val = (val << 5) | i; bits += 5; if (bits >= 8) { out.push((val >>> (bits - 8)) & 255); bits -= 8; } } return new Uint8Array(out); },
  async totp(secret, time = Date.now(), step = 30) {
    const ctr = Math.floor(time / 1000 / step); const buf = new ArrayBuffer(8); const dv = new DataView(buf); dv.setUint32(0, Math.floor(ctr / 2 ** 32)); dv.setUint32(4, ctr >>> 0);
    const k = await crypto.subtle.importKey("raw", secret, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
    const h = new Uint8Array(await crypto.subtle.sign("HMAC", k, buf)); const o = h[h.length - 1] & 15;
    const n = ((h[o] & 127) << 24 | h[o + 1] << 16 | h[o + 2] << 8 | h[o + 3]) % 1e6; return String(n).padStart(6, "0");
  },
  async verifyTotp(secret, code) { code = String(code).replace(/\D/g, ""); if (code.length !== 6) return false; for (const w of [-1, 0, 1]) if (await C.totp(secret, Date.now() + w * 30000) === code) return true; return false; },
  recoveryCode() { const raw = C.b32(C.rand(15)); return raw.match(/.{1,4}/g).join("-"); }
};
function pwStrength(p) { let s = 0; if (!p) return 0; if (p.length >= 10) s++; if (p.length >= 14) s++; if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++; if (/\d/.test(p)) s++; if (/[^\w\s]/.test(p) || /\s/.test(p.trim())) s++; return Math.min(4, s); }

/* ---------- archivio cifrato (IndexedDB) ---------- */
const COLLS = ["players", "evals", "matches", "media", "lists", "lineups", "settings", "ideals", "staff", "meetings", "tasks", "todos", "notes", "trash"];
const S = {}; COLLS.forEach(c => S[c] = new Map());
const PBKDF2_ITER = 600000;
const Store = {
  db: null, key: null, dirty: false, pending: Promise.resolve(), urls: new Map(),
  dbName: null,
  async open(name) {
    name = name || this.dbName || "taccuino-scout-v3";
    if (this.db && this.dbName === name) return;
    if (this.db) { try { this.db.close(); } catch (e) { } this.db = null; }
    this.dbName = name;
    this.db = await new Promise((res, rej) => {
      const r = indexedDB.open(name, 1);
      r.onupgradeneeded = () => { for (const s of ["meta", "rec", "blob", "snap", "misc"]) r.result.createObjectStore(s); };
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
  },
  req(store, mode, fn) { return new Promise((res, rej) => { const tx = this.db.transaction(store, mode); const st = tx.objectStore(store); const r = fn(st); tx.oncomplete = () => res(r && "result" in r ? r.result : undefined); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error); }); },
  get(store, k) { return this.req(store, "readonly", st => st.get(k)); },
  put(store, k, v) { return this.req(store, "readwrite", st => st.put(v, k)); },
  del(store, k) { return this.req(store, "readwrite", st => st.delete(k)); },
  clear(store) { return this.req(store, "readwrite", st => st.clear()); },
  all(store) { return new Promise((res, rej) => { const out = []; const tx = this.db.transaction(store); const c = tx.objectStore(store).openCursor(); c.onsuccess = () => { const cur = c.result; if (cur) { out.push([cur.key, cur.value]); cur.continue(); } else res(out); }; c.onerror = () => rej(c.error); }); },
  keys(store) { return this.req(store, "readonly", st => st.getAllKeys()); },
  async meta() { return this.get("meta", "sec"); },
  async setup(password) {
    const salt = C.rand(16), raw = C.rand(32), rsalt = C.rand(16), recovery = C.recoveryCode();
    const wrapped = await C.encRaw(await C.kek(password, salt, PBKDF2_ITER), raw);
    const wrappedR = await C.encRaw(await C.kek(recovery.replace(/-/g, ""), rsalt, 300000), raw);
    await this.put("meta", "sec", { v: 3, salt, iter: PBKDF2_ITER, wrapped, rsalt, riter: 300000, wrappedR, created: new Date().toISOString(), totp: null, wipeAfter: 0 });
    await this.useRaw(raw); raw.fill(0);
    return recovery;
  },
  async unwrap(password) { const m = await this.meta(); return C.decRaw(await C.kek(password, m.salt, m.iter), m.wrapped); },
  async unwrapRecovery(code) { const m = await this.meta(); return C.decRaw(await C.kek(code.replace(/[^A-Za-z2-7]/g, "").toUpperCase(), m.rsalt, m.riter), m.wrappedR); },
  async rewrap(raw, newPassword) { const m = await this.meta(); m.salt = C.rand(16); m.iter = PBKDF2_ITER; m.wrapped = await C.encRaw(await C.kek(newPassword, m.salt, m.iter), raw); await this.put("meta", "sec", m); },
  async newRecovery(raw) { const m = await this.meta(); const code = C.recoveryCode(); m.rsalt = C.rand(16); m.wrappedR = await C.encRaw(await C.kek(code.replace(/-/g, ""), m.rsalt, m.riter), raw); await this.put("meta", "sec", m); return code; },
  async useRaw(raw) { this.raw = raw.slice(); this.key = await C.importKey(raw); },
  async loadAll() {
    COLLS.forEach(c => S[c] = new Map());
    try { this.tombs = (await this.get("misc", "tombs")) || {}; } catch (e) { this.tombs = {}; }
    for (const [k, v] of await this.all("rec")) { const i = k.indexOf("/"); const coll = k.slice(0, i), id = k.slice(i + 1); if (!S[coll]) continue; try { S[coll].set(id, await C.decJSON(this.key, v)); } catch (e) { console.warn("record illeggibile", k); } }
  },
  write(coll, id) {
    const v = S[coll].get(id); this.dirty = true; App.onDirty();
    this.pending = this.pending.then(async () => {
      if (!this.key) return;
      try { if (v) await this.put("rec", coll + "/" + id, await C.encJSON(this.key, v)); else await this.del("rec", coll + "/" + id); }
      catch (e) { toast(t("Salvataggio non riuscito: spazio pieno?")); }
    });
    return this.pending;
  },
  async putBlob(file) {
    const id = uid(); const buf = new Uint8Array(await file.arrayBuffer());
    const enc = await C.encRaw(this.key, buf);
    await this.put("blob", id, { iv: enc.iv, ct: enc.ct, mime: file.type || "application/octet-stream", size: buf.length });
    return id;
  },
  async blobURL(id) {
    if (this.urls.has(id)) return this.urls.get(id);
    const b = await this.get("blob", id); if (!b) return null;
    const pt = await C.decRaw(this.key, b); const url = URL.createObjectURL(new Blob([pt], { type: b.mime }));
    this.urls.set(id, url); return url;
  },
  async blobBytes(id) { const b = await this.get("blob", id); if (!b) return null; return { bytes: await C.decRaw(this.key, b), mime: b.mime }; },
  async delBlob(id) { if (this.urls.has(id)) { URL.revokeObjectURL(this.urls.get(id)); this.urls.delete(id); } await this.del("blob", id); },
  tombs: {},
  tomb(coll, id) { this.tombs[coll + "/" + id] = Date.now(); this.saveTombs(); },
  untomb(coll, id) { if (this.tombs[coll + "/" + id]) { delete this.tombs[coll + "/" + id]; this.saveTombs(); } },
  saveTombs() { clearTimeout(this._tt); this._tt = setTimeout(() => { if (this.db) this.put("misc", "tombs", { ...this.tombs }).catch(() => { }); }, 300); },
  dump() { const o = {}; for (const c of COLLS) o[c] = Object.fromEntries(S[c]); return o; },
  async snapshot(reason) {
    if (!this.key) return;
    const enc = await C.encJSON(this.key, this.dump()); const k = new Date().toISOString();
    await this.put("snap", k, { ...enc, reason: reason || "auto", count: S.players.size + S.evals.size + S.matches.size });
    const keys = (await this.keys("snap")).sort(); const keep = App.cfgDevice().keepSnapshots || 20;
    for (const old of keys.slice(0, Math.max(0, keys.length - keep))) await this.del("snap", old);
  },
  lock() { if (this.raw) this.raw.fill(0); this.raw = null; this.key = null; COLLS.forEach(c => S[c] = new Map()); for (const u of this.urls.values()) URL.revokeObjectURL(u); this.urls.clear(); }
};
function put(coll, id, v, keepT) { if (v && typeof v === "object" && !keepT) { v._t = Date.now(); Store.untomb(coll, id); } if (v && !v.example && window.Author && (coll === "players" || coll === "evals" || coll === "matches")) Author.stamp(v); S[coll].set(id, v); return Store.write(coll, id); }
function del(coll, id, noTomb) { S[coll].delete(id); if (!noTomb) Store.tomb(coll, id); return Store.write(coll, id); }

/* ---------- configurazione modificabile (salvata cifrata) ---------- */
const DEFAULT_AREAS = [
  ["tat", "Tattiche", "Tactical", false, [["Senza palla", "Off-the-ball play"], ["Visione", "Vision"], ["Smarcamento", "Getting open"], ["Imprevedibilità", "Unpredictability"], ["Contropiede", "Counter-attacking"], ["Ricezione tra le linee", "Receiving between the lines"], ["1vs1", "1v1"], ["Posizione", "Positioning"], ["Lettura del gioco", "Reading the game"], ["Ricezione palla", "Ball reception"], ["Capacità d'inserimento", "Late runs into the box"], ["Creare superiorità numerica", "Creating numerical superiority"], ["Ripiegamenti difensivi", "Tracking back"], ["Aprire gli spazi", "Creating space"], ["Abilità difensive", "Defensive ability"], ["Anticipo", "Anticipation"], ["Rottura del gioco avversario", "Breaking up play"], ["Supporto al centrocampo", "Midfield support"], ["Fa reparto da solo", "Leads the line alone"], ["Senso del gol", "Goal instinct"], ["Attacco della profondità", "Runs in behind"]]],
  ["fis", "Fisiche", "Physical", false, [["Intensità", "Intensity"], ["Velocità", "Speed"], ["Elevazione", "Jumping reach"], ["Resistenza", "Endurance"], ["Capacità aerobica", "Aerobic capacity"], ["Scatto sul breve", "Short sprint"], ["Fisicità", "Physicality"], ["Aggressività", "Aggressiveness"], ["Forza", "Strength"], ["Agilità", "Agility"], ["Equilibrio", "Balance"], ["Accelerazione", "Acceleration"], ["Duelli offensivi", "Attacking duels"], ["Protezione palla", "Ball shielding"], ["Duelli aerei", "Aerial duels"], ["Esplosività", "Explosiveness"], ["Potenza", "Power"], ["Cambio di passo", "Change of pace"], ["Spalle alla porta", "Back-to-goal play"]]],
  ["tec", "Tecniche", "Technical", false, [["Contrasti", "Tackling"], ["Passaggio", "Passing"], ["Gioco sotto pressione", "Play under pressure"], ["Controllo palla", "Ball control"], ["Incisività offensiva", "Attacking impact"], ["Precisione", "Accuracy"], ["Tiro", "Shooting"], ["Finalizzazione", "Finishing"], ["Uso entrambi i piedi", "Two-footedness"], ["Colpo di testa", "Heading"], ["Assist", "Assists"], ["Controllo orientato", "Directional first touch"], ["Tecnica", "Technique"], ["Dribbling", "Dribbling"], ["Conduzione palla", "Ball carrying"], ["Abilità offensive", "Attacking skills"], ["Passaggi chiave", "Key passes"], ["Freddezza", "Composure"]]],
  ["men", "Mentali", "Mental", false, [["Leadership", "Leadership"], ["Temperamento", "Temperament"], ["Livello d'attenzione", "Attention level"], ["Autocontrollo", "Self-control"], ["Presa decisioni", "Decision making"], ["Estrosità", "Flair"], ["Eccentricità", "Eccentricity"], ["Uomo squadra", "Team player"], ["Carisma", "Charisma"], ["Professionalità", "Professionalism"], ["Determinazione", "Determination"], ["Concentrazione", "Concentration"], ["Impulsività", "Impulsiveness"], ["Personalità", "Personality"], ["Gestione degli errori", "Handling mistakes"], ["Consapevolezza", "Awareness"]]],
  ["por", "Portiere", "Goalkeeping", true, [["Parate", "Shot stopping"], ["Reattività", "Reflexes"], ["Posizionamento tra i pali", "Goal positioning"], ["Uscite alte", "Claiming crosses"], ["Uscite basse", "Low exits"], ["1vs1 in uscita", "1v1 rushing out"], ["Presa", "Handling"], ["Gioco con i piedi", "Distribution with feet"], ["Rinvii", "Kicking"], ["Guida della difesa", "Commanding the defence"]]]
];
const opt = (id, it, en, extra) => ({ id, it, en, ...(extra || {}) });
function defaultConfig() {
  return {
    v: 3,
    scale: { min: 1, max: 10, step: 0.5 },
    minEvidence: 3,
    areas: DEFAULT_AREAS.map(([id, it, en, gk, ps]) => ({ id, it, en, gk, hidden: false, params: ps.map(([pit, pen]) => ({ id: pit, it: pit, en: pen, hidden: false })) })),
    roleHide: {},
    roles: [opt("Portiere", "Portiere", "Goalkeeper", { x: 6, y: 50, gk: true }), opt("Difensore centrale", "Difensore centrale", "Centre-back", { x: 22, y: 50 }), opt("Terzino destro", "Terzino destro", "Right-back", { x: 28, y: 84 }), opt("Terzino sinistro", "Terzino sinistro", "Left-back", { x: 28, y: 16 }), opt("Quinto destro", "Quinto destro", "Right wing-back", { x: 45, y: 88 }), opt("Quinto sinistro", "Quinto sinistro", "Left wing-back", { x: 45, y: 12 }), opt("Mediano", "Mediano", "Defensive midfielder", { x: 38, y: 50 }), opt("Regista", "Regista", "Deep-lying playmaker", { x: 42, y: 50 }), opt("Centrocampista centrale", "Centrocampista centrale", "Central midfielder", { x: 48, y: 50 }), opt("Mezzala", "Mezzala", "Box-to-box / half-space midfielder", { x: 52, y: 32 }), opt("Trequartista", "Trequartista", "Attacking midfielder", { x: 66, y: 50 }), opt("Ala destra", "Ala destra", "Right winger", { x: 74, y: 84 }), opt("Ala sinistra", "Ala sinistra", "Left winger", { x: 74, y: 16 }), opt("Seconda punta", "Seconda punta", "Second striker", { x: 78, y: 40 }), opt("Punta centrale", "Punta centrale", "Centre-forward", { x: 88, y: 50 }), opt("Falso 9", "Falso 9", "False nine", { x: 80, y: 50 })],
    levels: [opt("A", "Top", "Top"), opt("B", "Titolare", "Starter"), opt("C", "Rotazione", "Rotation"), opt("D", "Riserva", "Squad player"), opt("E", "Non adatto", "Not suitable")],
    verdicts: [opt("prendere", "Da prendere", "Sign", { color: "good" }), opt("attenzione", "Da seguire con attenzione", "Follow closely", { color: "blue" }), opt("seguire", "Da seguire", "Follow", { color: "amber" }), opt("rivedere", "Da rivedere", "Watch again", { color: "grey" }), opt("no", "Non appropriato", "Not suitable", { color: "bad" })],
    matchTypes: [opt("Campionato", "Campionato", "League"), opt("Coppa", "Coppa", "Cup"), opt("Amichevole", "Amichevole", "Friendly"), opt("Torneo", "Torneo", "Tournament"), opt("Play-off", "Play-off", "Play-off"), opt("Video", "Video", "Video")],
    teamCats: [opt("Prima squadra", "Prima squadra", "First team"), opt("U21/U23", "U21 / U23", "U21 / U23"), opt("Primavera / U19", "Primavera / U19", "U19"), opt("U18", "U18", "U18"), opt("U17", "U17", "U17"), opt("U16", "U16", "U16"), opt("U15", "U15", "U15"), opt("U14", "U14", "U14"), opt("Altro", "Altro", "Other")],
    systems: ["1-4-3-3", "1-4-2-3-1", "1-4-4-2", "1-4-3-1-2", "1-4-4-1-1", "1-4-1-4-1", "1-3-5-2", "1-3-4-3", "1-3-4-2-1", "1-5-3-2", "1-5-4-1"],
    somatotypes: [opt("Ectomorfo", "Ectomorfo", "Ectomorph"), opt("Mesomorfo", "Mesomorfo", "Mesomorph"), opt("Endomorfo", "Endomorfo", "Endomorph")],
    maturity: [opt("Precoce", "Precoce", "Early"), opt("Ordinario", "Ordinario", "Average"), opt("Tardivo", "Tardivo", "Late")],
    liveCats: [opt("Ricezione", "Ricezione", "Reception", { area: "tec" }), opt("Passaggio", "Passaggio", "Pass", { area: "tec" }), opt("Controllo orientato", "Controllo orientato", "Directional touch", { area: "tec" }), opt("Conduzione", "Conduzione", "Carry", { area: "tec" }), opt("Dribbling", "Dribbling", "Dribble", { area: "tec" }), opt("Cross / Assist", "Cross / Assist", "Cross / Assist", { area: "tec" }), opt("Tiro", "Tiro", "Shot", { area: "tec" }), opt("Colpo di testa", "Colpo di testa", "Header", { area: "tec" }), opt("Contrasto", "Contrasto", "Tackle", { area: "tec" }), opt("Smarcamento", "Smarcamento", "Getting open", { area: "tat" }), opt("Attacco profondità", "Attacco profondità", "Run in behind", { area: "tat" }), opt("Posizione", "Posizione", "Positioning", { area: "tat" }), opt("Lettura / Anticipo", "Lettura / Anticipo", "Reading / Interception", { area: "tat" }), opt("Pressing", "Pressing", "Pressing", { area: "tat" }), opt("Ripiegamento", "Ripiegamento", "Tracking back", { area: "tat" }), opt("Duello aereo", "Duello aereo", "Aerial duel", { area: "fis" }), opt("Duello a terra", "Duello a terra", "Ground duel", { area: "fis" }), opt("Scatto / Velocità", "Scatto / Velocità", "Sprint / Pace", { area: "fis" }), opt("Atteggiamento", "Atteggiamento", "Attitude", { area: "men" }), opt("Parata / Uscita", "Parata / Uscita", "Save / Claim", { area: "por" })],
    injuryTypes: [opt("Muscolare", "Muscolare", "Muscular"), opt("Articolare / legamenti", "Articolare / legamenti", "Joint / ligament"), opt("Ossea / frattura", "Ossea / frattura", "Bone / fracture"), opt("Tendinea", "Tendinea", "Tendon"), opt("Trauma / contusione", "Trauma / contusione", "Knock / bruise"), opt("Altro", "Altro", "Other")],
    tags: [{ id: "u21", name: "Under 21", color: "#2F6690" }, { id: "prestito", name: "In prestito", color: "#B8730F" }, { id: "svincolo", name: "Svincolato 2027", color: "#B23A3A" }],
    mediaMaxMB: 150,
    areaWeights: { tat: 30, tec: 30, men: 20, fis: 20, por: 40 }
  };
}
const Cfg = {
  get() { const c = S.settings.get("config"); return c || defaultConfig(); },
  save(c) { return put("settings", "config", c); },
  area(id) { return this.get().areas.find(a => a.id === id); },
  role(id) { return this.get().roles.find(r => r.id === id); },
  verdict(id) { return this.get().verdicts.find(v => v.id === id); },
  level(id) { return this.get().levels.find(v => v.id === id); },
  tag(id) { return this.get().tags.find(v => v.id === id); }
};
const Profile = { get() { return S.settings.get("profile") || { name: "", title: "", email: "", phone: "", city: "", bio: "", languages: "", certs: "", links: "", photo: "" }; } };

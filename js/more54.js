"use strict";
/* =========================================================
   MM Scout 5.4 — archivi nascosti con codice, ruoli sul
   campo nel profilo del giocatore, creazione al volo da
   riunioni e incarichi.
   ========================================================= */

/* =========================================================
   ARCHIVI NASCOSTI
   Gli elementi messi in un archivio nascosto spariscono da
   elenchi, ricerche, calendario e statistiche finché non lo
   apri con il suo codice. Restano cifrati come tutto il resto
   e sono inclusi nei backup e nella sincronizzazione.
   ========================================================= */
window.Vault = {
  COLLS: ["players", "matches", "evals", "media", "lists"], stash: {}, opened: new Set(), fails: {},
  list() { return ((S.settings.get("vaults") || {}).items) || []; },
  save(items) { put("settings", "vaults", { items }); },
  name(id) { const v = this.list().find(x => x.id === id); return v ? v.name : "?"; },
  openIds() { return [...this.opened].filter(id => this.list().some(v => v.id === id)); },
  isHidden(o) { return !!(o && o.vault && !this.opened.has(o.vault)); },
  hideAll() { for (const c of this.COLLS) { const st = this.stash[c] = this.stash[c] || new Map(); for (const [id, o] of [...S[c]]) if (this.isHidden(o)) { st.set(id, o); S[c].delete(id); } } },
  reveal(vid) { for (const c of this.COLLS) { const st = this.stash[c]; if (!st) continue; for (const [id, o] of [...st]) if (!vid || o.vault === vid) { S[c].set(id, o); st.delete(id); } } },
  withAll(fn) { this.reveal(); try { return fn(); } finally { this.hideAll(); } },
  async withAllA(fn) { this.reveal(); try { return await fn(); } finally { this.hideAll(); } },
  count(vid) { let n = { players: 0, matches: 0, evals: 0 }; for (const c of ["players", "matches", "evals"]) { for (const o of S[c].values()) if (o.vault === vid) n[c]++; for (const o of (this.stash[c] || new Map()).values()) if (o.vault === vid) n[c]++; } return n; },
  async hash(pin, salt) { const k = await crypto.subtle.importKey("raw", C.te.encode(pin), "PBKDF2", false, ["deriveBits"]); const b = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: C.unb64(salt), iterations: 150000, hash: "SHA-256" }, k, 256); return C.b64(new Uint8Array(b)); },
  async check(v, pin) { return (await this.hash(pin, v.salt)) === v.hash; }
};
Store.loadAll = (orig => async function () { Vault.opened.clear(); Vault.stash = {}; const r = await orig.apply(this, arguments); Vault.hideAll(); return r; })(Store.loadAll);
Store.lock = (orig => function () { Vault.opened.clear(); Vault.stash = {}; return orig.apply(this, arguments); })(Store.lock);
Store.dump = (orig => function () { return Vault.withAll(() => orig.call(this)); })(Store.dump);
Sync.build = (orig => function () { return Vault.withAllA(() => orig.apply(this, arguments)); })(Sync.build);
Sync.merge = (orig => function () { return Vault.withAllA(() => orig.apply(this, arguments)); })(Sync.merge);
window.put = (orig => function (coll, id, v, keepT) {
  const st = Vault.stash[coll]; if (st) st.delete(id); const r = orig(coll, id, v, keepT);
  if (v && Vault.COLLS.includes(coll) && Vault.isHidden(v)) { S[coll].delete(id); (Vault.stash[coll] = Vault.stash[coll] || new Map()).set(id, v); }
  return r;
})(window.put);
window.del = (orig => function (coll, id, noTomb) { const st = Vault.stash[coll]; if (st && st.has(id)) { S[coll].set(id, st.get(id)); st.delete(id); } return orig(coll, id, noTomb); })(window.del);

function vaultPanel() {
  const vs = Vault.list();
  return `<section class="panel vaultp"><div class="row between"><div><h2>🔒 ${t("Archivi nascosti")}</h2><p class="sub small">${t("Giocatori e partite che vuoi tenere riservati: spariscono da elenchi e ricerche finché non apri l'archivio con il suo codice.")}</p></div><button class="btn pri" data-a="vaultNew">+ ${t("Nuovo archivio nascosto")}</button></div>
   <div class="list" style="margin-top:6px">${vs.map(v => { const open = Vault.opened.has(v.id); const n = Vault.count(v.id); return `<div class="item"><span class="vico">${open ? "🔓" : "🔒"}</span><div class="grow"><div class="t">${esc(v.name)}</div><div class="m">${open ? t("{p} giocatori · {m} partite · {e} valutazioni", { p: n.players, m: n.matches, e: n.evals }) : t("Chiuso")}</div></div>${open ? `<button class="btn sm" data-a="vaultClose" data-id="${v.id}">${t("Chiudi")}</button><button class="btn sm ghost danger" data-a="vaultDel" data-id="${v.id}">${t("Elimina archivio")}</button>` : `<button class="btn sm pri" data-a="vaultOpen" data-id="${v.id}">${t("Apri con il codice")}</button>`}</div>`; }).join("") || `<div class="empty">${t("Nessun archivio nascosto.")}</div>`}</div>
   <p class="m" style="margin-top:6px">${t("Per nascondere un giocatore o una partita usa il pulsante 🔒 nella sua scheda. Gli archivi si richiudono da soli quando blocchi l'app.")}</p></section>`;
}
R.archivio = (orig => () => { const h = orig(); const i = h.indexOf("</div></div>"); return i > 0 ? h.slice(0, i + 12) + vaultPanel() + h.slice(i + 12) : vaultPanel() + h; })(R.archivio);
function vaultAsk(v, title, onOk) {
  sheet(`<h2>${esc(title)}</h2><p class="sub">${esc(v.name)}</p><form id="vaf" class="col"><input type="password" id="vaPin" inputmode="text" autocomplete="off" placeholder="${t("Codice o password dell'archivio")}" required><div class="warn" id="vaErr"></div><div class="row end"><button type="button" class="btn" data-a="closeSheetBtn">${t("Annulla")}</button><button class="btn pri">${t("Conferma")}</button></div></form>`);
  $("#vaPin").focus();
  $("#vaf").onsubmit = async e => { e.preventDefault(); const f = Vault.fails[v.id] || { n: 0, until: 0 }; if (f.until > Date.now()) { $("#vaErr").textContent = t("Troppi tentativi. Riprova tra {s} secondi.", { s: Math.ceil((f.until - Date.now()) / 1000) }); return; }
    if (await Vault.check(v, $("#vaPin").value)) { Vault.fails[v.id] = { n: 0, until: 0 }; closeSheet(); onOk(); return; }
    f.n++; if (f.n >= 3) f.until = Date.now() + 30000 * 2 ** (f.n - 3); Vault.fails[v.id] = f; $("#vaErr").textContent = t("Codice errato."); $("#vaPin").value = ""; };
}
function vaultAssign(coll, id, vid) {
  const o = S[coll].get(id); if (!o) return; const set = (c, k, x) => put(c, k, { ...x, vault: vid || undefined });
  const owners = [id];
  if (coll === "players") for (const [eid, e] of [...S.evals]) if (e.playerId === id) { set("evals", eid, e); owners.push(eid); }
  for (const [mid, m] of [...S.media]) if (owners.includes(m.ownerId)) set("media", mid, m);
  set(coll, id, o);
  if (vid && !Vault.opened.has(vid)) { if (coll === "players") ui.playerId = null; if (coll === "matches") ui.matchId = null; }
}
Object.assign(A, {
  vaultNew: (el, ev, after) => {
    sheet(`<h2>${t("Nuovo archivio nascosto")}</h2><p class="sub small">${t("Scegli un nome e un codice (almeno 4 caratteri). Senza il codice gli elementi restano nascosti: annotalo in un posto sicuro.")}</p>
     <form id="vnf" class="col"><label class="f">${t("Nome")}<input type="text" id="vnN" required placeholder="${t("es. Trattative riservate")}"></label><label class="f">${t("Codice o password")}<input type="password" id="vnP" required minlength="4" autocomplete="new-password"></label><label class="f">${t("Ripeti il codice")}<input type="password" id="vnP2" required autocomplete="new-password"></label><div class="warn" id="vnErr"></div>
     <div class="row end"><button type="button" class="btn" data-a="closeSheetBtn">${t("Annulla")}</button><button class="btn pri">${t("Crea")}</button></div></form>`);
    $("#vnf").onsubmit = async e => { e.preventDefault(); const n = $("#vnN").value.trim(), p = $("#vnP").value; if (p.length < 4) { $("#vnErr").textContent = t("Il codice deve avere almeno 4 caratteri."); return; } if (p !== $("#vnP2").value) { $("#vnErr").textContent = t("I due codici non coincidono."); return; }
      const salt = C.b64(C.rand(16)); const v = { id: uid(), name: n, salt, hash: await Vault.hash(p, salt), created: today() }; Vault.save([...Vault.list(), v]); Vault.opened.add(v.id); closeSheet(); toast(t("Archivio nascosto creato (aperto)")); if (after) after(v.id); else render(true); };
  },
  vaultOpen: el => { const v = Vault.list().find(x => x.id === el.dataset.id); if (!v) return; vaultAsk(v, t("Apri l'archivio nascosto"), () => { Vault.opened.add(v.id); Vault.reveal(v.id); toast(t("Archivio aperto: {n}", { n: v.name })); render(true); }); },
  vaultClose: el => { Vault.opened.delete(el.dataset.id); Vault.hideAll(); if (ui.playerId && !P(ui.playerId)) ui.playerId = null; if (ui.matchId && !S.matches.get(ui.matchId)) ui.matchId = null; toast(t("Archivio chiuso")); render(true); },
  vaultCloseAll: () => { Vault.opened.clear(); Vault.hideAll(); if (ui.playerId && !P(ui.playerId)) ui.playerId = null; if (ui.matchId && !S.matches.get(ui.matchId)) ui.matchId = null; toast(t("Archivi nascosti chiusi")); render(); },
  vaultDel: el => { const v = Vault.list().find(x => x.id === el.dataset.id); if (!v) return; vaultAsk(v, t("Elimina l'archivio: gli elementi tornano visibili"), () => { for (const c of Vault.COLLS) for (const [id, o] of [...S[c]]) if (o.vault === v.id) put(c, id, { ...o, vault: undefined }); Vault.save(Vault.list().filter(x => x.id !== v.id)); Vault.opened.delete(v.id); toast(t("Archivio eliminato: gli elementi sono di nuovo visibili")); render(true); }); },
  vaultPick: el => {
    const coll = el.dataset.coll, id = el.dataset.id; const o = S[coll].get(id); if (!o) return; const vs = Vault.list();
    sheet(`<h2>🔒 ${t("Archivio nascosto")}</h2><p class="sub small">${t("L'elemento sparisce da elenchi e ricerche finché non apri l'archivio con il codice.")}${coll === "players" ? " " + t("Le sue valutazioni vengono nascoste insieme a lui.") : ""}</p>
     ${o.vault ? `<div class="banner info">${t("Ora è in: {n}", { n: esc(Vault.name(o.vault)) })}</div><button class="btn" id="vpOut">${t("Togli dall'archivio nascosto")}</button>` : ""}
     <div class="list">${vs.filter(v => v.id !== o.vault).map(v => `<button class="item click" data-vp="${v.id}"><span>${Vault.opened.has(v.id) ? "🔓" : "🔒"}</span><span class="grow t" style="text-align:left">${esc(v.name)}</span><span class="m">${t("Sposta qui")}</span></button>`).join("") || `<div class="empty">${t("Nessun archivio nascosto.")}</div>`}</div>
     <div class="row between"><button class="btn" id="vpNew">+ ${t("Nuovo archivio nascosto")}</button><button class="btn ghost" data-a="closeSheetBtn">${t("Chiudi")}</button></div>`);
    $$("[data-vp]").forEach(b => b.onclick = () => { const vid = b.dataset.vp; closeSheet(); vaultAssign(coll, id, vid); toast(Vault.opened.has(vid) ? t("Spostato nell'archivio nascosto (aperto)") : t("Nascosto in «{n}»", { n: Vault.name(vid) })); render(); });
    const out = $("#vpOut"); if (out) out.onclick = () => { closeSheet(); vaultAssign(coll, id, null); toast(t("Di nuovo visibile")); render(true); };
    $("#vpNew").onclick = () => A.vaultNew(null, null, vid => { vaultAssign(coll, id, vid); toast(t("Spostato nell'archivio nascosto (aperto)")); render(true); });
  }
});

/* =========================================================
   RUOLI SUL CAMPO (scheda del giocatore)
   Il campo è diviso per reparti e corsie; ogni ruolo,
   classico o moderno, ha il suo punto da toccare.
   ========================================================= */
const ROLE_SPOT = { "Portiere": [5, 50], "Difensore centrale": [19, 50], "Terzino sinistro": [25, 12], "Terzino destro": [25, 88], "Quinto sinistro": [41, 7], "Quinto destro": [41, 93], "Mediano": [33, 65], "Regista": [33, 35], "Centrocampista centrale": [47, 50], "Mezzala": [55, 22], "Trequartista": [66, 50], "Ala sinistra": [74, 12], "Ala destra": [74, 88], "Seconda punta": [81, 32], "Falso 9": [81, 68], "Punta centrale": [91, 50] };
const ROLE_SHORT = { "Difensore centrale": "Dif. centrale", "Terzino sinistro": "Terzino sx", "Terzino destro": "Terzino dx", "Quinto sinistro": "Quinto sx", "Quinto destro": "Quinto dx", "Centrocampista centrale": "Centrocampista", "Ala sinistra": "Ala sx", "Ala destra": "Ala dx", "Seconda punta": "2ª punta", "Punta centrale": "Prima punta" };
const MODERN_ARCH = new Set(["gk-mod", "dc-imp", "dc-brac", "fb-inv", "fb-quinto", "fb-cos", "mid-btb", "mid-pal", "am-ins", "w-inv", "w-rac", "st-mov", "st-f9"]);
const ARCH_EXTRA = [["dc-brac", "Braccetto (difesa a tre)", "Wide centre-back in a back three", "dc"], ["dc-lib", "Libero", "Sweeper (libero)", "dc"], ["fb-cos", "Terzino costruttore (terzo centrale)", "Build-up full-back (third centre-back)", "fb"], ["w-tor", "Tornante (esterno di centrocampo)", "Wide midfielder who tracks back", "w"]];
Migrate.config = (orig => function () { orig.call(Migrate); const c = S.settings.get("config"); if (!c || (c.av || 0) >= 1) return; c.archetypes = c.archetypes || []; for (const [id, it, en, group] of ARCH_EXTRA) if (!c.archetypes.some(a => a.id === id)) c.archetypes.push({ id, it, en, group }); c.av = 1; put("settings", "config", c); })(Migrate.config);
function roleShort(r) { const x = L(Cfg.role(r)) || r; if (Prefs.lang === "it" && ROLE_SHORT[r]) return ROLE_SHORT[r]; return x.length > 13 ? x.slice(0, 12) + "…" : x; }
function rolePitch(d) {
  const cfg = Cfg.get(); const sel = d.roles || []; const Lc = "var(--pitch-line)"; const main = sel[0];
  const bands = [[0, 10, t("POR")], [10, 29, t("Difesa")], [29, 43, t("Mediana")], [43, 59, t("Centrocampo")], [59, 76, t("Trequarti")], [76, 100, t("Attacco")]];
  const spots = cfg.roles.filter(r => !r.hidden).map(r => { const [x, y] = ROLE_SPOT[r.id] || [r.x ?? 50, r.y ?? 50]; const X = x * 1.05, Y = y * 0.68; const on = sel.includes(r.id); const isMain = r.id === main;
    return `<g class="rspot${isMain ? " main" : on ? " sec" : ""}" data-rspot="${esc(r.id)}" role="button" tabindex="0" aria-pressed="${on}" aria-label="${esc(L(r))}"><title>${esc(L(r))}</title><circle cx="${X}" cy="${Y}" r="4.3"/><text x="${X}" y="${Y + 1.1}" text-anchor="middle" font-size="2.6" font-weight="800">${esc(roleCode(r.id))}</text><text x="${X}" y="${Y + 7.4}" text-anchor="middle" font-size="2.15" class="rsn">${isMain ? "★ " : ""}${esc(roleShort(r.id))}</text></g>`; }).join("");
  const pos = d.pos ? `<circle cx="${d.pos.x * 1.05}" cy="${d.pos.y * 0.68}" r="1.9" class="rpos"/>` : "";
  const svg = `<svg class="pitch rpitch" id="rolePitch" viewBox="-3 -3 111 74" role="group" aria-label="${t("Ruoli sul campo")}"><rect x="-3" y="-3" width="111" height="74" fill="var(--pitch)"/>
   ${bands.map(([a, b], i) => `<rect x="${a * 1.05}" y="0" width="${(b - a) * 1.05}" height="68" fill="${i % 2 ? "rgba(255,255,255,.035)" : "rgba(0,0,0,.035)"}"/>`).join("")}
   <g fill="none" stroke="${Lc}" stroke-width=".5" pointer-events="none"><rect x="0" y="0" width="105" height="68"/><line x1="52.5" y1="0" x2="52.5" y2="68"/><circle cx="52.5" cy="34" r="9.15"/><rect x="0" y="13.84" width="16.5" height="40.32"/><rect x="0" y="24.84" width="5.5" height="18.32"/><rect x="88.5" y="13.84" width="16.5" height="40.32"/><rect x="99.5" y="24.84" width="5.5" height="18.32"/></g>
   <g stroke="${Lc}" stroke-width=".3" stroke-dasharray="1.2 1.2" opacity=".6" pointer-events="none">${bands.slice(1).map(([a]) => `<line x1="${a * 1.05}" x2="${a * 1.05}" y1="0" y2="68"/>`).join("")}<line x1="0" x2="105" y1="${22 * .68}" y2="${22 * .68}"/><line x1="0" x2="105" y1="${78 * .68}" y2="${78 * .68}"/></g>
   ${bands.map(([a, b, n]) => `<text x="${(a + b) / 2 * 1.05}" y="-.8" text-anchor="middle" font-size="2.3" fill="${Lc}" pointer-events="none" class="rband">${esc(n)}</text>`).join("")}
   ${pos}${spots}<text x="104" y="70.6" fill="${Lc}" font-size="2.6" text-anchor="end" pointer-events="none">${t("attacco")} →</text><text x="1" y="70.6" fill="${Lc}" font-size="2.4" pointer-events="none">↑ ${t("Fascia sinistra")} · ↓ ${t("Fascia destra")}</text></svg>`;
  const arch = main ? archetypesFor(main) : [];
  return `<div class="pitchbox rpbox">${svg}</div>
   <div class="rsel"><span class="m">${t("Ruoli scelti")}:</span>${sel.map((r, i) => `<span class="chip ${i ? "" : "on"}" aria-pressed="${!i}">${i ? `<button type="button" class="lnk" data-rmain="${esc(r)}" title="${t("Rendi principale")}">☆</button>` : "★"} ${esc(L(Cfg.role(r)) || r)} <button type="button" class="lnk" data-rdel="${esc(r)}" aria-label="${t("Togli")}">✕</button></span>`).join("") || `<span class="m">${t("nessuno: tocca un ruolo sul campo")}</span>`}</div>
   ${arch.length ? `<div class="rarch"><span class="m">${t("Interpretazione")}:</span>${["c", "m"].map(k => { const xs = arch.filter(a => MODERN_ARCH.has(a.id) === (k === "m")); return xs.length ? `<span class="rgrp">${k === "m" ? t("moderna") : t("classica")}</span>${xs.map(a => `<button type="button" class="chip" data-rarch="${esc(a.id)}" aria-pressed="${d.archetype === a.id}">${esc(L(a))}</button>`).join("")}` : ""; }).join("")}</div>` : ""}
   <p class="m">${t("Tocca un ruolo per sceglierlo: il primo è il principale (★) e decide i parametri della valutazione. Tocca un punto libero del campo per la posizione esatta.")}</p>`;
}
window.playerEditor = (orig => function () {
  const h = orig(); return h.replace(/<div class="chips" id="pRoles"[\s\S]*?<\/div>\s*<div class="pitchbox"><svg[\s\S]*?<\/svg><\/div>/, rolePitch(ui.pdraft || {}));
})(window.playerEditor);
document.addEventListener("click", e => {
  const svg = e.target.closest && e.target.closest("#rolePitch"); const rm = e.target.closest && e.target.closest("[data-rmain],[data-rdel],[data-rarch]");
  if (!svg && !rm) return; const d = ui.pdraft; if (!d) return;
  if (rm) { e.preventDefault(); syncPlayer(); d.roles = d.roles || [];
    if (rm.dataset.rmain) { const r = rm.dataset.rmain; d.roles = [r, ...d.roles.filter(x => x !== r)]; const [x, y] = ROLE_SPOT[r] || [50, 50]; d.pos = { x, y }; if (d.archetype && !archetypesFor(r).some(a => a.id === d.archetype)) d.archetype = ""; }
    else if (rm.dataset.rdel) d.roles = d.roles.filter(x => x !== rm.dataset.rdel);
    else { d.archetype = d.archetype === rm.dataset.rarch ? "" : rm.dataset.rarch; const s = $("#pArch"); if (s) { if (![...s.options].some(o => o.value === d.archetype)) s.insertAdjacentHTML("beforeend", `<option value="${esc(d.archetype)}">${esc(archL(d.archetype))}</option>`); s.value = d.archetype; } }
    render(true); return; }
  syncPlayer(); const g = e.target.closest("[data-rspot]");
  if (g) { const r = g.dataset.rspot; d.roles = d.roles || []; if (d.roles.includes(r)) d.roles = d.roles.filter(x => x !== r); else { d.roles.push(r); if (d.roles.length === 1) { const [x, y] = ROLE_SPOT[r] || [50, 50]; d.pos = { x, y }; } } }
  else d.pos = pitchPoint(svg, e);
  render(true);
});
document.addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && e.target.closest && e.target.closest("[data-rspot]")) { e.preventDefault(); e.target.dispatchEvent(new MouseEvent("click", { bubbles: true })); } });

/* =========================================================
   RIUNIONI E INCARICHI: crea al volo partecipanti,
   giocatori e partite senza uscire dalla scheda
   ========================================================= */
const newPlayerRec = (first, last, role, club) => ({ first, last, club, roles: role ? [role] : [], pos: role && ROLE_SPOT[role] ? { x: ROLE_SPOT[role][0], y: ROLE_SPOT[role][1] } : null, verdict: "rivedere", tags: [], listIds: [], sex: "Uomo", contract: {}, physique: {}, pros: [], cons: [], injuries: [], relations: [] });
const roleOpts = () => Cfg.get().roles.filter(r => !r.hidden).map(r => `<option value="${esc(r.id)}">${esc(L(r))}</option>`).join("");
function inlinePlayerForm(k) { return `<details class="inl" id="${k}New"><summary>+ ${t("Crea un nuovo giocatore")}</summary><div class="inlrow"><input type="text" data-np="first" placeholder="${t("Nome")}"><input type="text" data-np="last" placeholder="${t("Cognome")}"><select data-np="role"><option value="">${t("Ruolo")} —</option>${roleOpts()}</select><input type="text" data-np="club" placeholder="${t("Club")}"><button type="button" class="btn sm" data-npadd="${k}">${t("Aggiungi")}</button></div></details>`; }
function readNP(k) { const box = $("#" + k + "New"); const v = n => (box.querySelector(`[data-np="${n}"]`) || {}).value || ""; const o = { first: v("first").trim(), last: v("last").trim(), role: v("role"), club: v("club").trim() }; if (!o.first && !o.last) { toast(t("Scrivi almeno nome o cognome")); return null; } box.querySelectorAll("input").forEach(x => x.value = ""); return o; }
function addChip(cid, v, n) { const c = $("#" + cid); if (!c) return; c.querySelectorAll(".m").forEach(x => { if (x.textContent === "—") x.remove(); }); c.insertAdjacentHTML("afterbegin", `<button type="button" class="chip" data-v="${v}" data-n="${esc(n.toLowerCase())}" aria-pressed="true">${esc(n)}</button>`); }
window.meetSheet = (orig => function (id, date) {
  orig(id, date);
  const pc = $("#mtPeople"); if (pc) pc.insertAdjacentHTML("afterend", `<div class="row inlbar"><details class="inl" id="stNew"><summary>+ ${t("Nuovo partecipante")}</summary><div class="inlrow"><input type="text" id="isN" placeholder="${t("Nome e cognome")}"><select id="isR">${STAFF_ROLES.map(([k, n]) => `<option value="${k}">${esc(t(n))}</option>`).join("")}</select><input type="email" id="isE" placeholder="${t("Email")}"><input type="tel" id="isT" placeholder="${t("Telefono")}"><button type="button" class="btn sm pri" id="isAdd">${t("Aggiungi")}</button></div></details><button type="button" class="btn sm ghost" id="isDelMode">🗑 ${t("Elimina contatti")}</button></div>`);
  const pl = $("#mtPl"); if (pl) pl.insertAdjacentHTML("afterend", inlinePlayerForm("mtPl"));
  const add = $("#isAdd"); if (add) add.onclick = () => { const n = $("#isN").value.trim(); if (!n) { toast(t("Scrivi il nome")); return; } const sid = uid(); put("staff", sid, { name: n, role: $("#isR").value, email: $("#isE").value.trim(), phone: $("#isT").value.trim(), org: "", notes: "" }); addChip("mtPeople", sid, n + " · " + staffRoleL($("#isR").value)); ["#isN", "#isE", "#isT"].forEach(s => $(s).value = ""); toast(t("Partecipante aggiunto")); };
  const dm = $("#isDelMode"); if (dm) dm.onclick = () => { const on = pc.classList.toggle("delmode"); dm.setAttribute("aria-pressed", on); dm.textContent = on ? "✓ " + t("Fine") : "🗑 " + t("Elimina contatti"); if (on) toast(t("Tocca un contatto per eliminarlo dalla rubrica")); };
  if (pc) pc.addEventListener("click", ev => { if (!pc.classList.contains("delmode")) return; const b = ev.target.closest(".chip"); if (!b) return; ev.stopPropagation(); ev.preventDefault(); if (b.dataset.sure !== "1") { b.dataset.sure = "1"; b.classList.add("sure"); b.textContent = "🗑 " + t("Elimina?") + " " + b.textContent; return; } del("staff", b.dataset.v); b.remove(); toast(t("Contatto eliminato")); }, true);
})(window.meetSheet);
document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest("[data-npadd]"); if (!b) return; const k = b.dataset.npadd; const o = readNP(k); if (!o) return; const pid = uid();
  put("players", pid, { ...newPlayerRec(o.first, o.last, o.role, o.club), notes: t("Creato al volo il {d}.", { d: fmtDate(today()) }) }); const nm = [o.first, o.last].filter(Boolean).join(" ");
  if (k === "mtPl") addChip("mtPl", pid, nm); else { const s = $("#" + k); if (s) { s.insertAdjacentHTML("beforeend", `<option value="${pid}">${esc(nm)}</option>`); s.value = pid; } }
  const det = $("#" + k + "New"); if (det) det.open = false; toast(t("Giocatore creato: {n}", { n: nm }));
});
window.taskSheet = (orig => function (id, preset) {
  orig(id, preset);
  const p = $("#tkP"); if (p) p.closest("label").classList.add("full"); if (p) p.closest("label").insertAdjacentHTML("afterend", `<div class="full">${inlinePlayerForm("tkP")}</div>`);
  const m = $("#tkM"); if (m) m.closest("label").classList.add("full"); if (m) m.closest("label").insertAdjacentHTML("afterend", `<div class="full"><details class="inl" id="tkMNew"><summary>+ ${t("Crea una nuova partita")}</summary><div class="inlrow"><input type="text" id="nmH" placeholder="${t("Squadra di casa")}"><input type="text" id="nmA" placeholder="${t("Squadra in trasferta")}"><input type="date" id="nmD" value="${today()}"><input type="time" id="nmT"><input type="text" id="nmC" placeholder="${t("Competizione")}"><button type="button" class="btn sm pri" id="nmAdd">${t("Aggiungi")}</button></div></details></div>`);
  const b = $("#nmAdd"); if (b) b.onclick = () => { const h = $("#nmH").value.trim(), a = $("#nmA").value.trim(); if (!h || !a) { toast(t("Scrivi le due squadre")); return; } const mid = uid();
    put("matches", mid, { home: h, away: a, date: $("#nmD").value || today(), time: $("#nmT").value, competition: $("#nmC").value.trim(), venue: "", type: (Cfg.get().matchTypes[0] || {}).id || "Campionato", status: "pianificata", events: [], targets: [], tags: [] });
    const s = $("#tkM"); s.insertAdjacentHTML("beforeend", `<option value="${mid}">${fmtDate($("#nmD").value || today())} · ${esc(h)} – ${esc(a)}</option>`); s.value = mid; $("#tkMNew").open = false; toast(t("Partita creata: {h} – {a}", { h, a })); };
})(window.taskSheet);

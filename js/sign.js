"use strict";
/* =========================================================
   MM Scout — profilo dell'osservatore, firma
   disegnata, firma delle valutazioni e dei documenti con
   impronta digitale (SHA-256) per verificarne l'integrità.
   ========================================================= */
const Sign = {
  async sha256(str) { const h = new Uint8Array(await crypto.subtle.digest("SHA-256", C.te.encode(str))); return [...h].map(b => b.toString(16).padStart(2, "0")).join(""); },
  evalContent(e) { return JSON.stringify({ p: e.playerId, d: e.date, h: e.home, a: e.away, m: e.minutes, by: e.by, r: e.r || {}, n: e.notes || {}, ev: (e.evidence || []).map(x => [x.area, x.min, x.text]), s: e.summary || "" }); },
  async evalHash(e) { return this.sha256(this.evalContent(e)); },
  async check(e) { if (!e || !e.signature) return null; return (await this.evalHash(e)) === e.signature.hash; },
  fmtHash(h) { return (h || "").slice(0, 32).match(/.{1,4}/g).join(" ").toUpperCase(); },
  block(sig, valid) {
    return `<div class="signbox ${valid === false ? "bad" : "ok"}">${sig.img ? `<img class="sigimg" src="${sig.img}" alt="${t("Firma")}">` : ""}<div><div class="m">${t("Firmato digitalmente da")}</div><b>${esc(sig.by)}</b>${sig.title ? `<div class="m">${esc(sig.title)}</div>` : ""}<div class="m">${new Date(sig.date).toLocaleString(locale())}</div><div class="m mono" style="font-size:11px">${t("Impronta")}: ${esc(this.fmtHash(sig.hash))}</div>${valid === false ? `<div class="warn">${t("Attenzione: la valutazione è stata modificata dopo la firma.")}</div>` : valid ? `<div class="okc">✓ ${t("Firma valida: contenuto non modificato")}</div>` : ""}</div></div>`;
  },
  // firma in fondo a un documento condiviso o stampato
  async signDoc(html) {
    const p = Profile.get(); const i = html.indexOf('<div class="foot">'); if (i < 0) return html;
    const body = html.slice(html.indexOf('<div class="doc">'), i); const hash = await this.sha256(body);
    const blk = `<div class="panel" style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">${p.signature ? `<img src="${p.signature}" alt="" style="max-width:240px;max-height:90px">` : ""}<div><div class="m">${esc(t("Firmato da"))}</div><b>${esc(p.name || "")}</b>${p.title ? `<div class="m">${esc(p.title)}</div>` : ""}${p.license ? `<div class="m">${esc(t("Tessera / licenza"))}: ${esc(p.license)}</div>` : ""}<div class="m">${esc(new Date().toLocaleString(locale()))}</div><div class="m" style="font-family:ui-monospace,Menlo,monospace;font-size:11px">${esc(t("Impronta del documento (SHA-256)"))}: ${esc(this.fmtHash(hash))}</div></div></div>`;
    return html.slice(0, i) + blk + html.slice(i);
  },
  askPassword(title, onOk) {
    sheet(`<h2>${esc(title)}</h2><p class="sub">${t("Per confermare che sei tu, inserisci la tua password.")}</p><form id="spf" class="col"><input type="password" id="spPw" autocomplete="current-password" required><div class="warn" id="spErr"></div><div class="row end"><button type="button" class="btn" data-a="closeSheetBtn">${t("Annulla")}</button><button class="btn pri">${t("Firma")}</button></div></form>`);
    $("#spPw").focus();
    $("#spf").onsubmit = async e => { e.preventDefault(); try { const raw = await Store.unwrap($("#spPw").value); raw.fill(0); closeSheet(); await onOk(); } catch (err) { $("#spErr").textContent = t("Password errata."); } };
  },
  async signEval(id) {
    const p = Profile.get(); if (!p.name) { toast(t("Prima completa il tuo profilo scout (nome e firma).")); go("profilo"); return; }
    this.askPassword(t("Firma la valutazione"), async () => {
      const e = S.evals.get(id); const hash = await this.evalHash(e);
      put("evals", id, { ...e, signature: { by: p.name, title: p.title || "", img: p.signature || "", date: new Date().toISOString(), hash, account: (Accounts.acc || {}).id || "" } });
      toast(t("Valutazione firmata")); render(true);
    });
  }
};
// mostra il riquadro della firma (verifica asincrona dell'impronta)
async function fillSignBoxes() { for (const el of $$("[data-sigcheck]")) { const e = S.evals.get(el.dataset.sigcheck); el.removeAttribute("data-sigcheck"); if (!e || !e.signature) continue; el.innerHTML = Sign.block(e.signature, await Sign.check(e)); } }

/* ---------- pagina profilo scout ---------- */
R.profilo = () => {
  const p = Profile.get(); const acc = Accounts.acc || {};
  return `<div class="head"><div><h1>${t("Profilo scout")}</h1><p class="sub">${t("I tuoi dati da osservatore: compaiono su giocatori, partite e report che crei, nelle condivisioni e nel portfolio.")}</p></div></div>
  <section class="panel"><div class="row" style="gap:16px">${p.photo ? `<img src="${p.photo}" alt="" style="width:96px;height:96px;border-radius:50%;object-fit:cover">` : `<div class="avatar" style="width:96px;height:96px;border-radius:50%;font-size:30px">${esc((p.name || "?").split(/\s+/).map(x => x[0]).join("").slice(0, 2).toUpperCase())}</div>`}
   <div class="col" style="gap:6px"><button class="btn sm" data-a="pickProfPhoto">${p.photo ? t("Cambia foto") : t("Aggiungi foto")}</button>${p.photo ? `<button class="btn sm ghost" data-a="rmProfPhoto">${t("Rimuovi foto")}</button>` : ""}</div></div>
   <div class="fgrid" style="margin-top:14px">
    <label class="f">${t("Nome e cognome")}<input type="text" id="prName" value="${esc(p.name)}"></label>
    <label class="f">${t("Qualifica")}<input type="text" id="prTitle" value="${esc(p.title)}" placeholder="${t("es. Osservatore calcistico")}"></label>
    <label class="f">${t("Email di accesso")}<input type="email" id="prEmail" value="${esc(acc.email || p.email)}"></label>
    <label class="f">${t("Telefono")}<input type="tel" id="prPhone" value="${esc(p.phone)}"></label>
    <label class="f">${t("Città / area coperta")}<input type="text" id="prCity" value="${esc(p.city)}"></label>
    <label class="f">${t("Lingue")}<input type="text" id="prLang" value="${esc(p.languages)}"></label>
    <label class="f">${t("Iniziali (per «Valutato da»)")}<input type="text" id="prInit" value="${esc(p.initials)}"></label>
    <label class="f">${t("Tessera / licenza")}<input type="text" id="prLicense" value="${esc(p.license)}"></label>
    <label class="f">${t("Club o agenzia per cui lavori")}<input type="text" id="prOrg" value="${esc(p.org)}"></label>
    <label class="f full">${t("Presentazione breve")}<textarea id="prBio">${esc(p.bio)}</textarea></label>
    <label class="f full">${t("Formazione e certificati (uno per riga)")}<textarea id="prCerts">${esc(p.certs)}</textarea></label>
    <label class="f full">${t("Link (LinkedIn, X…), uno per riga")}<textarea id="prLinks" style="min-height:60px">${esc(p.links)}</textarea></label></div>
   <div class="row end" style="margin-top:10px"><button class="btn pri" data-a="saveProfile">${t("Salva profilo")}</button></div></section>
  <section class="panel"><h2>${t("La tua firma")}</h2><p class="sub small">${t("Disegnala con il dito o il trackpad, oppure carica un'immagine. Comparirà sulle valutazioni e sui documenti che firmi.")}</p>
   ${p.signature ? `<div style="margin:10px 0"><img class="sigimg" src="${p.signature}" alt="${t("Firma")}" style="border:1px solid var(--line)"></div>` : ""}
   <canvas class="sigpad" id="sigpad" width="1040" height="340" aria-label="${t("Area per disegnare la firma")}"></canvas>
   <div class="row" style="margin-top:8px"><button class="btn sm" data-a="sigClear">${t("Cancella")}</button><button class="btn sm" data-a="sigUpload">${t("Carica immagine")}</button><button class="btn sm pri" data-a="sigSave">${t("Salva firma")}</button>${p.signature ? `<button class="btn sm danger" data-a="sigRemove">${t("Elimina firma")}</button>` : ""}</div></section>
  <section class="panel"><h2>${t("Il tuo lavoro")}</h2>${(() => { const mine = c => [...S[c].values()].filter(x => x.createdBy && x.createdBy.id === acc.id).length; return `<div class="stats" style="margin-top:8px"><div class="stat"><b>${mine("players")}</b><span>${t("Giocatori creati")}</span></div><div class="stat"><b>${mine("evals")}</b><span>${t("Valutazioni")}</span></div><div class="stat"><b>${[...S.matches.values()].filter(m => m.status === "vista" && m.createdBy && m.createdBy.id === acc.id).length}</b><span>${t("Partite viste")}</span></div><div class="stat"><b>${[...S.evals.values()].filter(e => e.signature).length}</b><span>${t("Valutazioni firmate")}</span></div></div>`; })()}
   <div class="row" style="margin-top:10px"><button class="btn" data-a="menuGo" data-v="portfolio">${t("Apri il portfolio")}</button><button class="btn" data-a="menuGo" data-v="attivita">${t("Vedi l'attività")}</button></div></section>`;
};
function bindSigPad() {
  const c = $("#sigpad"); if (!c) return; const ctx = c.getContext("2d"); let down = false, last = null; c._dirty = false;
  ctx.lineWidth = 5; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#16233d";
  const pos = e => { const r = c.getBoundingClientRect(); return [(e.clientX - r.left) * c.width / r.width, (e.clientY - r.top) * c.height / r.height]; };
  c.onpointerdown = e => { down = true; last = pos(e); c.setPointerCapture(e.pointerId); };
  c.onpointermove = e => { if (!down) return; const p = pos(e); ctx.beginPath(); ctx.moveTo(...last); ctx.lineTo(...p); ctx.stroke(); last = p; c._dirty = true; };
  c.onpointerup = c.onpointercancel = () => { down = false; };
}
function trimCanvas(c) {
  const ctx = c.getContext("2d"); const d = ctx.getImageData(0, 0, c.width, c.height).data; let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 10) { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
  if (x1 <= x0) return null; const pad = 10; const w = x1 - x0 + pad * 2, h = y1 - y0 + pad * 2; const o = document.createElement("canvas"); o.width = w; o.height = h; o.getContext("2d").drawImage(c, x0 - pad, y0 - pad, w, h, 0, 0, w, h); return o.toDataURL("image/png");
}
Object.assign(A, {
  saveProfile: () => {
    const v = s => $(s) ? $(s).value : ""; const email = v("#prEmail").trim().toLowerCase(); const acc = Accounts.acc;
    if (email && acc && email !== acc.email) { if (!Accounts.validEmail(email)) { toast(t("Scrivi un indirizzo email valido.")); return; } if (Accounts.byEmail(email)) { toast(t("Esiste già un profilo con questa email su questo dispositivo.")); return; } Accounts.update(acc.id, { email }); Prefs.set("lastEmail", email); }
    const p = { ...Profile.get(), name: v("#prName").trim(), title: v("#prTitle"), email: email || Profile.get().email, phone: v("#prPhone"), city: v("#prCity"), languages: v("#prLang"), initials: v("#prInit").trim(), license: v("#prLicense"), org: v("#prOrg"), bio: v("#prBio"), certs: v("#prCerts"), links: v("#prLinks") };
    put("settings", "profile", p); if (acc) Accounts.update(acc.id, { name: p.name }); toast(t("Profilo salvato")); render(true);
  },
  pickProfPhoto: async () => { const [f] = await pickFile("image/*"); if (!f) return; put("settings", "profile", { ...Profile.get(), photo: await photoToDataURL(f, 300) }); render(true); },
  rmProfPhoto: () => { put("settings", "profile", { ...Profile.get(), photo: "" }); render(true); },
  sigClear: () => { const c = $("#sigpad"); c.getContext("2d").clearRect(0, 0, c.width, c.height); c._dirty = false; },
  sigSave: () => { const c = $("#sigpad"); if (!c._dirty) { toast(t("Disegna prima la firma.")); return; } const img = trimCanvas(c); if (!img) return; put("settings", "profile", { ...Profile.get(), signature: img }); toast(t("Firma salvata")); render(true); },
  sigUpload: async () => { const [f] = await pickFile("image/*"); if (!f) return; put("settings", "profile", { ...Profile.get(), signature: await photoToDataURL(f, 520) }); toast(t("Firma salvata")); render(true); },
  sigRemove: () => { put("settings", "profile", { ...Profile.get(), signature: "" }); render(true); },
  signEval: el => Sign.signEval(el.dataset.id)
});

// salvataggio della valutazione: se il contenuto firmato cambia, la firma viene rimossa
A.saveEval = async () => {
  syncEval(); const { _id, ...o } = ui.edraft; o.evidence = (o.evidence || []).filter(x => x.text.trim()); for (const ak in o.r) if (!Object.keys(o.r[ak]).length) delete o.r[ak];
  if (o.signature && (await Sign.evalHash(o)) !== o.signature.hash) { delete o.signature; toast(t("La valutazione è cambiata: la firma è stata rimossa. Puoi firmarla di nuovo.")); } else toast(t("Valutazione salvata"));
  const eid = _id || uid(); put("evals", eid, { ...o, updatedAt: Date.now() });
  ui.edraft = null; ui.view = "giocatori"; ui.ptab = "caratteristiche"; ui.evalSel = eid; ui.playerId = o.playerId; history.replaceState(null, "", "#giocatori"); render(); window.scrollTo(0, 0);
};

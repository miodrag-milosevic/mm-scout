/* MM Scout 0.7 (beta) — torna su, esporta note, filtri dei giocatori, committenti di esempio,
   rosa attuale contro candidati nei profili ideali, codice di firma, cambio email di accesso.
   © Miodrag Milosevic. Vietato divulgare, copiare o modificare senza consenso dell'autore. */
"use strict";

/* ---------- 1. pulsante «Torna su» (tutte le pagine, telefono, tablet e computer) ---------- */
const ToTop = (() => {
  const b = document.createElement("button"); b.type = "button"; b.className = "totop noprint"; b.hidden = true;
  b.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 5l-7 7 1.4 1.4L11 8.8V20h2V8.8l4.6 4.6L19 12z" fill="currentColor"/></svg>';
  const sheetOpen = () => { const r = $("#sheetRoot"); return !!(r && r.children.length); };
  const upd = () => { const show = App.unlocked && scrollY > 500 && !sheetOpen(); if (b.hidden === show) { b.hidden = !show; } b.setAttribute("aria-label", t("Torna su")); b.title = t("Torna su"); };
  b.onclick = () => { const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches; scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); const h = $("#view h1, #view h2"); if (h) setTimeout(() => { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }, reduce ? 0 : 400); };
  const mount = () => { if (!b.isConnected) document.body.appendChild(b); upd(); };
  if (document.body) mount(); else addEventListener("DOMContentLoaded", mount);
  addEventListener("scroll", upd, { passive: true });
  try { const r = $("#sheetRoot"); if (r) new MutationObserver(upd).observe(r, { childList: true }); } catch (e) { }
  return { upd };
})();
window.render = (orig => function () { const r = orig.apply(this, arguments); try { ToTop.upd(); exTidy($("#view")); const ob = $("#view > .orgbar"), hd = $("#view > .head"); if (ob && hd) hd.after(ob); } catch (e) { } return r; })(window.render);
render = window.render;

/* ---------- 2. negli esempi la parola «(esempio)» nel titolo è già detta dall'etichetta ESEMPIO ---------- */
const EX_SUFFIX = /\s*\((esempio|example|beispiel|primer|ejemplo)\)\s*$/i;
function exTidy(root) {
  if (!root) return;
  for (const b of root.querySelectorAll(".ex")) { const n = b.previousSibling; if (n && n.nodeType === 3 && EX_SUFFIX.test(n.textContent)) n.textContent = n.textContent.replace(EX_SUFFIX, " "); }
}

/* ---------- 3. Note: esporta (tutte, quelle che vedi, scelte a mano, per cartella) ---------- */
// ZIP senza compressione (formato «store»): un file .md per nota, nelle cartelle scelte
const Zip = {
  crcT: null,
  crc(u8) { if (!this.crcT) { this.crcT = new Uint32Array(256); for (let i = 0; i < 256; i++) { let c = i; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; this.crcT[i] = c >>> 0; } } let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = this.crcT[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; },
  make(files) {
    const te = new TextEncoder(), parts = [], cent = []; let off = 0; const d = new Date(); const dt = ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xFFFF, dd = (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF;
    for (const f of files) {
      const name = te.encode(f.name), data = typeof f.data === "string" ? te.encode(f.data) : f.data, crc = this.crc(data);
      const h = new DataView(new ArrayBuffer(30)); h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true); h.setUint16(10, dt, true); h.setUint16(12, dd, true); h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
      parts.push(new Uint8Array(h.buffer), name, data);
      const c = new DataView(new ArrayBuffer(46)); c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true); c.setUint16(12, dt, true); c.setUint16(14, dd, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true); c.setUint32(42, off, true);
      cent.push(new Uint8Array(c.buffer), name); off += 30 + name.length + data.length;
    }
    const csize = cent.reduce((s, x) => s + x.length, 0); const e = new DataView(new ArrayBuffer(22)); e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, csize, true); e.setUint32(16, off, true);
    return new Blob([...parts, ...cent, new Uint8Array(e.buffer)], { type: "application/zip" });
  }
};
const nSafe = s => String(s || "").replace(/[\\/:*?"<>|#%{}~&]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 60) || t("Nota senza titolo");
const nKindL = n => t(n.kind === "personale" ? "Personale" : "Lavoro");
const nMeta = n => [nKindL(n), n.playerId && P(n.playerId) ? pname(P(n.playerId)) : "", (n.tags || []).length ? "#" + n.tags.join(" #") : "", n.updated || n.created ? fmtDate(new Date(n.updated || n.created).toISOString().slice(0, 10)) : ""].filter(Boolean).join(" · ");
const nMd = n => `# ${n.title || t("Nota senza titolo")}\n\n_${nMeta(n)}_\n\n${(n.body || "").trim()}\n`;
const nTxt = n => `${n.title || t("Nota senza titolo")}\n${"=".repeat(Math.min(60, (n.title || "x").length))}\n${nMeta(n)}\n\n${(n.body || "").replace(/^#+\s*/gm, "").replace(/\*\*(.+?)\*\*/g, "$1").trim()}\n`;
const nVisible = () => { const f = ui.nf || "all", q = (ui.nq || "").toLowerCase().trim(); return notesList().filter(([, n]) => (f === "all" || (f === "pin" ? n.pinned : (n.kind || "lavoro") === f))).filter(([, n]) => !q || q.split(/\s+/).every(w => (n.title + " " + (n.body || "") + " " + (n.tags || []).join(" ") + " " + (n.playerId && P(n.playerId) ? pname(P(n.playerId)) : "")).toLowerCase().includes(w))); };
function noteExportSheet() {
  const all = notesList().sort((a, b) => (b[1].updated || 0) - (a[1].updated || 0)); const vis = nVisible(); const tags = [...new Set(all.flatMap(([, n]) => n.tags || []))].sort(cmpTxt);
  sheet(`<div class="row between"><h2>${t("Esporta note")}</h2><button class="iconbtn" data-a="closeSheetBtn" aria-label="${t("Chiudi")}">✕</button></div>
   <div class="fgrid"><label class="f">${t("Quali note")}<select id="neWhat"><option value="all">${t("Tutte le note")} (${all.length})</option><option value="vis" ${vis.length !== all.length ? "selected" : ""}>${t("Quelle che vedi ora")} (${vis.length})</option><option value="kind:lavoro">${t("Cartella")}: ${t("Lavoro")}</option><option value="kind:personale">${t("Cartella")}: ${t("Personale")}</option><option value="pin">${t("Fissate")}</option>${tags.map(g => `<option value="tag:${esc(g)}">${t("Tag")}: ${esc(g)}</option>`).join("")}<option value="pick">${t("Scelgo io le note…")}</option></select></label>
    <label class="f">${t("Formato")}<select id="neFmt"><option value="zip">${t("Cartella .zip (un file per nota)")}</option><option value="md">${t("Markdown (.md, un unico file)")}</option><option value="txt">${t("Testo semplice (.txt)")}</option><option value="html">${t("Pagina da stampare o salvare in PDF")}</option><option value="json">${t("File per reimportare (.json)")}</option></select></label>
    <label class="f" id="neDirBox">${t("Cartelle nello .zip")}<select id="neDir"><option value="kind">${t("Per tipo (Lavoro, Personale)")}</option><option value="tag">${t("Per primo tag")}</option><option value="player">${t("Per giocatore")}</option><option value="none">${t("Nessuna cartella")}</option></select></label></div>
   <div id="nePick" hidden><input type="search" id="nePickQ" placeholder="${t("Cerca nelle note…")}" aria-label="${t("Cerca nelle note")}"><div class="row" style="gap:6px;margin:6px 0"><button type="button" class="btn sm" data-a="nePickAll" data-v="1">${t("Seleziona tutte")}</button><button type="button" class="btn sm ghost" data-a="nePickAll" data-v="0">${t("Nessuna")}</button></div>
    <div class="list nepick">${all.map(([id, n]) => `<label class="chk item" data-s="${esc((n.title + " " + (n.tags || []).join(" ")).toLowerCase())}"><input type="checkbox" value="${id}"> <span class="grow"><b>${esc(n.title || t("Nota senza titolo"))}</b> <span class="m small">${esc(nMeta(n))}</span></span></label>`).join("")}</div></div>
   <p class="m small" id="neInfo"></p>
   <div class="row end"><button class="btn" data-a="closeSheetBtn">${t("Annulla")}</button><button class="btn pri" id="neGo">⇩ ${t("Esporta")}</button></div>`, true);
  const sel = () => { const w = $("#neWhat").value; if (w === "all") return all; if (w === "vis") return vis; if (w === "pin") return all.filter(([, n]) => n.pinned); if (w.startsWith("kind:")) return all.filter(([, n]) => (n.kind || "lavoro") === w.slice(5)); if (w.startsWith("tag:")) return all.filter(([, n]) => (n.tags || []).includes(w.slice(4))); const ids = new Set($$("#nePick input:checked").map(i => i.value)); return all.filter(([id]) => ids.has(id)); };
  const upd = () => { $("#nePick").hidden = $("#neWhat").value !== "pick"; $("#neDirBox").hidden = $("#neFmt").value !== "zip"; $("#neInfo").textContent = t("{n} note da esportare", { n: sel().length }); };
  $("#neWhat").onchange = upd; $("#neFmt").onchange = upd; $("#nePick").onchange = upd; upd();
  $("#nePickQ").oninput = e => { const q = e.target.value.toLowerCase(); $$("#nePick .item").forEach(r => r.hidden = q && !r.dataset.s.includes(q)); };
  $("#neGo").onclick = () => { const l = sel().map(([, n]) => n); if (!l.length) { toast(t("Nessuna nota scelta")); return; } noteExport(l, $("#neFmt").value, $("#neDir").value); closeSheet(); };
}
function noteExport(l, fmt, dir) {
  const stamp = today(); const base = `${t("Note")} MM Scout ${stamp}`;
  if (fmt === "md") download(base + ".md", l.map(nMd).join("\n---\n\n"), "text/markdown");
  else if (fmt === "txt") download(base + ".txt", l.map(nTxt).join("\n\n"), "text/plain");
  else if (fmt === "json") download(base + ".json", JSON.stringify(l.map(n => ({ title: n.title || "", body: n.body || "", tags: n.tags || [], kind: n.kind || "lavoro", pinned: !!n.pinned, created: n.created || null, updated: n.updated || null })), null, 2), "application/json");
  else if (fmt === "html") {
    const w = window.open("", "_blank"); if (!w) { toast(t("Il browser ha bloccato la nuova finestra")); return; }
    w.document.write(`<!doctype html><html lang="${Prefs.lang}"><head><meta charset="utf-8"><title>${esc(base)}</title><style>body{font:15px/1.55 -apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#17221C;max-width:760px;margin:32px auto;padding:0 20px}h1{font-size:22px;margin:28px 0 4px}.m{color:#5B6860;font-size:13px;margin:0 0 10px}article{border-top:1px solid #D3D9CF;padding-top:6px;break-inside:avoid}ul{padding-left:20px}</style></head><body><p class="m">${esc(appName())} · ${esc(fmtDate(stamp))} · ${t("{n} note", { n: l.length })}</p>${l.map(n => `<article><h1>${esc(n.title || t("Nota senza titolo"))}</h1><p class="m">${esc(nMeta(n))}</p>${mdHtml(n.body || "")}</article>`).join("")}</body></html>`);
    w.document.close(); setTimeout(() => { try { w.focus(); w.print(); } catch (e) { } }, 300);
  } else {
    const used = new Set(); const files = l.map(n => { const folder = dir === "kind" ? nKindL(n) : dir === "tag" ? ((n.tags || [])[0] || t("Senza tag")) : dir === "player" ? (n.playerId && P(n.playerId) ? pname(P(n.playerId)) : t("Senza giocatore")) : "";
      let nm = (folder ? nSafe(folder) + "/" : "") + nSafe(n.title); let k = nm, i = 2; while (used.has(k.toLowerCase())) k = nm + " (" + i++ + ")"; used.add(k.toLowerCase()); return { name: k + ".md", data: nMd(n) }; });
    download(base + ".zip", Zip.make(files));
  }
  toast(t("Esportate {n} note", { n: l.length }));
}
R.note = (orig => function () { const h = orig.apply(this, arguments); return h.replace(`<button class="btn" data-a="noteImport">`, `<button class="btn" data-a="noteExport">⇩ ${t("Esporta")}</button><button class="btn" data-a="noteImport">`); })(R.note);
A.noteExport = () => noteExportSheet();
A.nePickAll = el => { $$("#nePick .item:not([hidden]) input").forEach(i => i.checked = el.dataset.v === "1"); $("#nePick").dispatchEvent(new Event("change")); };

/* ---------- 4. scegliere i giocatori: filtri per ruolo, lista, giudizio, età e committente ---------- */
const AGE_BANDS = [["", "Tutte le età"], ["u17", "≤ 17"], ["18", "18–21"], ["22", "22–25"], ["26", "26–29"], ["30", "30+"]];
const ageBand = a => a == null ? "" : a <= 17 ? "u17" : a <= 21 ? "18" : a <= 25 ? "22" : a <= 29 ? "26" : "30";
function pfBar(cid) {
  const pl = [...S.players.values()].filter(p => !p.archived); const roles = [...new Set(pl.map(mainRole).filter(Boolean))].sort((a, b) => cmpTxt(roleL(a), roleL(b)));
  const lists = [...S.lists.entries()].filter(([, l]) => !l.smart); const vs = Cfg.get().verdicts || []; const orgs = Orgs.list();
  const s = (k, opts) => `<select data-pfb="${k}" aria-label="${t("Filtro")}">${opts}</select>`;
  return `<div class="pfbar" data-for="${cid}">${s("role", `<option value="">${t("Tutti i ruoli")}</option>${roles.map(r => `<option value="${esc(r)}">${esc(roleL(r))}</option>`).join("")}`)}${lists.length ? s("list", `<option value="">${t("Tutte le liste")}</option>${lists.map(([id, l]) => `<option value="${id}">${esc(l.name)}</option>`).join("")}`) : ""}${s("verdict", `<option value="">${t("Tutti i giudizi")}</option>${vs.map(v => `<option value="${esc(v.id)}">${esc(L(v))}</option>`).join("")}`)}${s("age", AGE_BANDS.map(([k, n]) => `<option value="${k}">${t(n)}</option>`).join(""))}${orgs.length ? s("org", `<option value="">${t("Tutti i committenti")}</option>${orgs.map(o => `<option value="${o.id}">${esc(o.name)}</option>`).join("")}`) : ""}<label class="chk small"><input type="checkbox" data-pfb="sel"> ${t("Solo scelti")}</label><span class="m small" data-pfcount></span><span class="grow"></span><button type="button" class="btn sm ghost" data-a="pfbAll" data-for="${cid}">${t("Scegli i visibili")}</button><button type="button" class="btn sm ghost" data-a="pfbNone" data-for="${cid}">${t("Togli tutti")}</button></div>`;
}
function pfApply(cid) {
  const box = document.getElementById(cid); const bar = $(`.pfbar[data-for="${cid}"]`); if (!box || !bar) return;
  const v = k => { const e = bar.querySelector(`[data-pfb="${k}"]`); return e ? (e.type === "checkbox" ? e.checked : e.value) : ""; };
  const q = (($(`.chipq[data-for="${cid}"]`) || $("#" + cid + "Q") || {}).value || "").toLowerCase().trim();
  let n = 0;
  for (const c of box.querySelectorAll(".chip")) { const pid = c.dataset.v || c.dataset.pid; const p = P(pid); if (!p) continue; const on = c.getAttribute("aria-pressed") === "true";
    const ok = (!q || pname(p).toLowerCase().includes(q) || (p.club || "").toLowerCase().includes(q)) && (!v("role") || mainRole(p) === v("role")) && (!v("list") || (p.listIds || []).includes(v("list"))) && (!v("verdict") || p.verdict === v("verdict")) && (!v("age") || ageBand(age(p)) === v("age")) && (!v("org") || p.org === v("org")) && (!v("sel") || on);
    c.hidden = !ok; if (ok) n++; }
  const cnt = bar.querySelector("[data-pfcount]"); if (cnt) cnt.textContent = t("{n} giocatori", { n });
}
function pfEnhance(cid) {
  const box = document.getElementById(cid); if (!box || box.dataset.pfb) return; box.dataset.pfb = "1";
  for (const c of box.querySelectorAll(".chip")) { const p = P(c.dataset.v || c.dataset.pid); if (!p) continue; const r = mainRole(p); if (r && !c.querySelector(".pfr")) c.insertAdjacentHTML("beforeend", ` <span class="pfr">${esc(roleShort(r))}</span>`); }
  const q = $(`.chipq[data-for="${cid}"]`) || $("#" + cid + "Q"); (q || box).insertAdjacentHTML(q ? "afterend" : "beforebegin", pfBar(cid));
  if (q) q.oninput = () => pfApply(cid); pfApply(cid);
}
document.addEventListener("change", e => { const b = e.target.closest && e.target.closest(".pfbar"); if (b) pfApply(b.dataset.for); });
document.addEventListener("input", e => { const i = e.target; if (i && i.id === "mTgQ") setTimeout(() => pfApply("mTg"), 0); }, true);
A.pfbAll = el => { const box = document.getElementById(el.dataset.for); if (box) box.querySelectorAll(".chip:not([hidden])").forEach(c => c.setAttribute("aria-pressed", "true")); pfApply(el.dataset.for); };
A.pfbNone = el => { const box = document.getElementById(el.dataset.for); if (box) box.querySelectorAll(".chip").forEach(c => c.setAttribute("aria-pressed", "false")); pfApply(el.dataset.for); };
window.meetSheet = (orig => function () { const r = orig.apply(this, arguments); try { pfEnhance("mtPl"); } catch (e) { } return r; })(window.meetSheet); meetSheet = window.meetSheet;
window.matchForm = (orig => function () { const r = orig.apply(this, arguments); try { pfEnhance("mTg"); } catch (e) { } return r; })(window.matchForm); matchForm = window.matchForm;

/* ---------- 5. due committenti di esempio, collegati a giocatori, partite, report, staff, riunioni… ---------- */
const EX_ORGS = [
  { id: "exorgA", name: "FC Esempio Monteverde", type: "club", color: "#2F6690", person: "Luca Esempio", email: "scouting@esempio.ch", want: "Terzini ed esterni sinistri, prima squadra e U21: due report al mese.", note: "Report entro 48 ore dalla partita. Trasferte rimborsate a fine mese." },
  { id: "exorgB", name: "Agenzia Esempio Lario", type: "agency", color: "#7A4E9E", person: "Sara Esempio", email: "info@agenzia-esempio.ch", want: "Talenti U18–U20 nei campionati giovanili, con video e dati.", note: "Lavoro a progetto: un report completo per ogni giocatore proposto." }
];
function exOrgs() {
  const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const pr = Profile.get(); const mine = (pr.orgs || []).filter(o => !o.example);
  saveOrgs([...mine, ...EX_ORGS.map((o, i) => ({ ...o, from: day(i ? -60 : -200), example: true }))], pr.activeOrg && mine.some(o => o.id === pr.activeOrg) ? pr.activeOrg : "");
  const prevBusy = Undo.busy; Undo.busy = true; Activity.quiet = true;
  try {
    const A1 = "exorgA", B1 = "exorgB"; const set = (c, id, o) => { const x = S[c].get(id); if (x && x.example) { S[c].set(id, { ...x, ...o }); Store.write(c, id); } };
    const youthP = p => { const a = age(p); return a != null && a <= 20; };
    for (const [id, p] of S.players) if (p.example) set("players", id, { org: youthP(p) ? B1 : A1 });
    for (const [id, m] of S.matches) if (m.example) set("matches", id, { org: /U\d|Primavera|giovan|youth/i.test((m.teamCat || "") + " " + (m.home || "") + " " + (m.away || "")) ? B1 : A1 });
    for (const [id, e] of S.evals) if (e.example) { const p = P(e.playerId); set("evals", id, { org: p && p.org ? p.org : A1 }); }
    for (const [id, x] of S.tasks) if (x.example) { const p = P(x.playerId); set("tasks", id, { org: p && p.org ? p.org : A1 }); }
    let i = 0; for (const [id, x] of S.todos) if (x.example) set("todos", id, { org: i++ % 3 === 2 ? B1 : A1 });
    i = 0; for (const [id, n] of S.notes) if (n.example && (n.kind || "lavoro") === "lavoro") set("notes", id, { org: i++ % 2 ? B1 : A1 });
    i = 0; for (const [id, mt] of [...S.meetings].sort((a, b) => cmpTxt(a[1].date, b[1].date))) if (mt.example) set("meetings", id, { org: i++ === 1 ? B1 : A1 });
    for (const [id, s] of S.staff) if (s.example) set("staff", id, { orgId: s.role === "chief" ? B1 : A1 });
    i = 0; for (const [id, x] of S.ideals) if (x.example) { const plan = new Set((x.plan || []).map(c => c.pid)); // titolare attuale di esempio: un giocatore valutato dello stesso ruolo, il meno adatto al profilo (così il piano A ha senso)
      const squad = [...S.players.entries()].filter(([pid, p]) => p.example && !plan.has(pid) && [x.role, x.role2].filter(Boolean).some(r => (p.roles || []).includes(r)) && profile(pid).n).map(([pid]) => [pid, idealCompat(pid, x).pct]).filter(a => a[1] < Math.max(0, ...(x.plan || []).map(c => idealCompat(c.pid, x).pct))).sort((a, b) => a[1] - b[1]).slice(0, 1).map(a => a[0]);
      set("ideals", id, { org: i++ ? B1 : A1, squad: squad.length ? squad : (x.squad || []) }); }
  } finally { Undo.busy = prevBusy; Activity.quiet = false; }
}
Examples.load = (orig => function () { const r = orig.apply(this, arguments); try { exOrgs(); } catch (e) { console.warn(e); } return r; })(Examples.load);
Examples.clear = (orig => function () { const pr = Profile.get(); if ((pr.orgs || []).some(o => o.example)) saveOrgs((pr.orgs || []).filter(o => !o.example), (pr.orgs || []).some(o => o.example && o.id === pr.activeOrg) ? "" : pr.activeOrg); if (ui.orgF && /^exorg/.test(ui.orgF)) ui.orgF = ""; return orig.apply(this, arguments); })(Examples.clear);
// i testi degli esempi seguono la lingua scelta
const exOrgTxt = (o, k) => o && o.example ? t(o[k] || "") : (o && o[k]) || "";

/* ---------- 6. profili ideali: rosa attuale contro candidati (piano A, B, C) ---------- */
const PLAN_L = { A: "Piano A · prima scelta", B: "Piano B · alternativa", C: "Piano C · opzione di riserva" };
function squadCmp(id) {
  const x = S.ideals.get(id); if (!x) return ""; const sq = (x.squad || []).filter(P); const plan = (x.plan || []).filter(c => P(c.pid)).sort((a, b) => RANKS.indexOf(a.rank) - RANKS.indexOf(b.rank));
  const info = pid => { const pr = profile(pid); const cp = idealCompat(pid, x); return { pid, p: P(pid), pct: cp.pct, rating: pr.n ? pr.rating : null, cov: cp.cov }; };
  const S0 = sq.map(info).sort((a, b) => b.pct - a.pct || (b.rating || 0) - (a.rating || 0)); const ref = S0[0];
  const verdict = c => { if (!ref) return ["c-grey", t("Aggiungi chi gioca oggi per il confronto")]; if (c.rating == null || ref.rating == null) return ["c-grey", t("Dati insufficienti")];
    const dp = c.pct - ref.pct, dr = c.rating - ref.rating; if (dp >= 8 || dr >= 0.5) return ["c-good", t("Migliora la rosa")]; if (dp <= -8 || dr <= -0.5) return ["c-bad", t("Non migliora la rosa")]; return ["c-amber", t("Livello simile")]; };
  const diff = (a, b, d) => b == null || a == null ? "" : ` <span class="m small">(${a - b >= 0 ? "+" : ""}${d ? f1(a - b) : Math.round(a - b)}${d ? "" : "%"})</span>`;
  const row = (c, lab, cls, isRef) => { const p = c.p; const v = isRef ? ["c-blue", t("Riferimento")] : verdict(c);
    return `<tr><td><button type="button" class="lnk" data-a="openPlayer" data-id="${c.pid}">${esc(pname(p))}</button>${exB(p)}<div class="m small">${esc(p.club || "")}${age(p) != null ? " · " + t("{n} anni", { n: age(p) }) : ""}</div></td><td><span class="pill ${cls}">${esc(lab)}</span></td><td class="num">${c.pct}%${isRef ? "" : diff(c.pct, ref && ref.pct)}</td><td class="num">${c.rating != null ? f1(c.rating) : "—"}${isRef ? "" : diff(c.rating, ref && ref.rating, 1)}</td><td><span class="pill ${v[0]}">${esc(v[1])}</span></td>${isRef || !sq.includes(c.pid) ? "" : ""}</tr>`; };
  const rows = [...S0.map((c, i) => row(c, i ? t("In rosa") : t("Titolare attuale"), "c-grey", i === 0)), ...plan.map(c => row(info(c.pid), t(PLAN_L[c.rank] || "Piano {r}", { r: c.rank }), "c-good", false))];
  return `<section class="panel sqcmp"><div class="row between"><div><h2>${t("Rosa attuale e candidati")}</h2><p class="sub small">${t("Chi gioca oggi in questo ruolo è il riferimento: per ogni candidato vedi se migliora la rosa, a parità di profilo ideale.")}</p></div><div class="row"><button class="btn sm" data-a="sqAdd">+ ${t("Giocatore della rosa")}</button>${(S0.length + plan.length) >= 2 ? `<button class="btn sm pri" data-a="sqCompare">${t("Confronta rosa e candidati")}</button>` : ""}</div></div>
   ${sq.length ? `<div class="chips" style="margin:8px 0">${sq.map(pid => `<span class="chip on">${esc(pname(P(pid)))} <button type="button" class="lnk" data-a="sqRm" data-id="${pid}" aria-label="${t("Togli")}">✕</button></span>`).join("")}</div>` : ""}
   ${rows.length ? `<div class="tscroll"><table class="tbl"><thead><tr><th>${t("Giocatore")}</th><th>${t("Ruolo nel confronto")}</th><th class="num">${t("Aderenza al profilo")}</th><th class="num">${t("Rating")}</th><th>${t("Esito")}</th></tr></thead><tbody>${rows.join("")}</tbody></table></div>` : `<div class="empty">${t("Aggiungi chi gioca oggi in questo ruolo e i candidati del piano A, B e C.")}</div>`}
   <p class="m small" style="margin-top:6px">${t("Migliora la rosa: almeno 8 punti di aderenza o mezzo punto di rating in più del titolare attuale. Il confronto vale quanto le valutazioni che hai fatto.")}</p></section>`;
}
window.idealPage = (orig => function (id) { const h = orig(id); const k = h.indexOf('<div class="split">'); const pnl = squadCmp(id); return k > 0 ? h.slice(0, k) + pnl + h.slice(k) : h + pnl; })(window.idealPage);
idealPage = window.idealPage;
Object.assign(A, {
  sqAdd: () => { const x = S.ideals.get(ui.idealId); if (!x) return; const used = new Set([...(x.squad || []), ...(x.plan || []).map(c => c.pid)]);
    const opts = [...S.players.entries()].filter(([pid, p]) => !p.archived && !used.has(pid)).sort((a, b) => (mainRole(b[1]) === x.role) - (mainRole(a[1]) === x.role) || cmpTxt(pname(a[1]), pname(b[1])));
    sheet(`<div class="row between"><h2>${t("Giocatori della rosa attuale")}</h2><button class="iconbtn" data-a="closeSheetBtn" aria-label="${t("Chiudi")}">✕</button></div><p class="sub small">${t("Scegli chi gioca oggi in questo ruolo nella squadra per cui cerchi: sarà il riferimento per i candidati.")}</p>
     ${chipsPick("sqPick", opts.map(([pid, p]) => [pid, pname(p)]), [])}<div class="row end"><button class="btn" data-a="closeSheetBtn">${t("Annulla")}</button><button class="btn pri" id="sqOk">${t("Aggiungi")}</button></div>`, true);
    bindChips(); try { pfEnhance("sqPick"); } catch (e) { }
    $("#sqOk").onclick = () => { const ids = picked("sqPick"); if (!ids.length) { toast(t("Scegli prima il giocatore")); return; } closeSheet(); put("ideals", ui.idealId, { ...x, squad: [...(x.squad || []), ...ids] }); render(true); }; },
  sqRm: el => { const x = S.ideals.get(ui.idealId); if (!x) return; put("ideals", ui.idealId, { ...x, squad: (x.squad || []).filter(p => p !== el.dataset.id) }); render(true); },
  sqCompare: () => { const x = S.ideals.get(ui.idealId); if (!x) return; const sq = (x.squad || []).filter(P).map(pid => [pid, idealCompat(pid, x).pct]).sort((a, b) => b[1] - a[1]).map(a => a[0]);
    const plan = (x.plan || []).filter(c => P(c.pid)).sort((a, b) => RANKS.indexOf(a.rank) - RANKS.indexOf(b.rank)).map(c => c.pid);
    ui.cmp = [...new Set([...sq.slice(0, 1), ...plan, ...sq.slice(1)])].slice(0, 4); ui.cmpIdeal = ui.idealId; put("settings", "compare", { ids: [...ui.cmp] }); resetSub(); ui.idealId = null; go("confronto"); }
});

/* ---------- 7. codice di firma: firmi con un codice di 6 cifre invece della password ---------- */
const SignPin = {
  get() { return (S.settings.get("signpin") || {}).hash ? S.settings.get("signpin") : null; },
  async derive(code, salt, iter) { const k = await crypto.subtle.importKey("raw", C.te.encode(code), "PBKDF2", false, ["deriveBits"]); return new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: iter }, k, 256)); },
  async set(code) { const salt = crypto.getRandomValues(new Uint8Array(16)), iter = 210000; put("settings", "signpin", { salt: C.b64(salt), hash: C.b64(await this.derive(code, salt, iter)), iter, set: new Date().toISOString() }); Prefs.set("pinFail", 0); },
  async check(code) { const s = this.get(); if (!s) return false; const h = await this.derive(code, C.unb64(s.salt), s.iter); const ok = C.b64(h) === s.hash; Prefs.set("pinFail", ok ? 0 : (+Prefs.get("pinFail", 0) + 1)); return ok; },
  locked() { return +Prefs.get("pinFail", 0) >= 5; }
};
Sign.askPassword = function (title, onOk) {
  const pin = SignPin.get() && !SignPin.locked();
  sheet(`<h2>${esc(title)}</h2><p class="sub">${pin ? t("Per confermare che sei tu, inserisci il codice di firma oppure la password.") : t("Per confermare che sei tu, inserisci la tua password.")}</p>
   <form id="spf" class="col">${pin ? `<div class="seg" role="group" style="align-self:flex-start"><button type="button" data-spm="pin" aria-pressed="true">${t("Codice di firma")}</button><button type="button" data-spm="pw" aria-pressed="false">${t("Password")}</button></div>` : ""}
    <input type="password" id="spPw" ${pin ? 'inputmode="numeric" autocomplete="one-time-code" maxlength="8" placeholder="••••••"' : 'autocomplete="current-password"'} required aria-label="${pin ? t("Codice di firma") : t("Password")}">
    <div class="warn" id="spErr"></div><div class="row end"><button type="button" class="btn" data-a="closeSheetBtn">${t("Annulla")}</button><button class="btn pri">${t("Conferma")}</button></div></form>`);
  let mode = pin ? "pin" : "pw"; const inp = $("#spPw"); inp.focus();
  $$("#spf [data-spm]").forEach(b => b.onclick = () => { mode = b.dataset.spm; $$("#spf [data-spm]").forEach(x => x.setAttribute("aria-pressed", x === b)); inp.value = ""; $("#spErr").textContent = "";
    if (mode === "pin") { inp.setAttribute("inputmode", "numeric"); inp.setAttribute("autocomplete", "one-time-code"); inp.maxLength = 8; inp.placeholder = "••••••"; } else { inp.removeAttribute("inputmode"); inp.setAttribute("autocomplete", "current-password"); inp.removeAttribute("maxlength"); inp.placeholder = ""; } inp.setAttribute("aria-label", mode === "pin" ? t("Codice di firma") : t("Password")); inp.focus(); });
  $("#spf").onsubmit = async e => { e.preventDefault(); const v = inp.value; const err = $("#spErr");
    if (mode === "pin") { if (await SignPin.check(v)) { closeSheet(); await onOk(); return; } err.textContent = SignPin.locked() ? t("Troppi codici errati: usa la password.") : t("Codice errato."); if (SignPin.locked()) $$("#spf [data-spm]")[1].click(); return; }
    try { const raw = await Store.unwrap(v); raw.fill(0); Prefs.set("pinFail", 0); closeSheet(); await onOk(); } catch (x) { err.textContent = t("Password errata."); } };
};
// Impostazioni › Sicurezza: codice di firma ed email di accesso
SET.sicurezza = (orig => () => { const s = SignPin.get(); const acc = Accounts.acc || {};
  return `<section class="panel"><h2>${t("Codice di firma")}</h2><p class="sub small">${t("Un codice di 6 cifre per firmare valutazioni, report e documenti più in fretta, senza scrivere ogni volta la password. È salvato cifrato e vale su tutti i tuoi dispositivi sincronizzati. Dopo 5 codici sbagliati serve la password.")}</p>
    <p class="m" style="margin-top:6px">${s ? t("Attivo dal {d}", { d: fmtDate(s.set.slice(0, 10)) }) : t("Non attivo: per firmare serve la password.")}</p>
    <div class="row" style="margin-top:8px"><button class="btn pri" data-a="pinSet">${s ? t("Cambia codice") : t("Crea codice di firma")}</button>${s ? `<button class="btn ghost" data-a="pinOff">${t("Disattiva")}</button>` : ""}</div></section>
   <section class="panel"><h2>${t("Email di accesso")}</h2><p class="sub small">${t("È il nome del tuo profilo su questo dispositivo. Per cambiarla serve la password.")}</p>
    <div class="oform" style="margin-top:8px"><label class="f a-p">${t("Email attuale")}<input type="email" value="${esc(acc.email || "")}" readonly></label><label class="f a-e">${t("Nuova email")}<input type="email" id="emNew" autocomplete="email" maxlength="120" placeholder="nome@esempio.ch"></label><label class="f a-p">${t("Password")}<input type="password" id="emPw" autocomplete="current-password"></label></div>
    <div class="row end" style="margin-top:10px"><button class="btn pri" data-a="emSave">${t("Cambia email")}</button></div>
    <details class="howto" style="margin-top:8px"><summary>${t("Codici via email o SMS?")}</summary><p class="small">${t("MM Scout non ha un server: i tuoi dati non escono mai dai tuoi dispositivi. Per mandare codici via email o SMS servirebbe un server e un servizio a pagamento che conosce la tua email o il tuo numero. Per proteggere l'accesso usa la verifica in due passaggi con un'app di autenticazione (qui sotto) e conserva il codice di recupero: sono gratuiti e funzionano senza internet.")}</p></details></section>` + orig(); })(SET.sicurezza);
Object.assign(A, {
  pinSet: () => {
    sheet(`<h2>${t("Codice di firma")}</h2><p class="sub small">${t("Scegli 6 cifre facili da ricordare per te ma non ovvie (no 123456, no data di nascita).")}</p>
     <form id="pinF" class="oform"><label class="f a-f">${t("Nuovo codice")}<input type="password" id="pin1" inputmode="numeric" autocomplete="new-password" maxlength="6" placeholder="••••••"></label><label class="f a-to">${t("Ripeti il codice")}<input type="password" id="pin2" inputmode="numeric" autocomplete="new-password" maxlength="6" placeholder="••••••"></label><label class="f a-t">${t("Password")}<input type="password" id="pinPw" autocomplete="current-password"></label></form>
     <div class="warn" id="pinErr"></div><div class="row end"><button class="btn" data-a="closeSheetBtn">${t("Annulla")}</button><button class="btn pri" id="pinOk">${t("Salva codice")}</button></div>`);
    $("#pin1").focus();
    $("#pinOk").onclick = async () => { const a = $("#pin1").value, b = $("#pin2").value, err = $("#pinErr");
      if (!/^\d{6}$/.test(a)) { err.textContent = t("Il codice deve avere 6 cifre."); return; } if (a !== b) { err.textContent = t("I due codici non sono uguali."); return; }
      if (/^(\d)\1{5}$/.test(a) || "0123456789".includes(a) || "9876543210".includes(a)) { err.textContent = t("Codice troppo facile: scegline un altro."); return; }
      try { const raw = await Store.unwrap($("#pinPw").value); raw.fill(0); } catch (e) { err.textContent = t("Password errata."); return; }
      await SignPin.set(a); closeSheet(); toast(t("Codice di firma salvato")); render(true); };
  },
  pinOff: () => confirmSheet(t("Disattivare il codice di firma? Per firmare servirà la password."), () => { del("settings", "signpin"); toast(t("Codice di firma disattivato")); render(true); }),
  emSave: async () => { const acc = Accounts.acc; if (!acc) return; const e = ($("#emNew").value || "").trim().toLowerCase();
    if (!Accounts.validEmail(e)) { toast(t("Scrivi un indirizzo email valido.")); $("#emNew").focus(); return; } if (e === acc.email) { toast(t("È già la tua email.")); return; } if (Accounts.byEmail(e)) { toast(t("Esiste già un profilo con questa email su questo dispositivo.")); return; }
    try { const raw = await Store.unwrap($("#emPw").value); raw.fill(0); } catch (x) { toast(t("Password errata.")); $("#emPw").focus(); return; }
    try { Sync.fname(); } catch (x) { } Accounts.update(acc.id, { email: e }); Prefs.set("lastEmail", e); put("settings", "profile", { ...Profile.get(), email: e }); toast(t("Email di accesso aggiornata")); render(true); }
});

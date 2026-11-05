/* MM Scout 5.10 — Cestino: quello che elimini resta recuperabile per 30 giorni, poi si cancella da solo.
   © Miodrag Milosevic. Vietato divulgare, copiare o modificare senza consenso dell'autore. */
"use strict";

const TRASH_DAYS = 30, TRASH_MS = TRASH_DAYS * 864e5;
const TRASH_COLLS = ["players", "matches", "evals", "media", "lists", "lineups", "ideals", "staff", "meetings", "tasks", "todos", "notes"];
// ordine di ripristino: prima i "contenitori", poi quello che dipende da loro
const TRASH_ORDER = ["players", "matches", "staff", "lists", "ideals", "meetings", "evals", "lineups", "tasks", "todos", "notes", "media"];
const TRASH_KIND = { players: ["Giocatore", "👤"], matches: ["Partita", "🏟"], evals: ["Report", "📝"], media: ["File", "📎"], lists: ["Lista", "📁"], lineups: ["Squadra ombra", "🧩"], ideals: ["Profilo ideale", "🎯"], staff: ["Contatto", "🤝"], meetings: ["Riunione", "👥"], tasks: ["Incarico", "📌"], todos: ["Da fare", "☑️"], notes: ["Nota", "🗒"] };
const TRASH_FILTERS = [["", "Tutto"], ["players", "Giocatori"], ["matches", "Partite"], ["evals", "Report"], ["notes", "Note"], ["other", "Altri"]];

const Trash = {
  skip: 0, batch: null, bt: null, lastAt: 0, lastBatch: null,
  recs() { return [...S.trash.entries()].map(([id, r]) => { let label = r.label; try { label = this.label(r.coll, r.obj) || r.label; } catch (e) { } return { id, ...r, label }; }); },
  hidden(r) { return !!(r.obj && r.obj.vault && window.Vault && !Vault.opened.has(r.obj.vault)); },
  visible() { return this.recs().filter(r => !this.hidden(r)); },
  find(coll, oid) { for (const [id, r] of S.trash) if (r.coll === coll && r.oid === oid) return id; return null; },
  newBatch() { if (!this.batch) { this.batch = uid(); } clearTimeout(this.bt); this.bt = setTimeout(() => { this.lastBatch = this.batch; this.batch = null; }, 700); return this.batch; },
  label(coll, o) {
    if (!o) return "";
    if (coll === "evals") { const p = S.players.get(o.playerId) || (this.find("players", o.playerId) && S.trash.get(this.find("players", o.playerId)).obj); return (p ? pname(p) : t("Giocatore")) + (o.home ? ` (${o.home} – ${o.away})` : "") + (o.date ? " · " + fmtDate(o.date) : ""); }
    if (coll === "matches") return `${o.home || "?"} – ${o.away || "?"}` + (o.date ? " · " + fmtDate(o.date) : "");
    if (coll === "players") return pname(o);
    if (coll === "notes") return o.title || String(o.body || "").split("\n")[0].slice(0, 60) || t("Nota senza titolo");
    return o.name || o.title || o.what || o.text || t(TRASH_KIND[coll][0]);
  },
  keep(coll, id, o) {
    if (this.skip || !App.unlocked || (window.Undo && Undo.busy) || !TRASH_COLLS.includes(coll) || !o) return;
    const old = this.find(coll, id); if (old) { this.skip++; try { del("trash", old); } finally { this.skip--; } }
    const rec = { at: Date.now(), batch: this.newBatch(), coll, oid: id, obj: clone(o), label: this.label(coll, o), ex: !!o.example };
    put("trash", uid(), rec); this.lastAt = Date.now();
  },
  // tutti i record di un gruppo, nell'ordine giusto per rimetterli
  group(b) { return this.visible().filter(r => r.batch === b).sort((x, y) => TRASH_ORDER.indexOf(x.coll) - TRASH_ORDER.indexOf(y.coll)); },
  groups() {
    const m = new Map(); for (const r of this.visible()) { if (!m.has(r.batch)) m.set(r.batch, []); m.get(r.batch).push(r); }
    return [...m.entries()].map(([b, rs]) => { rs.sort((x, y) => TRASH_ORDER.indexOf(x.coll) - TRASH_ORDER.indexOf(y.coll)); const main = rs[0]; return { b, rs, main, at: Math.min(...rs.map(r => r.at)) }; }).sort((a, b) => b.at - a.at);
  },
  // da cosa dipende un elemento (es. una valutazione dal suo giocatore)
  parent(r) { const o = r.obj || {}; if (r.coll === "evals" && o.playerId) return ["players", o.playerId]; if (r.coll === "media" && o.ownerId) { for (const c of ["players", "evals", "matches"]) if (S[c].has(o.ownerId) || this.find(c, o.ownerId)) return [c, o.ownerId]; } return null; },
  restore(b) {
    const rs = this.group(b); if (!rs.length) return 0; const mine = new Set(rs.map(r => r.coll + "/" + r.oid)); let n = 0;
    // prima rimetto i "genitori" che sono finiti nel cestino in un altro momento
    for (const r of rs) { const p = this.parent(r); if (p && !S[p[0]].has(p[1]) && !mine.has(p.join("/"))) { const pid = this.find(p[0], p[1]); if (pid) { const pb = S.trash.get(pid).batch; n += this.restore(pb); } } }
    this.skip++; try { for (const r of rs) { if (!S.trash.has(r.id)) continue; const p = this.parent(r); if (p && !S[p[0]].has(p[1]) && !mine.has(p.join("/"))) continue; put(r.coll, r.oid, r.obj); del("trash", r.id); n++; } } finally { this.skip--; }
    return n;
  },
  async wipe(ids) { this.skip++; try { for (const id of ids) if (S.trash.has(id)) del("trash", id); } finally { this.skip--; } await Store.gcBlobs(); },
  async autoPurge() { const lim = Date.now() - TRASH_MS; const first = {}; for (const r of this.recs()) first[r.batch] = Math.min(first[r.batch] ?? Infinity, r.at || 0); const old = this.recs().filter(r => first[r.batch] < lim).map(r => r.id); if (old.length) { Undo.busy = true; try { await this.wipe(old); } finally { Undo.busy = false; } } return old.length; },
  daysLeft(at) { return Math.max(0, Math.ceil((at + TRASH_MS - Date.now()) / 864e5)); },
  count() { return this.groups().length; }
};
window.Trash = Trash;

/* ---------- 1. ogni eliminazione passa dal cestino ---------- */
window.del = (orig => function (coll, id, noTomb) {
  if (coll !== "trash" && TRASH_COLLS.includes(coll)) { const st = window.Vault && Vault.stash[coll]; const o = (S[coll] && S[coll].get(id)) || (st && st.get(id)); if (o) Trash.keep(coll, id, o); }
  return orig.apply(this, arguments);
})(window.del);
// se un elemento torna (Annulla, sincronizzazione, nuovo salvataggio), non resta anche nel cestino
window.put = (orig => function (coll, id, v) {
  const r = orig.apply(this, arguments);
  if (v && coll !== "trash" && TRASH_COLLS.includes(coll) && S.trash && S.trash.size && !Trash.skip) { const tid = Trash.find(coll, id); if (tid) { Trash.skip++; try { del("trash", tid); } finally { Trash.skip--; } } }
  return r;
})(window.put);
// i file di elementi nel cestino non vanno cancellati dalla pulizia automatica
Store.gcBlobs = async function () { try { const used = new Set([...S.media.values()].map(m => m.blobId).filter(Boolean)); for (const [, r] of S.trash) if (r.obj && r.obj.blobId) used.add(r.obj.blobId); for (const k of await this.keys("blob")) if (!used.has(k)) await this.del("blob", k); } catch (e) { } };
// esempi caricati/tolti, importazioni e ripristini di copie non riempiono il cestino
for (const k of ["load", "clear"]) if (Examples[k]) Examples[k] = (orig => function () { Trash.skip++; try { return orig.apply(this, arguments); } finally { Trash.skip--; } })(Examples[k]);
if (typeof exPart2 === "function") window.exPart2 = (orig => function () { Trash.skip++; try { return orig.apply(this, arguments); } finally { Trash.skip--; } })(window.exPart2);
Store.snapshot = (orig => async function (reason) { const r = await orig.apply(this, arguments); if (/^prima-/.test(String(reason || ""))) { Trash.skip++; setTimeout(() => { Trash.skip = Math.max(0, Trash.skip - 1); }, 15000); } return r; })(Store.snapshot);
if (window.Backup && Backup.restoreSnapshot) Backup.restoreSnapshot = (orig => async function () { Trash.skip++; try { return await orig.apply(this, arguments); } finally { Trash.skip = Math.max(0, Trash.skip - 1); } })(Backup.restoreSnapshot);

// i messaggi di conferma non dicono più «non si può annullare»
const TRASH_MSG = {
  "Eliminare definitivamente? Non si può annullare.": "Eliminare questo elemento?",
  "Eliminare definitivamente il giocatore con valutazioni e file? Se vuoi solo toglierlo di mezzo, usa Archivia.": "Eliminare il giocatore con valutazioni e file? Se vuoi solo toglierlo di mezzo, usa Archivia."
};
const TRASH_MSG_T = () => { const m = {}; for (const [a, b] of Object.entries(TRASH_MSG)) m[t(a)] = t(b); return m; };
window.confirmSheet = (orig => function (text, onYes, yesLabel) { const m = TRASH_MSG_T(); let x = m[text] || text; if (typeof x === "string" && x) x = x.charAt(0).toLocaleUpperCase() + x.slice(1); return orig.call(this, x, onYes, yesLabel); })(window.confirmSheet);
confirmSheet = window.confirmSheet;
// nelle conferme di eliminazione: «resta nel Cestino per 30 giorni»
window.confirmSheet = (orig => function () { const r = orig.apply(this, arguments); if (Trash.hint) { const p = $("#sheetRoot .sheet p"); if (p && !$("#sheetRoot .tconf")) p.insertAdjacentHTML("afterend", `<p class="m tconf">🗑 ${t("Resta nel Cestino per 30 giorni: da lì puoi recuperarlo.")}</p>`); } return r; })(window.confirmSheet);
confirmSheet = window.confirmSheet;
for (const k of ["delItem", "delPlayer", "delEval", "delMatch", "delMedia", "purge", "delList", "delLineup", "delIdeal", "todoDel", "noteDel"]) if (typeof A[k] === "function") A[k] = (orig => function () { Trash.hint = true; try { return orig.apply(this, arguments); } finally { Trash.hint = false; } })(A[k]);

// dopo un'eliminazione: link al Cestino nella barra «Annulla»
if (typeof UB !== "undefined") UB.show = (orig => function (kind, msg) { orig.apply(this, arguments); if (Date.now() - Trash.lastAt < 1500 && kind === "save") { const el = $("#undoBar"); if (el && !el.querySelector("[data-a=trashOpen]")) { const ok = el.querySelector("[data-a=ubOk]"); const b = `<button class="btn sm" data-a="trashOpen">🗑 ${t("Cestino")}</button>`; if (ok) ok.insertAdjacentHTML("beforebegin", b); else el.insertAdjacentHTML("beforeend", b); } } })(UB.show);

/* ---------- 2. pulizia automatica dopo 30 giorni ---------- */
Lock.enter = (orig => async function () { const r = await orig.apply(this, arguments); try { const n = await Trash.autoPurge(); if (n && ui.view === "cestino") render(true); } catch (e) { } return r; })(Lock.enter);
setInterval(() => { if (App.unlocked) Trash.autoPurge().then(n => { if (n && ui.view === "cestino") render(true); }); }, 36e5);

/* ---------- 3. pagina Cestino ---------- */
ICONS.cestino = ICONS.trash;
PAGE_DESC.cestino = "Quello che elimini resta qui per 30 giorni: puoi rimetterlo al suo posto con un tocco. Dopo 30 giorni si cancella da solo, per sempre.";
if (typeof VIEW_L !== "undefined") VIEW_L.cestino = "Cestino";
window.views = (orig => function () { const v = orig(); if (!v.some(x => x !== "-" && x[0] === "cestino")) { const i = v.findIndex(x => x !== "-" && x[0] === "archivio"); v.splice(i >= 0 ? i + 1 : v.length, 0, ["cestino", t("Cestino")]); } return v; })(window.views);
if (typeof NAV_GROUPS !== "undefined") { const g = NAV_GROUPS.find(x => x[1].includes("archivio")) || NAV_GROUPS[NAV_GROUPS.length - 1]; if (!g[1].includes("cestino")) g[1].splice(g[1].indexOf("archivio") + 1, 0, "cestino"); }
// numero di elementi accanto alla voce del menu
window.renderShell = (orig => function () { orig.apply(this, arguments); const n = Trash.count(); const b = $('#side .nav a[href="#cestino"]'); if (b && n && !b.querySelector(".tcount")) b.insertAdjacentHTML("beforeend", `<span class="tcount" aria-label="${t("{n} nel cestino", { n })}">${n}</span>`); })(window.renderShell);

const tx = s => esc(String(s == null ? "" : s));
function trashWhen(at) { const d = new Date(at); return fmtDate(d.toISOString().slice(0, 10)) + " " + d.toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit" }); }
function trashGroupHtml(g) {
  const k = TRASH_KIND[g.main.coll] || ["", "🗑"]; const left = Trash.daysLeft(g.at); const rest = g.rs.slice(1);
  const cnt = {}; for (const r of rest) cnt[r.coll] = (cnt[r.coll] || 0) + 1;
  const withTxt = Object.entries(cnt).map(([c, n]) => `${n} × ${t(TRASH_KIND[c][0])}`).join(", ");
  return `<div class="trow" data-batch="${g.b}">
    <span class="tico" aria-hidden="true">${k[1]}</span>
    <div class="grow tmain"><div class="t">${tx(g.main.label || t(k[0]))}${g.main.ex ? ` <span class="pill ex">${t("Esempio")}</span>` : ""}</div>
      <div class="m">${t(k[0])} · ${t("eliminato il {d}", { d: trashWhen(g.at) })}${withTxt ? ` · ${t("insieme a")}: ${withTxt}` : ""}</div>
      ${rest.length ? `<details class="tdet"><summary>${t("Mostra cosa contiene")}</summary><ul>${rest.map(r => `<li>${TRASH_KIND[r.coll][1]} ${tx(r.label || t(TRASH_KIND[r.coll][0]))}</li>`).join("")}</ul></details>` : ""}</div>
    <span class="pill ${left <= 3 ? "c-red" : left <= 7 ? "c-amber" : ""} tleft" title="${t("Dopo questa data si cancella da solo")}">${left ? t("ancora {n} giorni", { n: left }) : t("oggi")}</span>
    <div class="tact"><button class="btn sm pri" data-a="trashRestore" data-b="${g.b}">↩ ${t("Ripristina")}</button><button class="btn sm danger" data-a="trashKill" data-b="${g.b}">${t("Elimina per sempre")}</button></div>
  </div>`;
}
R.cestino = () => {
  const all = Trash.groups(); const f = ui.trashF || ""; const q = nrm(ui.trashQ || "");
  const fit = g => (!f || (f === "other" ? !["players", "matches", "evals", "notes"].includes(g.main.coll) : g.main.coll === f)) && (!q || g.rs.some(r => nrm(r.label).includes(q)));
  const rows = all.filter(fit); const soon = all.filter(g => Trash.daysLeft(g.at) <= 3).length;
  const fc = k => k === "" ? all.length : all.filter(g => k === "other" ? !["players", "matches", "evals", "notes"].includes(g.main.coll) : g.main.coll === k).length;
  return `<div class="head"><div><h1>${t("Cestino")}</h1><p class="sub">${t(PAGE_DESC.cestino)}</p></div>
    ${all.length ? `<div class="row"><button class="btn" data-a="trashRestoreAll">↩ ${t("Ripristina tutto")}</button><button class="btn danger" data-a="trashEmpty">🗑 ${t("Svuota il cestino")}</button></div>` : ""}</div>
   <div class="banner info">ℹ️ ${t("Giocatori, partite, report, note, liste, contatti e file eliminati arrivano qui. Se elimini un giocatore, insieme a lui finiscono nel cestino anche i suoi report e i suoi file: ripristinandolo torna tutto.")}${soon ? ` <b>${t("{n} elementi si cancellano entro 3 giorni.", { n: soon })}</b>` : ""}</div>
   ${all.length ? `<div class="row tbar"><div class="chips">${TRASH_FILTERS.map(([k, n]) => `<button class="chip" data-a="trashF" data-f="${k}" aria-pressed="${f === k}">${t(n)} <span class="m">${fc(k)}</span></button>`).join("")}</div>
     <input type="search" id="trashQ" class="tq" placeholder="${t("Cerca nel cestino")}" aria-label="${t("Cerca nel cestino")}" value="${tx(ui.trashQ || "")}"></div>` : ""}
   <section class="panel"><div class="tlist">${rows.map(trashGroupHtml).join("") || `<div class="empty">${all.length ? t("Nessun elemento con questo filtro.") : `🗑 ${t("Il cestino è vuoto.")}<br><span class="m">${t("Quando elimini qualcosa, lo ritrovi qui per 30 giorni.")}</span>`}</div>`}</div></section>`;
};
document.addEventListener("input", e => { if (e.target && e.target.id === "trashQ") { ui.trashQ = e.target.value; const pos = e.target.selectionStart; render(true); const i = $("#trashQ"); if (i) { i.focus(); try { i.setSelectionRange(pos, pos); } catch (er) { } } } });

const TRASH_VIEW = { players: "giocatori", matches: "partite", evals: "giocatori", media: null, lists: "liste", lineups: "squadre", ideals: "profili", staff: "staff", meetings: "staff", tasks: "staff", todos: "calendario", notes: "note" };
Object.assign(A, {
  trashOpen: () => { if (typeof UB !== "undefined") UB.hide(); closeSheet(); resetSub(); go("cestino"); },
  trashF: el => { ui.trashF = el.dataset.f || ""; render(true); },
  trashRestore: el => { const b = el.dataset.b; const g = Trash.group(b); if (!g.length) return; const main = g[0]; const n = Trash.restore(b); Undo.clear();
    toast(n ? t("Ripristinato: {l}", { l: main.label || t(TRASH_KIND[main.coll][0]) }) : t("Non è stato possibile ripristinare: l'elemento a cui apparteneva non esiste più."), 3600);
    render(true); },
  trashRestoreAll: () => confirmSheet(t("Rimettere al loro posto tutti gli elementi del cestino?"), () => { let n = 0; for (const g of Trash.groups().reverse()) n += Trash.restore(g.b); Undo.clear(); closeSheet(); toast(t("{n} elementi ripristinati", { n })); render(true); }, t("Ripristina tutto")),
  trashKill: el => { const rs = Trash.group(el.dataset.b); if (!rs.length) return; confirmSheet(t("Eliminare per sempre «{l}»? Non si potrà più recuperare.", { l: rs[0].label || t(TRASH_KIND[rs[0].coll][0]) }), async () => { Undo.busy = true; try { await Trash.wipe(rs.map(r => r.id)); } finally { Undo.busy = false; } Undo.clear(); closeSheet(); toast(t("Eliminato per sempre")); render(true); }, t("Elimina per sempre")); },
  trashEmpty: () => { const ids = Trash.visible().map(r => r.id); const n = ids.length; confirmSheet(t("Svuotare il cestino? {n} elementi verranno eliminati per sempre e non si potranno più recuperare.", { n }), async () => { Undo.busy = true; try { await Trash.wipe(ids); } finally { Undo.busy = false; } Undo.clear(); closeSheet(); toast(t("Cestino svuotato")); render(true); }, t("Svuota il cestino")); }
});

/* ---------- 4. ricerca: anche nel cestino ---------- */
R.cerca = (orig => () => { const h = orig(); const raw = (ui.q || "").trim(); if (!raw || raw.startsWith("#") || !S.trash.size) return h; const q = nrm(raw);
  const hits = Trash.groups().filter(g => g.rs.some(r => nrm(r.label).includes(q))); if (!hits.length) return h;
  return h + `<section class="panel trsearch"><div class="row between"><h2>🗑 ${t("Nel Cestino")} <span class="m">${hits.length}</span></h2><button class="btn sm ghost" data-a="trashSearch" data-q="${tx(raw)}">${t("Apri il cestino")} →</button></div><div class="tlist">${hits.slice(0, 5).map(trashGroupHtml).join("")}</div></section>`; })(R.cerca);
A.trashSearch = el => { ui.trashQ = el.dataset.q || ""; ui.trashF = ""; resetSub(); go("cestino"); };

/* ---------- 5. storico: le voci «Eliminazione» portano al cestino se l'elemento c'è ancora ---------- */
A.trashFrom = el => { const tid = Trash.find(el.dataset.c, el.dataset.id); if (tid) { ui.trashQ = S.trash.get(tid).label || ""; ui.trashF = ""; resetSub(); go("cestino"); } else toast(t("Non è più nel cestino.")); };
// storico: tocca una voce «Eliminazione» per ritrovarla nel cestino
window.render = (orig => function () { const r = orig.apply(this, arguments); try { if (S.trash && S.trash.size) for (const b of $$(".fitem .fdel[data-c][data-id]")) { const it = b.closest(".fitem"); if (it.dataset.a || !Trash.find(b.dataset.c, b.dataset.id)) continue; it.classList.add("click", "intrash"); it.dataset.a = "trashFrom"; it.dataset.c = b.dataset.c; it.dataset.id = b.dataset.id; it.title = t("Nel cestino: tocca per ritrovarlo"); } } catch (e) { } return r; })(window.render);
render = window.render;

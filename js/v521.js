/* MM Scout 0.8 (beta) — scelta del giocatore con filtri (una sola scelta per i report),
   pagina Committenti più corta e a schede, icone al posto delle emoji nei titoli.
   © Miodrag Milosevic. Vietato divulgare, copiare o modificare senza consenso dell'autore. */
"use strict";

/* ---------- 1. scegliere il giocatore: ricerca + filtri; una sola scelta dove serve ---------- */
function pickFilters() {
  const pl = [...S.players.values()].filter(p => !p.archived); const roles = [...new Set(pl.map(mainRole).filter(Boolean))].sort((a, b) => cmpTxt(roleL(a), roleL(b)));
  const lists = [...S.lists.entries()].filter(([, l]) => !l.smart); const vs = Cfg.get().verdicts || []; const orgs = Orgs.list();
  const s = (k, opts) => `<select data-ppf="${k}" aria-label="${t("Filtro")}">${opts}</select>`;
  return `<div class="pfbar ppbar">${s("role", `<option value="">${t("Tutti i ruoli")}</option>${roles.map(r => `<option value="${esc(r)}">${esc(roleL(r))}</option>`).join("")}`)}${lists.length ? s("list", `<option value="">${t("Tutte le liste")}</option>${lists.map(([id, l]) => `<option value="${id}">${esc(l.name)}</option>`).join("")}`) : ""}${s("verdict", `<option value="">${t("Tutti i giudizi")}</option>${vs.map(v => `<option value="${esc(v.id)}">${esc(L(v))}</option>`).join("")}`)}${s("age", AGE_BANDS.map(([k, n]) => `<option value="${k}">${t(n)}</option>`).join(""))}${orgs.length ? s("org", `<option value="">${t("Tutti i committenti")}</option>${orgs.map(o => `<option value="${o.id}">${esc(o.name)}</option>`).join("")}`) : ""}<span class="m small" id="ppCount"></span></div>`;
}
function playerPickerX(title, preselected, onDone, single) {
  const pl = [...S.players.entries()].filter(([, p]) => !p.archived).sort((a, b) => pname(a[1]).localeCompare(pname(b[1]))); const sset = new Set(preselected || []);
  const row = ([id, p]) => { const meta = [roleL(mainRole(p)), p.club, age(p) != null ? t("{n} anni", { n: age(p) }) : ""].filter(Boolean).map(esc).join(" · ");
    return single ? `<button type="button" class="item click pprow" data-pid="${id}">${avatar(p)}<div class="grow"><div class="t">${esc(pname(p))}${exB(p)}</div><div class="m">${meta}</div></div><span class="ppgo" aria-hidden="true">›</span></button>`
      : `<label class="item pprow" data-pid="${id}"><input type="checkbox" value="${id}" ${sset.has(id) ? "checked" : ""}>${avatar(p)}<div class="grow"><div class="t">${esc(pname(p))}${exB(p)}</div><div class="m">${meta}</div></div></label>`; };
  sheet(`<div class="row between"><h2>${esc(title)}</h2><button class="iconbtn" data-a="closeSheetBtn" aria-label="${t("Chiudi")}">✕</button></div>
   ${single ? `<p class="sub small">${t("Tocca il giocatore: il report è per un solo giocatore alla volta.")}</p>` : ""}
   <input type="search" id="ppQ" placeholder="${t("Cerca per nome, club o nazionalità")}" aria-label="${t("Cerca")}" autocomplete="off">${pickFilters()}
   <div class="list" id="ppList">${pl.map(row).join("") || `<div class="empty">${t("Nessun giocatore.")}</div>`}<div class="empty ppempty" id="ppNone" hidden>${t("Nessun giocatore con questi filtri.")}</div></div>
   ${single ? `<div class="row end"><button class="btn" data-a="closeSheetBtn">${t("Annulla")}</button></div>` : `<div class="row end"><button class="btn" data-a="closeSheetBtn">${t("Annulla")}</button><button class="btn pri" id="ppOk">${t("Conferma")}</button></div>`}`, true);
  const apply = () => { const q = ($("#ppQ").value || "").toLowerCase().trim(); const v = k => { const e = $(`[data-ppf="${k}"]`); return e ? e.value : ""; }; let n = 0;
    for (const r of $$("#ppList .pprow")) { const p = P(r.dataset.pid); const hay = (pname(p) + " " + (p.club || "") + " " + (p.nat || "") + " " + (p.alias || "")).toLowerCase();
      const ok = (!q || q.split(/\s+/).every(w => hay.includes(w))) && (!v("role") || mainRole(p) === v("role")) && (!v("list") || (p.listIds || []).includes(v("list"))) && (!v("verdict") || p.verdict === v("verdict")) && (!v("age") || ageBand(age(p)) === v("age")) && (!v("org") || p.org === v("org"));
      r.hidden = !ok; if (ok) n++; }
    $("#ppCount").textContent = t("{n} giocatori", { n }); $("#ppNone").hidden = n > 0 || !pl.length; };
  $("#ppQ").oninput = apply; $$("[data-ppf]").forEach(s => s.onchange = apply); apply(); setTimeout(() => { const q = $("#ppQ"); if (q && matchMedia("(hover:hover)").matches) q.focus(); }, 30);
  if (single) $("#ppList").onclick = e => { const r = e.target.closest(".pprow"); if (!r) return; closeSheet(); onDone([r.dataset.pid]); };
  else $("#ppOk").onclick = () => { const ids = $$("#ppList input:checked").map(x => x.value); closeSheet(); onDone(ids); };
}
window.playerPicker = (title, pre, onDone, single) => playerPickerX(title, pre, onDone, single); playerPicker = window.playerPicker;
A.pickEvalPlayer = () => { closeSheet(); playerPickerX(t("Per quale giocatore?"), [], ids => { if (ids[0]) go("giocatori", { edraft: newEvalDraft(ids[0]), playerId: ids[0], pdraft: null, openAreas: null }); }, true); };

/* ---------- 2. Committenti: pagina corta, dettaglio a schede ---------- */
A.setActOrg = el => { const id = el.dataset.id || ""; const prev = Undo.busy; Undo.busy = true; try { saveOrgs(Orgs.list(), id); } finally { Undo.busy = prev; }
  toast(id ? t("I nuovi elementi vanno a {n}", { n: Orgs.name(id) }) : t("I nuovi elementi non hanno committente")); render(true); };
const ORG_TABS = [["sum", "Riepilogo"], ["todo", "Da fare"], ["match", "Partite"], ["pl", "Giocatori"], ["ev", "Report"], ["staff", "Staff e riunioni"], ["more", "Profili e note"]];
function orgDetail2(oid) {
  const o = oid === "_none" ? { id: "_none", name: t("Senza committente") } : Orgs.get(oid); if (!o) return "";
  const td = today(); const sortDue = (a, b) => (a[1].due || "9").localeCompare(b[1].due || "9");
  const tasks = orgRec("tasks", oid).filter(([, x]) => x.status !== "done").sort(sortDue), todos = orgRec("todos", oid).filter(([, x]) => !x.done && x.status !== "done").sort(sortDue);
  const ms = orgRec("matches", oid).sort((a, b) => (b[1].date || "").localeCompare(a[1].date || "")); const next = ms.filter(([, m]) => m.status !== "vista" && (m.date || "") >= td).reverse(), seen = ms.filter(([, m]) => !next.some(n => n[1] === m));
  const pls = orgRec("players", oid).sort((a, b) => pname(a[1]).localeCompare(pname(b[1]))), evs = orgRec("evals", oid).sort((a, b) => (b[1].date || "").localeCompare(a[1].date || ""));
  const ns = orgRec("notes", oid), mts = orgRec("meetings", oid).sort((a, b) => (b[1].date || "").localeCompare(a[1].date || "")), sf = orgRec("staff", oid).sort((a, b) => cmpTxt(a[1].name, b[1].name)), ids = orgRec("ideals", oid);
  const cnt = { sum: 0, todo: tasks.length + todos.length, match: ms.length, pl: pls.length, ev: evs.length, staff: mts.length + sf.length, more: ids.length + ns.length };
  let tab = ui.orgTab || "sum"; if (!ORG_TABS.some(x => x[0] === tab)) tab = "sum";
  const pl = id => { const p = P(id); return p ? esc(pname(p)) : ""; };
  const taskRow = ([id, x]) => `<div class="item click" data-a="editTask" data-id="${id}">${ico("report")}<div class="grow"><div class="t">${pl(x.playerId) || t("Incarico")}${x.position ? ` · ${esc(x.position)}` : ""}</div><div class="m">${x.due ? `${x.due < td ? `<b class="tm">${t("scaduto")}</b> · ` : ""}${t("entro il {d}", { d: fmtDate(x.due) })}` : ""}${x.what ? " · " + esc(x.what) : ""}</div></div></div>`;
  const todoRow = ([id, x]) => `<div class="item click" data-a="todoEdit" data-id="${id}">${ico("calendario")}<div class="grow"><div class="t">${esc(x.title || x.text || "")}</div><div class="m">${x.due ? (x.due < td ? `<b class="tm">${t("scaduto")}</b> · ` : "") + fmtDate(x.due) : t("senza data")}</div></div></div>`;
  const staffRow = ([id, x]) => `<div class="item click" data-a="editStaff" data-id="${id}"><div class="avatar">${esc((x.name || "?").split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase())}</div><div class="grow"><div class="t">${esc(x.name || "—")}</div><div class="m">${esc(staffRoleL(x.role))}${x.email ? " · " + esc(x.email) : ""}${x.phone ? " · " + esc(x.phone) : ""}</div></div></div>`;
  const idealRow = ([id, x]) => `<div class="item click" data-a="openIdeal" data-id="${id}">${ico("profili")}<div class="grow"><div class="t">${esc(x.name || "—")}</div><div class="m">${esc(roleL(x.role) || "—")}${x.system ? " · " + esc(x.system) : ""} · ${t("{n} requisiti", { n: (x.req || []).length })}</div></div></div>`;
  const list = (arr, fn, emptyTxt, lim) => arr.length ? `<div class="list">${arr.slice(0, lim || 200).map(fn).join("")}</div>${lim && arr.length > lim ? `<p class="m small">${t("e altri {n}", { n: arr.length - lim })}</p>` : ""}` : `<p class="m">${emptyTxt || t("Ancora niente qui.")}</p>`;
  const h3 = (s, n) => `<h3 class="osub">${s}${n != null ? ` <span class="m">${n}</span>` : ""}</h3>`;
  const nb = (k, l) => `<button class="btn sm" data-a="orgNew" data-k="${k}" data-id="${o.id}">+ ${t(l)}</button>`;
  let body = "";
  if (tab === "sum") {
    const facts = o.id === "_none" ? `<p class="m">${t("Elementi creati senza committente: aprili e scegli «Per conto di» per assegnarli.")}</p>`
      : `<dl class="ofacts">${[[t("Tipo"), orgTypeL(o)], [t("Periodo"), o.from && o.to ? fmtDate(o.from) + " – " + fmtDate(o.to) : o.from ? t("dal {d}", { d: fmtDate(o.from) }) : o.to ? t("fino al {d}", { d: fmtDate(o.to) }) : ""], [t("Referente"), o.person || ""], [t("Email"), o.email ? `<a href="mailto:${esc(o.email)}">${esc(o.email)}</a>` : ""]].filter(r => r[1]).map(([k, v]) => `<div><dt>${k}</dt><dd>${k === t("Email") ? v : esc(v)}</dd></div>`).join("")}</dl>
        ${o.want ? `<div class="banner info small" style="margin-top:10px"><b>${t("Cosa ti chiede")}:</b> ${esc(exOrgTxt(o, "want"))}</div>` : ""}${o.note ? `<p class="m" style="margin-top:6px"><b>${t("Accordo e note")}:</b> ${esc(exOrgTxt(o, "note"))}</p>` : ""}`;
    const due = [...tasks.map(x => ["t", x]), ...todos.map(x => ["d", x])].sort((a, b) => (a[1][1].due || "9").localeCompare(b[1][1].due || "9")).slice(0, 3);
    body = `${facts}${o.id === "_none" ? "" : `<div class="oacts">${nb("task", "Incarico")}${nb("todo", "Impegno")}${nb("match", "Partita")}${nb("meet", "Riunione")}${nb("note", "Nota")}${nb("staff", "Contatto")}<button class="btn sm ghost" data-a="orgCopy" data-id="${o.id}">⧉ ${t("Copia riepilogo")}</button></div>`}
      <div class="osum2"><div>${h3(t("Prossime scadenze"), cnt.todo)}${due.length ? `<div class="list">${due.map(([k, x]) => k === "t" ? taskRow(x) : todoRow(x)).join("")}</div>` : `<p class="m">${t("Niente in scadenza.")}</p>`}</div>
       <div>${h3(t("Prossime partite"), next.length)}${list(next.slice(0, 3), ([id, m]) => matchItem(id, m), t("Nessuna partita in programma."))}</div></div>
      ${o.id === "_none" ? "" : `<div class="ojump"><span class="m small">${t("Apri le pagine solo con il suo lavoro")}:</span>${[["panoramica", "Panoramica"], ["calendario", "Agenda"], ["partite", "Partite"], ["giocatori", "Giocatori"], ["report", "Report"], ["staff", "Staff e riunioni"], ["dati", "Dati"]].map(([v, n]) => `<button type="button" class="lnk" data-a="orgView" data-id="${o.id}" data-v="${v}">${t(n)}</button>`).join("")}</div>`}`;
  } else if (tab === "todo") body = `${o.id === "_none" ? "" : `<div class="oacts">${nb("task", "Incarico")}${nb("todo", "Impegno")}</div>`}${h3(t("Incarichi"), tasks.length)}${list(tasks, taskRow)}${h3(t("Impegni"), todos.length)}${list(todos, todoRow)}`;
  else if (tab === "match") body = `${o.id === "_none" ? "" : `<div class="oacts">${nb("match", "Partita")}</div>`}${h3(t("In programma"), next.length)}${list(next, ([id, m]) => matchItem(id, m))}${h3(t("Già viste"), seen.length)}${list(seen, ([id, m]) => matchItem(id, m), "", 20)}`;
  else if (tab === "pl") body = list(pls, ([id, p]) => playerItem(id, p), "", 60);
  else if (tab === "ev") body = list(evs, ([id, e]) => evalItem(id, e, true), "", 40);
  else if (tab === "staff") body = `${o.id === "_none" ? "" : `<div class="oacts">${nb("meet", "Riunione")}${nb("staff", "Contatto")}</div>`}${h3(t("Riunioni"), mts.length)}${list(mts, ([id, m]) => meetingItem(id, m), "", 30)}${h3(t("Contatti"), sf.length)}${list(sf, staffRow)}`;
  else body = `${o.id === "_none" ? "" : `<div class="oacts">${nb("note", "Nota")}</div>`}${h3(t("Profili ideali"), ids.length)}${list(ids, idealRow)}${h3(t("Note"), ns.length)}${ns.length ? `<div class="ngrid">${ns.map(([id, n]) => noteCard(id, n)).join("")}</div>` : `<p class="m">${t("Ancora niente qui.")}</p>`}`;
  return `<section class="panel odetail" id="odetail" style="--oc:${esc(orgColor(o))}"><div class="row between ohead"><h2><span class="tdot" style="background:var(--oc)"></span> ${esc(o.name)}${o.example ? ` <span class="ex">${t("Esempio")}</span>` : ""}</h2><div class="row">${o.id === "_none" ? "" : `<button class="btn sm ghost" data-a="editOrg" data-id="${o.id}">✎ ${t("Modifica")}</button>`}<button class="btn sm ghost" data-a="orgOpen" data-id="" aria-label="${t("Chiudi")}">✕</button></div></div>
   <div class="tabs otabs" role="tablist">${ORG_TABS.map(([k, n]) => `<button role="tab" data-a="orgTab" data-t="${k}" aria-pressed="${tab === k}">${t(n)}${k !== "sum" ? ` <span class="otc">${cnt[k]}</span>` : ""}</button>`).join("")}</div>
   <div class="obody">${body}</div></section>`;
}
window.orgDetail = orgDetail2;
R.committenti = () => {
  const l = Orgs.list(), act = Orgs.active(); const none = orgStats("_none"); const noneN = none.players + none.next + none.seen + none.evals + none.tasks + none.todos + none.notes + none.meets + none.staff + none.ideals;
  if (ui.orgSel && ui.orgSel !== "_none" && !Orgs.get(ui.orgSel)) ui.orgSel = null;
  const head = `<div class="head"><div><h1>${t("Committenti")}</h1><p class="sub">${t(PAGE_DESC.committenti)}</p></div><button class="btn pri" data-a="editOrg">+ ${t("Aggiungi committente")}</button></div>`;
  if (!l.length) return head + `<section class="panel"><div class="empty">${ico("committenti", "ico big")}<p>${t("Ancora nessun committente.")}</p><span class="m">${t("Aggiungi il club, l'agenzia o l'agente per cui lavori. Se lavori da freelance, aggiungine uno per ogni cliente e, se vuoi, «Lavoro personale» per la tua pratica.")}</span><div class="row" style="justify-content:center;margin-top:12px"><button class="btn pri" data-a="editOrg">+ ${t("Aggiungi committente")}</button></div></div></section>`;
  const actBar = `<div class="oact" role="group" aria-label="${t("I nuovi elementi vanno a")}"><span class="oactl">${t("I nuovi elementi vanno a")}</span><div class="seg oseg">${l.map(o => `<button data-a="setActOrg" data-id="${o.id}" aria-pressed="${act === o.id}"><span class="tdot" style="background:${esc(orgColor(o))}"></span>${esc(o.name)}</button>`).join("")}<button data-a="setActOrg" data-id="" aria-pressed="${!act}" title="${t("I nuovi elementi non vengono assegnati a nessun committente")}">${t("Nessun committente")}</button></div></div>`;
  return head + actBar + `<div class="ogrid">${l.map(o => orgCard(o, o.id === act, ui.orgSel === o.id)).join("")}${noneN ? `<div class="ocard onone${ui.orgSel === "_none" ? " on" : ""}" data-oid="_none"><button type="button" class="otitle" data-a="orgOpen" data-id="_none"><b>${t("Senza committente")}</b><span class="m">${t("{n} elementi tuoi da assegnare", { n: noneN })}</span></button></div>` : ""}</div>
   ${ui.orgSel ? orgDetail2(ui.orgSel) : `<p class="m ohint">${t("Tocca un committente per vedere tutto il lavoro per lui.")}</p>`}`;
};
// la scheda intera si apre con un tocco (non solo il nome); tocca di nuovo per chiudere
window.orgCard = (orig => function (o, act, sel) { return orig.apply(this, arguments).replace('<div class="ocard', `<div data-oid="${o.id}" class="ocard`).replace(/<div class="row" style="gap:6px;margin-top:8px">[\s\S]*<\/div><\/div>$/, "</div>"); })(window.orgCard);
orgCard = window.orgCard;
document.addEventListener("click", e => { const c = e.target.closest && e.target.closest(".ocard[data-oid]"); if (!c || e.target.closest("button:not(.otitle), a, input, select")) return; if (ui.view !== "committenti") return;
  if (e.target.closest("[data-a]") && !e.target.closest(".otitle")) return; e.preventDefault(); e.stopPropagation(); A.orgOpen({ dataset: { id: ui.orgSel === c.dataset.oid ? "" : c.dataset.oid } }); }, true);
Object.assign(A, {
  orgOpen: el => { const id = el.dataset.id || null; if (id !== ui.orgSel) ui.orgTab = "sum"; ui.orgSel = id; render(true); if (id) setTimeout(() => { const d = $("#odetail"); if (d && d.getBoundingClientRect().top > innerHeight * 0.6) d.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }); }, 30); },
  orgJump: el => { ui.orgSel = el.dataset.id; ui.orgTab = el.dataset.v; render(true); setTimeout(() => { const d = $("#odetail"); if (d) d.scrollIntoView({ behavior: "smooth", block: "start" }); }, 30); },
  orgTab: el => { ui.orgTab = el.dataset.t; render(true); }
});

/* ---------- 3. titoli puliti: niente emoji davanti ai titoli; icone vere nelle scorciatoie ---------- */
const EMO_RE = /^[\s]*(?:[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F2FF}][\u{FE0F}\u{200D}\u{1F3FB}-\u{1F3FF}]*)+\s*/u;
const QA_ICO = { newMatch: "partite", newPlayer: "giocatori", pickEvalPlayer: "report", editMeet: "staff" };
function tidyIcons(root) {
  if (!root) return;
  for (const el of root.querySelectorAll("h1, h2, h3, summary, label.f, .h3s")) { const n = [...el.childNodes].find(x => x.nodeType === 3 && x.textContent.trim()); if (n && el.firstChild && (el.firstChild === n || (el.firstChild.nodeType === 3 && !el.firstChild.textContent.trim() && el.childNodes[1] === n)) && EMO_RE.test(n.textContent)) n.textContent = n.textContent.replace(EMO_RE, ""); }
  for (const q of root.querySelectorAll(".qab .qi")) { if (q.dataset.ic) continue; const k = QA_ICO[q.closest(".qab").dataset.a]; if (k) { q.innerHTML = ico(k); q.dataset.ic = "1"; } }
  for (const v of root.querySelectorAll(".vico")) { if (v.dataset.ic) continue; const it = v.closest("[data-a]"); const k = it && ({ openMatch: "report", runTask: "partite", editTask: "report", openPlayer: "giocatori" })[it.dataset.a]; if (k) { v.innerHTML = ico(k); v.dataset.ic = "1"; } }
}
let tidyQ = 0; const tidyRun = () => { if (tidyQ) return; tidyQ = requestAnimationFrame(() => { tidyQ = 0; try { tidyIcons($("#view")); tidyIcons($("#sheetRoot")); } catch (e) { } }); };
try { const mo = new MutationObserver(tidyRun); for (const sel of ["#view", "#sheetRoot"]) { const n = $(sel); if (n) mo.observe(n, { childList: true, subtree: true }); } } catch (e) { }

/* ---------- 4. cambio lingua: il riquadro «Annulla / Conferma» ancora aperto non resta nella lingua di prima ---------- */
A.setLang = (orig => function () { try { UB.hide(); } catch (e) { } return orig.apply(this, arguments); })(A.setLang);

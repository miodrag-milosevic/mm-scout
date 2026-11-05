"use strict";
/* =========================================================
   MM Scout — multimedia, finestre, condivisione protetta,
   backup e cloud, personalizzazione, portfolio, esempi, eventi.
   ========================================================= */

/* ---------- finestre ---------- */
function sheet(html, wide) { $("#sheetRoot").innerHTML = `<div class="scrim" data-a="closeSheet"><div class="sheet ${wide ? "wide" : ""}" role="dialog" aria-modal="true">${html}</div></div>`; }
function closeSheet() { const r = $("#sheetRoot"); if (r) r.innerHTML = ""; }
function confirmSheet(text, onYes, yesLabel) { sheet(`<h2>${t("Confermi?")}</h2><p>${esc(text)}</p><div class="row end"><button class="btn" data-a="closeSheetBtn">${t("Annulla")}</button><button class="btn pri" id="yes">${esc(yesLabel || t("Conferma"))}</button></div>`); $("#yes").onclick = async () => { closeSheet(); await onYes(); render(true); }; }
function promptSheet(title, label, value, onOk, type = "text") { sheet(`<h2>${esc(title)}</h2><form id="pf" class="col"><label class="f">${esc(label)}<input type="${type}" id="pfv" value="${esc(value || "")}" required></label><div class="row end"><button type="button" class="btn" data-a="closeSheetBtn">${t("Annulla")}</button><button class="btn pri">${t("OK")}</button></div></form>`); $("#pfv").focus(); $("#pf").onsubmit = e => { e.preventDefault(); const v = $("#pfv").value; closeSheet(); onOk(v); }; }

/* ---------- multimedia (file cifrati nel dispositivo) ---------- */
const mediaKindL = k => ({ image: t("Foto"), video: t("Video"), audio: t("Audio"), doc: t("Documento"), link: t("Link") }[k] || t("File"));
function mediaOf(owner, id) { return [...S.media.entries()].filter(([, m]) => (m.owner === owner && m.ownerId === id) || (owner === "player" && m.playerId === id)).sort((a, b) => (b[1].date || "").localeCompare(a[1].date || "")); }
function mediaGrid(owner, id) {
  const items = mediaOf(owner, id);
  return `<div class="row noprint" style="margin:8px 0"><button class="btn sm" data-a="addMedia" data-owner="${owner}" data-id="${id}">+ ${t("Foto, video o documento")}</button><button class="btn sm" data-a="addLink" data-owner="${owner}" data-id="${id}">+ ${t("Link")}</button></div>
  ${items.length ? `<div class="mgrid">${items.map(([mid, m]) => `<button class="mtile" data-a="openMedia" data-id="${mid}"><div class="th">${m.kind === "image" && m.blobId ? `<img data-blob="${m.blobId}" alt="">` : esc(mediaKindL(m.kind))}</div><div class="cap">${esc(m.name || "")}</div></button>`).join("")}</div>` : `<p class="muted small">${t("Nessun contenuto.")}</p>`}`;
}
function mediaSection(owner, id) { return `<section class="panel"><h2>${t("Multimedia")}</h2><p class="sub small">${t("Foto, video, audio e PDF vengono salvati cifrati su questo dispositivo. Per video lunghi meglio un link (es. un video non in elenco o la tua piattaforma di analisi).")}</p>${mediaGrid(owner, id)}</section>`; }
async function addMediaFiles(owner, ownerId, files) {
  const max = (Cfg.get().mediaMaxMB || 150) * 1048576; let n = 0;
  for (const f of files) {
    if (f.size > max) { toast(t("{f} è troppo grande (max {m} MB)", { f: f.name, m: Cfg.get().mediaMaxMB })); continue; }
    toast(t("Salvataggio di {f}…", { f: f.name }));
    try { const blobId = await Store.putBlob(f); const kind = f.type.startsWith("image/") ? "image" : f.type.startsWith("video/") ? "video" : f.type.startsWith("audio/") ? "audio" : "doc"; await put("media", uid(), { owner, ownerId, kind, name: f.name, mime: f.type, size: f.size, blobId, note: "", date: today() }); n++; }
    catch (e) { toast(t("Spazio insufficiente per {f}", { f: f.name })); }
  }
  if (n) toast(t("{n} file aggiunti", { n })); render(true);
}
async function openMedia(id) {
  const m = S.media.get(id); if (!m) return;
  let body = "";
  if (m.kind === "link") body = `<p><a href="${esc(m.url)}" target="_blank" rel="noopener noreferrer">${esc(m.url)}</a></p>`;
  else { const u = await Store.blobURL(m.blobId); if (!u) body = `<div class="empty">${t("File non trovato.")}</div>`;
    else if (m.kind === "image") body = `<img src="${u}" alt="" style="border-radius:8px;max-height:65vh;object-fit:contain;width:100%">`;
    else if (m.kind === "video") body = `<video src="${u}" controls playsinline style="width:100%;max-height:65vh;border-radius:8px"></video>`;
    else if (m.kind === "audio") body = `<audio src="${u}" controls style="width:100%"></audio>`;
    else body = m.mime === "application/pdf" ? `<iframe src="${u}" style="width:100%;height:60vh;border:1px solid var(--line);border-radius:8px" title="PDF"></iframe>` : `<p class="muted">${esc(m.mime)}</p>`; }
  sheet(`<div class="row between"><h2>${esc(m.name || mediaKindL(m.kind))}</h2><button class="btn sm ghost" data-a="closeSheetBtn">✕</button></div>${body}
    <div class="fgrid"><label class="f">${t("Titolo")}<input type="text" id="mdName" value="${esc(m.name)}"></label><label class="f">${t("Data")}<input type="date" id="mdDate" value="${esc(m.date)}"></label><label class="f full">${t("Nota")}<textarea id="mdNote" style="min-height:60px">${esc(m.note)}</textarea></label></div>
    <div class="m">${esc(mediaKindL(m.kind))}${m.size ? " · " + fmtSize(m.size) : ""}</div>
    <div class="row between"><button class="btn danger" data-a="delMedia" data-id="${id}">${t("Elimina")}</button><div class="row">${m.blobId ? `<button class="btn" data-a="dlMedia" data-id="${id}">${t("Scarica")}</button>` : ""}<button class="btn pri" data-a="saveMedia" data-id="${id}">${t("Salva")}</button></div></div>`, true);
}

/* ---------- moduli rapidi ---------- */
function safeUrl(u) { u = String(u || "").trim(); if (!u) return ""; if (!/^https?:\/\//i.test(u)) u = "https://" + u; try { const x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : ""; } catch (e) { return ""; } }
function matchForm(id, presetDate) {
  const m = id ? S.matches.get(id) : { date: presetDate || today(), type: "Campionato", status: "pianificata", targets: [], tags: [] }; const c = Cfg.get();
  const pl = [...S.players.entries()].filter(([, p]) => !p.archived).sort((a, b) => pname(a[1]).localeCompare(pname(b[1])));
  sheet(`<h2>${id ? t("Modifica partita") : t("Nuova partita")}</h2><form id="mForm" class="fgrid">
   <label class="f">${t("Squadra di casa")}<input type="text" id="mHome" required value="${esc(m.home)}"></label>
   <label class="f">${t("Squadra in trasferta")}<input type="text" id="mAway" required value="${esc(m.away)}"></label>
   <label class="f">${t("Data")}<input type="date" id="mDate" value="${esc(m.date)}"></label>
   <label class="f">${t("Ora")}<input type="time" id="mTime" value="${esc(m.time)}"></label>
   <label class="f">${t("Tipologia")}${sel("mType", c.matchTypes, m.type)}</label>
   <label class="f">${t("Categoria squadra")}${sel("mTeamCat", c.teamCats, m.teamCat, "—")}</label>
   <label class="f">${t("Competizione")}<input type="text" id="mComp" value="${esc(m.competition)}"></label>
   <label class="f">${t("Luogo")}<input type="text" id="mVenue" value="${esc(m.venue)}"></label>
   <details class="full"><summary class="m" style="font-weight:600;cursor:pointer">${t("Link e indirizzo (diretta, biglietti, info, mappa)")}</summary><div class="fgrid" style="margin-top:8px">
   <label class="f">${t("Diretta / video")}<input type="text" inputmode="url" id="mLStream" placeholder="https://" value="${esc(m.linkStream)}"></label>
   <label class="f">${t("Biglietti / accrediti")}<input type="text" inputmode="url" id="mLTickets" placeholder="https://" value="${esc(m.linkTickets)}"></label>
   <label class="f">${t("Info partita")}<input type="text" inputmode="url" id="mLInfo" placeholder="https://" value="${esc(m.linkInfo)}"></label>
   <label class="f">${t("Indirizzo dello stadio")}<input type="text" id="mAddr" value="${esc(m.address)}"></label></div></details>
   ${window.Orgs ? Orgs.sel("mOrg", m.org ?? Orgs.cur()) : ""}<label class="f full">${t("Obiettivo della missione")}<textarea id="mGoal">${esc(m.goal)}</textarea></label>
   <div class="full"><div class="m" style="font-weight:600;margin-bottom:6px">${t("Tag")}</div><div class="chips" id="mTags">${c.tags.map(tg => `<button type="button" class="chip" data-tag="${tg.id}" aria-pressed="${(m.tags || []).includes(tg.id)}">${esc(tg.name)}</button>`).join("")}</div></div>
   <div class="full"><div class="m" style="font-weight:600;margin-bottom:6px">${t("Giocatori da osservare")}</div><input type="search" id="mTgQ" placeholder="${t("Filtra")}" style="margin-bottom:6px"><div class="chips" id="mTg" style="max-height:200px;overflow:auto">${pl.map(([pid, p]) => `<button type="button" class="chip" data-pid="${pid}" data-n="${esc(pname(p).toLowerCase())}" aria-pressed="${(m.targets || []).includes(pid)}">${esc(pname(p))}</button>`).join("") || `<span class="muted">${t("Aggiungi prima qualche giocatore.")}</span>`}</div></div>
   <div class="row full between">${id ? `<button type="button" class="btn danger" data-a="delMatch" data-id="${id}">${t("Elimina")}</button>` : "<span></span>"}<div class="row"><button type="button" class="btn" data-a="closeSheetBtn">${t("Annulla")}</button><button class="btn pri">${t("Salva")}</button></div></div></form>`);
  const tog = e => { const b = e.target.closest(".chip"); if (b) b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") !== "true"); };
  $("#mTg").onclick = tog; $("#mTags").onclick = tog;
  $("#mTgQ").oninput = e => { const q = e.target.value.toLowerCase(); $$("#mTg .chip").forEach(x => x.hidden = !x.dataset.n.includes(q)); };
  $("#mForm").onsubmit = e => { e.preventDefault(); const nid = id || uid(); const o = { ...(id ? S.matches.get(id) : { events: [], status: "pianificata" }), ...($("#mOrg") ? { org: $("#mOrg").value } : {}), home: $("#mHome").value.trim(), away: $("#mAway").value.trim(), date: $("#mDate").value, time: $("#mTime").value, type: $("#mType").value, teamCat: $("#mTeamCat").value, competition: $("#mComp").value.trim(), venue: $("#mVenue").value.trim(), linkStream: safeUrl($("#mLStream").value), linkTickets: safeUrl($("#mLTickets").value), linkInfo: safeUrl($("#mLInfo").value), address: $("#mAddr").value.trim(), goal: $("#mGoal").value, targets: $$("#mTg .chip[aria-pressed=true]").map(b => b.dataset.pid), tags: $$("#mTags .chip[aria-pressed=true]").map(b => b.dataset.tag) }; put("matches", nid, o); toast(t("Partita salvata")); closeSheet(); if (!id) { ui.view = "partite"; ui.matchId = nid; ui.mtab = "live"; history.replaceState(null, "", "#partite"); } render(true); };
}
function subForm(key, sid) {
  const p = P(ui.playerId); const arr = p[key] || []; const r = sid ? arr.find(x => x.id === sid) : { date: today(), author: Profile.get().name || "" };
  const F = {
    relations: `<label class="f full">${t("Titolo")}<input type="text" id="sTitle" value="${esc(r.title || t("Scouting report: {n}", { n: pname(p) }))}"></label><label class="f">${t("Autore")}<input type="text" id="sAuthor" value="${esc(r.author)}"></label><label class="f">${t("Data")}<input type="date" id="sDate" value="${esc(r.date)}"></label><label class="f full">${t("Testo")}<textarea id="sText" style="min-height:240px" placeholder="${t("Qualità fisico-atletica · Qualità tecnica · Qualità tattica · Comportamento in campo")}">${esc(r.text || (sid ? "" : [t("QUALITÀ FISICO-ATLETICA"), "", t("QUALITÀ TECNICA"), "", t("QUALITÀ TATTICA"), "", t("COMPORTAMENTO IN CAMPO"), ""].join("\n")))}</textarea></label>`,
    injuries: `<label class="f">${t("Data")}<input type="date" id="sDate" value="${esc(r.date)}"></label><label class="f">${t("Tipo di infortunio")}<input type="text" id="sType" value="${esc(r.type)}"></label><label class="f">${t("Categoria")}${sel("sPart", Cfg.get().injuryTypes, r.part)}</label><label class="f">${t("Giorni di stop")}<input type="number" id="sDays" value="${esc(r.days)}"></label><label class="f full">${t("Note")}<textarea id="sText">${esc(r.notes)}</textarea></label>`
  }[key];
  sheet(`<h2>${key === "relations" ? t("Relazione") : t("Infortunio")}</h2><form id="sForm" class="fgrid">${F}<div class="row full between">${sid ? `<button type="button" class="btn danger" id="sDel">${t("Elimina")}</button>` : "<span></span>"}<div class="row"><button type="button" class="btn" data-a="closeSheetBtn">${t("Annulla")}</button><button class="btn pri">${t("Salva")}</button></div></div></form>`, key === "relations");
  const v = s => $(s) ? $(s).value : undefined;
  $("#sForm").onsubmit = e => { e.preventDefault(); const o = { id: sid || uid(), date: v("#sDate"), title: v("#sTitle"), author: v("#sAuthor"), text: key === "relations" ? v("#sText") : undefined, notes: key === "injuries" ? v("#sText") : undefined, type: v("#sType"), part: v("#sPart"), days: v("#sDays") }; Object.keys(o).forEach(k => o[k] === undefined && delete o[k]);
    const np = clone(p); np[key] = sid ? arr.map(x => x.id === sid ? o : x) : [...arr, o]; put("players", ui.playerId, np); closeSheet(); render(true); };
  if (sid) $("#sDel").onclick = () => { const np = clone(p); np[key] = arr.filter(x => x.id !== sid); put("players", ui.playerId, np); closeSheet(); render(true); };
}
function listForm(id, parentId) {
  const l = id ? S.lists.get(id) : { name: "", color: "#1E6A47", note: "", parentId: parentId || null };
  const opts = [...S.lists.entries()].filter(([lid, x]) => !x.smart && lid !== id && !(id && listDescendants(id).includes(lid)));
  sheet(`<h2>${id ? t("Modifica lista") : t("Nuova lista")}</h2><form id="lForm" class="col">
   <label class="f">${t("Nome della lista")}<input type="text" id="lName" value="${esc(l.name)}" required></label>
   <div class="row"><label class="f" style="flex:1">${t("Dentro a")}<select id="lParent"><option value="">${t("— nessuna (lista principale)")}</option>${opts.map(([lid]) => `<option value="${lid}" ${l.parentId === lid ? "selected" : ""}>${esc(listPath(lid).map(x => x[1].name).join(" › "))}</option>`).join("")}</select></label><label class="f">${t("Colore")}<input type="color" id="lColor" value="${esc(l.color || "#1E6A47")}"></label></div>
   <label class="f">${t("Descrizione")}<textarea id="lNote" style="min-height:60px">${esc(l.note)}</textarea></label>
   <div class="row between">${id ? `<button type="button" class="btn danger" data-a="delList" data-id="${id}">${t("Elimina")}</button>` : "<span></span>"}<div class="row"><button type="button" class="btn" data-a="closeSheetBtn">${t("Annulla")}</button><button class="btn pri">${t("Salva")}</button></div></div></form>`);
  if (l.smart) $("#lParent").closest("label").hidden = true;
  $("#lForm").onsubmit = e => { e.preventDefault(); const nid = id || uid(); put("lists", nid, { ...l, name: $("#lName").value.trim(), parentId: l.smart ? null : ($("#lParent").value || null), color: $("#lColor").value, note: $("#lNote").value, created: l.created || today() }); ui.listId = nid; closeSheet(); go("liste"); };
}
function playerPicker(title, preselected, onDone) {
  const pl = [...S.players.entries()].filter(([, p]) => !p.archived).sort((a, b) => pname(a[1]).localeCompare(pname(b[1])));
  const sset = new Set(preselected || []);
  sheet(`<h2>${esc(title)}</h2><input type="search" id="ppQ" placeholder="${t("Cerca")}"><div class="list" id="ppList" style="max-height:55vh;overflow:auto">${pl.map(([id, p]) => `<label class="item" data-n="${esc(pname(p).toLowerCase() + " " + (p.club || "").toLowerCase())}"><input type="checkbox" value="${id}" ${sset.has(id) ? "checked" : ""}>${avatar(p)}<div class="grow"><div class="t">${esc(pname(p))}</div><div class="m">${esc(roleL(mainRole(p)) || "")} ${p.club ? "· " + esc(p.club) : ""}</div></div></label>`).join("")}</div><div class="row end"><button class="btn" data-a="closeSheetBtn">${t("Annulla")}</button><button class="btn pri" id="ppOk">${t("Conferma")}</button></div>`);
  $("#ppQ").oninput = e => { const q = e.target.value.toLowerCase(); $$("#ppList .item").forEach(x => x.hidden = !x.dataset.n.includes(q)); };
  $("#ppOk").onclick = () => { const ids = $$("#ppList input:checked").map(x => x.value); closeSheet(); onDone(ids); };
}
function slotPicker(i) {
  const lu = S.lineups.get(ui.lineupId); const s = (lu.slots || {})[i] || { main: "", alt: [] }; const F = FORMATIONS[lu.formation] || FORMATIONS["4-3-3"];
  const pl = [...S.players.entries()].filter(([, p]) => !p.archived && p.verdict !== "no").sort((a, b) => (profile(b[0]).rating ?? -1) - (profile(a[0]).rating ?? -1));
  const opts = v => `<option value="">—</option>` + pl.map(([id, p]) => `<option value="${id}" ${v === id ? "selected" : ""}>${esc(pname(p))} · ${esc(roleL(mainRole(p)) || "")} · ${f1(profile(id).rating)}</option>`).join("");
  sheet(`<h2>${t("Posizione {p}", { p: F[i][0] })}</h2><label class="f">${t("Titolare")}<select id="slMain">${opts(s.main)}</select></label><label class="f">${t("Prima alternativa")}<select id="slA1">${opts((s.alt || [])[0])}</select></label><label class="f">${t("Seconda alternativa")}<select id="slA2">${opts((s.alt || [])[1])}</select></label>
   <div class="row end"><button class="btn" data-a="closeSheetBtn">${t("Annulla")}</button><button class="btn pri" id="slOk">${t("Salva")}</button></div>`);
  $("#slOk").onclick = () => { const slots = { ...(lu.slots || {}) }; slots[i] = { main: $("#slMain").value, alt: [$("#slA1").value, $("#slA2").value].filter(Boolean) }; put("lineups", ui.lineupId, { ...lu, slots }); closeSheet(); render(true); };
}
function quickPlayer(matchId) {
  const c = Cfg.get(); const m = S.matches.get(matchId);
  sheet(`<h2>${t("Giocatore notato")}</h2><form id="qpForm" class="fgrid"><label class="f">${t("Nome")}<input type="text" id="qpFirst"></label><label class="f">${t("Cognome")}<input type="text" id="qpLast" required></label><label class="f">${t("N° maglia")}<input type="number" id="qpShirt"></label><label class="f">${t("Squadra")}<select id="qpClub"><option>${esc(m.home)}</option><option>${esc(m.away)}</option></select></label><label class="f">${t("Ruolo")}${sel("qpRole", c.roles, "", "—")}</label><label class="f">${t("Anno di nascita")}<input type="number" id="qpYear"></label><label class="f full">${t("Perché l'hai notato")}<textarea id="qpNote" style="min-height:60px"></textarea></label>
   <div class="row full end"><button type="button" class="btn" data-a="closeSheetBtn">${t("Annulla")}</button><button class="btn pri">${t("Aggiungi")}</button></div></form>`);
  $("#qpForm").onsubmit = e => { e.preventDefault(); const id = uid(); const role = $("#qpRole").value; const r = Cfg.role(role); put("players", id, { first: $("#qpFirst").value.trim(), last: $("#qpLast").value.trim(), shirt: $("#qpShirt").value, club: $("#qpClub").value, roles: role ? [role] : [], pos: r ? { x: r.x, y: r.y } : null, birthYear: $("#qpYear").value, notes: $("#qpNote").value, verdict: "rivedere", tags: [], listIds: [], sex: "Uomo", contract: {}, physique: {}, pros: [], cons: [], injuries: [], relations: [] }); put("matches", matchId, { ...m, targets: [...(m.targets || []), id] }); closeSheet(); toast(t("Giocatore aggiunto")); render(true); };
}
function moreMenu() {
  sheet(`<h2>${t("Menu")}</h2><div class="list">${views().filter(v => v !== "-" && !["panoramica", "giocatori", "partite", "report"].includes(v[0])).map(v => `<a class="item click" href="#${v[0]}" data-a="menuGo" data-v="${v[0]}" style="color:inherit;text-decoration:none">${ico(v[0])}<div class="grow t">${v[1]}</div></a>`).join("")}<button class="item click" data-a="lockNow" style="border:0;background:none;width:100%;text-align:left">${ico("lock")}<div class="grow t">${t("Blocca ora")}</div></button></div>`);
}
function quickAdd() { sheet(`<h2>${t("Aggiungi")}</h2><div class="col qadd"><button class="btn pri" data-a="newPlayer">+ ${t("Giocatore")}</button><button class="btn" data-a="newMatch">+ ${t("Partita")}</button><button class="btn" data-a="loadSheet">+ ${t("Carica distinta")}</button><button class="btn" data-a="pickEvalPlayer">+ ${t("Valutazione")}</button>
   <div class="qgrid"><button class="btn" data-a="editTask">+ ${t("Incarico")}</button><button class="btn" data-a="todoNew">+ ${t("Impegno")}</button><button class="btn" data-a="editMeet">+ ${t("Riunione")}</button><button class="btn" data-a="noteNew">+ ${t("Nota")}</button><button class="btn" data-a="newList" data-parent="">+ ${t("Lista")}</button><button class="btn" data-a="editOrg">+ ${t("Committente")}</button></div></div>`); }

/* =========================================================
   CONDIVISIONE PROTETTA (file o link cifrati con codice)
   ========================================================= */
const SHARE_CSS = `:root{--ink:#17221C;--muted:#5B6860;--line:#D3D9CF;--sunk:#E6EAE3;--accent:#1E6A47;--accent-soft:#DCEBE2;--amber:#B8730F;--amber-soft:#F6E7CC;--bad:#B23A3A;--bad-soft:#F5DEDC;--blue:#2F6690;--blue-soft:#DCE8F2;--pitch:#1E6A47;--pitch-line:rgba(255,255,255,.8);--good:#2E7D4F}
*{box-sizing:border-box}body{margin:0;background:#F1F3EF;color:var(--ink);font:15px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif}
.doc{max-width:980px;margin:0 auto;padding:24px 16px;display:flex;flex-direction:column;gap:16px}
h1,h2,h3{font-family:"Avenir Next Condensed","Arial Narrow",sans-serif;text-transform:uppercase;letter-spacing:.02em;margin:0}h1{font-size:30px}h2{font-size:20px}h3{font-size:15px}
.panel{background:#fff;border:1px solid var(--line);border-radius:10px;padding:16px;break-inside:avoid}
.hdr{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:flex-end;border-bottom:3px solid var(--ink);padding-bottom:10px}
.wm{font-size:12px;color:var(--muted)}.muted{color:var(--muted)}.m{font-size:13px;color:var(--muted)}
.row{display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start}.grow{flex:1;min-width:220px}
.photo{width:120px;height:120px;border-radius:10px;object-fit:cover;background:var(--sunk)}
.rbox{background:var(--ink);color:#fff;border-radius:8px;text-align:center;padding:8px 14px}.rbox b{display:block;font-size:30px;line-height:1}
.kv{display:grid;grid-template-columns:auto 1fr;gap:3px 12px;font-size:14px;margin:8px 0}.kv dt{font-weight:700}.kv dd{margin:0}
.params{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px 20px}.pb{font-size:13px}.lab{display:flex;justify-content:space-between;font-weight:600}
.bar{height:8px;border-radius:4px;background:var(--sunk);overflow:hidden}.bar i{display:block;height:100%;background:var(--accent)}
.areah{display:flex;justify-content:space-between;border-bottom:2px solid var(--ink);padding-bottom:4px;margin:14px 0 8px}
.pill{display:inline-block;font-size:12px;font-weight:700;text-transform:uppercase;padding:2px 8px;border-radius:99px;background:var(--sunk)}
.c-good{background:var(--accent-soft);color:var(--accent)}.c-amber{background:var(--amber-soft);color:var(--amber)}.c-bad{background:var(--bad-soft);color:var(--bad)}.c-blue{background:var(--blue-soft);color:var(--blue)}.c-grey{background:var(--sunk);color:var(--muted)}
table{border-collapse:collapse;width:100%;font-size:14px}th,td{text-align:left;padding:5px 8px;border-bottom:1px solid var(--line)}th{font-size:12px;text-transform:uppercase;color:var(--muted)}
.radar text,.chart text{fill:var(--muted);font-size:10px}svg{max-width:100%}.pitchbox{width:300px;max-width:100%}
.code{font-family:ui-monospace,Menlo,monospace;font-size:12px;background:var(--sunk);padding:1px 5px;border-radius:4px}
.foot{font-size:12px;color:var(--muted);text-align:center;padding:10px}
@media print{body{background:#fff}.panel{border-color:#ccc}}`;
function shareHeader(title, o) {
  const prof = Profile.get();
  return `<div class="hdr"><div><div class="m">${esc(t("Report di scouting riservato"))}</div><h1>${esc(title)}</h1></div><div style="text-align:right">${prof.name ? `<b>${esc(prof.name)}</b>` : ""}${prof.title ? `<div class="m">${esc(prof.title)}</div>` : ""}${prof.email ? `<div class="m">${esc(prof.email)}</div>` : ""}${prof.phone ? `<div class="m">${esc(prof.phone)}</div>` : ""}</div></div>
  ${o.recipient ? `<div class="wm">${esc(t("Riservato a: {r}", { r: o.recipient }))} · ${esc(t("condiviso il {d}", { d: fmtDate(today()) }))}${o.expires ? " · " + esc(t("valido fino al {d}", { d: fmtDate(o.expires) })) : ""}</div>` : ""}`;
}
function sharePlayerBlock(id, o) {
  const p = P(id), pr = profile(id), c = p.contract || {}; const s = Cfg.get().scale;
  const evs = playerEvals(id);
  let h = `<div class="panel"><div class="row">${o.photo && p.photo ? `<img class="photo" src="${p.photo}" alt="">` : ""}<div class="grow"><h2>${esc(pname(p))}</h2>
    <dl class="kv"><dt>${t("Ruoli")}</dt><dd>${esc((p.roles || []).map(roleL).join(", ") || "—")}</dd><dt>${t("Età")}</dt><dd>${age(p) ?? "—"}${p.birth ? " (" + fmtDate(p.birth) + ")" : p.birthYear ? " (" + esc(p.birthYear) + ")" : ""}</dd><dt>${t("Nazionalità")}</dt><dd>${esc([p.nat, p.nat2].filter(Boolean).join(" / ") || "—")}</dd><dt>${t("Club")}</dt><dd>${esc(p.club || "—")}${p.league ? " · " + esc(p.league) : ""}</dd><dt>${t("Piede")}</dt><dd>${esc(p.foot ? t(p.foot) : "—")}</dd><dt>${t("Fisico")}</dt><dd>${esc([p.height ? p.height + " cm" : "", p.weight ? p.weight + " kg" : "", L(Cfg.get().somatotypes.find(x => x.id === p.soma))].filter(Boolean).join(" · ") || "—")}</dd>
    ${o.contract ? `<dt>${t("Contratto")}</dt><dd>${fmtDate(c.until)}${c.loan ? " · " + t("in prestito") : ""}${c.agent ? " · " + t("Agente") + ": " + esc(c.agent) : ""}</dd>` : ""}
    <dt>${t("Giudizio")}</dt><dd>${vpill(p.verdict) || "—"}${p.level ? " · " + esc(levelL(p.level)) : ""}</dd></dl></div>
    <div><div class="rbox"><span class="m" style="color:#ccc">${t("Rating")}</span><b>${f1(pr.rating)}</b><span style="font-size:12px">/ ${s.max}</span></div><div class="m" style="margin-top:6px">${t("{n} valutazioni", { n: pr.n })}</div></div></div>
    ${pr.n ? `<div class="row" style="margin-top:10px"><div class="pitchbox">${pitchSVG(p.pos ? [p.pos] : [])}</div><div class="grow">${radar([{ vals: visAreas(p).map(a => pr.area[a.id]) }], visAreas(p).map(a => L(a) + " " + f1(pr.area[a.id])))}</div></div>` : ""}</div>`;
  if (pr.n) h += `<div class="panel"><h2>${t("Caratteristiche (media)")}</h2>${visAreas(p).map(a => { const vals = visParams(p, a).map(x => [x, pr.attr[a.id][x.id]]).filter(z => z[1] != null); if (!vals.length) return ""; return `<div class="areah"><h3>${esc(L(a))}</h3><span class="code">${f1(pr.area[a.id])}</span></div><div class="params">${vals.map(([x, v]) => `<div class="pb"><div class="lab"><span>${esc(L(x))}</span><span>${f1(v)}</span></div><div class="bar"><i style="width:${pct(v) * 100}%"></i></div></div>`).join("")}</div>`; }).join("")}</div>`;
  if ((p.pros || []).length || (p.cons || []).length) h += `<div class="panel"><div class="row"><div class="grow"><h3 style="color:var(--good)">${t("Pro")}</h3><ul>${(p.pros || []).map(x => `<li>${esc(x)}</li>`).join("")}</ul></div><div class="grow"><h3 style="color:var(--bad)">${t("Contro")}</h3><ul>${(p.cons || []).map(x => `<li>${esc(x)}</li>`).join("")}</ul></div></div></div>`;
  if (o.relations) for (const r of (p.relations || [])) h += `<div class="panel"><h2>${esc(r.title)}</h2><div class="m">${esc(r.author || "")} · ${fmtDate(r.date)}</div><p style="white-space:pre-wrap">${esc(r.text)}</p></div>`;
  if (o.evals) for (const [, e] of evs.slice().reverse()) h += shareEvalBlock(e, false);
  if (o.links) { const ls = mediaOf("player", id).filter(([, m]) => m.kind === "link"); if (ls.length) h += `<div class="panel"><h2>${t("Link")}</h2><ul>${ls.map(([, m]) => `<li><a href="${esc(m.url)}" target="_blank" rel="noopener noreferrer">${esc(m.name || m.url)}</a></li>`).join("")}</ul></div>`; }
  return h;
}
function shareEvalBlock(e, withPlayer) {
  const p = P(e.playerId); const s = Cfg.get().scale;
  return `<div class="panel"><div class="row" style="justify-content:space-between"><div><h2>${withPlayer ? esc(pname(p)) + " · " : ""}${esc(e.home || "")} – ${esc(e.away || "")}${e.score ? " " + esc(e.score) : ""}</h2><div class="m">${fmtDate(e.date)} · ${esc(L(Cfg.get().matchTypes.find(x => x.id === e.matchType)) || "")} · ${t("Valutato da")} ${esc(e.by || "—")} · ${t("Minuti")} ${esc(e.minutes || "—")}</div></div><div class="rbox"><b>${f1(evalRating(e))}</b><span style="font-size:12px">/ ${s.max}</span></div></div>
  ${visAreas(p).map(a => { const vals = Object.entries((e.r || {})[a.id] || {}); if (!vals.length) return ""; return `<div class="areah"><h3>${esc(L(a))}</h3><span class="code">${f1(evalArea(e, a.id))}</span></div><div class="params">${vals.map(([k, v]) => `<div class="pb"><div class="lab"><span>${esc(paramL(a, k))}</span><span>${f1(v)}</span></div><div class="bar"><i style="width:${pct(v) * 100}%"></i></div></div>`).join("")}</div>${e.notes && e.notes[a.id] ? `<p><b>${t("Note")}:</b> ${esc(e.notes[a.id])}</p>` : ""}${(e.evidence || []).filter(x => x.area === a.id).map(x => `<div class="m"><span class="code">${esc(x.min || "–")}'</span> ${esc(x.text)}</div>`).join("")}`; }).join("")}
  ${e.context && Object.keys(e.context).length ? `<div class="areah"><h3>${t("Contesto della partita")}</h3></div>${CONTEXT_DEF.filter(([k]) => e.context[k]).map(([k, it, en]) => `<div class="m">${esc(L({ it, en }))}: ${stars(+e.context[k])}</div>`).join("")}` : ""}
  ${e.concl && Object.keys(e.concl).length ? `<div class="areah"><h3>${t("Conclusione")}</h3></div>${CONCL_DEF.filter(([k]) => e.concl[k]).map(([k, it, en]) => `<div class="m">${esc(L({ it, en }))} <b>${{ si: t("Sì"), forse: t("Da capire"), no: t("No") }[e.concl[k]]}</b></div>`).join("")}` : ""}
  ${e.summary ? `<div class="areah"><h3>${t("Sintesi")}</h3></div><p style="white-space:pre-wrap">${esc(e.summary)}</p>` : ""}
  ${e.signature ? `<div style="display:flex;gap:14px;align-items:center;margin-top:12px;border-top:1px solid var(--line);padding-top:10px">${e.signature.img ? `<img src="${e.signature.img}" alt="" style="max-width:200px;max-height:70px">` : ""}<div class="m">${t("Valutazione firmata da {n}", { n: esc(e.signature.by) })} · ${new Date(e.signature.date).toLocaleDateString(locale())}<br><span style="font-family:ui-monospace,Menlo,monospace;font-size:11px">${t("Impronta")}: ${esc(Sign.fmtHash(e.signature.hash))}</span></div></div>` : ""}</div>`;
}
function shareMatchBlock(id, o) {
  const m = S.matches.get(id); const evs = [...S.evals.values()].filter(e => e.matchId === id);
  let h = `<div class="panel"><h2>${esc(m.home)} – ${esc(m.away)} ${esc(m.score || "")}</h2><div class="m">${fmtDate(m.date)} ${esc(m.time || "")} · ${esc(m.competition || "")} · ${esc(m.venue || "")}</div>
   <dl class="kv"><dt>${t("Sistemi di gioco")}</dt><dd>${esc(m.sysHome || "—")} / ${esc(m.sysAway || "—")}</dd><dt>${t("Condizioni")}</dt><dd>${esc(m.conditions || "—")}</dd></dl>
   ${m.homeNotes ? `<h3>${esc(m.home)}</h3><p style="white-space:pre-wrap">${esc(m.homeNotes)}</p>` : ""}${m.awayNotes ? `<h3>${esc(m.away)}</h3><p style="white-space:pre-wrap">${esc(m.awayNotes)}</p>` : ""}${m.notes ? `<h3>${t("Note")}</h3><p style="white-space:pre-wrap">${esc(m.notes)}</p>` : ""}</div>`;
  const tg = (m.targets || []).filter(P);
  if (tg.length && (m.events || []).length) h += `<div class="panel"><h2>${t("Azioni registrate")}</h2>${tg.map(pid => { const ev = (m.events || []).filter(x => x.p === pid); if (!ev.length) return ""; return `<h3 style="margin-top:10px">${esc(pname(P(pid)))}</h3>${liveTable(ev)}`; }).join("")}</div>`;
  if (o.evals) for (const e of evs) h += shareEvalBlock(e, true);
  return h;
}
function shareLineupBlock(id) {
  const lu = S.lineups.get(id); const F = FORMATIONS[lu.formation] || FORMATIONS["4-3-3"];
  return `<div class="panel"><h2>${esc(lu.name)} · ${esc(lu.formation)}</h2>${lu.note ? `<p>${esc(lu.note)}</p>` : ""}<table><thead><tr><th>${t("Pos.")}</th><th>${t("Titolare")}</th><th>${t("Rating")}</th><th>${t("Alternative")}</th></tr></thead><tbody>${F.map(([lb], i) => { const s = (lu.slots || {})[i] || {}; const p = P(s.main); return `<tr><td>${lb}</td><td>${p ? esc(pname(p)) + (p.club ? ` <span class="m">${esc(p.club)}</span>` : "") : "—"}</td><td>${p ? f1(profile(s.main).rating) : ""}</td><td>${(s.alt || []).filter(P).map(a => esc(pname(P(a)))).join(", ")}</td></tr>`; }).join("")}</tbody></table></div>`;
}
function buildShareDoc(kind, id, o) {
  let title = "", body = "";
  if (kind === "player") { title = pname(P(id)); body = sharePlayerBlock(id, o); }
  else if (kind === "eval") { const e = S.evals.get(id); title = pname(P(e.playerId)); body = sharePlayerBlock(e.playerId, { ...o, evals: false, relations: false }) + shareEvalBlock(e, false); }
  else if (kind === "match") { const m = S.matches.get(id); title = m.home + " – " + m.away; body = shareMatchBlock(id, o); }
  else if (kind === "lineup") { title = S.lineups.get(id).name; body = shareLineupBlock(id); }
  else if (kind === "portfolio") { title = o.title; body = o.body; }
  const prof = Profile.get();
  const html = `<!doctype html><html lang="${Prefs.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>${SHARE_CSS}</style></head><body><div class="doc">${kind === "portfolio" ? body : shareHeader(title, o) + body}<div class="foot">${esc(prof.name || "")} · ${esc(t("Creato con MM Scout il {d}", { d: fmtDate(today()) }))}<br>${esc(t("Documento riservato. Vietato divulgarlo, copiarlo o modificarlo senza il consenso dell'autore."))}<br>© ${new Date().getFullYear()} Miodrag Milosevic · MM Scout</div></div></body></html>`;
  return { title, html, sign: !!o.sign };
}
const SHARE_ALPHA = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function newShareCode() { const r = C.rand(12); return [...r].map(b => SHARE_ALPHA[b % SHARE_ALPHA.length]).join("").match(/.{4}/g).join("-"); }
const normCode = c => String(c).toUpperCase().replace(/[^A-Z0-9]/g, "");
async function encryptShare(doc, code, o) {
  const salt = C.rand(16), iter = 250000; const key = await C.kek(normCode(code), salt, iter);
  let bytes = C.te.encode(JSON.stringify({ html: doc.html, title: doc.title, expires: o.expires || "", recipient: o.recipient || "", lang: Prefs.lang })); let z = 0;
  const comp = await C.deflate(bytes); if (comp && comp.length < bytes.length) { bytes = comp; z = 1; }
  const enc = await C.encRaw(key, bytes);
  return { v: 1, s: C.b64url(salt), i: iter, iv: C.b64url(enc.iv), ct: C.b64url(enc.ct), z };
}
// Pagina autonoma che si apre con il codice (nessun dato in chiaro dentro il file)
function viewerFile(payload, lang) {
  const T = { t: t("Report di scouting protetto"), p: t("Questo documento è cifrato. Inserisci il codice di accesso che hai ricevuto a parte."), c: t("Codice di accesso"), o: t("Apri"), e: t("Codice errato. Controllalo e riprova."), x: t("Questa condivisione è scaduta."), n: t("Questo browser non riesce ad aprire il documento. Usa una versione recente di Safari, Chrome, Firefox o Edge.") };
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${T.t}</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#17221C;font:16px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;color:#17221C;padding:16px}.b{background:#fff;border-radius:14px;padding:26px;max-width:420px;width:100%;display:flex;flex-direction:column;gap:12px}h1{font:700 24px "Avenir Next Condensed","Arial Narrow",sans-serif;text-transform:uppercase;margin:0}input{font:20px ui-monospace,Menlo,monospace;letter-spacing:.12em;text-transform:uppercase;padding:10px;border:1px solid #D3D9CF;border-radius:8px;text-align:center}button{font:600 16px inherit;background:#1E6A47;color:#fff;border:0;border-radius:8px;padding:11px}.e{color:#B23A3A;font-size:14px;min-height:20px}p{margin:0;color:#5B6860}</style></head>
<body><form class="b" id="f"><h1>${T.t}</h1><p>${T.p}</p><label for="c">${T.c}</label><input id="c" autocomplete="off" autofocus placeholder="XXXX-XXXX-XXXX"><div class="e" id="e"></div><button>${T.o}</button></form>
<script>const D=${JSON.stringify(payload)};const T=${JSON.stringify(T)};
const u=s=>{s=s.replace(/-/g,"+").replace(/_/g,"/");while(s.length%4)s+="=";const b=atob(s),a=new Uint8Array(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a};
document.getElementById("f").onsubmit=async ev=>{ev.preventDefault();const E=document.getElementById("e");E.textContent="";
if(!window.crypto||!crypto.subtle){E.textContent=T.n;return}
try{const code=document.getElementById("c").value.toUpperCase().replace(/[^A-Z0-9]/g,"");
const base=await crypto.subtle.importKey("raw",new TextEncoder().encode(code),"PBKDF2",false,["deriveKey"]);
const key=await crypto.subtle.deriveKey({name:"PBKDF2",salt:u(D.s),iterations:D.i,hash:"SHA-256"},base,{name:"AES-GCM",length:256},false,["decrypt"]);
let pt=new Uint8Array(await crypto.subtle.decrypt({name:"AES-GCM",iv:u(D.iv)},key,u(D.ct)));
if(D.z){const st=new Blob([pt]).stream().pipeThrough(new DecompressionStream("deflate-raw"));pt=new Uint8Array(await new Response(st).arrayBuffer())}
const o=JSON.parse(new TextDecoder().decode(pt));if(o.expires&&new Date()>new Date(o.expires+"T23:59:59")){E.textContent=T.x;return}
document.open();document.write(o.html);document.close()}catch(err){E.textContent=T.e}}<\/script></body></html>`;
}
// Apertura di un link protetto dentro l'app (prima dello sblocco, isolato)
const LinkViewer = {
  async show(hash) {
    let D; try { D = JSON.parse(C.td.decode(C.unb64url(hash))); } catch (e) { return false; }
    $("#appRoot").hidden = true; const r = $("#lockRoot"); r.hidden = false;
    r.innerHTML = `<div class="lock"><div class="lockbox">${appBrand()}<h2>${t("Report di scouting protetto")}</h2><p class="sub">${t("Inserisci il codice di accesso che hai ricevuto a parte.")}</p><form id="lvf" class="col"><input type="text" id="lvc" class="mono" style="font-size:20px;text-align:center;letter-spacing:.12em" placeholder="XXXX-XXXX-XXXX" autocomplete="off"><div class="warn" id="lvErr"></div><button class="btn pri">${t("Apri")}</button></form><button class="btn ghost sm" id="lvExit">${t("Esci e apri il mio archivio")}</button></div></div>`;
    $("#lvExit").onclick = () => { history.replaceState(null, "", location.pathname); location.reload(); };
    $("#lvf").onsubmit = async e => {
      e.preventDefault();
      try { const key = await C.kek(normCode($("#lvc").value), C.unb64url(D.s), D.i); let pt = await C.decRaw(key, { iv: C.unb64url(D.iv), ct: C.unb64url(D.ct) }); if (D.z) pt = await C.inflate(pt);
        const o = JSON.parse(C.td.decode(pt)); if (o.expires && new Date() > new Date(o.expires + "T23:59:59")) { $("#lvErr").textContent = t("Questa condivisione è scaduta."); return; }
        r.innerHTML = `<div style="display:flex;flex-direction:column;height:100vh"><div class="row between" style="padding:8px 12px;background:var(--side);color:var(--side-ink)"><b>${esc(o.title)}</b><div class="row"><button class="btn sm" id="lvSave">${t("Salva copia")}</button><button class="btn sm" id="lvClose">${t("Chiudi")}</button></div></div><iframe id="lvFrame" sandbox="allow-popups allow-popups-to-escape-sandbox" style="flex:1;border:0;width:100%;background:#fff" title="${esc(o.title)}"></iframe></div>`;
        $("#lvFrame").srcdoc = o.html; $("#lvSave").onclick = () => download((o.title || "report").replace(/[^\w\- ]+/g, "") + ".html", o.html, "text/html"); $("#lvClose").onclick = () => { history.replaceState(null, "", location.pathname); location.reload(); };
      } catch (err) { $("#lvErr").textContent = t("Codice errato. Controllalo e riprova."); }
    };
    return true;
  }
};
function shareSheet(kind, id) {
  const pub = App.cfgDevice().publicUrl || (location.protocol === "https:" ? location.origin + location.pathname : "");
  const code = newShareCode();
  const exp = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
  const what = { player: t("Scheda giocatore"), eval: t("Valutazione"), match: t("Partita visionata"), lineup: t("Squadra ombra") }[kind];
  sheet(`<h2>${t("Condividi in sicurezza")}: ${esc(what)}</h2>
   <p class="sub small">${t("Il contenuto viene cifrato con un codice. Manda il file o il link per email e il codice per un'altra strada (SMS, WhatsApp, telefonata): chi ha solo uno dei due non può leggere nulla.")}</p>
   <div class="fgrid"><label class="f">${t("Destinatario (compare nel documento)")}<input type="text" id="shTo" placeholder="${t("es. Area scouting FC …")}"></label><label class="f">${t("Valido fino al")}<input type="date" id="shExp" value="${exp}"></label></div>
   ${kind === "player" ? `<div class="col" style="gap:6px"><label class="chk"><input type="checkbox" id="shPhoto" checked> ${t("Foto profilo")}</label><label class="chk"><input type="checkbox" id="shEvals" checked> ${t("Tutte le valutazioni")}</label><label class="chk"><input type="checkbox" id="shRel" checked> ${t("Relazioni")}</label><label class="chk"><input type="checkbox" id="shContract"> ${t("Dati contrattuali e agente")}</label><label class="chk"><input type="checkbox" id="shLinks" checked> ${t("Link multimediali")}</label></div>` : kind === "match" ? `<label class="chk"><input type="checkbox" id="shEvals" checked> ${t("Includi le valutazioni dei giocatori")}</label>` : kind === "eval" ? `<label class="chk"><input type="checkbox" id="shPhoto" checked> ${t("Foto profilo")}</label>` : ""}
   <label class="chk"><input type="checkbox" id="shSign" checked> ${t("Firma il documento (nome, firma e impronta digitale)")}</label>
   <label class="f">${t("Codice di accesso")}<div class="row"><input type="text" id="shCode" class="mono" value="${code}" style="flex:1;font-size:18px;letter-spacing:.08em"><button class="btn sm" data-a="copyText" data-target="shCode">${t("Copia")}</button></div></label>
   <div class="col"><button class="btn pri" id="shFile">${t("Crea file protetto (.html) da allegare")}</button>
   <button class="btn" id="shLink" ${pub ? "" : "disabled"}>${t("Crea link protetto")}</button>${pub ? "" : `<p class="m">${t("Per i link serve l'indirizzo pubblico dell'app (es. GitHub Pages): impostalo in Impostazioni › Generale.")}</p>`}
   <button class="btn ghost" id="shPlain">${t("Anteprima / stampa senza protezione")}</button></div><div id="shOut"></div>`, true);
  const opts = () => ({ recipient: $("#shTo").value.trim(), expires: $("#shExp").value, photo: $("#shPhoto")?.checked, evals: $("#shEvals")?.checked, relations: $("#shRel")?.checked, contract: $("#shContract")?.checked, links: $("#shLinks")?.checked, sign: $("#shSign")?.checked });
  const mk = async o => { const d = buildShareDoc(kind, id, o); if (o.sign) d.html = await Sign.signDoc(d.html); return d; };
  const fname = d => (d.title || "report").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-") + "-" + t("protetto") + ".html";
  $("#shPlain").onclick = async () => { const d = await mk(opts()); const u = URL.createObjectURL(new Blob([d.html], { type: "text/html" })); const w = window.open(u, "_blank"); if (!w) download(d.title + ".html", d.html, "text/html"); };
  $("#shFile").onclick = async () => {
    const o = opts(); const c = $("#shCode").value; if (normCode(c).length < 8) { toast(t("Il codice deve avere almeno 8 caratteri")); return; }
    const d = await mk(o); const payload = await encryptShare(d, c, o); const html = viewerFile(payload, Prefs.lang); const file = new File([html], fname(d), { type: "text/html" });
    const mailBody = t("Ciao,\n\nin allegato trovi il report «{t}». Il file è protetto: aprilo con un browser e inserisci il codice che ti mando a parte.\n\n{n}", { t: d.title, n: Profile.get().name || "" });
    $("#shOut").innerHTML = `<div class="banner info col" style="margin-top:6px"><b>${t("File pronto")}</b><div class="row"><button class="btn sm pri" id="shSend">${t("Invia (Mail, Messaggi…)")}</button><button class="btn sm" id="shDl">${t("Scarica il file")}</button><a class="btn sm" href="mailto:?subject=${encodeURIComponent(d.title)}&body=${encodeURIComponent(mailBody)}">${t("Scrivi email")}</a><a class="btn sm" href="sms:&body=${encodeURIComponent(t("Codice per il report {t}: {c}", { t: d.title, c }))}">${t("Codice via SMS")}</a></div><span class="m">${t("Con «Scrivi email» ricordati di allegare il file scaricato. Il codice mandalo separatamente.")}</span></div>`;
    $("#shDl").onclick = () => download(file.name, file);
    $("#shSend").onclick = async () => { try { if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], title: d.title, text: mailBody }); else { download(file.name, file); toast(t("Condivisione non disponibile qui: file scaricato")); } } catch (e) { } };
  };
  $("#shLink").onclick = async () => {
    const o = { ...opts(), photo: false }; const c = $("#shCode").value; if (normCode(c).length < 8) { toast(t("Il codice deve avere almeno 8 caratteri")); return; }
    const d = await mk(o); const payload = await encryptShare(d, c, o); const link = pub.split("#")[0] + "#s=" + C.b64url(C.te.encode(JSON.stringify(payload)));
    const long = link.length > 60000;
    const mailBody = t("Ciao,\n\nti condivido il report «{t}». Apri il link e inserisci il codice che ti mando a parte:\n\n{l}\n\n{n}", { t: d.title, l: link, n: Profile.get().name || "" });
    $("#shOut").innerHTML = `<div class="banner ${long ? "bad" : "info"} col" style="margin-top:6px">${long ? `<b>${t("Il link è molto lungo ({k} KB): alcune app email potrebbero tagliarlo. Meglio il file protetto.", { k: Math.round(link.length / 1024) })}</b>` : `<b>${t("Link pronto")}</b>`}<textarea id="shLinkTxt" readonly style="min-height:70px" class="mono small">${esc(link)}</textarea><div class="row"><button class="btn sm" data-a="copyText" data-target="shLinkTxt">${t("Copia link")}</button><a class="btn sm" href="mailto:?subject=${encodeURIComponent(d.title)}&body=${encodeURIComponent(mailBody)}">${t("Scrivi email")}</a><a class="btn sm" href="sms:&body=${encodeURIComponent(t("Codice per il report {t}: {c}", { t: d.title, c }))}">${t("Codice via SMS")}</a></div><span class="m">${t("Nel link la foto non è inclusa, per tenerlo corto. Il contenuto resta nel link stesso: non passa da nessun server.")}</span></div>`;
  };
}

/* =========================================================
   BACKUP, COPIE AUTOMATICHE E iCLOUD
   ========================================================= */
const Backup = {
  timer: null, dirHandle: null, needPerm: false,
  schedule() { if (this.timer) return; const min = App.cfgDevice().backupEveryMin || 10; this.timer = setTimeout(() => { this.timer = null; this.run(); }, min * 60000); },
  async run(force) {
    if (!App.unlocked || (!Store.dirty && !force)) return;
    try { await Store.pending; await Store.snapshot("auto"); Store.dirty = false; } catch (e) { }
    if (App.cfgDevice().autoFolder) await this.toFolder(false);
  },
  async afterUnlock() {
    try { this.dirHandle = await Store.get("misc", "dirHandle") || null; } catch (e) { this.dirHandle = null; }
    if (this.dirHandle && App.cfgDevice().autoFolder) { try { const st = await this.dirHandle.queryPermission({ mode: "readwrite" }); this.needPerm = st !== "granted"; } catch (e) { this.needPerm = true; } }
  },
  reminder() {
    let html = "";
    if (this.needPerm) html += `<div class="banner row between">${t("Il backup automatico nella cartella (es. iCloud Drive, OneDrive, Google Drive) è in pausa: il browser chiede di nuovo il permesso.")} <button class="btn sm pri" data-a="regrantFolder">${t("Riattiva")}</button></div>`;
    const last = Prefs.get("lastBackup", null); const days = App.cfgDevice().backupReminderDays;
    if (days && S.players.size && (!last || (Date.now() - new Date(last)) / 864e5 > days)) html += `<div class="banner row between">${last ? t("Ultimo backup completo {d} giorni fa.", { d: Math.floor((Date.now() - new Date(last)) / 864e5) }) : t("Non hai ancora fatto un backup completo.")} <button class="btn sm pri" data-a="backupNow">${t("Fai backup ora")}</button></div>`;
    return html;
  },
  async build(includeMedia) {
    await Store.pending; const m = await Store.meta();
    const data = await C.encJSON(Store.key, Store.dump());
    const out = { app: "mm-scout", kind: "backup", v: 3, created: new Date().toISOString(), wrap: { salt: C.b64(m.salt), iter: m.iter, iv: C.b64(m.wrapped.iv), ct: C.b64(m.wrapped.ct) }, rwrap: { salt: C.b64(m.rsalt), iter: m.riter, iv: C.b64(m.wrappedR.iv), ct: C.b64(m.wrappedR.ct) }, data: { iv: C.b64(data.iv), ct: C.b64(data.ct) }, blobs: {} };
    if (includeMedia) for (const [k, b] of await Store.all("blob")) out.blobs[k] = { iv: C.b64(b.iv), ct: C.b64(b.ct), mime: b.mime, size: b.size };
    return new Blob([JSON.stringify(out)], { type: "application/json" });
  },
  fname() { return `mm-scout-${today()}.tsbackup`; },
  async exportFile(includeMedia) { const b = await this.build(includeMedia); download(this.fname(), b); Prefs.set("lastBackup", new Date().toISOString()); toast(t("Backup scaricato")); },
  async shareFile(includeMedia) {
    const b = await this.build(includeMedia); const f = new File([b], this.fname(), { type: "application/octet-stream" });
    try { if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: appName() + " backup" }); Prefs.set("lastBackup", new Date().toISOString()); render(true); return; } } catch (e) { if (e.name === "AbortError") return; }
    download(f.name, f); Prefs.set("lastBackup", new Date().toISOString()); toast(t("Backup scaricato"));
  },
  async chooseFolder() {
    if (!window.showDirectoryPicker) { toast(t("Questo browser non permette di scegliere una cartella.")); return; }
    try { const h = await window.showDirectoryPicker({ id: "mm-scout-backup", mode: "readwrite" }); await Store.put("misc", "dirHandle", h); this.dirHandle = h; this.needPerm = false; App.setDevice({ autoFolder: true }); await this.toFolder(true); render(true); } catch (e) { if (e.name !== "AbortError") toast(t("Cartella non disponibile")); }
  },
  async regrant() { try { const st = await this.dirHandle.requestPermission({ mode: "readwrite" }); this.needPerm = st !== "granted"; if (!this.needPerm) await this.toFolder(true); } catch (e) { } render(true); },
  async toFolder(showToast) {
    if (!this.dirHandle) return;
    try {
      if ((await this.dirHandle.queryPermission({ mode: "readwrite" })) !== "granted") { this.needPerm = true; return; }
      const fh = await this.dirHandle.getFileHandle(this.fname(), { create: true }); const w = await fh.createWritable(); await w.write(await this.build(true)); await w.close();
      const names = []; for await (const [n] of this.dirHandle.entries()) if (/^(taccuino-scout|mm-scout)-\d{4}-\d{2}-\d{2}\.tsbackup$/.test(n)) names.push(n);
      names.sort(); for (const n of names.slice(0, Math.max(0, names.length - 14))) await this.dirHandle.removeEntry(n);
      Prefs.set("lastBackup", new Date().toISOString()); Prefs.set("lastFolderBackup", new Date().toISOString()); const ss = $("#saveState"); if (ss) ss.innerHTML = saveStateText();
      if (showToast) toast(t("Backup salvato nella cartella"));
    } catch (e) { if (showToast) toast(t("Backup nella cartella non riuscito")); }
  },
  async importFile(file) {
    let o; try { o = JSON.parse(await file.text()); } catch (e) { toast(t("File non riconosciuto")); return; }
    if (o.app !== "mm-scout" && o.app !== "taccuino-scout") { toast(t("File non riconosciuto")); return; }
    if (o.kind !== "backup") { // esportazioni delle versioni precedenti (non cifrate)
      const n = Migrate.importV2(o); toast(t("{n} voci importate", { n })); render(); return;
    }
    sheet(`<h2>${t("Importa backup")}</h2><p class="sub">${t("Backup del {d}. Inserisci la password che usavi quando l'hai creato (oppure il codice di recupero di allora).", { d: fmtDate(o.created.slice(0, 10)) })}</p>
      <form id="ibf" class="col"><input type="password" id="ibPw" placeholder="${t("Password o codice di recupero")}" required><label class="chk"><input type="radio" name="ibm" value="merge" checked> ${t("Unisci ai dati attuali (aggiorna le voci uguali)")}</label><label class="chk"><input type="radio" name="ibm" value="replace"> ${t("Sostituisci tutto con il backup")}</label><div class="warn" id="ibErr"></div><div class="row end"><button type="button" class="btn" data-a="closeSheetBtn">${t("Annulla")}</button><button class="btn pri">${t("Importa")}</button></div></form>`);
    $("#ibf").onsubmit = async e => {
      e.preventDefault(); const pw = $("#ibPw").value; const mode = $$("input[name=ibm]").find(x => x.checked).value; let raw;
      try { raw = await C.decRaw(await C.kek(pw, C.unb64(o.wrap.salt), o.wrap.iter), { iv: C.unb64(o.wrap.iv), ct: C.unb64(o.wrap.ct) }); }
      catch (err) { try { raw = await C.decRaw(await C.kek(pw.replace(/[^A-Za-z2-7]/g, "").toUpperCase(), C.unb64(o.rwrap.salt), o.rwrap.iter), { iv: C.unb64(o.rwrap.iv), ct: C.unb64(o.rwrap.ct) }); } catch (err2) { $("#ibErr").textContent = t("Password o codice non validi."); return; } }
      const key = await C.importKey(raw); raw.fill(0);
      const dump = await C.decJSON(key, { iv: C.unb64(o.data.iv), ct: C.unb64(o.data.ct) });
      $("#ibErr").textContent = t("Importazione…");
      if (mode === "replace") { await Store.snapshot("prima-di-importare"); for (const c of COLLS) for (const k of [...S[c].keys()]) await del(c, k); }
      let n = 0; for (const c of COLLS) for (const [k, v] of Object.entries(dump[c] || {})) { await put(c, k, v); n++; }
      for (const [k, b] of Object.entries(o.blobs || {})) { try { const pt = await C.decRaw(key, { iv: C.unb64(b.iv), ct: C.unb64(b.ct) }); const enc = await C.encRaw(Store.key, pt); await Store.put("blob", k, { iv: enc.iv, ct: enc.ct, mime: b.mime, size: b.size }); } catch (err) { } }
      Migrate.config(); closeSheet(); toast(t("{n} voci importate", { n })); render();
    };
  },
  async restoreSnapshot(k) {
    const s = await Store.get("snap", k); if (!s) return;
    const dump = await C.decJSON(Store.key, s);
    await Store.snapshot("prima-del-ripristino");
    for (const c of COLLS) for (const id of [...S[c].keys()]) await del(c, id);
    for (const c of COLLS) for (const [id, v] of Object.entries(dump[c] || {})) await put(c, id, v);
    Migrate.config(); toast(t("Copia ripristinata")); render();
  }
};

/* =========================================================
   PORTFOLIO (mostrare il proprio lavoro)
   ========================================================= */
R.portfolio = () => {
  const prof = Profile.get(); const sel0 = new Set(S.settings.get("portfolio")?.ids || []);
  const pl = [...S.players.entries()].filter(([id, p]) => !p.archived && profile(id).n).sort((a, b) => (profile(b[0]).rating ?? 0) - (profile(a[0]).rating ?? 0));
  return `<div class="head"><div><h1>${t("Portfolio")}</h1><p class="sub">${t("Il tuo biglietto da visita da scout: profilo, numeri del lavoro svolto e una selezione di report. Lo scarichi come pagina da allegare a una candidatura o da mandare protetta con codice.")}</p></div></div>
  <section class="panel row between"><div class="row" style="gap:12px">${prof.photo ? `<img src="${prof.photo}" alt="" style="width:56px;height:56px;border-radius:50%;object-fit:cover">` : ""}<div><b>${esc(prof.name || t("Profilo da completare"))}</b><div class="m">${esc(prof.title || "")}${prof.email ? " · " + esc(prof.email) : ""}</div><div class="m">${prof.signature ? "✓ " + t("Firma impostata") : t("Nessuna firma impostata")}</div></div></div><button class="btn" data-a="menuGo" data-v="profilo">${t("Modifica il profilo scout")}</button></section>
  <section class="panel"><h2>${t("Contenuto del portfolio")}</h2><div class="col" style="margin-top:8px"><label class="chk"><input type="checkbox" id="pfStats" checked> ${t("Numeri dell'attività (ultimi 12 mesi)")}</label><label class="chk"><input type="checkbox" id="pfEvals" checked> ${t("Per ogni giocatore, l'ultima valutazione completa")}</label><label class="chk"><input type="checkbox" id="pfPhoto"> ${t("Foto dei giocatori")}</label><label class="chk"><input type="checkbox" id="pfSign" checked> ${t("Firma il portfolio")}</label></div>
   <h3 style="margin-top:12px">${t("Giocatori da mostrare")} <span class="m">(${t("scegli i tuoi report migliori")})</span></h3><div class="list" id="pfList" style="max-height:340px;overflow:auto;margin-top:6px">${pl.map(([id, p]) => `<label class="item"><input type="checkbox" value="${id}" ${sel0.has(id) ? "checked" : ""}>${avatar(p)}<div class="grow"><div class="t">${esc(pname(p))}${exB(p)}</div><div class="m">${esc(roleL(mainRole(p)) || "")} · ${t("{n} valutazioni", { n: profile(id).n })}</div></div><div class="score ${sc(profile(id).rating)}">${f1(profile(id).rating)}</div></label>`).join("") || `<div class="empty">${t("Servono giocatori con almeno una valutazione.")}</div>`}</div>
   <label class="chk" style="margin-top:10px"><input type="checkbox" id="pfAnon"> ${t("Nascondi i cognomi dei giocatori (mostra solo iniziale)")}</label>
   <div class="row end" style="margin-top:12px"><button class="btn" data-a="pfPreview">${t("Anteprima")}</button><button class="btn" data-a="pfDownload">${t("Scarica (HTML, stampabile in PDF)")}</button><button class="btn pri" data-a="pfProtect">${t("Condividi protetto con codice")}</button></div></section>`;
};
function buildPortfolio() {
  const prof = Profile.get(); const ids = $$("#pfList input:checked").map(x => x.value); put("settings", "portfolio", { ids });
  const anon = $("#pfAnon").checked, withStats = $("#pfStats").checked, withEvals = $("#pfEvals").checked, photo = $("#pfPhoto").checked;
  const nm = p => anon ? (p.first || "") + " " + ((p.last || "")[0] || "") + "." : pname(p);
  const st = activityStats(12);
  let body = `<div class="hdr"><div class="row" style="align-items:center">${prof.photo ? `<img class="photo" style="width:96px;height:96px" src="${prof.photo}" alt="">` : ""}<div><div class="m">${t("Portfolio di scouting")}</div><h1>${esc(prof.name || t("Scout"))}</h1><div>${esc(prof.title || "")}${prof.city ? " · " + esc(prof.city) : ""}</div></div></div><div style="text-align:right" class="m">${esc(prof.email || "")}<br>${esc(prof.phone || "")}<br>${esc(prof.languages || "")}</div></div>`;
  if (prof.bio || prof.certs || prof.links) body += `<div class="panel">${prof.bio ? `<p style="white-space:pre-wrap">${esc(prof.bio)}</p>` : ""}${prof.certs ? `<h3 style="margin-top:10px">${t("Formazione e certificati")}</h3><ul>${prof.certs.split("\n").filter(Boolean).map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}${prof.links ? `<h3>${t("Link")}</h3><ul>${prof.links.split("\n").filter(Boolean).map(x => `<li><a href="${esc(x)}">${esc(x)}</a></li>`).join("")}</ul>` : ""}</div>`;
  if (withStats) body += `<div class="panel"><h2>${t("Attività degli ultimi 12 mesi")}</h2><div class="row" style="margin-top:8px">${[[st.ms.length, t("Partite viste")], [st.evs.length, t("Valutazioni")], [st.players, t("Giocatori valutati")], [Math.round(st.minutes / 60), t("Ore osservate")]].map(([v, l]) => `<div class="rbox" style="min-width:120px"><b>${v}</b><span style="font-size:12px">${esc(l)}</span></div>`).join("")}</div>${barChart(st.rows)}<div class="row" style="margin-top:8px"><div class="grow"><h3>${t("Competizioni seguite")}</h3>${Object.entries(st.comps).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `<div class="m">${esc(k)} · ${v}</div>`).join("") || "—"}</div><div class="grow"><h3>${t("Nazionalità valutate")}</h3>${Object.entries(st.nats).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `<div class="m">${esc(k)} · ${v}</div>`).join("") || "—"}</div></div></div>`;
  body += `<div class="panel"><h2>${t("Selezione di giocatori osservati")}</h2><table><thead><tr><th>${t("Giocatore")}</th><th>${t("Ruolo")}</th><th>${t("Età")}</th><th>${t("Club")}</th><th>${t("Rating")}</th><th>${t("Giudizio")}</th></tr></thead><tbody>${ids.map(id => { const p = P(id); return `<tr><td>${esc(nm(p))}</td><td>${esc(roleL(mainRole(p)) || "")}</td><td>${age(p) ?? ""}</td><td>${esc(p.club || "")}</td><td>${f1(profile(id).rating)}</td><td>${vpill(p.verdict)}</td></tr>`; }).join("")}</tbody></table></div>`;
  if (withEvals) for (const id of ids) { const p = P(id); const evs = playerEvals(id); const last = evs[evs.length - 1]; if (!last) continue; const e = last[1]; const pr = profile(id);
    body += `<div class="panel"><div class="row">${photo && p.photo ? `<img class="photo" style="width:90px;height:90px" src="${p.photo}" alt="">` : ""}<div class="grow"><h2>${esc(nm(p))}</h2><div class="m">${esc((p.roles || []).map(roleL).join(", "))} · ${esc(p.club || "")} · ${age(p) ?? ""} ${t("anni")}</div></div><div class="rbox"><b>${f1(pr.rating)}</b></div></div>${radar([{ vals: visAreas(p).map(a => pr.area[a.id]) }], visAreas(p).map(a => L(a)))}${shareEvalBlock(e, false).replace('<div class="panel">', '<div>')}</div>`; }
  return buildShareDoc("portfolio", null, { title: t("Portfolio di {n}", { n: prof.name || t("scout") }), body, sign: $("#pfSign") && $("#pfSign").checked });
}

/* =========================================================
   IMPOSTAZIONI E PERSONALIZZAZIONE
   ========================================================= */
let cfgDraft = null;
R.impostazioni = () => {
  const tabs = [["generale", t("Generale")], ["sicurezza", t("Sicurezza")], ["sync", t("Sincronizzazione")], ["backup", t("Backup")], ["personalizza", t("Personalizza")], ["info", t("Informazioni")]];
  return `<div class="head"><div><h1>${t("Impostazioni")}</h1></div></div><div class="tabs">${tabs.map(([k, n]) => `<button data-a="setTab" data-t="${k}" aria-pressed="${ui.setTab === k}">${n}</button>`).join("")}</div><div id="setBody">${SET[ui.setTab]()}</div>`;
};
const SET = {};
SET.generale = () => {
  const d = App.cfgDevice();
  return `<section class="panel"><h2>${t("Aspetto")}</h2><div class="col" style="margin-top:10px"><div class="row"><b style="width:110px">${t("Lingua")}</b><div class="seg">${LANGS.map(([k, n]) => `<button data-a="setLang" data-v="${k}" aria-pressed="${Prefs.lang === k}">${n}</button>`).join("")}</div></div>
   <div class="row"><b style="width:110px">${t("Tema")}</b><div class="seg">${[["system", t("Automatico")], ["light", t("Chiaro")], ["dark", t("Scuro")]].map(([k, n]) => `<button data-a="setTheme" data-v="${k}" aria-pressed="${Prefs.theme === k}">${n}</button>`).join("")}</div></div></div></section>
  <section class="panel"><h2>${t("Registro partita")}</h2><label class="chk" style="margin-top:8px"><input type="checkbox" id="devLiveDet" ${d.liveDetailsOff ? "" : "checked"}> ${t("Dopo ogni azione apri subito la scheda Dettagli (zona, pressione, piede, nota)")}</label><p class="m">${t("Consigliato: dati più completi e voto proposto più preciso. Spegnilo se in una partita veloce vuoi solo un tocco per azione.")}</p><label class="chk" style="margin-top:8px"><input type="checkbox" id="devNeutral" ${d.hideNeutral ? "" : "checked"}> ${t("Mostra il pulsante «= Neutra»")}</label><p class="m">${t("Neutra = azione né riuscita né sbagliata, per esempio un passaggio sicuro all'indietro o un duello senza vincitore. Conta per il coinvolgimento del giocatore, non alza né abbassa il voto.")}</p></section>
  <section class="panel"><h2>${t("Indirizzo pubblico dell'app")}</h2><p class="sub small">${t("Serve per creare link protetti. Se hai pubblicato l'app su GitHub Pages, incolla qui l'indirizzo (es. https://nome.github.io/mm-scout/).")}</p><div class="row" style="margin-top:8px"><input type="url" id="pubUrl" value="${esc(d.publicUrl)}" placeholder="https://" style="flex:1"><button class="btn" data-a="savePubUrl">${t("Salva")}</button></div></section>
  <section class="panel"><h2>${t("Esempi")}</h2><p class="sub small">${t("Tutti gli esempi per provare l'app: una prima squadra completa, giocatori e squadre giovanili, partite con le azioni registrate, valutazioni, profili ideali con piano A/B/C, riunioni, impegni e note.")}</p><div class="row" style="margin-top:8px"><button class="btn" data-a="loadEx">${t("Carica esempi")}</button><button class="btn danger" data-a="clearEx">${t("Elimina esempi")}</button></div></section>
  <section class="panel"><h2>${t("Esporta dati in tabella")}</h2><p class="sub small">${t("File CSV da aprire con Numbers o Excel.")}</p><div class="row" style="margin-top:8px"><button class="btn" data-a="exportCsv">${t("Giocatori (CSV)")}</button><button class="btn" data-a="exportEvalCsv">${t("Valutazioni (CSV)")}</button></div></section>`;
};
SET.sicurezza = () => {
  const d = App.cfgDevice();
  return `<section class="panel"><h2>${t("Protezione attiva")}</h2><ul class="small"><li>${t("Tutti i dati e i file sono cifrati con AES-256-GCM.")}</li><li>${t("La chiave deriva dalla tua password (PBKDF2-SHA256, 600.000 iterazioni): senza password i dati sono illeggibili.")}</li><li>${t("Nessun dato lascia il dispositivo, a meno che tu non faccia un backup o una condivisione.")}</li></ul><div id="secTotp"></div></section>
  <section class="panel"><h2>${t("Cambia password")}</h2><form id="cpForm" class="fgrid" style="margin-top:10px"><label class="f">${t("Password attuale")}<input type="password" id="cpOld" autocomplete="current-password" required></label><label class="f">${t("Nuova password")}<input type="password" id="np1" autocomplete="new-password" required></label><label class="f">${t("Ripeti nuova password")}<input type="password" id="np2" autocomplete="new-password" required></label><div class="full"><div class="strength"><i id="pwBar" style="width:0"></i></div><div class="m" id="pwHint"></div><div class="warn" id="lockErr"></div></div><div class="full row end"><button class="btn pri">${t("Cambia password")}</button></div></form></section>
  <section class="panel"><h2>${t("Blocco automatico")}</h2><div class="fgrid" style="margin-top:10px"><label class="f">${t("Blocca dopo minuti di inattività")}<select id="devLock">${[[1, "1"], [5, "5"], [10, "10"], [30, "30"], [60, "60"], [0, t("Mai")]].map(([v, n]) => `<option value="${v}" ${d.autoLockMin === v ? "selected" : ""}>${n}</option>`).join("")}</select></label><label class="chk" style="align-self:end"><input type="checkbox" id="devHide" ${d.lockOnHide ? "checked" : ""}> ${t("Blocca appena l'app va in background")}</label></div></section>
  <section class="panel"><h2>${t("Codice di recupero")}</h2><p class="sub small">${t("Se lo hai perso, generane uno nuovo: quello vecchio smette di funzionare.")}</p><form id="rcForm" class="row" style="margin-top:8px"><input type="password" id="rcPw" placeholder="${t("Password attuale")}" required style="flex:1"><button class="btn">${t("Genera nuovo codice")}</button></form><div id="rcOut"></div></section>
  <section class="panel"><h2>${t("Protezione da tentativi")}</h2><p class="sub small">${t("Dopo 5 password errate l'app attende sempre di più. Puoi anche far cancellare tutti i dati dopo troppi tentativi (utile se perdi il telefono: assicurati di avere un backup).")}</p><label class="f" style="margin-top:8px;max-width:320px">${t("Cancella i dati dopo")}<select id="wipeAfter"><option value="0">${t("Mai")}</option>${[10, 15, 20].map(n => `<option value="${n}">${t("{n} tentativi errati", { n })}</option>`).join("")}</select></label></section>`;
};
SET.backup = () => {
  const d = App.cfgDevice(); const last = Prefs.get("lastBackup", null); const lastF = Prefs.get("lastFolderBackup", null); const fsOk = !!window.showDirectoryPicker; const isBrave = !!navigator.brave;
  return `<section class="panel"><h2>${t("Backup completo")}</h2><p class="sub small">${t("Il file .tsbackup è cifrato: per aprirlo serve la password (o il codice di recupero) di quando l'hai creato.")} ${last ? t("Ultimo: {d}.", { d: fmtDate(last.slice(0, 10)) }) : ""}</p>
    <label class="chk" style="margin-top:8px"><input type="checkbox" id="bkMedia" checked> ${t("Includi foto, video e documenti")}</label>
    <div class="row" style="margin-top:10px"><button class="btn pri" data-a="backupShare">${t("Salva nel cloud / File…")}</button><button class="btn" data-a="backupDownload">${t("Scarica backup")}</button><button class="btn" data-a="backupImport">${t("Importa backup")}</button></div>
    <p class="m" style="margin-top:6px">${t("Su iPhone e Android: «Salva nel cloud» apre il menu Condividi → scegli «Salva in File» (iCloud Drive) oppure Google Drive, OneDrive o Dropbox.")}</p></section>
  <section class="panel"><h2>${t("Backup automatico in una cartella (computer)")}</h2>
    ${fsOk ? `<p class="sub small">${t("Scegli una cartella del tuo cloud (iCloud Drive, OneDrive, Google Drive, Dropbox, kDrive) o del computer: l'app ci salva da sola un backup cifrato ogni volta che ci sono modifiche (uno al giorno, tiene gli ultimi 14). Il cloud lo copia su tutti i tuoi dispositivi.")}</p>
      <div class="row" style="margin-top:8px"><button class="btn pri" data-a="chooseFolder">${Backup.dirHandle ? t("Cambia cartella") : t("Scegli cartella")}</button>${Backup.dirHandle ? `<button class="btn" data-a="folderNow">${t("Salva adesso")}</button><button class="btn ghost" data-a="folderOff">${t("Disattiva")}</button>` : ""}</div>
      ${Backup.dirHandle ? `<p class="m" style="margin-top:6px">${t("Cartella: {n}", { n: esc(Backup.dirHandle.name) })} · ${d.autoFolder ? t("attivo") : t("disattivato")}${lastF ? " · " + t("ultimo salvataggio {d}", { d: fmtDate(lastF.slice(0, 10)) }) : ""}</p>` : ""}`
      : `<div class="banner info small">${isBrave ? t("In Brave questa funzione è spenta di serie. Per attivarla apri brave://flags/#file-system-access-api, scegli «Enabled» e riavvia Brave. In alternativa usa «Salva nel cloud» qui sopra.") : t("Questo browser (es. Safari, Firefox, iPhone o Android) non permette all'app di scrivere da sola in una cartella. Usa «Salva nel cloud» qui sopra: l'app ti ricorda quando è il momento.")}</div>`}</section>
  <section class="panel"><h2>${t("Frequenza e promemoria")}</h2><div class="fgrid" style="margin-top:10px"><label class="f">${t("Copia automatica interna ogni (minuti)")}<select id="devEvery">${[5, 10, 30, 60].map(v => `<option ${d.backupEveryMin === v ? "selected" : ""}>${v}</option>`).join("")}</select></label><label class="f">${t("Copie interne da conservare")}<select id="devKeep">${[10, 20, 50].map(v => `<option ${d.keepSnapshots === v ? "selected" : ""}>${v}</option>`).join("")}</select></label><label class="f">${t("Ricordami il backup completo ogni (giorni)")}<select id="devRemind">${[[1, "1"], [3, "3"], [7, "7"], [14, "14"], [0, t("Mai")]].map(([v, n]) => `<option value="${v}" ${d.backupReminderDays === v ? "selected" : ""}>${n}</option>`).join("")}</select></label></div></section>
  <section class="panel"><h2>${t("Copie automatiche interne")}</h2><p class="sub small">${t("L'app salva da sola delle copie cifrate sul dispositivo: se cancelli qualcosa per errore, puoi tornare indietro. Non sostituiscono il backup nel cloud.")}</p><div id="snapList" class="list" style="margin-top:6px"><div class="m">${t("Caricamento…")}</div></div></section>`;
};
SET.info = () => `<section class="panel"><h2>${esc(appName())} ${APP_VERSION}</h2><p class="sub">${t("App personale per lo scouting calcistico. Funziona offline, i dati restano sul dispositivo e sono cifrati.")}</p>
  <ul class="small"><li>${t("Spazio usato")}: <span id="usage">…</span></li><li>${t("Archivio persistente")}: <span id="persist">…</span></li><li>${t("Codice QR: libreria qrcode-generator (licenza MIT).")}</li></ul></section>`;

/* ----- editor delle opzioni ----- */
SET.personalizza = () => {
  if (!cfgDraft) cfgDraft = clone(Cfg.get());
  const c = cfgDraft; const roleSel = ui.roleTpl || (c.roles[0] || {}).id;
  const twoLang = (path, arr, extra) => arr.map((x, i) => `<div class="opt-row ${extra ? "three" : ""} ${x.hidden ? "hiddenp" : ""}"><input type="text" data-path="${path}.${i}.it" value="${esc(x.it)}" aria-label="IT"><input type="text" data-path="${path}.${i}.en" value="${esc(x.en)}" aria-label="EN">${extra ? extra(x, i) : ""}<div class="opt-actions"><button data-a="optMove" data-path="${path}" data-i="${i}" data-d="-1" title="${t("Su")}">↑</button><button data-a="optMove" data-path="${path}" data-i="${i}" data-d="1" title="${t("Giù")}">↓</button><button data-a="optHide" data-path="${path}.${i}" title="${t("Nascondi / mostra")}">${x.hidden ? "◌" : "●"}</button><button data-a="optDel" data-path="${path}" data-i="${i}" title="${t("Elimina")}">✕</button></div></div>`).join("");
  const block = (title, sub, path, arr, extra, addLabel) => `<section class="panel"><h2>${title}</h2>${sub ? `<p class="sub small">${sub}</p>` : ""}<div class="row m" style="margin-top:8px;font-weight:600"><span style="flex:1">Italiano</span><span style="flex:1">English</span></div>${twoLang(path, arr, extra)}<button class="btn sm" style="margin-top:8px" data-a="optAdd" data-path="${path}">+ ${addLabel || t("Aggiungi")}</button></section>`;
  const colorSel = (x, i, path) => `<select data-path="${path}.${i}.color">${["good", "blue", "amber", "grey", "bad"].map(k => `<option value="${k}" ${x.color === k ? "selected" : ""}>${{ good: t("Verde"), blue: t("Blu"), amber: t("Ambra"), grey: t("Grigio"), bad: t("Rosso") }[k]}</option>`).join("")}</select>`;
  const hide = new Set(c.roleHide[roleSel] || []);
  return `<div class="banner info row between"><span>${t("Modifica le opzioni come preferisci. Le modifiche valgono dopo «Salva modifiche». Rinominare non cambia i dati già inseriti.")}</span><div class="row"><button class="btn sm ghost" data-a="cfgReset">${t("Ripristina predefiniti")}</button><button class="btn sm pri" data-a="cfgSave">${t("Salva modifiche")}</button></div></div>
  <section class="panel"><h2>${t("Scala dei voti")}</h2><div class="fgrid" style="margin-top:10px"><label class="f">${t("Scala")}<select data-cfg="scale">${[["1-10-0.5", "1 – 10 (" + t("mezzi punti") + ")"], ["1-10-0.1", "1 – 10 (" + t("decimi") + ")"], ["1-10-1", "1 – 10 (" + t("interi") + ")"], ["1-5-0.5", "1 – 5 (" + t("mezzi punti") + ")"], ["1-100-1", "1 – 100"]].map(([k, n]) => `<option value="${k}" ${`${c.scale.min}-${c.scale.max}-${c.scale.step}` === k ? "selected" : ""}>${n}</option>`).join("")}</select></label><label class="f">${t("Evidenze minime per ogni giudizio")}<input type="number" min="0" max="10" data-cfg="minEvidence" value="${c.minEvidence}"></label><label class="f">${t("Dimensione massima file multimediali (MB)")}<input type="number" min="5" max="2000" data-cfg="mediaMaxMB" value="${c.mediaMaxMB}"></label></div><p class="m" style="margin-top:6px">${t("Se cambi scala, i voti già dati restano con il loro numero: conviene sceglierla all'inizio.")}</p></section>
  <section class="panel"><h2>${t("Peso delle aree nel rating")}</h2><p class="sub small">${t("Il rating finale è la media pesata delle aree. Esempio: tecnica 30, tattica 30, mentale 20, fisica 20.")}</p><div class="fgrid" style="margin-top:8px">${c.areas.map(a => `<label class="f">${esc(L(a))}<input type="number" min="0" max="100" data-path="areaWeights.${a.id}" value="${esc((c.areaWeights || {})[a.id] ?? 1)}"></label>`).join("")}</div></section>
  <section class="panel"><h2>${t("Aree e parametri di valutazione")}</h2><p class="sub small">${t("Rinomina, riordina, nascondi o aggiungi parametri. L'area Portiere compare solo per i giocatori con ruolo da portiere.")}</p>
   ${c.areas.map((a, ai) => `<details class="area" style="margin-top:10px" ${ui.openCfgArea === ai ? "open" : ""} data-ai="${ai}"><summary><h3>${esc(L(a))}${a.hidden ? " · " + t("nascosta") : ""}</h3><span class="m">${t("{n} parametri attivi su {tot}", { n: a.params.filter(x => !x.hidden).length, tot: a.params.length })}</span></summary><div class="row" style="margin-bottom:8px"><input type="text" data-path="areas.${ai}.it" value="${esc(a.it)}" style="flex:1" aria-label="IT"><input type="text" data-path="areas.${ai}.en" value="${esc(a.en)}" style="flex:1" aria-label="EN"><button class="btn sm ghost" data-a="optHide" data-path="areas.${ai}">${a.hidden ? t("Mostra area") : t("Nascondi area")}</button></div>${twoLang(`areas.${ai}.params`, a.params)}<button class="btn sm" style="margin:8px 0 12px" data-a="optAdd" data-path="areas.${ai}.params">+ ${t("Parametro")}</button></details>`).join("")}
   <button class="btn sm" style="margin-top:10px" data-a="optAdd" data-path="areas">+ ${t("Nuova area")}</button></section>
  <section class="panel"><h2>${t("Parametri per ruolo")}</h2><p class="sub small">${t("Scegli quali parametri compaiono quando valuti un giocatore di quel ruolo (conta il ruolo principale). Togli la spunta a quelli che non servono.")}</p>
   <label class="f" style="max-width:320px;margin-top:8px">${t("Ruolo")}<select id="roleTpl">${c.roles.map(r => `<option value="${esc(r.id)}" ${r.id === roleSel ? "selected" : ""}>${esc(L(r))}</option>`).join("")}</select></label>
   ${c.areas.filter(a => !a.hidden && (!a.gk || (c.roles.find(r => r.id === roleSel) || {}).gk)).map(a => `<div class="areah"><h3>${esc(L(a))}</h3><span class="row"><button class="btn sm ghost" data-a="tplAll" data-area="${a.id}" data-v="1">${t("Tutti")}</button><button class="btn sm ghost" data-a="tplAll" data-area="${a.id}" data-v="0">${t("Nessuno")}</button></span></div><div class="params">${a.params.filter(x => !x.hidden).map(x => `<label class="chk small"><input type="checkbox" data-tpl="${a.id}|${esc(x.id)}" ${hide.has(a.id + "|" + x.id) ? "" : "checked"}> ${esc(L(x))}</label>`).join("")}</div>`).join("")}</section>
  ${block(t("Ruoli"), t("Il segno «Portiere» attiva l'area dei portieri. La posizione sul campo si imposta dalla scheda del giocatore."), "roles", c.roles, (x, i) => `<label class="chk small"><input type="checkbox" data-path="roles.${i}.gk" data-bool="1" ${x.gk ? "checked" : ""}> GK</label>`, t("Ruolo"))}
  ${block(t("Livelli"), t("La sigla (A, B, C…) è il codice breve che compare nella scheda."), "levels", c.levels, (x, i) => `<input type="text" data-path="levels.${i}.id" value="${esc(x.id)}" aria-label="${t("Sigla")}" style="max-width:90px">`, t("Livello"))}
  ${block(t("Giudizi"), "", "verdicts", c.verdicts, (x, i) => colorSel(x, i, "verdicts"), t("Giudizio"))}
  <section class="panel"><h2>${t("Tag")}</h2>${c.tags.map((x, i) => `<div class="opt-row"><input type="text" data-path="tags.${i}.name" value="${esc(x.name)}"><input type="color" data-path="tags.${i}.color" value="${esc(x.color)}"><div class="opt-actions"><button data-a="optMove" data-path="tags" data-i="${i}" data-d="-1">↑</button><button data-a="optMove" data-path="tags" data-i="${i}" data-d="1">↓</button><button data-a="optDel" data-path="tags" data-i="${i}">✕</button></div></div>`).join("")}<button class="btn sm" style="margin-top:8px" data-a="optAdd" data-path="tags">+ ${t("Tag")}</button></section>
  ${block(t("Azioni del registro live"), t("Per ogni azione scegli la fase di gioco in cui compare e l'area di valutazione che alimenta."), "liveCats", c.liveCats, (x, i) => `<div class="row" style="flex-wrap:nowrap;gap:4px"><select data-path="liveCats.${i}.group" aria-label="${t("Fase")}">${(c.liveGroups || []).filter(g => g.id !== "frequenti").map(g => `<option value="${g.id}" ${x.group === g.id ? "selected" : ""}>${esc(L(g))}</option>`).join("")}</select><select data-path="liveCats.${i}.area" aria-label="${t("Area")}">${c.areas.map(a => `<option value="${a.id}" ${x.area === a.id ? "selected" : ""}>${esc(L(a))}</option>`).join("")}</select></div>`, t("Azione"))}
  ${block(t("Domande prima del fischio d'inizio"), "", "preQuestions", c.preQuestions || [], (x, i) => `<select data-path="preQuestions.${i}.group">${PREQ_GROUPS.map(([g, it, en]) => `<option value="${g}" ${x.group === g ? "selected" : ""}>${esc(L({ it, en }))}</option>`).join("")}</select>`, t("Domanda"))}
  ${block(t("Interpretazioni del ruolo"), "", "archetypes", c.archetypes || [], (x, i) => `<select data-path="archetypes.${i}.group">${[["gk", "Portiere"], ["dc", "Difensore centrale"], ["fb", "Terzini e quinti"], ["mid", "Centrocampisti"], ["am", "Trequartista"], ["w", "Ali"], ["st", "Attaccanti"]].map(([g, n]) => `<option value="${g}" ${x.group === g ? "selected" : ""}>${esc(t(n))}</option>`).join("")}</select>`, t("Interpretazione"))}
  ${block(t("Atteggiamento nel riscaldamento"), "", "warmupChips", c.warmupChips || [])}
  ${block(t("Tipologie di partita"), "", "matchTypes", c.matchTypes)}
  ${block(t("Categorie di squadra"), "", "teamCats", c.teamCats)}
  ${block(t("Tipi di infortunio"), "", "injuryTypes", c.injuryTypes)}
  ${block(t("Somatotipi"), "", "somatotypes", c.somatotypes)}
  ${block(t("Maturazione biologica"), "", "maturity", c.maturity)}
  <section class="panel"><h2>${t("Sistemi di gioco")}</h2><textarea id="cfgSystems" style="min-height:120px">${esc(c.systems.join("\n"))}</textarea><p class="m">${t("Uno per riga.")}</p></section>
  <div class="row end"><button class="btn pri" data-a="cfgSave">${t("Salva modifiche")}</button></div>`;
};
function rememberCfgArea(el) { const d = el.closest("details.area[data-ai]"); ui.openCfgArea = d ? +d.dataset.ai : null; }
function getPath(o, path) { return path.split(".").reduce((x, k) => x == null ? x : x[k], o); }
function setPath(o, path, v) { const ks = path.split("."); const last = ks.pop(); const tgt = ks.reduce((x, k) => x[k], o); tgt[last] = v; }

/* =========================================================
   ESEMPI (tutti inventati: giocatori, società, staff e valutazioni)
   ========================================================= */
const Examples = {
  rng(seed) { let h = 1779033703 ^ seed.length; for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; } return () => { h = Math.imul(h ^ h >>> 16, 2246822507); h = Math.imul(h ^ h >>> 13, 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; }; },
  PLUS: {
    "Portiere": [["Parate", "Reattività", "Posizionamento tra i pali", "Uscite alte", "1vs1 in uscita", "Elevazione", "Esplosività", "Concentrazione", "Personalità", "Leadership"], ["Dribbling", "Finalizzazione", "Tiro", "Senso del gol", "Attacco della profondità", "Fa reparto da solo", "Incisività offensiva", "Abilità offensive", "Assist", "Contropiede", "Imprevedibilità"]],
    "Difensore centrale": [["Abilità difensive", "Anticipo", "Posizione", "Rottura del gioco avversario", "Ripiegamenti difensivi", "Duelli aerei", "Forza", "Fisicità", "Contrasti", "Colpo di testa", "Concentrazione"], ["Dribbling", "Finalizzazione", "Senso del gol", "Fa reparto da solo", "Imprevedibilità", "Estrosità", "Assist", "Attacco della profondità", "Spalle alla porta"]],
    "Quinto": [["Velocità", "Resistenza", "Capacità aerobica", "Intensità", "Assist", "Conduzione palla", "Ripiegamenti difensivi", "Contropiede", "Accelerazione"], ["Colpo di testa", "Fa reparto da solo", "Spalle alla porta", "Senso del gol", "Duelli aerei"]],
    "Mediano": [["Lettura del gioco", "Posizione", "Rottura del gioco avversario", "Supporto al centrocampo", "Passaggio", "Gioco sotto pressione", "Intensità", "Resistenza", "Uomo squadra", "Anticipo"], ["Fa reparto da solo", "Senso del gol", "Finalizzazione", "Attacco della profondità", "Spalle alla porta", "Colpo di testa"]],
    "Regista": [["Visione", "Lettura del gioco", "Passaggio", "Passaggi chiave", "Gioco sotto pressione", "Controllo orientato", "Tecnica", "Precisione", "Presa decisioni", "Personalità", "Leadership"], ["Fa reparto da solo", "Velocità", "Duelli aerei", "Elevazione", "Attacco della profondità", "Spalle alla porta"]],
    "Mezzala": [["Capacità d'inserimento", "Supporto al centrocampo", "Resistenza", "Intensità", "Conduzione palla", "Passaggio", "Fisicità", "Uomo squadra"], ["Fa reparto da solo", "Spalle alla porta", "Uso entrambi i piedi"]],
    "Trequartista": [["Ricezione tra le linee", "Dribbling", "Imprevedibilità", "Passaggi chiave", "Abilità offensive", "Conduzione palla", "Accelerazione", "Cambio di passo", "Tiro", "Estrosità", "1vs1"], ["Duelli aerei", "Colpo di testa", "Abilità difensive", "Contrasti", "Rottura del gioco avversario", "Spalle alla porta"]],
    "Ala": [["1vs1", "Dribbling", "Imprevedibilità", "Velocità", "Accelerazione", "Cambio di passo", "Abilità offensive", "Contropiede", "Conduzione palla"], ["Duelli aerei", "Colpo di testa", "Abilità difensive", "Fa reparto da solo", "Spalle alla porta"]],
    "Punta centrale": [["Senso del gol", "Attacco della profondità", "Fa reparto da solo", "Finalizzazione", "Tiro", "Colpo di testa", "Freddezza", "Spalle alla porta", "Duelli aerei", "Protezione palla", "Incisività offensiva"], ["Abilità difensive", "Ripiegamenti difensivi", "Contrasti", "Supporto al centrocampo", "Rottura del gioco avversario"]]
  },
  gen(p, base, seed) {
    const R0 = this.rng(seed); const role = mainRole(p) || ""; const key = Object.keys(this.PLUS).find(k => role.startsWith(k)) || "Mezzala"; const [plus, minus] = this.PLUS[key]; const r = {};
    for (const a of visAreas(p)) { r[a.id] = {}; for (const x of a.params) { if (R0() < 0.12) continue; let v = base + (plus.includes(x.id) ? 1.2 : 0) - (minus.includes(x.id) ? 1.6 : 0) + (R0() - 0.5) * 1.4; v = Math.round(Math.max(3, Math.min(9.5, v)) * 2) / 2; r[a.id][x.id] = v; } }
    return r;
  },
  load(silent) {
    for (const c of COLLS) for (const [id, o] of [...S[c]]) if (o && o.example) { del(c, id); }
    const ex = o => ({ ...o, example: true }); const K = {};
    const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
    const L1 = uid(), L2 = uid(), L3 = uid();
    put("lists", L1, ex({ name: t("Mercato estate 2027"), parentId: null, color: "#1E6A47", note: t("Obiettivi per la prossima sessione di mercato") }));
    put("lists", L2, ex({ name: t("Difensori"), parentId: L1, color: "#2F6690", note: "" }));
    put("lists", L3, ex({ name: t("Under 21"), parentId: L1, color: "#B8730F", note: "" }));
    const lists = { pav: [L2], gil: [L2], tom: [L2], dew: [L2], bar: [L1, L3], cam: [L3], jas: [L1], hut: [L1], ram: [L1] };
    const tags = { bar: ["u21"], cam: ["u21"] };
    const pros = { mod: [t("Visione e qualità del passaggio"), t("Scanning continuo"), t("Gestione dei tempi di gioco")], jas: [t("Contropressing"), t("Copertura di campo"), t("Pulizia nel primo passaggio")], pul: [t("Uno contro uno"), t("Cambio di passo"), t("Tiro dopo il rientro")], cam: [t("Movimenti da punta matura"), t("Protezione palla")], pav: [t("Aggressività"), t("Gioco aereo"), t("Uscita palla al piede")] };
    const cons = { mod: [t("Copertura in non possesso"), t("Duelli in velocità")], jas: [t("Accelerazione sul breve")], pul: [t("Duelli aerei")], cam: [t("Continuità sotto porta")], pav: [t("Impeto dopo l'errore")] };
    for (const [k, first, last, role, birth, city, country, nat, foot, shirt, height, level, verdict, base, value, until, loan, career] of EX_SQUAD) { K[k] = uid(); const r = Cfg.role(role) || { x: 50, y: 50 }; const r2 = EX_ROLE2[k];
      put("players", K[k], ex({ first, last, sex: "Uomo", birth, birthYear: birth.slice(0, 4), birthCity: t(city), birthCountry: t(country), nat: t(nat), foot, shirt: String(shirt), height: String(height), club: "FC Valdoria", league: "Lega Alfa", eu: ["Italia", "Francia", "Belgio", "Spagna", "Croazia", "Portogallo", "Bulgaria"].includes(nat) ? "eu" : nat === "Svizzera" ? "assim" : "noneu", roles: r2 ? [role, r2] : [role], pos: { x: r.x, y: r.y }, level, verdict, listIds: lists[k] || [], tags: tags[k] || [], pros: pros[k] || [], cons: cons[k] || [], contract: { until: until, loan: !!loan, owner: loan ? "Sherwood Rovers" : "", value: value ? value + " mln € (stima di esempio, 23/09/2026)" : "" }, physique: {}, injuries: [], relations: [], quick: t(career), notes: t("Esempio: giocatore, società e dati inventati, utili solo per provare l'app."), nextCheck: k === "cam" ? day(6) : k === "bar" ? day(10) : "" })); }
    const m1 = uid(), m2 = uid(), m3 = uid(); const E = (tm, h, p, c, o, n) => ({ id: uid(), t: tm, h, p: K[p], c, o, n });
    put("matches", m1, ex({ home: "FC Valdoria", away: t("Squadra Esempio A"), date: day(-9), time: "20:45", type: "Campionato", teamCat: "Prima squadra", competition: t("Partita di esempio"), venue: t("Stadio di esempio"), status: "vista", score: "2-1", sysHome: "1-3-4-2-1", sysAway: "1-4-3-3", goal: t("Centrocampo: confronto Banović, Morina, Lemaire."), targets: [K.mod, K.jas, K.rab], tags: [], notes: t("Partita di esempio inventata."), events: [E(4, 1, "jas", "Ricezione", "+", t("Doppio controllo prima di ricevere")), E(9, 1, "mod", "Passaggio", "+", t("Cambio di gioco sul quinto")), E(14, 1, "rab", "Conduzione", "+", t("Rompe la prima linea")), E(19, 1, "jas", "Pressing", "+", t("Riaggressione immediata")), E(26, 1, "mod", "Controllo orientato", "+", t("Riceve tra le linee e gira")), E(33, 1, "mod", "Duello a terra", "-", t("Superato in campo aperto")), E(41, 1, "rab", "Smarcamento", "+", t("Attacca l'area da dietro")), E(50, 2, "jas", "Passaggio", "+", ""), E(63, 2, "mod", "Passaggio", "+", ""), E(71, 2, "jas", "Posizione", "+", t("Schermo davanti alla difesa")), E(78, 2, "rab", "Ripiegamento", "+", "")] }));
    put("matches", m2, ex({ home: t("Squadra Esempio B"), away: "FC Valdoria", date: day(-4), time: "18:00", type: "Campionato", teamCat: "Prima squadra", competition: t("Partita di esempio"), venue: t("Stadio di esempio"), status: "vista", score: "0-2", sysHome: "1-4-4-2", sysAway: "1-3-4-2-1", targets: [K.cam, K.bar, K.pul, K.pav], tags: ["u21"], events: [E(6, 1, "pul", "Dribbling", "+", t("Rientra e calcia")), E(11, 1, "pav", "Lettura / Anticipo", "+", ""), E(17, 1, "bar", "Cross / Assist", "+", t("Cross basso dal fondo")), E(24, 1, "cam", "Attacco profondità", "+", ""), E(29, 1, "pav", "Duello aereo", "+", ""), E(38, 1, "cam", "Tiro", "-", t("Conclusione fuori misura")), E(52, 2, "bar", "Ripiegamento", "+", ""), E(66, 2, "cam", "Ricezione", "+", t("Spalle alla porta, protegge e scarica")), E(83, 2, "bar", "Duello a terra", "-", "")] }));
    put("matches", m3, ex({ home: "FC Valdoria", away: t("Squadra Esempio C"), date: day(5), time: "20:45", type: "Campionato", competition: t("Partita di esempio"), venue: t("Stadio di esempio"), status: "pianificata", goal: t("Verificare Fletcher e Faria contro una difesa bassa."), targets: [K.hut, K.ram], tags: [], events: [] }));
    const mk = (k, mid, i) => { const p = P(K[k]); const m = S.matches.get(mid);
      const evd = (m.events || []).filter(e => e.p === K[k]).map(e => ({ area: (Cfg.get().liveCats.find(c => c.id === e.c) || {}).area || "tec", min: String(e.t), text: `${liveCatL(e.c)} (${e.o === "+" ? t("positiva") : e.o === "-" ? t("negativa") : t("neutra")})${e.n ? ": " + e.n : ""}` }));
      put("evals", uid(), ex({ playerId: K[k], matchId: mid, by: "MM", date: m.date, matchType: "Campionato", cat: "Club", teamCat: "Prima squadra", home: m.home, away: m.away, score: m.score, sysHome: m.sysHome, sysAway: m.sysAway, shirt: p.shirt, minutes: "90", source: "Video completo", positions: [p.pos, { x: Math.min(100, p.pos.x + 8), y: Math.max(0, p.pos.y - 10) }], r: this.gen(p, EX_SQUAD.find(x => x[0] === k)[13], k + i), notes: {}, evidence: evd, summary: t("Valutazione di esempio inventata per esercitazione."), tags: [] })); };
    ["mod", "jas", "rab", "mai", "tom", "gab", "pav", "sae", "est", "pul", "ram"].forEach(k => mk(k, m1, 1));
    ["mai", "gil", "pav", "dew", "bar", "sae", "jas", "mus", "pul", "hut", "cam"].forEach(k => mk(k, m2, 2));
    const pm = P(K.mod); put("players", K.mod, { ...pm, relations: [{ id: uid(), title: t("Scouting report: {n}", { n: "Dario Banović" }), author: "MM", date: day(-8), text: t("Relazione di esempio inventata per esercitazione.") }] });
    const slots = { 0: K.mai, 1: K.gil, 2: K.pav, 3: K.tom, 4: K.sae, 5: K.jas, 6: K.mod, 7: K.bar, 8: K.pul, 9: K.rab, 10: K.ram }; const sl = {}; for (const i in slots) sl[i] = { main: slots[i], alt: [] }; sl[10].alt = [K.cam]; sl[2].alt = [K.dew]; sl[7].alt = [K.est];
    put("lineups", uid(), ex({ name: t("Valdoria 2026/27 (esempio)"), formation: "3-4-2-1", slots: sl, note: "" }));
    put("settings", "compare", { ids: [K.mod, K.jas, K.rab] }); ui.cmp = [K.mod, K.jas, K.rab];
    if (!silent) { toast(t("Esempi caricati")); render(); }
  },
  clear() { for (const c of COLLS) for (const [id, o] of [...S[c]]) if (o && o.example) del(c, id); ui.cmp = []; ui.playerId = null; ui.matchId = null; toast(t("Esempi eliminati")); render(); }
};

/* =========================================================
   CSV
   ========================================================= */
function csv(rows) { return "﻿" + rows.map(r => r.map(v => { v = v == null ? "" : String(v); return /[",;\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; }).join(";")).join("\n"); }
function exportPlayersCsv() { const rows = [[t("Nome"), t("Cognome"), t("Ruolo"), t("Età"), t("Nazionalità"), t("Club"), t("Campionato"), t("Piede"), t("Altezza"), t("Livello"), t("Giudizio"), t("Rating"), t("Valutazioni"), t("Scadenza contratto"), t("Agente"), t("Tag"), t("Liste")]]; for (const [id, p] of filterPlayers({ ...ui.pf, showArch: true })) { const pr = profile(id); rows.push([p.first, p.last, (p.roles || []).map(roleL).join(", "), age(p), p.nat, p.club, p.league, p.foot ? t(p.foot) : "", p.height, p.level, L(Cfg.verdict(p.verdict)), pr.rating != null ? pr.rating.toFixed(2) : "", pr.n, (p.contract || {}).until, (p.contract || {}).agent, (p.tags || []).map(x => (Cfg.tag(x) || {}).name).join(", "), (p.listIds || []).map(x => (S.lists.get(x) || {}).name).filter(Boolean).join(", ")]); } download(`giocatori-${today()}.csv`, csv(rows), "text/csv"); }
function exportEvalsCsv() { const areas = Cfg.get().areas; const rows = [[t("Data"), t("Giocatore"), t("Partita"), t("Valutato da"), t("Minuti"), t("Rating"), ...areas.map(a => L(a)), t("Sintesi")]]; for (const [, e] of S.evals) { rows.push([e.date, pname(P(e.playerId)), `${e.home || ""} – ${e.away || ""}`, e.by, e.minutes, evalRating(e)?.toFixed(2), ...areas.map(a => evalArea(e, a.id)?.toFixed(2) ?? ""), e.summary]); } download(`valutazioni-${today()}.csv`, csv(rows), "text/csv"); }

/* =========================================================
   EVENTI
   ========================================================= */
function bindView() {
  if (ui.view === "partite" && ui.matchId && ui.mtab === "live") { renderLiveLog(); tickClock(); if (!clockH) clockH = setInterval(tickClock, 1000); }
  const on = (sel, ev, fn) => { const el = $(sel); if (el) el[ev] = fn; };
  // filtri giocatori
  on("#pfq", "oninput", e => { ui.pf.q = e.target.value; const pos = e.target.selectionStart; render(true); const n = $("#pfq"); n.focus(); n.setSelectionRange(pos, pos); });
  on("#pfsort", "onchange", e => { ui.pf.sort = e.target.value; render(true); });
  ["role", "verdict", "level", "tag", "list", "foot"].forEach(k => on("#pf_" + k, "onchange", e => { ui.pf[k] = e.target.value; render(true); }));
  ["nat", "ageMin", "ageMax", "rMin", "contract"].forEach(k => on("#pf_" + k, "onchange", e => { ui.pf[k] = e.target.value; render(true); }));
  on("#pf_showArch", "onchange", e => { ui.pf.showArch = e.target.checked; render(true); });
  // filtri partite e report
  on("#mfq", "oninput", e => { ui.mf.q = e.target.value; const pos = e.target.selectionStart; render(true); const n = $("#mfq"); n.focus(); n.setSelectionRange(pos, pos); });
  ["status", "type", "tag"].forEach(k => on("#mf_" + k, "onchange", e => { ui.mf[k] = e.target.value; render(true); }));
  on("#mf_showArch", "onchange", e => { ui.mf.showArch = e.target.checked; render(true); });
  on("#rfq", "oninput", e => { ui.rf.q = e.target.value; const pos = e.target.selectionStart; render(true); const n = $("#rfq"); n.focus(); n.setSelectionRange(pos, pos); });
  ["from", "to", "by", "type", "tag", "rMin", "sort"].forEach(k => on("#rf_" + k, "onchange", e => { ui.rf[k] = e.target.value; render(true); }));
  on("#rf_showArch", "onchange", e => { ui.rf.showArch = e.target.checked; render(true); });
  // live
  on("#addTarget", "onchange", e => { if (!e.target.value) return; const m = S.matches.get(ui.matchId); put("matches", ui.matchId, { ...m, targets: [...(m.targets || []), e.target.value] }); ui.liveP = e.target.value; render(true); });
  // editor valutazione
  on("#eMatch", "onchange", e => { syncEval(); const m = S.matches.get(e.target.value); if (m) Object.assign(ui.edraft, { date: m.date, home: m.home, away: m.away, score: m.score || "", sysHome: m.sysHome || ui.edraft.sysHome, sysAway: m.sysAway || ui.edraft.sysAway, matchType: m.type || ui.edraft.matchType }); render(true); });
  $$(".slrow input[type=range]").forEach(r => { const setV = () => { const d = ui.edraft, ak = r.dataset.ak, at = r.dataset.at; d.r[ak] = d.r[ak] || {}; d.r[ak][at] = +r.value; const row = r.closest(".slrow"); row.classList.remove("unset"); row.querySelector(".vchip").textContent = f1(+r.value); updAvg(ak); }; r.oninput = setV; r.onpointerup = setV; r.onkeyup = setV; });
  on("#eTags", "onclick", e => { const b = e.target.closest(".chip"); if (b) b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") !== "true"); });
  on("#ePitch", "onclick", e => { syncEval(); const pt = pitchPoint($("#ePitch"), e); const d = ui.edraft; const near = d.positions.findIndex(q => Math.hypot(q.x - pt.x, (q.y - pt.y) * 0.65) < 4); if (near >= 0) d.positions.splice(near, 1); else d.positions.push(pt); render(true); });
  // editor giocatore
  on("#pRoles", "onclick", e => { const b = e.target.closest(".chip"); if (!b) return; syncPlayer(); const d = ui.pdraft, r = b.dataset.role; d.roles = d.roles || []; if (d.roles.includes(r)) d.roles = d.roles.filter(x => x !== r); else { d.roles.push(r); if (d.roles.length === 1 && !d.pos) { const ro = Cfg.role(r); d.pos = { x: ro.x ?? 50, y: ro.y ?? 50 }; } } render(true); });
  on("#pPitch", "onclick", e => { syncPlayer(); ui.pdraft.pos = pitchPoint($("#pPitch"), e); render(true); });
  on("#pTags", "onclick", e => { const b = e.target.closest(".chip[data-tag]"); if (!b) return; syncPlayer(); const d = ui.pdraft; d.tags = d.tags.includes(b.dataset.tag) ? d.tags.filter(x => x !== b.dataset.tag) : [...d.tags, b.dataset.tag]; render(true); });
  on("#pLists", "onclick", e => { const b = e.target.closest(".chip"); if (b) b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") !== "true"); });
  // confronto
  on("#cmpQ", "oninput", e => { const q = e.target.value.toLowerCase(); $$("#cmpChips .chip").forEach(x => x.hidden = !x.dataset.n.includes(q)); });
  // squadre ombra
  on("#formation", "onchange", e => { const lu = S.lineups.get(ui.lineupId); put("lineups", ui.lineupId, { ...lu, formation: e.target.value }); render(true); });
  // impostazioni
  if (ui.view === "impostazioni") bindSettings();
}
function bindSettings() {
  const on = (sel, ev, fn) => { const el = $(sel); if (el) el[ev] = fn; };
  on("#devLiveDet", "onchange", e => { App.setDevice({ liveDetailsOff: !e.target.checked }); toast(t("Salvato")); }); on("#devNeutral", "onchange", e => { App.setDevice({ hideNeutral: !e.target.checked }); toast(t("Salvato")); });
  on("#devLock", "onchange", e => { App.setDevice({ autoLockMin: +e.target.value }); App.touch(); toast(t("Salvato")); });
  on("#devHide", "onchange", e => { App.setDevice({ lockOnHide: e.target.checked }); toast(t("Salvato")); });
  on("#devEvery", "onchange", e => { App.setDevice({ backupEveryMin: +e.target.value }); toast(t("Salvato")); });
  on("#devKeep", "onchange", e => { App.setDevice({ keepSnapshots: +e.target.value }); toast(t("Salvato")); });
  on("#devRemind", "onchange", e => { App.setDevice({ backupReminderDays: +e.target.value }); toast(t("Salvato")); });
  if ($("#np1")) Lock.bindPw();
  on("#cpForm", "onsubmit", async e => { e.preventDefault(); const pw = Lock.checkPw(); if (!pw) return; try { const raw = await Store.unwrap($("#cpOld").value); await Store.rewrap(raw, pw); raw.fill(0); toast(t("Password cambiata")); e.target.reset(); } catch (err) { $("#lockErr").textContent = t("Password attuale errata."); } });
  on("#rcForm", "onsubmit", async e => { e.preventDefault(); try { const raw = await Store.unwrap($("#rcPw").value); const code = await Store.newRecovery(raw); raw.fill(0); $("#rcOut").innerHTML = `<div class="recovery" id="rcCode" style="margin-top:8px">${esc(code)}</div><div class="row" style="margin-top:6px"><button class="btn sm" data-a="copyText" data-target="rcCode">${t("Copia")}</button><span class="m">${t("Salvalo subito: non verrà mostrato di nuovo.")}</span></div>`; } catch (err) { toast(t("Password attuale errata.")); } });
  if ($("#secTotp")) Store.meta().then(m => { $("#secTotp").innerHTML = `<div class="row between" style="margin-top:10px"><span>${t("Verifica in due passaggi")}: <b>${m.totp ? t("attiva") : t("non attiva")}</b></span>${m.totp ? `<button class="btn sm danger" data-a="totpOff">${t("Disattiva")}</button>` : `<button class="btn sm pri" data-a="totpOn">${t("Attiva")}</button>`}</div>`; const w = $("#wipeAfter"); if (w) { w.value = String(m.wipeAfter || 0); w.onchange = async () => { const mm = await Store.meta(); mm.wipeAfter = +w.value; await Store.put("meta", "sec", mm); toast(t("Salvato")); }; } });
  if ($("#snapList")) Store.keys("snap").then(async ks => { ks = ks.sort().reverse(); const rows = []; for (const k of ks) { const s = await Store.get("snap", k); rows.push(`<div class="item"><div class="grow"><div class="t">${new Date(k).toLocaleString(locale())}</div><div class="m">${esc(s.reason || "")} · ${t("{n} voci", { n: s.count ?? "?" })}</div></div><button class="btn sm" data-a="restoreSnap" data-k="${k}">${t("Ripristina")}</button></div>`); } $("#snapList").innerHTML = rows.join("") || `<div class="m">${t("Nessuna copia ancora: la prima arriva dopo le prime modifiche.")}</div>`; });
  if ($("#usage") && navigator.storage && navigator.storage.estimate) navigator.storage.estimate().then(e => { $("#usage").textContent = `${fmtSize(e.usage)} / ${fmtSize(e.quota)}`; });
  if ($("#persist")) (navigator.storage && navigator.storage.persisted ? navigator.storage.persisted() : Promise.resolve(false)).then(v => $("#persist").textContent = v ? t("sì") : t("no (il browser potrebbe liberare spazio: fai backup)"));
  // personalizza
  $$("[data-path]").forEach(el => { if (el.tagName === "BUTTON") return; el.addEventListener(el.type === "checkbox" || el.tagName === "SELECT" || el.type === "color" ? "change" : "input", () => { setPath(cfgDraft, el.dataset.path, el.dataset.bool ? el.checked : el.value); }); });
  $$("[data-cfg]").forEach(el => el.addEventListener("change", () => { if (el.dataset.cfg === "scale") { const [a, b, s] = el.value.split("-").map(Number); cfgDraft.scale = { min: a, max: b, step: s }; } else cfgDraft[el.dataset.cfg] = +el.value; }));
  on("#roleTpl", "onchange", e => { ui.roleTpl = e.target.value; render(true); });
  $$("[data-tpl]").forEach(el => el.onchange = () => { const r = ui.roleTpl || cfgDraft.roles[0].id; const set = new Set(cfgDraft.roleHide[r] || []); if (el.checked) set.delete(el.dataset.tpl); else set.add(el.dataset.tpl); cfgDraft.roleHide[r] = [...set]; });
  on("#cfgSystems", "oninput", e => { cfgDraft.systems = e.target.value.split("\n").map(x => x.trim()).filter(Boolean); });
}
async function photoToDataURL(file, size = 400) { return new Promise((res, rej) => { const img = new Image(); img.onload = () => { const c = document.createElement("canvas"); const k = Math.min(1, size / Math.min(img.width, img.height)); const w = img.width * k, h = img.height * k; c.width = Math.min(w, size); c.height = Math.min(h, size); c.getContext("2d").drawImage(img, (c.width - w) / 2, (c.height - h) / 2, w, h); URL.revokeObjectURL(img.src); res(c.toDataURL("image/jpeg", .85)); }; img.onerror = rej; img.src = URL.createObjectURL(file); }); }
function pickFile(accept, multiple) { return new Promise(res => { const i = document.createElement("input"); i.type = "file"; i.accept = accept; i.multiple = !!multiple; i.onchange = () => res([...i.files]); i.click(); }); }
function importLive(showToast) {
  const d = ui.edraft; const m = S.matches.get(d.matchId); if (!m) return; const have = new Set(d.evidence.map(e => e.liveId)); let n = 0; const p = P(d.playerId);
  for (const e of (m.events || []).filter(e => e.p === d.playerId && !have.has(e.id))) { let area = (Cfg.get().liveCats.find(c => c.id === e.c) || {}).area || "tec"; if (!visAreas(p).some(a => a.id === area)) area = visAreas(p)[0].id; d.evidence.push({ area, min: String(e.t), text: `${liveCatL(e.c)} (${e.o === "+" ? t("positiva") : e.o === "-" ? t("negativa") : t("neutra")})${e.n ? ": " + e.n : ""}`, liveId: e.id }); n++; }
  if (showToast) toast(n ? t("{n} evidenze importate", { n }) : t("Niente di nuovo da importare"));
}

const A = {
  // accesso e aspetto
  setLang: el => { Prefs.set("lang", el.dataset.v); document.documentElement.lang = el.dataset.v; if (App.unlocked) render(true); else Lock.show(); },
  setTheme: el => { Prefs.set("theme", el.dataset.v); applyTheme(); if (App.unlocked) render(true); else $$('[data-a="setTheme"]').forEach(b => b.setAttribute("aria-pressed", b.dataset.v === el.dataset.v)); },
  lockRecovery: () => Lock.recovery(), lockCancel: () => { Store.lock(); Lock.show(); },
  signup: () => Lock.signup(false),
  pickAcct: el => { $("#lgEmail").value = el.dataset.email; $("#pw").focus(); },
  setupTotp: async () => { const s = await Lock.setupTotpScreen(() => Lock.setup4()); Lock.render(Lock.brand() + s.html + `<button class="btn ghost sm" data-a="setup4">${t("Salta")}</button>`); s.bind(); },
  setup4: () => Lock.setup4(),
  lockNow: () => { closeSheet(); App.lock(); },
  copyText: el => { const tg = document.getElementById(el.dataset.target); const v = tg.value ?? tg.textContent; navigator.clipboard.writeText(v).then(() => toast(t("Copiato"))).catch(() => { const r = document.createRange(); r.selectNodeContents(tg); getSelection().removeAllRanges(); getSelection().addRange(r); if (tg.select) tg.select(); toast(t("Selezionato: copia con ⌘C")); }); },
  totpOn: async () => { const s = await Lock.setupTotpScreen(() => { closeSheet(); render(true); }); sheet(s.html + `<button class="btn ghost" data-a="closeSheetBtn">${t("Annulla")}</button>`); s.bind(); },
  totpOff: () => { sheet(`<h2>${t("Disattiva verifica in due passaggi")}</h2><form id="toff" class="col"><input type="text" id="toffC" inputmode="numeric" placeholder="${t("Codice a 6 cifre")}" class="mono" required><div class="warn" id="toffE"></div><div class="row end"><button type="button" class="btn" data-a="closeSheetBtn">${t("Annulla")}</button><button class="btn danger">${t("Disattiva")}</button></div></form>`); $("#toff").onsubmit = async e => { e.preventDefault(); const m = await Store.meta(); const sec = await C.decRaw(Store.key, m.totp); if (!(await C.verifyTotp(sec, $("#toffC").value))) { $("#toffE").textContent = t("Codice non valido."); return; } m.totp = null; await Store.put("meta", "sec", m); closeSheet(); toast(t("Verifica in due passaggi disattivata")); render(true); }; },
  // navigazione
  moreMenu: () => moreMenu(), quickAdd: () => quickAdd(), menuGo: (el, e) => { e.preventDefault(); closeSheet(); resetSub(); go(el.dataset.v); },
  closeSheet: () => closeSheet(), closeSheetBtn: () => closeSheet(), print: () => window.print(),
  // giocatori
  newPlayer: () => { closeSheet(); go("giocatori", { pdraft: newPlayerDraft(), playerId: null, edraft: null }); },
  editPlayer: el => go("giocatori", { pdraft: { ...clone(P(el.dataset.id)), _id: el.dataset.id }, playerId: el.dataset.id, edraft: null }),
  cancelPlayer: () => { ui.pdraft = null; render(); window.scrollTo(0, 0); },
  savePlayer: () => { syncPlayer(); const d = ui.pdraft; if (!d.first && !d.last) { toast(t("Scrivi almeno nome o cognome")); return; } const { _id, ...o } = d; const nid = _id || uid(); put("players", nid, { ...o, updatedAt: Date.now() }); ui.pdraft = null; ui.playerId = nid; toast(t("Giocatore salvato")); render(); window.scrollTo(0, 0); },
  delPlayer: () => confirmSheet(t("Eliminare definitivamente il giocatore con valutazioni e file? Se vuoi solo toglierlo di mezzo, usa Archivia."), async () => { const pid = ui.pdraft._id; for (const [eid, ev] of [...S.evals]) if (ev.playerId === pid) del("evals", eid); for (const [mid, m] of [...S.media]) if (m.ownerId === pid) { if (m.blobId) await Store.delBlob(m.blobId); del("media", mid); } del("players", pid); ui.pdraft = null; ui.playerId = null; }),
  pickPhoto: async () => { syncPlayer(); const [f] = await pickFile("image/*"); if (!f) return; try { ui.pdraft.photo = await photoToDataURL(f); render(true); } catch (e) { toast(t("Immagine non leggibile")); } },
  rmPhoto: () => { syncPlayer(); delete ui.pdraft.photo; render(true); },
  newTagInline: () => { syncPlayer(); promptSheet(t("Nuovo tag"), t("Nome del tag"), "", v => { const c = Cfg.get(); const id = uid(); c.tags.push({ id, name: v.trim(), color: "#2F6690" }); Cfg.save(c); ui.pdraft.tags = [...(ui.pdraft.tags || []), id]; render(true); }); },
  openPlayer: el => { closeSheet(); resetSub(); go("giocatori", { playerId: el.dataset.id, ptab: "profilo", evalSel: null }); },
  backList: () => { ui.playerId = null; render(); window.scrollTo(0, 0); },
  ptab: el => { ui.ptab = el.dataset.t; render(true); },
  toggleFilters: () => { ui.pf.open = !ui.pf.open; render(true); },
  clearFilters: () => { ui.pf = { ...ui.pf, role: "", verdict: "", level: "", tag: "", list: "", foot: "", nat: "", ageMin: "", ageMax: "", rMin: "", contract: "", q: "" }; render(true); },
  saveSmart: () => promptSheet(t("Salva come lista intelligente"), t("Nome della lista"), "", v => { const { open, showArch, sort, ...f } = ui.pf; const id = uid(); put("lists", id, { name: v.trim(), smart: f, parentId: null, color: "#2F6690", created: today() }); ui.listId = id; go("liste"); }),
  pickLists: el => { const p = P(el.dataset.id); const ls = [...S.lists.entries()].filter(([, l]) => !l.smart && !l.archived); sheet(`<h2>${t("Liste di {n}", { n: esc(pname(p)) })}</h2><div class="list">${ls.map(([lid]) => `<label class="item"><input type="checkbox" value="${lid}" ${(p.listIds || []).includes(lid) ? "checked" : ""}><span class="grow">${esc(listPath(lid).map(x => x[1].name).join(" › "))}</span></label>`).join("") || `<div class="empty">${t("Nessuna lista.")}</div>`}</div><div class="row between"><button class="btn" data-a="newList" data-parent="">+ ${t("Nuova lista")}</button><button class="btn pri" id="plOk">${t("Salva")}</button></div>`); $("#plOk").onclick = () => { put("players", el.dataset.id, { ...p, listIds: $$(".sheet input:checked").map(x => x.value) }); closeSheet(); render(true); }; },
  addSub: el => subForm(el.dataset.k), editSub: el => subForm(el.dataset.k, el.dataset.sid),
  toggleArchive: el => { const c = el.dataset.coll, id = el.dataset.id; const o = S[c].get(id); put(c, id, { ...o, archived: !o.archived }); toast(o.archived ? t("Ripristinato") : t("Archiviato")); if (c === "lists" && !o.archived) ui.listId = null; render(true); },
  purge: el => confirmSheet(t("Eliminare definitivamente? Non si può annullare."), async () => { const c = el.dataset.coll, id = el.dataset.id; if (c === "players") { for (const [eid, ev] of [...S.evals]) if (ev.playerId === id) del("evals", eid); } for (const [mid, m] of [...S.media]) if (m.ownerId === id) { if (m.blobId) await Store.delBlob(m.blobId); del("media", mid); } del(c, id); }),
  archTab: el => { ui.archTab = el.dataset.t; render(true); },
  exportCsv: () => exportPlayersCsv(), exportEvalCsv: () => exportEvalsCsv(),
  // valutazioni
  newEval: el => { closeSheet(); go("giocatori", { edraft: newEvalDraft(el.dataset.id), playerId: el.dataset.id, pdraft: null, openAreas: null }); },
  pickEvalPlayer: () => { closeSheet(); playerPicker(t("Per quale giocatore?"), [], ids => { if (ids[0]) go("giocatori", { edraft: newEvalDraft(ids[0]), playerId: ids[0], pdraft: null, openAreas: null }); }); },
  evalFromMatch: el => { const mid = ui.matchId; go("giocatori", { edraft: newEvalDraft(el.dataset.id, mid), playerId: el.dataset.id, matchId: null, openAreas: null }); importLive(false); render(); },
  editEval: el => { const e = S.evals.get(el.dataset.id); go("giocatori", { edraft: { ...clone(e), _id: el.dataset.id }, playerId: e.playerId, openAreas: null }); },
  evalSel: el => { ui.evalSel = el.dataset.id; render(true); },
  evalSelOpen: el => { ui.ptab = "caratteristiche"; ui.evalSel = el.dataset.id; render(true); },
  openEvalPlayer: el => { const e = S.evals.get(el.dataset.id); closeSheet(); resetSub(); go("giocatori", { playerId: e.playerId, ptab: "caratteristiche", evalSel: el.dataset.id }); },
  cancelEval: () => { ui.edraft = null; render(); window.scrollTo(0, 0); },
  clrParam: el => { const d = ui.edraft, ak = el.dataset.ak, at = el.dataset.at; if (d.r[ak] && d.r[ak][at] != null) { delete d.r[ak][at]; el.closest(".slrow").classList.add("unset"); el.textContent = "–"; updAvg(ak); } },
  clearPos: () => { syncEval(); ui.edraft.positions = []; render(true); },
  addEv: () => { syncEval(); ui.edraft.evidence.push({ area: visAreas(P(ui.edraft.playerId))[0].id, min: "", text: "" }); render(true); },
  rmEv: el => { syncEval(); ui.edraft.evidence.splice(+el.dataset.i, 1); render(true); },
  importEv: () => { syncEval(); importLive(true); render(true); },
  saveEval: () => { syncEval(); const { _id, ...o } = ui.edraft; o.evidence = (o.evidence || []).filter(x => x.text.trim()); for (const ak in o.r) if (!Object.keys(o.r[ak]).length) delete o.r[ak]; const eid = _id || uid(); put("evals", eid, { ...o, updatedAt: Date.now() }); const back = ui.view; ui.edraft = null; ui.view = "giocatori"; ui.ptab = "caratteristiche"; ui.evalSel = eid; ui.playerId = o.playerId; history.replaceState(null, "", "#giocatori"); toast(t("Valutazione salvata")); render(); window.scrollTo(0, 0); },
  delEval: () => confirmSheet(t("Eliminare questa valutazione?"), async () => { const id = ui.edraft._id; for (const [mid, m] of [...S.media]) if (m.ownerId === id) { if (m.blobId) await Store.delBlob(m.blobId); del("media", mid); } del("evals", id); ui.edraft = null; }),
  copyEval: () => { syncEval(); const txt = evalText(ui.edraft); navigator.clipboard.writeText(txt).then(() => toast(t("Report copiato"))).catch(() => { sheet(`<h2>${t("Testo del report")}</h2><textarea id="cp" style="min-height:300px">${esc(txt)}</textarea><button class="btn" data-a="closeSheetBtn">${t("Chiudi")}</button>`); $("#cp").select(); }); },
  // partite
  newMatch: () => { closeSheet(); matchForm(); }, editMatch: el => matchForm(el.dataset.id),
  delMatch: el => confirmSheet(t("Eliminare la partita e il suo registro live?"), async () => { const id = el.dataset.id; for (const [mid, m] of [...S.media]) if (m.ownerId === id) { if (m.blobId) await Store.delBlob(m.blobId); del("media", mid); } del("matches", id); ui.matchId = null; }),
  openMatch: el => { closeSheet(); resetSub(); go("partite", { matchId: el.dataset.id, mtab: "live", liveP: null, liveCat: null, timer: null }); },
  closeMatch: () => { ui.matchId = null; render(); },
  mtab: el => { ui.mtab = el.dataset.t; render(true); },
  markSeen: el => { const m = S.matches.get(el.dataset.id); put("matches", el.dataset.id, { ...m, status: "vista" }); toast(t("Partita segnata come vista")); render(true); },
  saveMatchInfo: el => { const m = S.matches.get(el.dataset.id); const v = s => $(s).value; put("matches", el.dataset.id, { ...m, score: v("#mi_score"), sysHome: v("#mi_sysHome"), sysAway: v("#mi_sysAway"), conditions: v("#mi_cond"), homeNotes: v("#mi_homeNotes"), awayNotes: v("#mi_awayNotes"), notes: v("#mi_notes") }); toast(t("Note salvate")); render(true); },
  quickPlayer: el => quickPlayer(el.dataset.id),
  tToggle: () => { const tm = ui.timer; tSet(ui.matchId, tm.run ? { ...tm, run: false, base: tSec(tm) } : { ...tm, run: true, start: Date.now() }); render(true); },
  tHalf: () => { const tm = ui.timer; tSet(ui.matchId, tm.half === 1 ? { run: false, start: 0, base: 45 * 60, half: 2 } : { run: false, start: 0, base: 0, half: 1 }); render(true); },
  liveP: el => { ui.liveP = el.dataset.id; $$('[data-a="liveP"]').forEach(b => b.setAttribute("aria-pressed", b.dataset.id === ui.liveP)); },
  liveC: el => { ui.liveCat = el.dataset.c; $$('[data-a="liveC"]').forEach(b => b.setAttribute("aria-pressed", b.dataset.c === ui.liveCat)); },
  liveO: el => { if (!ui.liveP) { toast(t("Scegli prima il giocatore")); return; } if (!ui.liveCat) { toast(t("Scegli il tipo di azione")); return; } const m = S.matches.get(ui.matchId); const mm = +($("#manMin").value || 0); const ev = { id: uid(), t: mm || minuteOf(ui.timer), h: ui.timer.half, p: ui.liveP, c: ui.liveCat, o: el.dataset.o, n: $("#liveNote").value.trim() }; put("matches", ui.matchId, { ...m, events: [...(m.events || []), ev] }); $("#liveNote").value = ""; $("#manMin").value = ""; renderLiveLog(); toast(`${ev.t}' · ${liveCatL(ev.c)} ${ev.o === "+" ? t("positiva") : ev.o === "-" ? t("negativa") : t("neutra")}`); },
  undo: () => { const m = S.matches.get(ui.matchId); if (!(m.events || []).length) return; put("matches", ui.matchId, { ...m, events: m.events.slice(0, -1) }); renderLiveLog(); toast(t("Ultima azione annullata")); },
  // liste
  openList: el => { closeSheet(); resetSub(); ui.listId = el.dataset.id || null; go("liste"); },
  newList: el => listForm(null, el.dataset.parent || null), editList: el => listForm(el.dataset.id),
  delList: el => confirmSheet(t("Eliminare la lista? I giocatori restano nel database; le sottoliste salgono di un livello."), () => { const id = el.dataset.id; const l = S.lists.get(id); for (const [cid, c] of [...S.lists]) if (c.parentId === id) put("lists", cid, { ...c, parentId: l.parentId || null }); for (const [pid, p] of [...S.players]) if ((p.listIds || []).includes(id)) put("players", pid, { ...p, listIds: p.listIds.filter(x => x !== id) }); del("lists", id); ui.listId = l.parentId || null; closeSheet(); }),
  addToList: el => { const lid = el.dataset.id; const cur = [...S.players.entries()].filter(([, p]) => (p.listIds || []).includes(lid)).map(x => x[0]); playerPicker(t("Aggiungi alla lista"), cur, ids => { for (const [pid, p] of S.players) { const has = (p.listIds || []).includes(lid), want = ids.includes(pid); if (has !== want) put("players", pid, { ...p, listIds: want ? [...(p.listIds || []), lid] : p.listIds.filter(x => x !== lid) }); } render(true); }); },
  rmFromList: (el, e) => { e.stopPropagation(); const p = P(el.dataset.id); put("players", el.dataset.id, { ...p, listIds: (p.listIds || []).filter(x => x !== el.dataset.list) }); render(true); },
  // confronto e squadre
  cmp: el => { const id = el.dataset.id; const i = ui.cmp.indexOf(id); if (i >= 0) ui.cmp.splice(i, 1); else { if (ui.cmp.length >= 4) ui.cmp.shift(); ui.cmp.push(id); } put("settings", "compare", { ids: [...ui.cmp] }); render(true); },
  newLineup: () => promptSheet(t("Nuova squadra ombra"), t("Nome della squadra"), t("Squadra ombra {n}", { n: S.lineups.size + 1 }), v => { const id = uid(); put("lineups", id, { name: v.trim(), formation: "4-3-3", slots: {}, note: "" }); ui.lineupId = id; render(); }),
  selLineup: el => { ui.lineupId = el.dataset.id; render(true); },
  slot: el => slotPicker(+el.dataset.i),
  saveLineup: () => { const lu = S.lineups.get(ui.lineupId); put("lineups", ui.lineupId, { ...lu, name: $("#luName").value.trim() || lu.name, note: $("#luNote").value }); toast(t("Salvato")); render(true); },
  delLineup: () => confirmSheet(t("Eliminare questa squadra ombra?"), () => { del("lineups", ui.lineupId); ui.lineupId = null; }),
  actRange: el => { ui.actRange = +el.dataset.v; render(true); },
  // multimedia
  addMedia: async el => { const files = await pickFile("image/*,video/*,audio/*,application/pdf", true); if (files.length) addMediaFiles(el.dataset.owner, el.dataset.id, files); },
  addLink: el => { sheet(`<h2>${t("Aggiungi link")}</h2><form id="lkf" class="col"><label class="f">${t("Indirizzo (URL)")}<input type="url" id="lkU" required placeholder="https://"></label><label class="f">${t("Titolo")}<input type="text" id="lkT"></label><div class="row end"><button type="button" class="btn" data-a="closeSheetBtn">${t("Annulla")}</button><button class="btn pri">${t("Aggiungi")}</button></div></form>`); $("#lkf").onsubmit = e => { e.preventDefault(); put("media", uid(), { owner: el.dataset.owner, ownerId: el.dataset.id, kind: "link", name: $("#lkT").value.trim() || $("#lkU").value, url: $("#lkU").value.trim(), note: "", date: today() }); closeSheet(); render(true); }; },
  openMedia: el => openMedia(el.dataset.id),
  saveMedia: el => { const m = S.media.get(el.dataset.id); put("media", el.dataset.id, { ...m, name: $("#mdName").value, date: $("#mdDate").value, note: $("#mdNote").value }); closeSheet(); render(true); },
  delMedia: el => confirmSheet(t("Eliminare questo contenuto?"), async () => { const m = S.media.get(el.dataset.id); if (m.blobId) await Store.delBlob(m.blobId); del("media", el.dataset.id); }),
  dlMedia: async el => { const m = S.media.get(el.dataset.id); const b = await Store.blobBytes(m.blobId); if (b) download(m.name || "file", new Blob([b.bytes], { type: b.mime })); },
  // condivisione e portfolio
  shareItem: el => shareSheet(el.dataset.kind, el.dataset.id),
  saveProfile: () => { const v = s => $(s).value; put("settings", "profile", { ...Profile.get(), name: v("#prName").trim(), title: v("#prTitle"), city: v("#prCity"), email: v("#prEmail"), phone: v("#prPhone"), languages: v("#prLang"), initials: v("#prInit").trim(), bio: v("#prBio"), certs: v("#prCerts"), links: v("#prLinks") }); toast(t("Profilo salvato")); render(true); },
  pickProfPhoto: async () => { const [f] = await pickFile("image/*"); if (!f) return; put("settings", "profile", { ...Profile.get(), photo: await photoToDataURL(f, 300) }); render(true); },
  pfPreview: async () => { const d = buildPortfolio(); if (d.sign) d.html = await Sign.signDoc(d.html); sheet(`<div class="row between"><h2>${t("Anteprima")}</h2><button class="btn sm" data-a="closeSheetBtn">✕</button></div><iframe sandbox="" style="width:100%;height:70vh;border:1px solid var(--line);border-radius:8px;background:#fff" title="${t("Anteprima")}" id="pfFrame"></iframe>`, true); $("#pfFrame").srcdoc = d.html; },
  pfDownload: async () => { const d = buildPortfolio(); if (d.sign) d.html = await Sign.signDoc(d.html); download(`portfolio-${today()}.html`, d.html, "text/html"); toast(t("Aprilo e usa Stampa › Salva come PDF per averlo in PDF")); },
  pfProtect: async () => { const d = buildPortfolio(); if (d.sign) d.html = await Sign.signDoc(d.html); const code = newShareCode(); sheet(`<h2>${t("Portfolio protetto")}</h2><label class="f">${t("Codice di accesso")}<input type="text" id="shCode" class="mono" value="${code}"></label><div class="row"><button class="btn sm" data-a="copyText" data-target="shCode">${t("Copia codice")}</button><button class="btn pri" id="pfGo">${t("Crea file protetto")}</button></div>`); $("#pfGo").onclick = async () => { const payload = await encryptShare(d, $("#shCode").value, {}); const html = viewerFile(payload, Prefs.lang); const f = new File([html], `portfolio-${t("protetto")}.html`, { type: "text/html" }); try { if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: d.title }); return; } } catch (e) { if (e.name === "AbortError") return; } download(f.name, f); }; },
  // impostazioni
  setTab: el => { ui.setTab = el.dataset.t; if (el.dataset.t !== "personalizza") cfgDraft = null; render(true); },
  saveAppName: () => { Prefs.set("appName", $("#appNameIn").value.trim()); document.title = appName(); toast(t("Salvato")); render(true); },
  savePubUrl: () => { let v = $("#pubUrl").value.trim(); if (v && !/^https:\/\//.test(v)) { toast(t("L'indirizzo deve iniziare con https://")); return; } App.setDevice({ publicUrl: v }); toast(t("Salvato")); },
  loadEx: () => { closeSheet(); Examples.load(); }, clearEx: () => confirmSheet(t("Eliminare tutti i dati di esempio? I tuoi dati restano."), () => Examples.clear()),
  backupNow: () => { if (Backup.dirHandle && App.cfgDevice().autoFolder && !Backup.needPerm) Backup.toFolder(true).then(() => render(true)); else Backup.shareFile(true); },
  backupShare: () => Backup.shareFile($("#bkMedia").checked), backupDownload: () => Backup.exportFile($("#bkMedia").checked),
  backupImport: async () => { const [f] = await pickFile(".tsbackup,.json,application/json"); if (f) Backup.importFile(f); },
  chooseFolder: () => Backup.chooseFolder(), folderNow: () => Backup.toFolder(true).then(() => render(true)), folderOff: () => { App.setDevice({ autoFolder: false }); render(true); },
  regrantFolder: () => Backup.regrant(),
  restoreSnap: el => confirmSheet(t("Ripristinare questa copia? I dati attuali vengono sostituiti (prima ne salvo una copia)."), () => Backup.restoreSnapshot(el.dataset.k)),
  wipe: () => confirmSheet(t("Cancellare TUTTI i dati di questo dispositivo, password compresa? Fai prima un backup."), async () => { App.unlocked = false; Store.lock(); await Lock.wipeAll(); }),
  optMove: el => { rememberCfgArea(el); const arr = getPath(cfgDraft, el.dataset.path); const i = +el.dataset.i, j = i + (+el.dataset.d); if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; render(true); },
  optDel: el => { rememberCfgArea(el); const arr = getPath(cfgDraft, el.dataset.path); arr.splice(+el.dataset.i, 1); render(true); },
  optHide: el => { rememberCfgArea(el); const o = getPath(cfgDraft, el.dataset.path); o.hidden = !o.hidden; render(true); },
  optAdd: el => { rememberCfgArea(el); const path = el.dataset.path; const arr = getPath(cfgDraft, path); const id = uid(); if (path === "tags") arr.push({ id, name: t("Nuovo tag"), color: "#1E6A47" }); else if (path === "areas") arr.push({ id, it: "Nuova area", en: "New area", gk: false, hidden: false, params: [] }); else if (path === "roles") arr.push({ id, it: "Nuovo ruolo", en: "New role", x: 50, y: 50 }); else if (path === "levels") arr.push({ id: String.fromCharCode(65 + arr.length), it: "Nuovo livello", en: "New level" }); else if (path === "verdicts") arr.push({ id, it: "Nuovo giudizio", en: "New verdict", color: "grey" }); else if (path === "preQuestions") arr.push({ id, it: "Nuova domanda?", en: "New question?", group: "giocatore" }); else if (path === "archetypes") arr.push({ id, it: "Nuova interpretazione", en: "New interpretation", group: "mid" }); else if (path === "liveCats") arr.push({ id, it: "Nuova azione", en: "New action", area: "tec", group: "possesso", params: [] }); else arr.push({ id, it: "Nuovo", en: "New" }); render(true); },
  tplAll: el => { const r = ui.roleTpl || cfgDraft.roles[0].id; const a = cfgDraft.areas.find(x => x.id === el.dataset.area); const set = new Set(cfgDraft.roleHide[r] || []); for (const x of a.params) { const k = a.id + "|" + x.id; if (el.dataset.v === "1") set.delete(k); else set.add(k); } cfgDraft.roleHide[r] = [...set]; render(true); },
  cfgSave: () => { Cfg.save(clone(cfgDraft)); toast(t("Opzioni salvate")); render(true); },
  cfgReset: () => confirmSheet(t("Ripristinare tutte le opzioni predefinite? I dati inseriti non vengono toccati, ma tag, liste di opzioni e parametri aggiunti da te spariscono dalle opzioni."), () => { const keepTags = Cfg.get().tags; cfgDraft = defaultConfig(); cfgDraft.tags = keepTags; Cfg.save(clone(cfgDraft)); })
};
document.addEventListener("click", e => { const el = e.target.closest("[data-a]"); if (!el) return; const a = el.dataset.a; if (a === "closeSheet" && e.target !== el) return; const fn = A[a]; if (fn) { if (el.tagName === "A" && a !== "menuGo") { } fn(el, e); } });

/* =========================================================
   AVVIO
   ========================================================= */
(async () => {
  applyTheme(); document.documentElement.lang = Prefs.lang;
  if (window.matchMedia) matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", applyTheme);
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) navigator.serviceWorker.register("sw.js").catch(() => { });
  const h = location.hash; if (h.startsWith("#s=")) { if (await LinkViewer.show(h.slice(3))) return; }
  if (!window.crypto || !crypto.subtle || !window.indexedDB) { document.body.innerHTML = `<div class="lock"><div class="lockbox"><h2>${t("Browser non supportato")}</h2><p>${t("Serve una versione recente di Safari, Chrome, Brave, Firefox o Edge. Se hai aperto il file direttamente, prova a pubblicarlo su GitHub Pages.")}</p></div></div>`; return; }
  try { await Accounts.init(); } catch (e) { document.body.innerHTML = `<div class="lock"><div class="lockbox"><h2>${t("Archivio non disponibile")}</h2><p>${t("Il browser non permette di salvare dati (finestra privata?). Apri l'app in una finestra normale.")}</p></div></div>`; return; }
  { const v = location.hash.slice(1); if (views().some(x => x[0] === v)) ui.view = v; else if (v.startsWith("match-")) { ui.view = "partite"; ui.matchId = v.slice(6); ui.mtab = "prima"; } else if (v.startsWith("player-")) { ui.view = "giocatori"; ui.playerId = v.slice(7); } }
  Lock.show();
})();

/* MM Scout 5.11 — profilo giovanile: dati e caratteristiche per i talenti delle giovanili.
   © Miodrag Milosevic. Vietato divulgare, copiare o modificare senza consenso dell'autore. */
"use strict";

/* ---------- 1. area di valutazione «Sviluppo (giovani)» ---------- */
const YOUTH_MAX_AGE = 20;
const SVI = { id: "svi", it: "Sviluppo (giovani)", en: "Development (youth)", gk: false, hidden: false, params: [
  ["Coordinazione e motricità", "Coordination and motor skills"], ["Capacità di apprendimento", "Learning ability (coachability)"],
  ["Margini di miglioramento", "Room for improvement"], ["Maturità rispetto all'età", "Maturity for his age"],
  ["Rendimento contro i più grandi", "Performance against older players"], ["Passione e voglia di migliorare", "Passion and drive to improve"],
  ["Reazione alle difficoltà", "Response to setbacks"]].map(([it, en]) => ({ id: it, it, en, hidden: false })) };
Migrate.config = (orig => function () { orig.apply(this, arguments); try { const c = S.settings.get("config"); if (!c || (c.yv || 0) >= 1) return; c.areas = c.areas || []; if (!c.areas.some(a => a.id === "svi")) c.areas.push(clone(SVI)); c.areaWeights = c.areaWeights || {}; if (c.areaWeights.svi == null) c.areaWeights.svi = 10; c.yv = 1; put("settings", "config", c); } catch (e) { } })(Migrate.config);
const isYouth = p => { if (!p) return false; const a = age(p); if (a != null) return a <= YOUTH_MAX_AGE; return !!(p.youth && p.youth.cat); };
window.isYouth = isYouth;
// l'area «Sviluppo» compare solo per i giovani (fino a 20 anni)
window.visAreas = (orig => function (p) { const list = orig.apply(this, arguments); return isYouth(p) ? list : list.filter(a => a.id !== "svi"); })(window.visAreas);
visAreas = window.visAreas;
// nella valutazione per ruolo i parametri dello sviluppo sono sempre «chiave»
try { for (const g in RK) RK[g].svi = "*"; if (keysFor.c) keysFor.c = {}; } catch (e) { }

/* ---------- 2. scheda del giocatore: «Profilo giovanile» ---------- */
const PHV = [["pre", "Prima del picco di crescita", "Before the growth spurt"], ["in", "Durante il picco di crescita", "During the growth spurt"], ["post", "Dopo il picco di crescita", "After the growth spurt"], ["nd", "Non lo so ancora", "Not known yet"]];
const YUP = [["", "No", "No"], ["1", "Sì, un anno sotto età", "Yes, one year up"], ["2", "Sì, due o più anni sotto età", "Yes, two or more years up"]];
const yOpt = (arr, v) => arr.map(([id, it, en]) => `<option value="${id}" ${v === id ? "selected" : ""}>${esc(L({ it, en }))}</option>`).join("");
function youthPanel(d) {
  const y = d.youth || {}; const cfg = Cfg.get(); const a = age(d); const yr = d.birth ? String(d.birth).slice(0, 4) : d.birthYear; const sem = semester(d);
  const open = isYouth(d) || !!(d.youth && Object.keys(d.youth).length) || a == null;
  return `<details class="panel ypanel" id="youthPanel" ${open ? "open" : ""}><summary><h2>🌱 ${t("Profilo giovanile")}</h2><span class="m">${t("per i giocatori fino a {n} anni", { n: YOUTH_MAX_AGE })}</span></summary>
   <p class="sub small">${t("Nei giovani conta il potenziale più del rendimento di oggi: annata, crescita fisica e come impara contano quanto la tecnica.")}</p>
   <div class="yinfo">${yr ? `<span class="pill">${t("Annata {y}", { y: esc(yr) })}</span>` : ""}${sem ? `<span class="pill" title="${t("Effetto età relativa: chi è nato nei primi mesi dell'anno spesso è più sviluppato dei compagni della stessa annata.")}">${t("{n}° semestre", { n: sem })}</span>` : ""}${a != null ? `<span class="pill">${t("{n} anni", { n: a })}</span>` : ""}</div>
   <div class="fgrid" style="margin-top:10px">
    <label class="f">${t("Categoria in cui gioca")}<select id="yCat"><option value="">—</option>${cfg.teamCats.map(c => `<option value="${esc(c.id)}" ${y.cat === c.id ? "selected" : ""}>${esc(L(c))}</option>`).join("")}</select></label>
    <label class="f">${t("Gioca sotto età?")}<select id="yUp">${yOpt(YUP, y.up || "")}</select></label>
    <label class="f">${t("Fase di crescita")}<select id="yPhv"><option value="">—</option>${yOpt(PHV, y.phv || "")}</select></label>
    <label class="f">${t("Settore giovanile / club formatore")}<input type="text" id="yAcad" maxlength="80" data-vrule="team" value="${esc(y.academy || "")}" placeholder="${t("es. FC Esempio")}"></label>
    <label class="f">${t("Stagioni nel settore giovanile")}<input type="number" id="yYears" value="${esc(y.years || "")}"></label>
    <label class="f full">${t("Note sullo sviluppo")}<textarea id="yDev" maxlength="2000" placeholder="${t("es. cresciuto molto in un anno, deve ancora adattarsi al nuovo corpo; impara in fretta le correzioni")}">${esc(y.dev || "")}</textarea></label></div>
   ${a != null && a < 18 ? `<div class="banner info small" style="margin-top:10px">🛡 ${t("Giocatore minorenne: i contatti passano sempre dal club o dai genitori. Non salvare dati su scuola, salute o famiglia.")}</div>` : ""}
  </details>`;
}
window.playerEditor = (orig => function () { let h = orig.apply(this, arguments); const d = ui.pdraft; if (!d || h.includes('id="youthPanel"')) return h;
  const mark = `<section class="panel"><h2>${t("Giudizio, tag e liste")}</h2>`; const i = h.indexOf(mark); return i < 0 ? h : h.slice(0, i) + youthPanel(d) + h.slice(i); })(window.playerEditor);
playerEditor = window.playerEditor;
window.syncPlayer = (orig => function () { const r = orig.apply(this, arguments); const d = ui.pdraft; if (!d || !$("#yCat")) return r;
  const v = s => ($(s) ? $(s).value.trim() : ""); const y = { cat: v("#yCat"), up: v("#yUp"), phv: v("#yPhv"), academy: v("#yAcad"), years: v("#yYears"), dev: $("#yDev") ? $("#yDev").value.trim() : "" };
  for (const k of Object.keys(y)) if (!y[k]) delete y[k]; if (Object.keys(y).length) d.youth = y; else delete d.youth; return r; })(window.syncPlayer);
syncPlayer = window.syncPlayer;
if (typeof VRANGE !== "undefined") VRANGE.yYears = [0, 20];
if (typeof FIELD_L !== "undefined") FIELD_L.youth = "profilo giovanile";

// nella scheda del giocatore: riquadro «Profilo giovanile»
function youthView(p) {
  const y = p.youth || {}; const yr = p.birth ? String(p.birth).slice(0, 4) : p.birthYear; const sem = semester(p); const a = age(p);
  const cat = y.cat ? (Cfg.get().teamCats.find(c => c.id === y.cat) || { it: y.cat, en: y.cat }) : null; const lv = p.potential ? Cfg.level(p.potential) : null; const mat = p.maturity ? Cfg.get().maturity.find(m => m.id === p.maturity) : null;
  const ph = PHV.find(x => x[0] === y.phv), up = YUP.find(x => x[0] === y.up && y.up);
  const cell = (k, v) => v ? `<div><div class="m">${k}</div><b>${v}</b></div>` : "";
  const cells = [cell(t("Annata"), yr ? esc(yr) + (sem ? " · " + t("{n}° semestre", { n: sem }) : "") : ""), cell(t("Categoria"), cat ? esc(L(cat)) : ""), cell(t("Sotto età"), up ? esc(L({ it: up[1], en: up[2] })) : ""), cell(t("Fase di crescita"), ph ? esc(L({ it: ph[1], en: ph[2] })) : ""), cell(t("Maturazione biologica"), mat ? esc(L(mat)) : ""), cell(t("Livello potenziale"), lv ? esc(p.potential + " · " + L(lv)) : ""), cell(t("Settore giovanile"), esc(y.academy || "")), cell(t("Stagioni nel settore giovanile"), esc(y.years || ""))].join("");
  return `<section class="panel yview"><h2>🌱 ${t("Profilo giovanile")}</h2>${cells ? `<div class="ygrid">${cells}</div>` : `<p class="m">${t("Ancora nessun dato sullo sviluppo: aggiungili con «Modifica».")}</p>`}${y.dev ? `<p style="margin-top:8px">${esc(y.dev)}</p>` : ""}${a != null && a < 18 ? `<p class="m" style="margin-top:8px">🛡 ${t("Minorenne: contatti solo tramite club o genitori.")}</p>` : ""}</section>`;
}
window.render = (orig => function () { const r = orig.apply(this, arguments); try { if (ui.view === "giocatori" && ui.playerId && !ui.pdraft && !ui.edraft && (ui.ptab || "profilo") === "profilo") { const p = P(ui.playerId); const box = $("#view .cpitch"); if (p && isYouth(p) && box && !$("#view .yview")) { const sec = box.closest("section") || box; sec.insertAdjacentHTML("afterend", youthView(p)); } } } catch (e) { } return r; })(window.render);
render = window.render;

/* ---------- 3. elenco giocatori: filtro «Solo giovani» ---------- */
window.filterPlayers = (orig => function (f) { const list = orig.apply(this, arguments); return f && f.youth ? list.filter(x => isYouth(Array.isArray(x) ? x[1] : x)) : list; })(window.filterPlayers);
filterPlayers = window.filterPlayers;
A.pfYouth = () => { ui.pf.youth = !ui.pf.youth; render(true); };
window.render = (orig => function () { const r = orig.apply(this, arguments); try { if (ui.view === "giocatori" && !ui.playerId && !ui.pdraft) { const g = $('#view [data-a="pGroup"]'); const bar = g && g.parentElement; if (bar && !$("#pfYouthB")) bar.insertAdjacentHTML("afterend", `<button type="button" class="btn ytog" id="pfYouthB" data-a="pfYouth" aria-pressed="${!!ui.pf.youth}" title="${t("Mostra solo i giocatori fino a {n} anni", { n: YOUTH_MAX_AGE })}">🌱 ${t("Giovani")}</button>`); } } catch (e) { } return r; })(window.render);
render = window.render;

/* ---------- 4. esempi: i giovani hanno già il profilo giovanile ---------- */
const YDEV = ["Cresciuto molto nell'ultimo anno: deve ancora adattarsi al nuovo corpo, ma la tecnica resta pulita.", "Impara in fretta: le correzioni dell'allenatore si vedono già nella partita successiva.", "Gioca con i più grandi e regge il confronto fisico; a volte cala nel secondo tempo.", "Molto tecnico ma ancora leggero: va seguito nel tempo, il margine è alto.", "Leader del gruppo già ora: parla con i compagni e non si abbatte dopo un errore."];
const catFor = a => a <= 14 ? "U14" : a <= 15 ? "U15" : a <= 16 ? "U16" : a <= 17 ? "U17" : a <= 18 ? "U18" : a <= 19 ? "Primavera / U19" : "U21/U23";
function exYouth() { const prev = Undo.busy; Undo.busy = true; let i = 0; try { for (const [id, p] of [...S.players]) { if (!p.example || !isYouth(p) || p.youth) continue; const a = age(p); const y = { cat: catFor(a), phv: a <= 15 ? "in" : "post", up: i % 3 === 0 ? "1" : "", academy: p.club || "", years: String(Math.max(1, Math.min(8, a - 9))), dev: t(YDEV[i % YDEV.length]) }; for (const k of Object.keys(y)) if (!y[k]) delete y[k]; put("players", id, { ...p, youth: y, maturity: p.maturity || (a <= 15 ? "Precoce" : "Ordinario") }); i++; } } finally { Undo.busy = prev; } }
Examples.load = (orig => function () { const r = orig.apply(this, arguments); try { Activity.quiet = true; exYouth(); } catch (e) { } finally { Activity.quiet = false; } try { Undo.clear(); } catch (e) { } return r; })(Examples.load);
Lock.enter = (orig => async function () { const r = await orig.apply(this, arguments); try { if ([...S.players.values()].some(p => p.example && isYouth(p) && !p.youth)) { Activity.quiet = true; exYouth(); Activity.quiet = false; Undo.clear(); } } catch (e) { } return r; })(Lock.enter);

/* MM Scout 0.9 (beta) — accesso su due colonne, barra laterale ridimensionabile, logo moderno,
   icone vere per gli impegni, schede allineate, esportazione CSV dei Dati.
   © Miodrag Milosevic. Vietato divulgare, copiare o modificare senza consenso dell'autore. */
"use strict";

/* ---------- 1. schermata di accesso: intestazione, modulo a sinistra, demo e avvisi a destra ---------- */
function lockLayout() {
  const box = $("#lockRoot .lockbox"); if (!box) return;
  for (const br of box.querySelectorAll(".lhead .brand br")) br.replaceWith(" ");
  let main = box.querySelector(":scope > .lmain"), side = box.querySelector(":scope > .laside");
  const stray = [...box.children].filter(c => !c.classList.contains("lhead") && c !== main && c !== side);
  if (!stray.length) return;
  const act = document.activeElement; let pos = null; try { if (act && act.selectionStart != null) pos = [act.selectionStart, act.selectionEnd]; } catch (e) { pos = null; }
  if (!main) { main = document.createElement("div"); main.className = "lmain"; box.appendChild(main); }
  if (!side) { side = document.createElement("aside"); side.className = "laside"; box.appendChild(side); }
  for (const c of stray) (c.matches(".lbeta, .ldemo") ? side : main).appendChild(c);
  box.classList.add("lsplit"); side.hidden = !side.children.length;
  if (act && box.contains(act) && document.activeElement !== act) { try { act.focus({ preventScroll: true }); if (pos) act.setSelectionRange(pos[0], pos[1]); } catch (e) { } }
}
Lock.render = (orig => function () { const r = orig.apply(this, arguments); try { lockLayout(); } catch (e) { } return r; })(Lock.render);
try { lockLayout(); } catch (e) { }
let lockQ = 0;
try { const lr = $("#lockRoot"); if (lr) new MutationObserver(() => { if (lockQ) return; lockQ = requestAnimationFrame(() => { lockQ = 0; try { lockLayout(); } catch (e) { } }); }).observe(lr, { childList: true, subtree: true }); } catch (e) { }

/* ---------- 2. barra laterale: si allarga o si stringe trascinando il bordo (computer e tablet) ---------- */
const SIDE_MIN = 200, SIDE_MAX = 380;
const sideW = () => { const w = +Prefs.get("sideW", 0); return w >= SIDE_MIN && w <= SIDE_MAX ? w : 0; };
function sideApply() { const app = $("#appRoot"); if (!app) return; const w = sideW(); if (w) app.style.setProperty("--sidew", w + "px"); else app.style.removeProperty("--sidew"); app.classList.toggle("sidecustom", !!w); }
function sideHandle() {
  const side = $("#appRoot .side"); if (!side || side.querySelector(".sideresize")) return;
  const h = document.createElement("div"); h.className = "sideresize noprint"; h.tabIndex = 0; h.setAttribute("role", "separator"); h.setAttribute("aria-orientation", "vertical");
  h.setAttribute("aria-label", t("Larghezza del menu: trascina, oppure usa le frecce ← →")); h.title = t("Trascina per allargare o stringere il menu · doppio clic: larghezza normale");
  side.appendChild(h);
  const set = w => { w = Math.round(Math.max(SIDE_MIN, Math.min(SIDE_MAX, w))); Prefs.set("sideW", w); sideApply(); h.setAttribute("aria-valuenow", w); };
  h.addEventListener("pointerdown", e => { if (e.button !== 0) return; e.preventDefault(); const app = $("#appRoot"); app.classList.add("resizing"); h.setPointerCapture(e.pointerId); const x0 = e.clientX, w0 = side.getBoundingClientRect().width;
    const mv = ev => set(w0 + ev.clientX - x0); const up = () => { app.classList.remove("resizing"); h.removeEventListener("pointermove", mv); h.removeEventListener("pointerup", up); h.removeEventListener("pointercancel", up); };
    h.addEventListener("pointermove", mv); h.addEventListener("pointerup", up); h.addEventListener("pointercancel", up); });
  h.addEventListener("dblclick", () => { Prefs.set("sideW", 0); sideApply(); });
  h.addEventListener("keydown", e => { const w = side.getBoundingClientRect().width; if (e.key === "ArrowLeft") { e.preventDefault(); set(w - 16); } else if (e.key === "ArrowRight") { e.preventDefault(); set(w + 16); } else if (e.key === "Home") { Prefs.set("sideW", 0); sideApply(); } });
}
window.renderShell = (orig => function () { const r = orig.apply(this, arguments); try { sideApply(); sideHandle(); } catch (e) { } return r; })(window.renderShell);
renderShell = window.renderShell;

/* ---------- 3. logo: moderno o classico (Impostazioni › Generale) ---------- */
SET.generale = (orig => () => { const st = Prefs.get("logoStyle", "modern"); return orig() + `<section class="panel"><h2>${t("Logo")}</h2><p class="sub small">${t("Il logo nel menu, nella schermata di accesso e nei documenti. L'icona dell'app sul telefono resta quella moderna.")}</p>
   <div class="logopick" role="radiogroup" aria-label="${t("Logo")}">${[["modern", "Moderno", "img/logo.svg"], ["classic", "Classico (erba)", "img/logo.jpg"]].map(([k, n, src]) => `<button type="button" role="radio" class="logoopt" data-a="logoStyle" data-v="${k}" aria-checked="${st === k}"><img src="${src}" alt="" width="56" height="56"><span>${t(n)}</span></button>`).join("")}</div></section>`; })(SET.generale);
A.logoStyle = el => { Prefs.set("logoStyle", el.dataset.v); render(true); toast(t("Logo aggiornato")); };

/* ---------- 4. impegni: icone vere al posto delle emoji (stesso stile in tutta l'app) ---------- */
const TK_ICO = { match: ICONS.partite, video: '<path d="M8 5v14l11-7z"/>', report: ICONS.report, call: '<path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.6a1 1 0 0 1-.25 1z"/>',
  travel: '<path d="M12 2C8 2 4 2.5 4 6v9.5A3.5 3.5 0 0 0 7.5 19L6 20.5v.5h12v-.5L16.5 19a3.5 3.5 0 0 0 3.5-3.5V6c0-3.5-4-4-8-4zM7.5 17a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3.5-7H6V6h5zm2 0V6h5v4zm3.5 7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>',
  meet: ICONS.staff, study: '<path d="M12 3 1 9l11 6 9-4.9V17h2V9zM5 13.2v4L12 21l7-3.8v-4L12 17z"/>', admin: ICONS.archivio, other: ICONS.tag };
for (const k of TD_KINDS) if (TK_ICO[k[0]]) k[2] = `<svg class="tki tk-${k[0]}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${TK_ICO[k[0]]}</svg>`;

/* ---------- 5. Dati: tabella «Tutti i giocatori» esportabile in CSV (Excel, Numbers, Google Fogli) ---------- */
function tableCsv(tbl) {
  const cell = c => { const s = (c.innerText || "").replace(/\s+/g, " ").trim(); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return "﻿" + [...tbl.querySelectorAll("tr")].map(r => [...r.children].map(cell).join(";")).join("\r\n");
}
R.dati = (orig => function () { const h = orig.apply(this, arguments); return h.replace(`<h2>${t("Tutti i giocatori")}</h2>`, `<div class="row between"><h2>${t("Tutti i giocatori")}</h2><button type="button" class="btn sm" data-a="datiCsv">⇩ ${t("Esporta CSV")}</button></div>`); })(R.dati);
A.datiCsv = () => { const tbl = $("#view .dtable table"); if (!tbl) { toast(t("Nessun dato.")); return; } download(`${t("Dati")} MM Scout ${today()}.csv`, tableCsv(tbl), "text/csv;charset=utf-8"); toast(t("File CSV scaricato")); };

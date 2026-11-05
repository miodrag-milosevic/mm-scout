/* MM Scout 5.11.1 — durante la partita: «Ultime azioni» sempre sotto gli occhi, con dettagli e cancellazione della singola azione.
   © Miodrag Milosevic. Vietato divulgare, copiare o modificare senza consenso dell'autore. */
"use strict";

/* ---------- 1. ultime azioni (le 4 più recenti) ---------- */
window.renderLast = function () {
  const el = $("#llast"); if (!el) return; const m = S.matches.get(ui.matchId); const evs = (m && m.events) || [];
  if (!evs.length) { el.hidden = true; el.innerHTML = ""; return; } el.hidden = false;
  const last = evs.slice(-4).reverse();
  const row = (e, i) => { const o = evOutcome(e); const p = P(e.p); const who = p ? (p.last || pname(p)) : "—"; const det = e.z || e.pr || e.n || (e.d && Object.keys(e.d).length);
    return `<div class="lrow${i ? "" : " lnew"}"><span class="code lmin">${esc(halfL(e.h))} ${esc(e.t)}'</span><b class="lo2 ${o === "+" ? "tp" : o === "-" ? "tm" : ""}" aria-label="${o === "+" ? t("Positiva") : o === "-" ? t("Negativa") : t("Neutra")}">${o === "+" ? "✓" : o === "-" ? "✗" : "="}</b><span class="grow ltxt">${esc(liveCatL(e.c))} · ${esc(who)}${det ? ` <span class="ldet">· ${t("con dettagli")}</span>` : ""}${e.n ? ` <span class="ldet">«${esc(String(e.n).slice(0, 40))}»</span>` : ""}</span><button type="button" class="btn sm" data-a="ldet" data-e="${esc(e.id)}">${t("Dettagli")}</button><button type="button" class="btn sm ldel" data-a="ldelEv" data-e="${esc(e.id)}" aria-label="${t("Elimina questa azione")}" title="${t("Elimina questa azione")}">✕</button></div>`; };
  el.innerHTML = `<div class="lhead"><span class="m">${t("Ultime azioni")}</span><button type="button" class="lnk" data-a="mtab" data-t="registro">${t("Registro completo ({n})", { n: evs.length })} →</button></div>${last.map(row).join("")}`;
};
renderLast = window.renderLast;
A.ldelEv = el => { if (el.dataset.armed !== "1") { el.dataset.armed = "1"; el.classList.add("armed"); el.textContent = t("Elimina?"); setTimeout(() => { if (document.contains(el)) { el.dataset.armed = ""; el.classList.remove("armed"); el.textContent = "✕"; } }, 3000); return; } const id = el.dataset.e; const m = S.matches.get(ui.matchId); if (!m) return; const ev = (m.events || []).find(e => e.id === id); if (!ev) return;
  put("matches", ui.matchId, { ...m, events: m.events.filter(e => e.id !== id) }); toast(t("Azione eliminata: {c} al {m}'", { c: liveCatL(ev.c), m: ev.t })); if (window.renderLive) renderLive(); else render(true); };

/* ---------- 2. menu «Altro» (telefono e tablet): chiudi in alto e in basso ---------- */
window.moreMenu = function () {
  const items = views().filter(v => v !== "-" && !["panoramica", "giocatori", "partite", "report"].includes(v[0]));
  sheet(`<div class="mmhead"><h2>${t("Menu")}</h2><button type="button" class="iconbtn mmx" data-a="closeSheetBtn" aria-label="${t("Chiudi il menu")}" title="${t("Chiudi il menu")}">✕</button></div>
   <div class="list">${items.map(v => `<a class="item click" href="#${v[0]}" data-a="menuGo" data-v="${v[0]}" style="color:inherit;text-decoration:none"${ui.view === v[0] ? ' aria-current="page"' : ""}>${ico(v[0])}<div class="grow t">${v[1]}</div></a>`).join("")}<button class="item click" data-a="lockNow" style="border:0;background:none;width:100%;text-align:left">${ico("lock")}<div class="grow t">${t("Blocca ora")}</div></button></div>`);
  const s = $("#sheetRoot .sheet"); if (s) s.classList.add("mmsheet");
};
moreMenu = window.moreMenu;

/* ---------- 3. passaggi e schede: dopo il cambio si torna all'inizio della sezione ---------- */
const TAB_ACTS = new Set(["mtab", "ptab", "archTab", "setTab", "stTab", "searchTab", "agMode"]);
document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest("[data-a]"); if (!b) return; const a = b.dataset.a; if (!TAB_ACTS.has(a)) return;
  const fromBar = !!b.closest(".tabs, .seg, .agseg, .steps"); const sheet = !!b.closest("#sheetRoot");
  if (sheet) return;
  setTimeout(() => {
    const act = document.querySelector(`#view [data-a="${a}"][aria-pressed="true"]`) || document.querySelector(`#view [data-a="${a}"]`); if (!act) return;
    const bar = act.closest(".tabs, .seg, .agseg") || act; const r = bar.getBoundingClientRect();
    // se il passaggio è partito dal fondo (es. «Avanti: …») o la barra non si vede, la porto in alto
    if (!fromBar || r.top < 0 || r.top > innerHeight - 120) { const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches; window.scrollTo({ top: Math.max(0, scrollY + r.top - 12), behavior: reduce ? "auto" : "smooth" }); }
  }, 40);
});

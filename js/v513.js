/* MM Scout 5.10.3 — logo centrato, marchio su telefono, schermo sempre acceso durante la partita.
   © Miodrag Milosevic. Vietato divulgare, copiare o modificare senza consenso dell'autore. */
"use strict";

/* ---------- 1. logo: centrato nel menu (computer e tablet), marchio in alto su telefono ---------- */
window.renderShell = (orig => function () { orig.apply(this, arguments);
  try { const br = $("#side .brand"); if (br) { br.classList.add("brc"); br.querySelectorAll("br").forEach(x => x.replaceWith(" ")); } } catch (e) { }
  try { const m = $("#appRoot main"); if (m && !m.querySelector(".mbrand")) m.insertAdjacentHTML("afterbegin", `<button type="button" class="mbrand noprint" data-a="menuGo" data-v="panoramica" aria-label="${esc(appName())} · ${t("Panoramica")}"><img src="${logoSrc()}" alt="" width="30" height="30"><b>${esc(appName())}</b><span class="brbeta">BETA · v${APP_VERSION}</span></button>`); } catch (e) { }
})(window.renderShell);
renderShell = window.renderShell;

/* ---------- 2. durante la partita: il cronometro è già fisso in alto (barra della partita) ---------- */
const liveOn = () => ui.view === "partite" && ui.matchId && ui.mtab === "live" && !!$("#clock") && ui.timer;

/* ---------- 3. schermo sempre acceso mentre il cronometro corre ---------- */
let wLock = null, wBusy = false;
async function wakeCheck() {
  const want = !!(liveOn() && ui.timer.run && document.visibilityState === "visible");
  try {
    if (want && !wLock && !wBusy && navigator.wakeLock) { wBusy = true; wLock = await navigator.wakeLock.request("screen"); wLock.addEventListener("release", () => { wLock = null; }); }
    else if (!want && wLock) { const l = wLock; wLock = null; await l.release(); }
  } catch (e) { wLock = null; } finally { wBusy = false; }
  const b = $("#wakeHint"); if (b) b.hidden = !wLock;
}
setInterval(wakeCheck, 3000); document.addEventListener("visibilitychange", wakeCheck);
window.render = (orig => function () { const r = orig.apply(this, arguments); try { const c = $("#clock"); if (c && !$("#wakeHint") && navigator.wakeLock) { const box = c.closest(".clockbox") || c.parentElement; box.insertAdjacentHTML("beforeend", `<span class="m wakehint" id="wakeHint" hidden title="${t("Lo schermo non si spegne mentre il cronometro corre")}">💡 ${t("schermo sempre acceso")}</span>`); } wakeCheck(); } catch (e) { } return r; })(window.render);
render = window.render;

/* ---------- 4. «Primi passi»: guida per chi usa l'app la prima volta ---------- */
const real = coll => [...S[coll].values()].filter(o => o && !o.example);
const GS = [
  ["prof", "Completa il tuo profilo scout", "nome, ruolo e lingue: compaiono nei report", () => !!(Profile.get().name || "").trim(), "gsProfile"],
  ["pl", "Aggiungi il primo giocatore", "bastano nome, ruolo e squadra", () => real("players").length > 0, "gsPlayer"],
  ["ma", "Crea la prima partita", "con il giocatore obiettivo da osservare", () => real("matches").length > 0, "gsMatch"],
  ["live", "Registra le azioni dal vivo", "«Durante»: avvia il cronometro e tocca ✓ ✕ = sulle azioni", () => real("matches").some(m => (m.events || []).length), "gsLive"],
  ["ev", "Scrivi la prima valutazione", "voti, evidenze e giudizio finale", () => real("evals").length > 0, "gsEval"],
  ["bk", "Fai il primo backup", "un file cifrato da tenere al sicuro", () => !!Prefs.get("lastBackup", null), "gsBackup"]
];
function gsHtml() {
  if (Prefs.get("gsOff", false)) return ""; const st = GS.map(g => { let ok = false; try { ok = g[3](); } catch (e) { } return ok; }); const done = st.filter(Boolean).length; if (done === GS.length) return "";
  return `<section class="panel gsteps"><div class="row between"><div><h2>🚀 ${t("Primi passi")}</h2><p class="sub small">${t("Sei passaggi per iniziare a fare scouting con l'app. Si spuntano da soli quando li fai.")}</p></div><button type="button" class="btn sm ghost" data-a="gsOff" aria-label="${t("Nascondi")}">${t("Nascondi")}</button></div>
   <div class="gsbar" role="progressbar" aria-valuemin="0" aria-valuemax="${GS.length}" aria-valuenow="${done}"><span style="width:${Math.round(done / GS.length * 100)}%"></span></div><p class="m">${t("{a} di {b} fatti", { a: done, b: GS.length })}</p>
   <ol class="gslist">${GS.map((g, i) => `<li class="${st[i] ? "ok" : ""}"><span class="gsn">${st[i] ? "✓" : i + 1}</span><div class="grow"><b>${t(g[1])}</b><div class="m">${t(g[2])}</div></div>${st[i] ? "" : `<button type="button" class="btn sm ${i === st.indexOf(false) ? "pri" : ""}" data-a="${g[4]}">${t("Fai ora")} →</button>`}</li>`).join("")}</ol></section>`;
}
R.panoramica = (orig => () => { const h = orig(); const g = gsHtml(); if (!g) return h; const i = h.indexOf('<section class="panel today">'); return i < 0 ? h + g : h.slice(0, i) + g + h.slice(i); })(R.panoramica);
Object.assign(A, {
  gsOff: () => { Prefs.set("gsOff", true); render(true); toast(t("Puoi riaprire «Primi passi» da Impostazioni.")); },
  gsOn: () => { Prefs.set("gsOff", false); resetSub(); go("panoramica"); },
  gsProfile: () => { resetSub(); go("profilo"); },
  gsPlayer: () => A.newPlayer(),
  gsMatch: () => A.newMatch(),
  gsLive: () => { const m = [...S.matches.entries()].filter(([, x]) => !x.example).sort((a, b) => String(b[1].date || "").localeCompare(String(a[1].date || "")))[0]; if (!m) { A.newMatch(); return; } A.openMatch({ dataset: { id: m[0] } }); setTimeout(() => A.mtab({ dataset: { t: "live" } }), 30); },
  gsEval: () => A.pickEvalPlayer(),
  gsBackup: () => A.backupNow()
});
R.impostazioni = (orig => () => { const h = orig(); if (!Prefs.get("gsOff", false)) return h; return h + `<section class="panel"><div class="row between"><div><h2>🚀 ${t("Primi passi")}</h2><p class="sub small">${t("La guida per iniziare è nascosta.")}</p></div><button type="button" class="btn sm" data-a="gsOn">${t("Mostra di nuovo")}</button></div></section>`; })(R.impostazioni);

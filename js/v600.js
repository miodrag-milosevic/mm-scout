/* =========================================================
   6.0 — Cronometro sicuro, banner partita, recupero, chiusura guidata
   ========================================================= */
const CL = {
  END: { 1: 45, 2: 90, 3: 105, 4: 120 }, MAXREC: 15, ATTEND_MIN: 20,
  lastAct: Date.now(),
  cap: h => ((CL.END[h] || 45) + CL.MAXREC) * 60,
  // l'utente sta guardando la partita nella pagina «Durante» con l'app aperta e attiva
  attended() { return document.visibilityState === "visible" && App.unlocked && ui.view === "partite" && ui.mtab === "live" && (Date.now() - CL.lastAct) < CL.ATTEND_MIN * 60000; },
  limit(tm, raw) { const c = CL.cap(tm.half || 1); return raw > c && !CL.attended() ? c : raw; },
  key: id => "ts3_tmr_" + id,
  running() {
    const out = [];
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (!k || !k.startsWith("ts3_tmr_")) continue; const id = k.slice(8); let tm = null; try { tm = JSON.parse(localStorage.getItem(k)); } catch (e) { } if (tm && tm.run) out.push([id, tm]); } } catch (e) { }
    return out;
  },
  notices() { try { return JSON.parse(localStorage.getItem("ts3_clock_notices") || "[]"); } catch (e) { return []; } },
  setNotices(a) { try { localStorage.setItem("ts3_clock_notices", JSON.stringify(a.slice(-20))); } catch (e) { } },
  label(h) { return [t("1° tempo"), t("2° tempo"), t("1° tempo supplementare"), t("2° tempo supplementare")][(h || 1) - 1]; },
  mname(id) { const m = typeof S !== "undefined" && S.matches && S.matches.get(id); return m ? `${m.home || ""} – ${m.away || ""}` : t("Partita"); },
  // chiude da solo un cronometro rimasto acceso oltre il limite
  sweep() {
    for (const [id, tm] of CL.running()) {
      const raw = tm.base + Math.floor((Date.now() - tm.start) / 1000); const cap = CL.cap(tm.half || 1);
      if (raw < cap || (ui.timerFor === id && CL.attended())) continue;
      const stopped = { ...tm, run: false, start: 0, base: cap, auto: { at: Date.now(), reason: "cap" } };
      try { localStorage.setItem(CL.key(id), JSON.stringify(stopped)); } catch (e) { }
      if (ui.timerFor === id) ui.timer = stopped;
      const n = CL.notices(); n.push({ id, h: tm.half || 1, min: Math.round(cap / 60), at: Date.now() }); CL.setNotices(n);
      try { if (App.unlocked && S.matches.get(id)) put("matches", id, { ...S.matches.get(id), clockAuto: { h: tm.half || 1, min: Math.round(cap / 60), at: Date.now(), reason: "limite" } }); } catch (e) { }
    }
  },
  beep() { try { if (!Prefs.get("soundOn", true)) return; const C = window.AudioContext || window.webkitAudioContext; if (!C) return; const a = CL.ac || (CL.ac = new C()); const o = a.createOscillator(), g = a.createGain(); o.type = "sine"; o.frequency.value = 660; g.gain.setValueAtTime(0.0001, a.currentTime); g.gain.exponentialRampToValueAtTime(0.12, a.currentTime + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.5); o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + 0.55); } catch (e) { } },
  fmt(s) { return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); },
  banner() {
    let el = $("#liveBanner");
    if (!App.unlocked) { if (el) el.remove(); document.body.classList.remove("livebn"); return; }
    CL.sweep();
    const run = CL.running().filter(([id]) => typeof S !== "undefined" && S.matches && S.matches.get(id) && !(ui.view === "partite" && ui.matchId === id && ui.mtab === "live"));
    const notes = CL.notices();
    if (!run.length && !notes.length) { if (el) el.remove(); document.body.classList.remove("livebn"); return; }
    if (!el) { el = document.createElement("div"); el.id = "liveBanner"; document.body.appendChild(el); }
    document.body.classList.add("livebn");
    if (notes.length) {
      const x = notes[notes.length - 1];
      el.className = "livebanner warn"; el.setAttribute("role", "alert");
      el.innerHTML = `<span class="lbtxt"><b>${t("Cronometro chiuso automaticamente")}</b> · ${esc(CL.mname(x.id))} · ${esc(CL.label(x.h))}, ${t("limite raggiunto")} ${x.min}'</span><span class="lbact"><button class="btn sm" data-a="lbOpen" data-id="${x.id}">${t("Apri partita")}</button><button class="btn sm ghost" data-a="lbDismiss">${t("OK")}</button></span>`;
      return;
    }
    const [id, tm] = run[0]; const s = tSec(tm); const sel = Prefs.get("liveRemind", 3);
    el.className = "livebanner"; el.removeAttribute("role");
    const keep = el.querySelector("select") && el.dataset.id === id;
    if (!keep) {
      el.dataset.id = id;
      el.innerHTML = `<span class="lbtxt"><span class="lbdot" aria-hidden="true"></span><b>${t("In partita")}</b> · <span id="lbName"></span> · <span id="lbClock" class="mono"></span></span><span class="lbact"><label class="lbrem">${t("Promemoria")} <select id="lbRem" aria-label="${t("Promemoria")}">${[[0, t("No")], [1, "1'"], [2, "2'"], [3, "3'"]].map(([v, l]) => `<option value="${v}" ${v === sel ? "selected" : ""}>${l}</option>`).join("")}</select></label><button class="btn sm pri" data-a="lbOpen" data-id="${id}">${t("Torna alla partita")}</button></span>`;
      const rs = el.querySelector("#lbRem"); rs.onchange = () => { Prefs.set("liveRemind", +rs.value); CL.nextRem = 0; };
    }
    el.querySelector("#lbName").textContent = CL.mname(id); el.querySelector("#lbClock").textContent = `${["1T", "2T", "1TS", "2TS"][(tm.half || 1) - 1]} ${CL.fmt(s)}`;
    // promemoria periodico (silenzioso se i suoni sono spenti)
    const every = Prefs.get("liveRemind", 3) * 60000;
    if (every > 0) { if (!CL.nextRem) CL.nextRem = Date.now() + every; else if (Date.now() >= CL.nextRem) { CL.nextRem = Date.now() + every; toast(t("Sei in partita: torna a osservare il giocatore"), 4000); CL.beep(); } }
  }
};
["pointerdown", "keydown", "touchstart", "scroll", "mousemove"].forEach(ev => document.addEventListener(ev, () => { CL.lastAct = Date.now(); }, { passive: true, capture: true }));
setInterval(() => { try { CL.banner(); } catch (e) { } }, 1000);
document.addEventListener("visibilitychange", () => { try { CL.banner(); } catch (e) { } });
Object.assign(A, {
  lbOpen: el => { const id = el.dataset.id; const n = CL.notices(); CL.setNotices(n.filter(x => x.id !== id)); go("partite", { matchId: id, mtab: "live" }); CL.banner(); },
  lbDismiss: () => { CL.setNotices([]); CL.banner(); }
});

/* ---------- recupero + etichetta minuto ---------- */
window.tickClock = (orig => function () {
  orig.apply(this, arguments);
  try {
    const tm = ui.timer, lb = $("#minLbl"); if (!tm || !lb) return; const h = tm.half || 1, end = CL.END[h], sec = tSec(tm), mins = Math.floor(sec / 60), rec = (tm.rec || {})[h] || 0;
    let extra = ""; if (mins >= end) { const over = Math.ceil(sec / 60) - end; extra = ` · ${end}'+${over}'` + (rec ? ` (${t("recupero")} +${rec}')` : ""); if (rec && over > rec) lb.classList.add("recover-over"); } else if (rec) extra = ` · ${t("recupero")} +${rec}'`;
    lb.textContent += extra;
  } catch (e) { }
})(window.tickClock);
function recBox() {
  const bar = $(".livebar .seg"); if (!bar || $("#recSel")) return; const tm = ui.timer; if (!tm) return;
  const h = tm.half || 1; const cur = (tm.rec || {})[h] || 0;
  const w = document.createElement("label"); w.className = "recbox"; w.innerHTML = `${t("Recupero")} <select id="recSel" aria-label="${t("Minuti di recupero")} – ${CL.label(h)}">${Array.from({ length: CL.MAXREC + 1 }, (_, i) => `<option value="${i}" ${i === cur ? "selected" : ""}>+${i}'</option>`).join("")}</select>`;
  bar.insertAdjacentElement("afterend", w);
  w.querySelector("select").onchange = e => { const t0 = ui.timer; const nt = { ...t0, rec: { ...(t0.rec || {}), [t0.half || 1]: +e.target.value } }; tSet(ui.matchId, nt); tickClock(); };
}
window.render = (orig => function () { const r = orig.apply(this, arguments); try { recBox(); CL.banner(); } catch (e) { } return r; })(window.render);
render = window.render;
A.lHalf = (orig => function (el) { orig.apply(this, arguments); })(A.lHalf);

/* ---------- «Avanti: Dopo la partita»: chiusura guidata del cronometro ---------- */
A.mtab = (orig => function (el) {
  const to = el && el.dataset && el.dataset.t;
  if (to === "dopo" && ui.mtab === "live" && ui.matchId && !CL.bypass) {
    const tm = ui.timer && ui.timerFor === ui.matchId ? ui.timer : tGet(ui.matchId); const sec = tSec(tm), h = tm.half || 1, end = CL.END[h];
    const started = tm.run || sec > (HALVES[h] || 0) * 60 + 5;
    if (started && h <= 2 && sec < end * 60) {
      sheet(`<h2>${t("Fine partita?")}</h2><p>${t("Il cronometro è al {m}' e il {h} non è ancora arrivato al {e}'. Vuoi continuare a osservare o chiudere qui?", { m: Math.floor(sec / 60), h: CL.label(h), e: end })}</p><div class="row end"><button class="btn" data-a="clContinue">${t("Continua a osservare")}</button><button class="btn pri" data-a="clFinish" data-t="dopo">${t("Chiudi e vai al dopo partita")}</button></div>`);
      return;
    }
    if (tm.run) tSet(ui.matchId, { ...tm, run: false, start: 0, base: Math.min(sec, CL.cap(h)) });
  }
  return orig.apply(this, arguments);
})(A.mtab);
Object.assign(A, {
  clContinue: () => { closeSheet(); ui.mtab = "live"; render(); window.scrollTo(0, 0); },
  clFinish: el => { closeSheet(); const tm = ui.timer || tGet(ui.matchId); if (tm.run) tSet(ui.matchId, { ...tm, run: false, start: 0, base: Math.min(tSec(tm), CL.cap(tm.half || 1)) }); CL.bypass = true; try { A.mtab({ dataset: { t: el.dataset.t } }); } finally { CL.bypass = false; } }
});

/* ---------- stile ---------- */
{ const st = document.createElement("style"); st.textContent = `
.livebanner{position:fixed;top:0;left:0;right:0;z-index:300;min-height:44px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:6px 14px;background:#1f5d3a;color:#fff;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,.25)}
.livebanner.warn{background:#9a5b00}
.livebanner .lbtxt{display:flex;align-items:center;gap:6px;flex-wrap:wrap;min-width:0}
.livebanner .lbact{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.livebanner .btn{min-height:34px}
.livebanner .lbrem{display:flex;align-items:center;gap:6px;font-size:13px}
.livebanner select{min-height:30px;color:#1b1b1b;background:#fff;border-radius:8px;padding:0 8px}
.lbdot{width:9px;height:9px;border-radius:50%;background:#ff5a4d;animation:lbp 1.2s infinite}
@keyframes lbp{50%{opacity:.25}}
body.livebn{padding-top:48px}
body.livebn .topbar,body.livebn #topbar{top:48px}
@media (max-width:640px){body.livebn{padding-top:84px}body.livebn .topbar,body.livebn #topbar{top:84px}.livebanner{padding:6px 10px}}
.recbox{display:inline-flex;align-items:center;gap:6px;font-size:13px;margin-left:8px}
.recover-over{color:#b3261e;font-weight:600}
`; document.head.appendChild(st); }

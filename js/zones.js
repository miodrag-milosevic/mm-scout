"use strict";
/* =========================================================
   MM Scout — campo diviso in zone di gioco: 6 fasce in
   lunghezza × 5 corridoi in larghezza (fasce laterali,
   mezzi spazi, corridoio centrale) = 30 zone toccabili.
   Zona, pressione, piede e contesto della gara pesano nel
   voto proposto dalle azioni registrate.
   ========================================================= */
const ZSTRIPS = [["Area propria", "Own box"], ["Difesa", "Defensive third"], ["Centrocampo difensivo", "Defensive midfield"], ["Centrocampo offensivo", "Attacking midfield"], ["Trequarti", "Final third"], ["Area avversaria", "Opponent's box"]];
const ZLANES = [["Fascia sinistra", "Left flank"], ["Mezzo spazio sinistro", "Left half-space"], ["Corridoio centrale", "Central lane"], ["Mezzo spazio destro", "Right half-space"], ["Fascia destra", "Right flank"]];
function zoneOf(z) { if (!z) return null; const s = Math.min(5, Math.max(0, Math.floor(z.x / (100 / 6)))), c = Math.min(4, Math.max(0, Math.floor(z.y / 20))); return { s, c, id: s * 5 + c }; }
function zoneCenter(s, c) { return { x: +((s + 0.5) * 100 / 6).toFixed(2), y: (c + 0.5) * 20, zid: s * 5 + c }; }
window.zoneL = function (z) { const q = zoneOf(z); if (!q) return ""; return `${L({ it: ZSTRIPS[q.s][0], en: ZSTRIPS[q.s][1] })} · ${L({ it: ZLANES[q.c][0], en: ZLANES[q.c][1] }).toLowerCase()}`; };
const third = z => { const q = zoneOf(z); return q ? (q.s <= 1 ? 0 : q.s <= 3 ? 1 : 2) : -1; };

function zoneGridSVG(sel) {
  const W = 105 / 6, H = 68 / 5, q = zoneOf(sel), Lc = "var(--pitch-line)"; let cells = "";
  for (let s = 0; s < 6; s++) for (let c = 0; c < 5; c++) { const on = q && q.s === s && q.c === c; cells += `<rect class="zcell${on ? " on" : ""}" data-zs="${s}" data-zc="${c}" x="${s * W + .3}" y="${c * H + .3}" width="${W - .6}" height="${H - .6}" rx="1"><title>${esc(zoneL(zoneCenter(s, c)))}</title></rect>`; }
  const thirds = [0, 2, 4].map((s, i) => `<text x="${(s + 1) * W}" y="-0.9" text-anchor="middle" font-size="2.6" fill="var(--pitch-line)">${esc([t("difensiva"), t("centrale"), t("offensiva")][i])}</text>`).join("");
  return `<svg class="pitch zgrid" viewBox="-3 -4.5 111 76" role="group" aria-label="${t("Zone del campo")}"><rect x="-3" y="-4.5" width="111" height="76" fill="var(--pitch)"/>${thirds}
   <g fill="none" stroke="${Lc}" stroke-width=".5" pointer-events="none"><rect x="0" y="0" width="105" height="68"/><line x1="52.5" y1="0" x2="52.5" y2="68"/><circle cx="52.5" cy="34" r="9.15"/><rect x="0" y="13.84" width="16.5" height="40.32"/><rect x="88.5" y="13.84" width="16.5" height="40.32"/><rect x="0" y="24.84" width="5.5" height="18.32"/><rect x="99.5" y="24.84" width="5.5" height="18.32"/></g>
   ${cells}<g pointer-events="none" stroke="${Lc}" stroke-width=".35" opacity=".85">${[1, 2, 3, 4, 5].map(i => `<line y1="0" y2="68" x1="${i * W}" x2="${i * W}" ${i % 2 ? 'stroke-dasharray="1.2 1"' : ""}/>`).join("")}${[1, 2, 3, 4].map(i => `<line x1="0" x2="105" y1="${i * H}" y2="${i * H}" stroke-dasharray="1.2 1"/>`).join("")}</g>
   <text x="104" y="71" fill="${Lc}" font-size="2.8" text-anchor="end" pointer-events="none">${t("attacco")} →</text><text x="1" y="71" fill="${Lc}" font-size="2.8" pointer-events="none">↑ ${t("Fascia sinistra")} · ↓ ${t("Fascia destra")}</text></svg>`;
}
function zonePicker(sel, id) { return `<div class="zpick" id="${id}"><div class="pitchbox zbox">${zoneGridSVG(sel)}</div><div class="zname m" id="${id}Name">${sel ? "📍 " + esc(zoneL(sel)) : t("Nessuna zona: tocca un riquadro")}</div></div>`; }
function bindZonePicker(id, get, set) {
  const box = $("#" + id); if (!box) return;
  box.onclick = ev => { const r = ev.target.closest("[data-zs]"); if (!r) return; const s = +r.dataset.zs, c = +r.dataset.zc; const cur = zoneOf(get()); const nz = cur && cur.s === s && cur.c === c ? null : zoneCenter(s, c); set(nz); box.querySelector(".zbox").innerHTML = zoneGridSVG(nz); $("#" + id + "Name").textContent = nz ? "📍 " + zoneL(nz) : t("Nessuna zona: tocca un riquadro"); };
}

/* ---------- peso dei dati tracciati nel voto proposto ---------- */
function ctxFactor(m) { const c = (m.post || {}).context || {}; const v = Object.values(c).map(Number).filter(x => x > 0); if (!v.length) return 1; return 0.85 + (mean(v) - 1) * 0.075; } // 1→0,85 · 3→1 · 5→1,15
function evWeight(e, c, m) {
  let w = 1; const o = evOutcome(e);
  if (e.pr) w *= o === "+" ? (e.pr >= 4 ? 1.35 : e.pr <= 2 ? 0.85 : 1) : (e.pr >= 4 ? 0.8 : e.pr <= 2 ? 1.2 : 1); // riuscire sotto pressione vale di più, sbagliare senza pressione pesa di più
  const th = third(e.z); if (th >= 0 && c) { if (c.area === "tec" || c.area === "tat") { if (o === "+" && th === 2) w *= 1.15; if (o === "-" && th === 0) w *= 1.2; } }
  return w * ctxFactor(m);
}
window.paramStats = function (pid, matchId) {
  const out = {};
  for (const [mid, m] of S.matches) { if (matchId && mid !== matchId) continue; for (const e of (m.events || [])) { if (e.p !== pid) continue; const c = catOf(e.c); if (!c) continue; const o = evOutcome(e); const w = evWeight(e, c, m); const det = !!(e.z || e.pr || e.b);
    for (const k of (c.params || [])) { const s = out[k] = out[k] || { n: 0, pos: 0, neg: 0, w: 0, wp: 0, wn: 0, det: 0 }; s.n++; s.w += w; if (det) s.det++; if (o === "+") { s.pos++; s.wp += w; } else if (o === "-") { s.neg++; s.wn += w; } } } }
  return out;
};
window.suggestFrom = function (st) {
  const s = Cfg.get().scale; if (!st || st.n < 2) return null; const mid = (s.min + s.max) / 2; const bal = st.w ? (st.wp - st.wn) / st.w : (st.pos - st.neg) / st.n;
  const conf = Math.min(1, 0.55 + st.n * 0.09); // più azioni = proposta più decisa
  let v = mid + bal * (s.max - s.min) * 0.42 * conf; v = Math.round(v / s.step) * s.step; return Math.max(s.min, Math.min(s.max, +v.toFixed(2)));
};
// qualità delle evidenze: le azioni con zona/pressione/piede contano come evidenze con contesto
window.evidenceQuality = (orig => function (e) {
  let q = orig(e); if (!e || !e.playerId) return q; const ms = e.matchId ? [S.matches.get(e.matchId)].filter(Boolean) : [];
  const evs = ms.flatMap(m => (m.events || []).filter(x => x.p === e.playerId && catOf(x.c))); if (evs.length >= 6) { const det = evs.filter(x => x.z || x.pr).length / evs.length; if (q && q < 5 && det >= 0.6) q++; if (!q) q = 2; }
  return q;
})(window.evidenceQuality);
function trackPanel(evs) {
  const ev = evs.filter(e => catOf(e.c)); if (!ev.length) return "";
  const pz = Math.round(ev.filter(e => e.z).length / ev.length * 100), pp = Math.round(ev.filter(e => e.pr).length / ev.length * 100), pb = Math.round(ev.filter(e => e.b).length / ev.length * 100);
  const rows = [t("difensiva"), t("centrale"), t("offensiva")].map((n, i) => { const x = ev.filter(e => third(e.z) === i); return x.length ? `<tr><td>${t("Terzo")} ${esc(n)}</td><td class="n">${x.length}</td><td class="n">${Math.round(x.filter(e => evOutcome(e) === "+").length / x.length * 100)}%</td></tr>` : ""; }).join("");
  const hp = ev.filter(e => e.pr >= 4); const hpr = hp.length ? Math.round(hp.filter(e => evOutcome(e) === "+").length / hp.length * 100) : null;
  return `<div class="trackp"><div class="ctxgrid"><div><span class="m">${t("Azioni con zona")}</span><b class="mono">${pz}%</b></div><div><span class="m">${t("Con pressione")}</span><b class="mono">${pp}%</b></div><div><span class="m">${t("Con piede")}</span><b class="mono">${pb}%</b></div>${hpr != null ? `<div><span class="m">${t("Riuscita sotto forte pressione")}</span><b class="mono">${hpr}% (${hp.length})</b></div>` : ""}</div>
   ${rows ? `<div class="tw" style="margin-top:8px"><table><thead><tr><th>${t("Zona")}</th><th class="n">${t("Azioni")}</th><th class="n">%+</th></tr></thead><tbody>${rows}</tbody></table></div>` : ""}
   <p class="m">${t("Più dettagli registri, più il voto proposto è preciso: azioni riuscite sotto forte pressione e in zona offensiva valgono di più, errori senza pressione o nella propria area pesano di più. Conta anche la difficoltà della gara.")}</p></div>`;
}

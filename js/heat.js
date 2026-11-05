"use strict";
/* =========================================================
   MM Scout — mappa delle zone: il campo diviso in 5 corsie
   e 6 fasce; ogni zona si colora in base a quante azioni
   sono avvenute lì (con filtro per esito).
   ========================================================= */
function heatmapSVG(points, o = {}) {
  const C = 6, Rw = 5, cnt = Array.from({ length: C * Rw }, () => 0);
  for (const p of points) { const cx = Math.min(C - 1, Math.floor(p.x / (100 / C))), cy = Math.min(Rw - 1, Math.floor(p.y / (100 / Rw))); cnt[cy * C + cx]++; }
  const max = Math.max(1, ...cnt); const W = 105 / C, H = 68 / Rw; const col = o.color || "#F2C14E"; let cells = "";
  cnt.forEach((n, i) => { if (!n) return; const x = (i % C) * W, y = Math.floor(i / C) * H; const a = 0.18 + 0.7 * (n / max); cells += `<rect x="${x + .4}" y="${y + .4}" width="${W - .8}" height="${H - .8}" rx="1.2" fill="${col}" fill-opacity="${a.toFixed(2)}"/><text x="${x + W / 2}" y="${y + H / 2 + 1.6}" text-anchor="middle" font-size="4.2" font-weight="700" fill="#17221C">${n}</text>`; });
  const Lc = "var(--pitch-line)";
  return `<svg class="pitch" viewBox="-3 -3 111 74" role="img" aria-label="${t("Mappa delle zone")}"><rect x="-3" y="-3" width="111" height="74" fill="var(--pitch)"/>${cells}
   <g fill="none" stroke="${Lc}" stroke-width=".5"><rect x="0" y="0" width="105" height="68"/><line x1="52.5" y1="0" x2="52.5" y2="68"/><circle cx="52.5" cy="34" r="9.15"/><rect x="0" y="13.84" width="16.5" height="40.32"/><rect x="88.5" y="13.84" width="16.5" height="40.32"/></g>
   <g stroke="${Lc}" stroke-width=".25" stroke-dasharray="1.2 1.2" opacity=".55">${[1, 2, 3, 4].map(i => `<line x1="0" x2="105" y1="${i * H}" y2="${i * H}"/>`).join("")}${[1, 2, 3, 4, 5].map(i => `<line y1="0" y2="68" x1="${i * W}" x2="${i * W}"/>`).join("")}</g>
   <text x="102" y="66" fill="${Lc}" font-size="3.2" text-anchor="end">${t("attacco")} →</text></svg>`;
}
function heatBlock(events, key) {
  const f = (ui.heat || {})[key] || "all"; const pts = events.filter(e => e.z && (f === "all" || evOutcome(e) === f)).map(e => e.z);
  if (!events.some(e => e.z)) return `<p class="m">${t("Aggiungi la zona alle azioni (con «Dettagli») per vedere la mappa.")}</p>`;
  return `<div class="seg" style="margin-bottom:8px">${[["all", t("Tutte")], ["+", "✓ " + t("Positive")], ["-", "✗ " + t("Negative")]].map(([v, n]) => `<button data-a="heatF" data-k="${key}" data-v="${v}" aria-pressed="${f === v}">${n}</button>`).join("")}</div><div class="pitchbox" style="max-width:420px">${heatmapSVG(pts, { color: f === "-" ? "#E07070" : f === "+" ? "#5CC48B" : "#F2C14E" })}</div><p class="m">${t("{n} azioni con zona · 5 corsie × 6 fasce", { n: pts.length })}</p>`;
}
A.heatF = el => { ui.heat = ui.heat || {}; ui.heat[el.dataset.k] = el.dataset.v; render(true); };

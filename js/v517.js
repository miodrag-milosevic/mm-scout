/* MM Scout 5.11.5 — grafici radar: etichette sempre leggibili (vanno a capo, mai tagliate)
   e valori mancanti mostrati come «nessun voto» invece che come zero.
   © Miodrag Milosevic. Vietato divulgare, copiare o modificare senza consenso dell'autore. */
"use strict";

function rWrap(text, max) {
  const words = String(text || "").split(/\s+/).filter(Boolean); const lines = []; let cur = "";
  for (const w of words) { if (!cur) cur = w; else if ((cur + " " + w).length <= max) cur += " " + w; else { lines.push(cur); cur = w; } }
  if (cur) lines.push(cur);
  if (lines.length > 3) { const head = lines.slice(0, 2); head.push(lines.slice(2).join(" ")); return head.map(l => l.length > max + 6 ? l.slice(0, max + 5) + "…" : l); }
  return lines.map(l => l.length > max + 6 ? l.slice(0, max + 5) + "…" : l);
}
window.radar = function (series, labels, colors = ["var(--accent)"]) {
  const s = Cfg.get().scale; const n = labels.length; if (!n) return "";
  const many = n > 8, r = many ? 110 : 96, fs = many ? 9 : 10, lh = fs + 2, cw = fs * 0.58, gap = many ? 10 : 14, maxCh = many ? 13 : 15;
  const ang = i => -Math.PI / 2 + i * 2 * Math.PI / n;
  const pt = (i, v) => { const k = Math.max(0, Math.min(1, (v - s.min) / (s.max - s.min))); return [Math.cos(ang(i)) * r * k, Math.sin(ang(i)) * r * k]; };
  const noData = labels.map((_, i) => series.length > 0 && series.every(ser => ser.vals[i] == null));
  let g = ""; let x0 = -r, x1 = r, y0 = -r, y1 = r;
  for (const k of [0.2, 0.4, 0.6, 0.8, 1]) g += `<polygon points="${labels.map((_, i) => pt(i, s.min + k * (s.max - s.min)).map(v => v.toFixed(1)).join(",")).join(" ")}" fill="none" stroke="var(--line)" stroke-width="1"/>`;
  labels.forEach((l, i) => {
    const a = ang(i), ca = Math.cos(a), sa = Math.sin(a); const [ex, ey] = pt(i, s.max);
    const lines = rWrap(l, maxCh); if (noData[i]) lines.push("(" + t("nessun voto") + ")");
    const lx = ca * (r + gap), ly = sa * (r + gap); const anc = Math.abs(ca) < 0.2 ? "middle" : ca < 0 ? "end" : "start";
    const w = Math.max(...lines.map(x => x.length)) * cw; const hgt = lines.length * lh;
    // in alto le righe salgono, in basso scendono, ai lati restano centrate sull'asse
    const top = sa < -0.3 ? ly - hgt + fs * 0.35 : sa > 0.3 ? ly + fs * 0.35 : ly - hgt / 2 + fs * 0.75;
    const left = anc === "middle" ? lx - w / 2 : anc === "end" ? lx - w : lx;
    x0 = Math.min(x0, left - 4); x1 = Math.max(x1, left + w + 4); y0 = Math.min(y0, top - fs); y1 = Math.max(y1, top + hgt);
    g += `<line x1="0" y1="0" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" stroke="var(--line)"${noData[i] ? ' stroke-dasharray="3 3"' : ""}/><text x="${lx.toFixed(1)}" y="${top.toFixed(1)}" text-anchor="${anc}" style="font-size:${fs}px"${noData[i] ? ' opacity=".55"' : ""}>${lines.map((x, j) => `<tspan x="${lx.toFixed(1)}" dy="${j ? lh : 0}">${esc(x)}</tspan>`).join("")}<title>${esc(l)}</title></text>`;
  });
  series.forEach((ser, j) => {
    const c = colors[j % colors.length]; const have = ser.vals.map((v, i) => v == null ? null : pt(i, v)).filter(Boolean);
    if (have.length >= 3) g += `<polygon points="${have.map(p => p.map(v => v.toFixed(1)).join(",")).join(" ")}" fill="${c}" fill-opacity=".16" stroke="${c}" stroke-width="2" stroke-linejoin="round"/>`;
    else if (have.length === 2) g += `<polyline points="${have.map(p => p.map(v => v.toFixed(1)).join(",")).join(" ")}" fill="none" stroke="${c}" stroke-width="2"/>`;
    g += ser.vals.map((v, i) => { if (v == null) return ""; const [x, y] = pt(i, v); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="${c}"><title>${esc(labels[i])}: ${esc(f1(v))}</title></circle>`; }).join("");
  });
  const pad = 6, vb = [x0 - pad, y0 - pad, x1 - x0 + pad * 2, y1 - y0 + pad * 2].map(v => v.toFixed(1)).join(" ");
  const maxW = Math.round((x1 - x0 + pad * 2) * (many ? 1.05 : 1.15));
  return `<svg class="radar" viewBox="${vb}" style="width:100%;max-width:${maxW}px;display:block;margin:4px auto;overflow:visible" role="img" aria-label="${t("Grafico radar")}">${g}</svg>`;
};
radar = window.radar;

/* ---------- grafico a dispersione: nomi mai fuori dal bordo e meno sovrapposti ---------- */
window.scatter = function (rows, fx, fy, lx, ly) {
  const pts = rows.map(r => [fx(r), fy(r), r]).filter(([x, y]) => x != null && y != null && !isNaN(x) && !isNaN(y)); if (pts.length < 2) return `<p class="m">${t("Servono almeno 2 giocatori con entrambi i valori.")}</p>`;
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys); const W = 560, H = 320, P0 = 40, PR = 14;
  const X = v => P0 + (x1 === x0 ? 0.5 : (v - x0) / (x1 - x0)) * (W - P0 - PR), Y = v => H - 30 - (y1 === y0 ? 0.5 : (v - y0) / (y1 - y0)) * (H - 54);
  const mx = mean(xs), my = mean(ys); const fs = 10.5, cw = fs * 0.56;
  // etichette: a destra del punto, a sinistra se vicino al bordo; poi le sposto in verticale se si toccano
  const labs = pts.map(([x, y, r]) => { const name = r.p.last || pname(r.p); const px = X(x), py = Y(y), w = name.length * cw; const right = px + 8 + w <= W - 2; return { px, py, name, w, right, lx: right ? px + 8 : px - 8, ly: py + 4 }; });
  const box = l => [l.right ? l.lx : l.lx - l.w, l.right ? l.lx + l.w : l.lx];
  const order = labs.map((l, i) => i).sort((a, b) => labs[a].ly - labs[b].ly);
  for (let k = 0; k < order.length; k++) { const a = labs[order[k]]; for (let m = 0; m < k; m++) { const b = labs[order[m]]; const [a0, a1] = box(a), [b0, b1] = box(b); if (a0 < b1 && b0 < a1 && Math.abs(a.ly - b.ly) < fs + 1) a.ly = b.ly + fs + 1; } a.ly = Math.min(H - 34, Math.max(18, a.ly)); }
  return `<svg viewBox="0 0 ${W} ${H}" class="scatter" role="img" aria-label="${esc(lx)} / ${esc(ly)}"><line x1="${X(mx)}" x2="${X(mx)}" y1="14" y2="${H - 30}" stroke="var(--line)" stroke-dasharray="3 3"/><line y1="${Y(my)}" y2="${Y(my)}" x1="${P0}" x2="${W - PR}" stroke="var(--line)" stroke-dasharray="3 3"/>
   <text x="${W - PR}" y="${H - 8}" text-anchor="end" font-size="11" fill="var(--muted)">${esc(lx)} →</text><text x="6" y="12" font-size="11" fill="var(--muted)">↑ ${esc(ly)}</text>
   ${pts.map(([x, y, r], i) => { const l = labs[i]; return `<g class="sdot" data-a="openPlayer" data-id="${r.id}"><circle cx="${l.px}" cy="${l.py}" r="6" fill="${r.p.example ? "var(--blue)" : "var(--accent)"}" fill-opacity=".75"/><text x="${l.lx.toFixed(1)}" y="${l.ly.toFixed(1)}" font-size="${fs}" text-anchor="${l.right ? "start" : "end"}" fill="var(--ink)">${esc(l.name)}</text><title>${esc(pname(r.p))}: ${f1(x)} / ${f1(y)}</title></g>`; }).join("")}</svg><p class="m">${t("Le linee tratteggiate sono le medie: in alto a destra chi va meglio su entrambi i valori.")}</p>`;
};
scatter = window.scatter;

/* ---------- andamento: la prima e l'ultima data non escono dal grafico ---------- */
window.lineChart = (orig => function () { let h = orig.apply(this, arguments); if (!h) return h; const tag = 'text-anchor="middle"';
  const a = h.indexOf(tag), b = h.lastIndexOf(tag); if (a < 0) return h; if (b > a) h = h.slice(0, b) + 'text-anchor="end"' + h.slice(b + tag.length); return h.slice(0, a) + 'text-anchor="start"' + h.slice(a + tag.length); })(window.lineChart);
lineChart = window.lineChart;

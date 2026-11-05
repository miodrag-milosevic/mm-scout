"use strict";
/* =========================================================
   MM Scout — analisi semplice per lo scout: numeri per 90
   minuti dal tuo registro, xG stimato dalle zone dei tiri,
   percentili rispetto ai giocatori dello stesso ruolo nel
   tuo archivio (o alle statistiche importate), mappa di
   calore, percorso di carriera e report da presentare.
   ========================================================= */
// metriche ricavate dalle azioni registrate (id azione → come contarle)
const MX = [
  ["goals", "Gol", "att", e => e.c === "Gol"],
  ["xg", "xG stimato", "att", null],
  ["shots", "Tiri", "att", e => e.c === "Tiro" || e.c === "Colpo di testa" && e.o !== "="],
  ["sot", "Tiri in porta", "att", e => (e.c === "Tiro" || e.c === "Colpo di testa") && e.o === "+"],
  ["ast", "Assist", "att", e => e.c === "Assist"],
  ["kp", "Occasioni create", "att", e => (e.c === "Occasione creata" || e.c === "Filtrante") && e.o === "+"],
  ["prog", "Passaggi progressivi", "pos", e => (e.c === "Passaggio progressivo" || e.c === "Cambio di gioco") && e.o === "+"],
  ["drb", "Dribbling riusciti", "pos", e => e.c === "Dribbling" && e.o === "+"],
  ["crs", "Cross riusciti", "pos", e => e.c === "Cross / Assist" && e.o === "+"],
  ["loss", "Palle perse", "pos", e => e.c === "Perdita palla"],
  ["duel", "Duelli vinti", "def", e => ["Duello a terra", "Duello aereo", "Contrasto"].includes(e.c) && e.o === "+"],
  ["rec", "Recuperi", "def", e => ["Recupero palla", "Lettura / Anticipo", "Chiusura"].includes(e.c) && e.o === "+"],
  ["press", "Pressioni riuscite", "def", e => ["Pressing", "Contropressing"].includes(e.c) && e.o === "+"]
];
const MXG = { att: ["Attacco", "#E07A3F"], pos: ["Possesso", "#2F8F9D"], def: ["Difesa", "#5C7A29"] };
function shotXG(e) {
  if (e.c === "Rigore") return 0.76; if (!(e.c === "Tiro" || e.c === "Colpo di testa")) return 0;
  const q = window.zoneOf ? zoneOf(e.z) : null; let x = 0.08;
  if (q) { if (q.s === 5) x = q.c === 2 ? 0.3 : (q.c === 1 || q.c === 3) ? 0.15 : 0.05; else if (q.s === 4) x = q.c === 2 ? 0.07 : 0.04; else x = 0.02; }
  return e.c === "Colpo di testa" ? x * 0.6 : x;
}
function minutesIn(m, pid) { const pp = ((m.post || {}).players || {})[pid] || {}; const v = +pp.minutes; return v > 0 ? v : matchMinutes(m, pid) || 90; }
function playerData(pid) {
  const out = { mins: 0, matches: 0, ev: [], cnt: {}, tot: {} }; MX.forEach(([k]) => { out.cnt[k] = 0; out.tot[k] = 0; });
  for (const [, m] of S.matches) { const pe = (m.events || []).filter(e => e.p === pid); if (!pe.length) continue; out.matches++; out.mins += minutesIn(m, pid); out.ev.push(...pe); }
  for (const e of out.ev) { for (const [k, , , f] of MX) if (f && f(e)) out.cnt[k]++; out.cnt.xg += shotXG(e); if (["Duello a terra", "Duello aereo", "Contrasto"].includes(e.c)) out.tot.duel++; if (e.c === "Dribbling") out.tot.drb++; if (e.c === "Cross / Assist") out.tot.crs++; }
  out.p90 = {}; MX.forEach(([k]) => out.p90[k] = out.mins ? out.cnt[k] / out.mins * 90 : 0);
  return out;
}
function percentiles(pid) {
  const p = P(pid); const g = roleGroup(mainRole(p)); const me = playerData(pid); if (me.mins < 60) return { me, n: 0 };
  const peers = [...S.players.keys()].filter(id => id !== pid && roleGroup(mainRole(P(id))) === g).map(playerData).filter(d => d.mins >= 60);
  if (peers.length < 4) return { me, n: peers.length };
  const res = {}; for (const [k] of MX) { const v = me.p90[k]; const vals = peers.map(d => d.p90[k]); const inv = k === "loss"; const below = vals.filter(x => inv ? x > v : x < v).length, eq = vals.filter(x => x === v).length; res[k] = Math.round((below + eq / 2) / vals.length * 100); }
  return { me, n: peers.length, pc: res };
}
// ruota dei percentili (stile «pizza»)
function pizza(rows) { // rows: [{label, value(0-100), sub, color}]
  const N = rows.length; if (!N) return ""; const cx = 150, cy = 150, r0 = 26, R = 112; let s = "";
  rows.forEach((r, i) => { const a0 = -Math.PI / 2 + i * 2 * Math.PI / N + 0.025, a1 = -Math.PI / 2 + (i + 1) * 2 * Math.PI / N - 0.025; const rr = r0 + (R - r0) * Math.max(0.04, r.value / 100);
    const arc = (rad, a, b) => `${cx + rad * Math.cos(a)},${cy + rad * Math.sin(a)}`; const big = a1 - a0 > Math.PI ? 1 : 0;
    s += `<path d="M${arc(r0, a0)} L${arc(R, a0)} A${R},${R} 0 ${big} 1 ${arc(R, a1)} L${arc(r0, a1)} A${r0},${r0} 0 ${big} 0 ${arc(r0, a0)}Z" fill="var(--sunk)"/>`;
    s += `<path d="M${arc(r0, a0)} L${arc(rr, a0)} A${rr},${rr} 0 ${big} 1 ${arc(rr, a1)} L${arc(r0, a1)} A${r0},${r0} 0 ${big} 0 ${arc(r0, a0)}Z" fill="${r.color}" opacity="${0.55 + 0.45 * r.value / 100}"><title>${esc(r.label)}: ${r.value}</title></path>`;
    const am = (a0 + a1) / 2, lx = cx + (R + 22) * Math.cos(am), ly = cy + (R + 22) * Math.sin(am); const anchor = Math.cos(am) > 0.3 ? "start" : Math.cos(am) < -0.3 ? "end" : "middle";
    s += `<text x="${lx}" y="${ly - 2}" text-anchor="${anchor}" font-size="10.5" fill="var(--ink)">${esc(r.label)} <tspan font-weight="800" fill="${r.color}">${r.value}</tspan></text>${r.sub != null ? `<text x="${lx}" y="${ly + 10}" text-anchor="${anchor}" font-size="9" fill="var(--muted)">${esc(r.sub)}</text>` : ""}`; });
  [25, 50, 75].forEach(q => s += `<circle cx="${cx}" cy="${cy}" r="${r0 + (R - r0) * q / 100}" fill="none" stroke="var(--line)" stroke-dasharray="2 3"/>`);
  return `<svg viewBox="-60 -10 420 320" class="pizza" role="img" aria-label="${t("Percentili")}">${s}<circle cx="${cx}" cy="${cy}" r="${r0 - 2}" fill="var(--surface)"/></svg>`;
}
// mappa di calore sfumata (canvas disegnato dopo il rendering)
function smoothHeat(points, key) {
  if (!points.length) return `<p class="m">${t("Aggiungi la zona alle azioni (con «Dettagli») per vedere la mappa.")}</p>`;
  const Lc = "rgba(23,34,28,.45)";
  return `<div class="heatwrap"><canvas class="heatc" width="420" height="272" data-pts="${esc(JSON.stringify(points.map(z => [Math.round(z.x), Math.round(z.y)])))}"></canvas>
   <svg viewBox="0 0 105 68" class="heatlines" aria-hidden="true"><g fill="none" stroke="${Lc}" stroke-width=".45"><rect x=".3" y=".3" width="104.4" height="67.4" rx="1"/><line x1="52.5" y1="0" x2="52.5" y2="68"/><circle cx="52.5" cy="34" r="9.15"/><rect x="0" y="13.84" width="16.5" height="40.32"/><rect x="88.5" y="13.84" width="16.5" height="40.32"/><rect x="0" y="24.84" width="5.5" height="18.32"/><rect x="99.5" y="24.84" width="5.5" height="18.32"/></g><text x="103" y="66" font-size="3" text-anchor="end" fill="${Lc}">${t("attacco")} →</text></svg></div><p class="m">${t("{n} azioni con zona", { n: points.length })}</p>`;
}
function drawHeat(cv) {
  let pts; try { pts = JSON.parse(cv.dataset.pts || "[]"); } catch (e) { pts = []; } cv.removeAttribute("data-pts");
  const W = cv.width, H = cv.height, g = cv.getContext("2d"), acc = new Float32Array(W * H); const rad = 34;
  for (const [x, y] of pts) { const px = x / 100 * W, py = y / 100 * H; for (let j = Math.max(0, py - rad | 0); j < Math.min(H, py + rad); j++) for (let i = Math.max(0, px - rad | 0); i < Math.min(W, px + rad); i++) { const d2 = ((i - px) ** 2 + (j - py) ** 2) / (rad * rad); if (d2 < 1) acc[j * W + i] += Math.exp(-d2 * 3.2); } }
  let mx = 0; for (const v of acc) if (v > mx) mx = v; const img = g.createImageData(W, H);
  const ramp = [[0, [70, 190, 90, 0]], [0.12, [70, 190, 90, 120]], [0.4, [150, 210, 70, 170]], [0.62, [245, 215, 60, 200]], [0.82, [245, 140, 50, 215]], [1, [220, 50, 40, 230]]];
  for (let k = 0; k < acc.length; k++) { const v = mx ? acc[k] / mx : 0; let c = ramp[0][1]; for (let r = 1; r < ramp.length; r++) if (v <= ramp[r][0]) { const [a0, c0] = ramp[r - 1], [a1, c1] = ramp[r]; const f = (v - a0) / (a1 - a0); c = c0.map((x, i) => x + (c1[i] - x) * f); break; }
    img.data[k * 4] = c[0]; img.data[k * 4 + 1] = c[1]; img.data[k * 4 + 2] = c[2]; img.data[k * 4 + 3] = c[3]; }
  g.putImageData(img, 0, 0);
}
window.afterRender = (orig => async function () { $$("canvas.heatc[data-pts]").forEach(drawHeat); return orig.apply(this, arguments); })(window.afterRender);

/* ---------- percorso di carriera ---------- */
const CK = { y: ["Settore giovanile", "var(--blue)"], p: ["Prima squadra", "var(--accent)"], l: ["Prestito", "var(--amber)"] };
function careerTimeline(car) {
  if (!car || !car.length) return "";
  const now = new Date().getFullYear() + (new Date().getMonth() >= 6 ? 1 : 0); const ys = car.map(c => +c.from).filter(Boolean); const y0 = Math.min(...ys), y1 = Math.max(now, ...car.map(c => +c.to || now)); const span = Math.max(1, y1 - y0);
  const rows = car.slice().sort((a, b) => (+a.from || 0) - (+b.from || 0));
  return `<div class="ctl">${rows.map(c => { const a = ((+c.from || y0) - y0) / span * 100, w = Math.max(3, (((+c.to || y1) - (+c.from || y0)) / span) * 100); const k = CK[c.kind] || CK.p;
    return `<div class="ctr"><span class="ctn">${esc(c.club)}</span><div class="ctb"><i style="left:${a}%;width:${Math.min(w, 100 - a)}%;background:${k[1]}" title="${esc(c.club)} ${esc(c.from || "")}–${esc(c.to || "")}"></i></div><span class="cty mono">${esc(c.from || "")}–${esc(c.to ? String(c.to).slice(-2) : "")}</span></div>`; }).join("")}
   <div class="ctaxis mono"><span>${y0}</span><span>${y1}</span></div><div class="row small" style="margin-top:4px">${Object.values(CK).map(([n, col]) => `<span class="row" style="gap:4px"><i style="display:inline-block;width:12px;height:8px;border-radius:2px;background:${col}"></i>${t(n)}</span>`).join("")}</div></div>`;
}
function careerTable(car) {
  if (!car || !car.length) return ""; const any = car.some(c => c.apps || c.goals || c.ast || c.min);
  return `<div class="tw" style="margin-top:10px"><table><thead><tr><th>${t("Stagioni")}</th><th>${t("Squadra")}</th><th>${t("Tipo")}</th>${any ? `<th class="n">${t("Pres.")}</th><th class="n">${t("Gol")}</th><th class="n">${t("Assist")}</th><th class="n">${t("Minuti")}</th>` : ""}</tr></thead><tbody>${car.slice().sort((a, b) => (+b.from || 0) - (+a.from || 0)).map(c => `<tr><td class="mono">${esc(c.from || "")}–${esc(c.to || "")}</td><td><b>${esc(c.club)}</b>${c.league ? ` <span class="m">${esc(c.league)}</span>` : ""}</td><td>${esc(t((CK[c.kind] || CK.p)[0]))}</td>${any ? `<td class="n">${esc(c.apps ?? "")}</td><td class="n">${esc(c.goals ?? "")}</td><td class="n">${esc(c.ast ?? "")}</td><td class="n">${esc(c.min ?? "")}</td>` : ""}</tr>`).join("")}</tbody></table></div>`;
}
function careerSheet(pid) {
  const p = P(pid); let rows = clone(p.career || []);
  const draw = () => { $("#carRows").innerHTML = rows.map((c, i) => `<div class="carrow" data-i="${i}"><input type="number" data-k="from" value="${esc(c.from)}" placeholder="${t("Dal")}"><input type="number" data-k="to" value="${esc(c.to)}" placeholder="${t("Al")}"><input type="text" data-k="club" value="${esc(c.club)}" placeholder="${t("Squadra")}"><select data-k="kind">${Object.entries(CK).map(([k, [n]]) => `<option value="${k}" ${c.kind === k ? "selected" : ""}>${esc(t(n))}</option>`).join("")}</select><input type="number" data-k="apps" value="${esc(c.apps)}" placeholder="${t("Pres.")}"><input type="number" data-k="goals" value="${esc(c.goals)}" placeholder="${t("Gol")}"><input type="number" data-k="ast" value="${esc(c.ast)}" placeholder="${t("Assist")}"><button class="btn sm ghost" data-rm="${i}">✕</button></div>`).join(""); };
  const read = () => { $$("#carRows .carrow").forEach(r => { const c = rows[+r.dataset.i]; r.querySelectorAll("[data-k]").forEach(x => { c[x.dataset.k] = x.value; }); }); };
  sheet(`<h2>${t("Percorso di carriera")}: ${esc(pname(p))}</h2><p class="sub small">${t("Una riga per squadra: anni, squadra, tipo. Presenze, gol e assist sono facoltativi.")}</p><div id="carRows" class="col" style="gap:6px"></div>
   <div class="row between"><button class="btn sm" id="carAdd">+ ${t("Aggiungi squadra")}</button><div class="row"><button class="btn" data-a="closeSheetBtn">${t("Annulla")}</button><button class="btn pri" id="carSave">${t("Salva")}</button></div></div>`, true);
  draw(); $("#carAdd").onclick = () => { read(); rows.push({ from: "", to: "", club: "", kind: "p" }); draw(); };
  $("#carRows").onclick = e => { const b = e.target.closest("[data-rm]"); if (!b) return; read(); rows.splice(+b.dataset.rm, 1); draw(); };
  $("#carSave").onclick = () => { read(); put("players", pid, { ...P(pid), career: rows.filter(r => r.club) }); closeSheet(); render(true); };
}
A.editCareer = el => careerSheet(el.dataset.id);

/* ---------- scheda «Analisi» ---------- */
function analysisTab(id, p) {
  const d = playerData(id), pc = percentiles(id); const evs = playerEvals(id).map(x => x[1]).sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  const f2 = v => (Math.round(v * 100) / 100).toLocaleString(locale ? locale() : "it-IT"); const succ = d.ev.filter(e => evOutcome(e) === "+").length, judged = d.ev.filter(e => evOutcome(e) === "+" || evOutcome(e) === "-").length;
  const tiles = [[d.matches, t("Partite osservate")], [d.mins, t("Minuti")], [d.ev.length, t("Azioni registrate")], [judged ? Math.round(succ / judged * 100) + "%" : "—", t("% riuscita")]];
  const rows = MX.map(([k, l, g]) => [k, t(l), g, d.cnt[k], d.p90[k]]);
  const pz = pc.pc ? pizza(MX.filter(([k]) => k !== "loss").map(([k, l, g]) => ({ label: t(l), value: pc.pc[k], sub: f2(d.p90[k]), color: MXG[g][1] }))) : "";
  const stats = (p.stats || []).slice(-1)[0]; let impPc = "";
  if (stats) { const same = [...S.players.values()].map(x => (x.stats || []).find(s => s.label === stats.label)).filter(Boolean); if (same.length >= 5) { const keys = Object.keys(stats.data).filter(k => !isNaN(parseFloat(String(stats.data[k]).replace(",", ".")))).slice(0, 12); const num = v => parseFloat(String(v).replace(",", "."));
      impPc = `<h3 style="margin-top:14px">${t("Percentili sulle statistiche importate")} · ${esc(stats.label)} <span class="m">(${same.length})</span></h3><div class="pcbars">${keys.map(k => { const v = num(stats.data[k]); const vals = same.map(s => num(s.data[k])).filter(x => !isNaN(x)); const q = Math.round(vals.filter(x => x < v).length / Math.max(1, vals.length - 1) * 100); return `<div class="pcb"><span>${esc(k)}</span><div class="bar"><i style="width:${q}%;background:${q >= 75 ? "var(--good)" : q >= 40 ? "var(--amber)" : "var(--bad)"}"></i></div><b class="mono">${q}</b><span class="m mono">${esc(stats.data[k])}</span></div>`; }).join("")}</div>`; } }
  const zones = d.ev.filter(e => e.z).map(e => e.z);
  const trend = evs.map(e => ({ label: fmtDate(e.date).slice(0, 5), v: evalRating(e) })).filter(x => x.v != null);
  return `<section class="panel"><h2>${t("Analisi delle prestazioni")}</h2><p class="sub small">${t("Calcolata solo sulle partite che hai visto e sulle azioni che hai registrato: è il tuo lavoro, non quello di un fornitore di dati.")}</p>
   <div class="stats" style="margin-top:10px">${tiles.map(([v, l]) => `<div class="stat"><b>${v}</b><span>${l}</span></div>`).join("")}</div></section>
  <div class="grid2"><section class="panel"><h2>${t("Per 90 minuti")}</h2><div class="tw" style="margin-top:8px"><table><thead><tr><th>${t("Metrica")}</th><th class="n">${t("Totale")}</th><th class="n">${t("Per 90")}</th>${pc.pc ? `<th class="n">${t("Percentile")}</th>` : ""}</tr></thead><tbody>${rows.map(([k, l, g, c, v]) => `<tr><td><i class="gdot" style="background:${MXG[g][1]}"></i>${esc(l)}</td><td class="n">${k === "xg" ? f2(c) : c}</td><td class="n">${f2(v)}</td>${pc.pc ? `<td class="n"><b style="color:${pc.pc[k] >= 75 ? "var(--good)" : pc.pc[k] >= 40 ? "var(--amber)" : "var(--bad)"}">${pc.pc[k]}</b></td>` : ""}</tr>`).join("")}
    ${d.tot.duel ? `<tr><td>${t("Duelli vinti")} %</td><td class="n" colspan="${pc.pc ? 3 : 2}">${Math.round(d.cnt.duel / d.tot.duel * 100)}%</td></tr>` : ""}${d.tot.drb ? `<tr><td>${t("Dribbling riusciti")} %</td><td class="n" colspan="${pc.pc ? 3 : 2}">${Math.round(d.cnt.drb / d.tot.drb * 100)}%</td></tr>` : ""}</tbody></table></div>
    <p class="m" style="margin-top:6px">${t("xG stimato: probabilità media di gol dei tiri in base alla zona (area piccola e centro area valgono di più). È una stima del tuo registro, non un dato ufficiale.")}</p></section>
   <section class="panel"><h2>${t("Percentili")}</h2>${pz ? `<p class="sub small">${t("Per 90 minuti rispetto ad altri {n} giocatori dello stesso reparto che hai osservato almeno 60 minuti.", { n: pc.n })}</p><div class="pizzabox">${pz}</div><div class="row small">${Object.values(MXG).map(([n, col]) => `<span class="row" style="gap:4px"><i class="gdot" style="background:${col}"></i>${t(n)}</span>`).join("")}</div>` : `<p class="m" style="margin-top:8px">${t("Servono almeno 60 minuti osservati per lui e altri 4 giocatori dello stesso reparto nel tuo archivio.")}${pc.n ? " " + t("Ora: {n}.", { n: pc.n }) : ""}</p>`}${impPc}</section></div>
  <div class="grid2"><section class="panel"><h2>${t("Mappa di calore")}</h2>${smoothHeat(zones)}</section>
   <section class="panel"><h2>${t("Andamento delle valutazioni")}</h2>${trend.length >= 2 ? lineChart(trend) : `<p class="m">${t("Servono almeno 2 valutazioni.")}</p>`}</section></div>
  <section class="panel"><div class="row between"><h2>${t("Percorso di carriera")}</h2><button class="btn sm noprint" data-a="editCareer" data-id="${id}">${t("Modifica")}</button></div>${careerTimeline(p.career) || `<p class="m" style="margin-top:8px">${t("Aggiungi le squadre in cui ha giocato per vedere il suo percorso.")}</p>`}${careerTable(p.career)}</section>`;
}

/* ---------- scheda «Report»: la presentazione per direttore sportivo e capo scout ---------- */
function reportTab(id, p) {
  const pr = profile(id), pj = latestProj(id), d = playerData(id), prof = Profile.get(); const c = p.contract || {};
  const evs = playerEvals(id).map(x => x[1]); const areas = visAreas(p); const attr = [];
  for (const a of areas) for (const x of visParams(p, a)) { const v = (pr.attr[a.id] || {})[x.id]; if (v != null) attr.push([L(x), v, isKeyParam(p, a.id, x.id)]); }
  const top = attr.slice().sort((a, b) => b[1] - a[1]).slice(0, 4), low = attr.filter(x => x[2]).sort((a, b) => a[1] - b[1]).slice(0, 3);
  const ms = [...S.matches.entries()].filter(([, m]) => (m.events || []).some(e => e.p === id) || (m.targets || []).includes(id)).sort((a, b) => (b[1].date || "").localeCompare(a[1].date || "")).slice(0, 6);
  const facts = [[t("Ruolo"), [mainRole(p), ...(p.roles || []).slice(1)].filter(Boolean).map(roleL).join(", ") + (p.archetype ? " · " + archL(p.archetype) : "")], [t("Età"), age(p) != null ? t("{n} anni", { n: age(p) }) + (p.birth ? " (" + fmtDate(p.birth) + ")" : "") : "—"], [t("Nazionalità"), [p.nat, p.nat2].filter(Boolean).join(" / ") || "—"], [t("Club attuale"), (p.club || "—") + (p.league ? " · " + p.league : "")], [t("Piede"), p.foot ? t(p.foot) : "—"], [t("Altezza"), p.height ? p.height + " cm" : "—"], [t("Contratto"), c.until ? fmtDate(c.until) : "—"], [t("Valore di mercato"), c.value || "—"]];
  return `<section class="panel report-sheet"><div class="rhead"><div class="rph">${p.photo ? `<img src="${p.photo}" alt="">` : jersey(p)}</div><div class="grow"><div class="m">${t("Scouting report")}${p.org && Orgs.name(p.org) ? " · " + esc(Orgs.name(p.org)) : ""}</div><h1>${esc(pname(p))}</h1><div class="row" style="margin-top:4px">${vpill(p.verdict)}${p.level ? `<span class="pill c-good">${esc(p.level)} · ${esc(L(Cfg.level(p.level)))}</span>` : ""}${reliabilityPill(id)}</div></div><div class="rbox r-rating"><span>${t("Rating")}</span><b>${f1(pr.rating)}</b></div></div>
   <div class="rgrid"><dl class="kv">${facts.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}</dl><div>${pj ? projView(pj, true) : `<p class="m">${t("Aggiungi «Il mio giudizio: oggi e domani» in una valutazione per completare il report.")}</p>`}</div></div>
   ${p.quick ? `<p class="rquick">${esc(p.quick)}</p>` : ""}
   <div class="grid2" style="margin-top:12px"><div><h3>${t("Punti di forza")}</h3><ul class="rlist good">${[...(p.pros || []), ...top.map(x => `${x[0]} ${f1(x[1])}`)].slice(0, 6).map(x => `<li>${esc(x)}</li>`).join("") || "<li>—</li>"}</ul></div><div><h3>${t("Dove deve migliorare")}</h3><ul class="rlist bad">${[...(p.cons || []), ...low.map(x => `${x[0]} ${f1(x[1])}`)].slice(0, 5).map(x => `<li>${esc(x)}</li>`).join("") || "<li>—</li>"}</ul></div></div>
   <div class="grid2" style="margin-top:12px"><div><h3>${t("Rating per area")}</h3>${areas.map(a => pr.area[a.id] != null ? `<div class="pb"><div class="lab"><span>${esc(L(a))}</span><span class="mono">${f1(pr.area[a.id])}</span></div><div class="bar"><i style="width:${pct(pr.area[a.id]) * 100}%"></i></div></div>` : "").join("") || `<p class="m">${t("Nessuna valutazione.")}</p>`}</div><div><h3>${t("Mappa di calore")}</h3>${smoothHeat(d.ev.filter(e => e.z).map(e => e.z))}</div></div>
   ${p.career && p.career.length ? `<h3 style="margin-top:12px">${t("Percorso di carriera")}</h3>${careerTimeline(p.career)}` : ""}
   <h3 style="margin-top:12px">${t("Partite osservate")}</h3><div class="tw"><table><thead><tr><th>${t("Data")}</th><th>${t("Partita")}</th><th class="n">${t("Minuti")}</th><th class="n">${t("Voto")}</th></tr></thead><tbody>${ms.map(([mid, m]) => { const pp = ((m.post || {}).players || {})[id] || {}; const ev = evs.find(e => e.matchId === mid); return `<tr><td class="mono">${fmtDate(m.date)}</td><td>${esc(m.home)} – ${esc(m.away)}${m.score ? " " + esc(m.score) : ""}</td><td class="n">${(m.events || []).some(e => e.p === id) ? minutesIn(m, id) : "—"}</td><td class="n">${pp.grade ? f1(+pp.grade) : ev ? f1(evalRating(ev)) : "—"}</td></tr>`; }).join("") || `<tr><td colspan="4" class="m">${t("Nessuna partita.")}</td></tr>`}</tbody></table></div>
   <div class="rsign"><div>${prof.signature ? `<img src="${prof.signature}" alt="${t("Firma")}">` : ""}<div><b>${esc(prof.name || "")}</b>${prof.title ? " · " + esc(prof.title) : ""}</div><div class="m">${t("Data")}: ${fmtDate(today())}${evs.some(e => e.signature) ? " · ✍ " + t("{n} valutazioni firmate", { n: evs.filter(e => e.signature).length }) : ""}</div></div></div>
   <div class="row end noprint" style="margin-top:10px"><button class="btn" data-a="print">${t("Stampa / PDF")}</button><button class="btn pri" data-a="shareItem" data-kind="player" data-id="${id}">${ico("share")} ${t("Condividi")}</button></div></section>`;
}
// scheda «Profilo»: in cima il giudizio di oggi e domani
window.ptab = (orig => function (id, p, pr) {
  if (ui.ptab === "analisi") return analysisTab(id, p); if (ui.ptab === "report") return reportTab(id, p);
  const h = orig(id, p, pr); if (false) { const pj = latestProj(id); if (pj) return `<section class="panel"><h2>${t("Oggi e domani")}</h2>${projView(pj)}</section>` + h; }
  return h;
})(window.ptab);
// nuove schede del giocatore: Report per prima dopo Profilo, Analisi dopo Partite e azioni
window.playerPage = (orig => function (id) {
  let h = orig(id); const tb = (k, n) => `<button data-a="ptab" data-t="${k}" aria-pressed="${ui.ptab === k}">${n}</button>`;
  h = h.replace(/(<button data-a="ptab" data-t="profilo"[^>]*>[^<]*<\/button>)/, `$1${tb("report", t("Report"))}`).replace(/(<button data-a="ptab" data-t="azioni"[^>]*>[^<]*<\/button>)/, `$1${tb("analisi", t("Analisi"))}`);
  return h;
})(window.playerPage);

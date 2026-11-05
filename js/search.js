"use strict";
/* =========================================================
   MM Scout — ricerca intelligente: tollera errori di
   battitura, propone il nome più vicino, capisce le date
   (12/10, 12.10.2026, ottobre 2026, oggi…) in 4 lingue.
   ========================================================= */
const Search = {
  norm(s) { return String(s || "").toLowerCase().replace(/đ/g, "dj").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9/.\- ]/g, " ").replace(/\s+/g, " ").trim(); },
  lev(a, b) { if (a === b) return 0; if (!a.length) return b.length; if (!b.length) return a.length; let prev = Array.from({ length: b.length + 1 }, (_, i) => i); for (let i = 1; i <= a.length; i++) { const cur = [i]; for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; } return prev[b.length]; },
  sim(a, b) { if (!a || !b) return 0; return 1 - this.lev(a, b) / Math.max(a.length, b.length); },
  // punteggio tra la ricerca e un testo: 1 = trovato, 0 = niente
  score(q, text) {
    const nt = this.norm(text); if (!q) return 0; if (nt.includes(q)) return 1;
    const qt = q.split(" ").filter(Boolean), words = nt.split(" ").filter(Boolean); if (!words.length) return 0; let tot = 0;
    for (const w of qt) { let best = 0; for (const x of words) { const s = x.startsWith(w) ? 0.97 : w.length >= 3 ? this.sim(w, x.slice(0, Math.max(w.length, x.length))) : 0; if (s > best) best = s; } tot += best; }
    return tot / qt.length;
  },
  MONTHS: { enero: 1, febrero: 2, abril: 4, mayo: 5, junio: 6, julio: 7, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12, gennaio: 1, febbraio: 2, marzo: 3, aprile: 4, maggio: 5, giugno: 6, luglio: 7, agosto: 8, settembre: 9, ottobre: 10, novembre: 11, dicembre: 12, january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12, januar: 1, februar: 2, marz: 3, mai: 5, juni: 6, juli: 7, oktober: 10, dezember: 12, jun: 6, jul: 7, avgust: 8, septembar: 9, oktobar: 10, novembar: 11, decembar: 12, mart: 3, maj: 5, gen: 1, feb: 2, mar: 3, apr: 4, mag: 5, giu: 6, lug: 7, ago: 8, set: 9, ott: 10, nov: 11, dic: 12, jan: 1, aug: 8, sep: 9, oct: 10, okt: 10, dec: 12, dez: 12, sept: 9 },
  // riconosce una data o un periodo nella ricerca; restituisce {from,to,rest}
  date(q) {
    const pad = n => String(n).padStart(2, "0"); const now = new Date(); const Y = now.getFullYear(); const iso = d => d.toISOString().slice(0, 10);
    const rel = { hoy: 0, ayer: -1, manana: 1, oggi: 0, today: 0, heute: 0, danas: 0, ieri: -1, yesterday: -1, gestern: -1, juce: -1, domani: 1, tomorrow: 1, morgen: 1, sutra: 1 };
    let m, rest = q;
    for (const [w, d] of Object.entries(rel)) if (new RegExp("(^| )" + w + "( |$)").test(q)) { const x = new Date(); x.setDate(x.getDate() + d); return { from: iso(x), to: iso(x), rest: q.replace(w, "").trim(), label: fmtDate(iso(x)) }; }
    if ((m = q.match(/(\d{4})-(\d{1,2})-(\d{1,2})/))) { const s = `${m[1]}-${pad(m[2])}-${pad(m[3])}`; return { from: s, to: s, rest: q.replace(m[0], "").trim(), label: fmtDate(s) }; }
    if ((m = q.match(/(^| )(\d{1,2})[/.](\d{1,2})(?:[/.](\d{2,4}))?( |$)/))) { const yy = m[4] ? (m[4].length === 2 ? 2000 + +m[4] : +m[4]) : null; const mm = +m[3], dd = +m[2]; if (mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31) { const s = yy ? `${yy}-${pad(mm)}-${pad(dd)}` : `-${pad(mm)}-${pad(dd)}`; return { exact: s, rest: q.replace(m[0], " ").trim(), label: `${pad(dd)}/${pad(mm)}${yy ? "/" + yy : ""}` }; } }
    if ((m = q.match(/(\d{4})-(\d{1,2})(?!\d|-)/))) { const s = `${m[1]}-${pad(m[2])}`; return { from: s + "-01", to: s + "-31", rest: q.replace(m[0], "").trim(), label: s }; }
    for (const w of q.split(" ")) { if (this.MONTHS[w]) { const mo = this.MONTHS[w]; const ym = q.match(/(^| )(\d{4})( |$)/); const yy = ym ? +ym[2] : null; rest = q.replace(w, "").replace(ym ? ym[2] : "@@", "").trim(); return yy ? { from: `${yy}-${pad(mo)}-01`, to: `${yy}-${pad(mo)}-31`, rest, label: `${w} ${yy}` } : { month: pad(mo), rest, label: w }; } }
    if ((m = q.match(/^(\d{4})$/))) return { from: `${m[1]}-01-01`, to: `${m[1]}-12-31`, rest: "", label: m[1], yearOnly: true };
    return null;
  },
  inDate(d, dt) { if (!d) return false; if (dt.exact) return dt.exact.startsWith("-") ? d.slice(4) === dt.exact : d === dt.exact; if (dt.month) return d.slice(5, 7) === dt.month; return d >= dt.from && d <= dt.to; },
  vocab() { const v = new Set(); for (const p of S.players.values()) { [p.first, p.last, p.alias, p.club, pname(p)].forEach(x => x && v.add(x)); } for (const m of S.matches.values()) { [m.home, m.away, m.competition, m.venue].forEach(x => x && v.add(x)); } for (const l of S.lists.values()) l.name && v.add(l.name); return [...v]; },
  suggest(q) { const nq = this.norm(q); if (nq.length < 3) return []; const out = []; for (const w of this.vocab()) { const nw = this.norm(w); const s = Math.max(this.sim(nq, nw), ...nw.split(" ").map(x => this.sim(nq, x))); if (s >= 0.55 && s < 1) out.push([w, s]); } return out.sort((a, b) => b[1] - a[1]).slice(0, 4).map(x => x[0]); },
  run(raw) {
    const q0 = this.norm(raw); const dt = this.date(q0); const q = dt ? this.norm(dt.rest) : q0; const TH = 0.78; const res = { players: [], matches: [], evals: [], lists: [], media: [] };
    const take = (arr, id, o, s) => { if (s >= TH) arr.push([id, o, s]); };
    if (!dt || (q && !dt.yearOnly)) for (const [id, p] of S.players) { if (!q) break; const roles = (p.roles || []).map(roleL).join(" "); const tags = (p.tags || []).map(x => (Cfg.tag(x) || {}).name).join(" ");
      const main = Math.max(this.score(q, pname(p)), this.score(q, p.alias), this.score(q, (p.last || "") + " " + (p.first || "")));
      const other = Math.max(this.score(q, [p.club, p.league, p.nat, p.nat2, roles, tags, (p.contract || {}).agent, p.birthCity].join(" ")), this.norm(p.notes + " " + p.quick + " " + (p.relations || []).map(r => r.title + " " + r.text).join(" ")).includes(q) ? 0.9 : 0);
      take(res.players, id, p, Math.max(main, other * 0.98)); }
    for (const [id, m] of S.matches) { if (dt && !this.inDate(m.date, dt)) continue; const s = q ? this.score(q, [m.home, m.away, m.competition, m.venue, m.goal, m.notes, (m.targets || []).map(x => pname(P(x))).join(" ")].join(" ")) : 1; take(res.matches, id, m, s); }
    for (const [id, e] of S.evals) { if (dt && !this.inDate(e.date, dt)) continue; const s = q ? Math.max(this.score(q, pname(P(e.playerId))), this.score(q, [e.home, e.away, e.by].join(" ")), this.norm([e.summary, ...Object.values(e.notes || {}), ...(e.evidence || []).map(x => x.text)].join(" ")).includes(q) ? 0.9 : 0) : 1; take(res.evals, id, e, s); }
    if (!dt) { for (const [id, l] of S.lists) take(res.lists, id, l, q ? this.score(q, l.name + " " + (l.note || "")) : 0); for (const [id, m] of S.media) take(res.media, id, m, q ? this.score(q, m.name + " " + (m.note || "")) : 0); }
    for (const k in res) res[k].sort((a, b) => b[2] - a[2] || ((b[1].date || "").localeCompare(a[1].date || "")));
    const exact = Object.values(res).some(a => a.some(x => x[2] >= 0.97));
    return { res, dt, sugg: exact ? [] : this.suggest(dt ? dt.rest : raw), fuzzy: !exact && Object.values(res).some(a => a.length) };
  }
};
R.cerca = () => {
  const raw = ui.q.trim(); const tab = ui.stab || "all";
  if (raw.length < 2) return `<div class="head"><div><h1>${t("Cerca")}</h1><p class="sub">${t("Cerca per nome (anche scritto male), club, ruolo, nazionalità, partita, competizione, tag, note o data: «12/10», «ottobre 2026», «oggi».")}</p></div></div><div class="empty">${t("Scrivi almeno 2 lettere nella barra in alto.")}</div>`;
  const { res, dt, sugg, fuzzy } = Search.run(raw);
  const tabs = [["all", t("Tutto")], ["players", t("Giocatori")], ["matches", t("Partite")], ["evals", t("Valutazioni")], ["lists", t("Liste")], ["media", t("Multimedia")]];
  const n = k => k === "all" ? Object.values(res).reduce((s, a) => s + a.length, 0) : res[k].length;
  const show = k => tab === "all" || tab === k;
  const sec = (k, title, fn) => show(k) && res[k].length ? `<section class="panel"><h2>${title} <span class="m">${res[k].length}</span></h2><div class="list">${res[k].slice(0, tab === "all" ? 8 : 60).map(fn).join("")}</div>${tab === "all" && res[k].length > 8 ? `<button class="btn sm ghost" data-a="searchTab" data-t="${k}">${t("Vedi tutti")}</button>` : ""}</section>` : "";
  return `<div class="head"><div><h1>${t("Cerca")}</h1><p class="sub">${t("{n} risultati per «{q}»", { n: n("all"), q: esc(raw) })}${dt ? " · " + t("data: {d}", { d: esc(dt.label) }) : ""}</p></div></div>
   ${sugg.length ? `<div class="banner info row">${fuzzy ? t("Forse cercavi:") : t("Nessun risultato esatto. Forse cercavi:")} ${sugg.map(s => `<button class="chip" data-a="searchSet" data-q="${esc(s)}">${esc(s)}</button>`).join("")}</div>` : ""}
   <div class="tabs">${tabs.map(([k, l]) => `<button data-a="searchTab" data-t="${k}" aria-pressed="${tab === k}">${l} (${n(k)})</button>`).join("")}</div>
   ${sec("players", t("Giocatori"), ([id, p]) => playerItem(id, p))}
   ${sec("matches", t("Partite"), ([id, m]) => matchItem(id, m))}
   ${sec("evals", t("Valutazioni"), ([id, e]) => evalItem(id, e, true))}
   ${sec("lists", t("Liste"), ([id, l]) => `<div class="item click" data-a="openList" data-id="${id}"><span class="tag" style="color:${esc(l.color)}"><i></i></span><div class="grow t">${esc(listPath(id).map(x => x[1].name).join(" › "))}</div></div>`)}
   ${sec("media", t("Multimedia"), ([id, m]) => `<div class="item click" data-a="openMedia" data-id="${id}"><span class="code">${esc(mediaKindL(m.kind))}</span><div class="grow t">${esc(m.name)}</div></div>`)}
   ${!n("all") ? `<div class="empty">${t("Nessun risultato.")}</div>` : ""}`;
};
Object.assign(A, {
  searchTab: el => { ui.stab = el.dataset.t; $("#view").innerHTML = R.cerca(); },
  searchSet: el => { ui.q = el.dataset.q; const g = $("#gq"); if (g) g.value = ui.q; $("#view").innerHTML = R.cerca(); }
});

"use strict";
/* =========================================================
   MM Scout 5.6 — ordine e semplicità
   · menu laterale per fasi di lavoro · area «Dati»
   · ricerca per categoria e per reparto, a lista o a griglia
   · calendario: tocca un giorno per aprire o creare
   · partita guidata passo per passo
   · creazione veloce di giocatori, salto tra le sezioni
   · nazionalità di tutto il mondo · campi allineati
   · profili ideali: aderenza all'ideale (100% solo se tutto è
     al livello ideale), creazione guidata dallo staff
   · confronto e squadra ombra più semplici
   ========================================================= */

/* ---------- menu laterale: per fasi di lavoro ---------- */
ICONS.dati = '<path d="M4 20V4h2v14h14v2zm4-4v-5h3v5zm5 0V7h3v9zm5 0v-7h3v7z"/>';
const NAV_GROUPS = [["Lavoro sul campo", ["panoramica", "calendario", "partite", "giocatori", "report"]], ["Con lo staff", ["staff", "profili", "confronto", "squadre", "liste"]], ["Analisi", ["dati", "attivita"]], ["Il mio profilo", ["portfolio", "profilo", "archivio", "impostazioni"]]];
window.views = (orig => function () { const all = orig().filter(v => v !== "-"); all.push(["dati", t("Dati")]); const by = Object.fromEntries(all.map(v => [v[0], v])); const out = []; NAV_GROUPS.forEach(([g, ids], i) => { if (i) out.push("-"); ids.forEach(id => by[id] && out.push(by[id])); }); all.forEach(v => { if (!out.includes(v)) out.push(v); }); return out; })(window.views);
window.renderShell = (orig => function () { orig(); const seps = $$("#side .nav .sep"); const nav = $("#side .nav"); if (!nav) return; nav.insertAdjacentHTML("afterbegin", `<div class="navh">${t(NAV_GROUPS[0][0])}</div>`); seps.forEach((s, i) => { s.outerHTML = `<div class="navh">${t((NAV_GROUPS[i + 1] || [""])[0])}</div>`; }); })(window.renderShell);
PAGE_DESC.dati = "Le prestazioni di tutti i giocatori osservati: numeri, storico, valutazioni e grafici, solo dai tuoi dati.";

/* ---------- pulsante della lingua: compatto ---------- */
// (stile in app.css) — mostra solo la bandiera

/* ---------- nazionalità: elenco completo nella lingua scelta ---------- */
const ISO = "AF AX AL DZ AS AD AO AI AG AR AM AW AU AT AZ BS BH BD BB BY BE BZ BJ BM BT BO BA BW BR BN BG BF BI CV KH CM CA KY CF TD CL CN CO KM CG CD CR CI HR CU CW CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FO FJ FI FR GF PF GA GM GE DE GH GI GR GL GD GP GU GT GG GN GW GY HT HN HK HU IS IN ID IR IQ IE IM IL IT JM JP JE JO KZ KE KI XK KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MQ MR MU YT MX FM MD MC MN ME MS MA MZ MM NA NR NP NL NC NZ NI NE NG MK NO OM PK PW PS PA PG PY PE PH PL PT PR QA RE RO RU RW KN LC VC WS SM ST SA SN RS SC SL SG SK SI SB SO ZA KR SS ES LK SD SR SE CH SY TW TJ TZ TH TL TG TO TT TN TR TM TC TV UG UA AE GB US UY UZ VU VA VE VN YE ZM ZW".split(" ");
const UK4 = { it: ["Inghilterra", "Scozia", "Galles", "Irlanda del Nord"], en: ["England", "Scotland", "Wales", "Northern Ireland"], de: ["England", "Schottland", "Wales", "Nordirland"], sr: ["Engleska", "Škotska", "Vels", "Severna Irska"], es: ["Inglaterra", "Escocia", "Gales", "Irlanda del Norte"] };
function nations() { const l = Prefs.lang; if (nations.c && nations.c.l === l) return nations.c.v; let v = []; try { const dn = new Intl.DisplayNames([{ it: "it", en: "en", de: "de", sr: "sr-Latn", es: "es", fr: "fr" }[l] || "it"], { type: "region" }); v = ISO.map(c => dn.of(c)).filter(Boolean); } catch (e) { v = []; } v = [...new Set([...v, ...(UK4[l] || UK4.it)])].sort((a, b) => a.localeCompare(b, l)); nations.c = { l, v }; return v; }
function natDatalist() { let d = $("#natList"); if (d && d.dataset.l === Prefs.lang) return; if (!d) { d = document.createElement("datalist"); d.id = "natList"; document.body.appendChild(d); } d.dataset.l = Prefs.lang; d.innerHTML = nations().map(n => `<option value="${esc(n)}"></option>`).join(""); }
const NAT_INPUTS = "#pNat,#pNat2,#pf_nat,#pBirthCountry,#qpNat,#qnNat";
function bindNat() { const els = $$(NAT_INPUTS); if (!els.length) return; natDatalist(); els.forEach(el => { el.setAttribute("list", "natList"); el.setAttribute("autocomplete", "off"); }); }
window.afterRender = (orig => async function () { const r = orig.apply(this, arguments); try { bindNat(); jumpBar(); } catch (e) { } return r; })(window.afterRender);
document.addEventListener("focusin", e => { if (e.target.matches && e.target.matches(NAT_INPUTS)) bindNat(); });

/* ---------- editor lunghi: barra per saltare tra le sezioni ---------- */
function jumpBar() {
  if (!(ui.pdraft || ui.edraft || ui.idraft)) return; const v = $("#view"); if (!v || v.querySelector(".jumpbar")) return;
  const secs = [...v.querySelectorAll(":scope > section.panel > h2, :scope > section.panel > .row > h2, :scope > section.panel > .areah > h2")].map(h => h.closest("section.panel")); const uniq = [...new Set(secs)]; if (uniq.length < 3) return;
  uniq.forEach((s, i) => s.id = s.id || "sec" + i);
  const bar = document.createElement("nav"); bar.className = "jumpbar noprint"; bar.setAttribute("aria-label", t("Sezioni"));
  bar.innerHTML = uniq.map(s => `<button type="button" data-jump="${s.id}">${esc((s.querySelector("h2") || {}).textContent || "")}</button>`).join("");
  const head = v.querySelector(".head"); (head || v.firstElementChild).after(bar);
}
document.addEventListener("click", e => { const b = e.target.closest && e.target.closest("[data-jump]"); if (!b) return; const s = document.getElementById(b.dataset.jump); if (s) { const y = s.getBoundingClientRect().top + window.scrollY - 70; window.scrollTo({ top: y, behavior: "smooth" }); } });

/* ---------- nuovo giocatore: prima la scheda veloce ---------- */
A.newPlayer = (orig => function (el, ev) {
  if (el && el.dataset && el.dataset.full) return orig(el, ev); closeSheet(); const c = Cfg.get();
  sheet(`<div class="row between"><h2>${t("Nuovo giocatore")}</h2><button class="btn sm ghost" data-a="closeSheetBtn" aria-label="${t("Chiudi")}">✕</button></div><p class="sub small">${t("Bastano pochi dati: il resto lo completi quando vuoi.")}</p>
   <form id="qnf" class="fgrid"><label class="f">${t("Nome")}<input type="text" id="qnFirst" autocomplete="off"></label><label class="f">${t("Cognome")}<input type="text" id="qnLast" autocomplete="off"></label>
    <label class="f">${t("Ruolo principale")}<select id="qnRole"><option value="">—</option>${c.roles.filter(r => !r.hidden).map(r => `<option value="${esc(r.id)}">${esc(L(r))}</option>`).join("")}</select></label><label class="f">${t("Anno di nascita")}<input type="number" id="qnYear" min="1980" max="2025" inputmode="numeric"></label>
    <label class="f">${t("Club attuale")}<input type="text" id="qnClub"></label><label class="f">${t("Nazionalità")}<input type="text" id="qnNat"></label>
    <label class="f">${t("Piede preferito")}${sel("qnFoot", [opt("Destro", "Destro", "Right"), opt("Sinistro", "Sinistro", "Left"), opt("Ambidestro", "Ambidestro", "Both")], "", "—")}</label><label class="f">${t("N° maglia")}<input type="number" id="qnShirt" min="0" max="99"></label>
    <div class="row full between"><button type="button" class="btn" id="qnFull">${t("Scheda completa")} →</button><button class="btn pri">${t("Salva")}</button></div></form>`, true);
  bindNat(); $("#qnFirst").focus();
  const read = () => { const v = s => $(s).value.trim(); const role = v("#qnRole"); const r0 = ROLE_SPOT[role]; return { first: v("#qnFirst"), last: v("#qnLast"), roles: role ? [role] : [], pos: r0 ? { x: r0[0], y: r0[1] } : null, birthYear: v("#qnYear"), club: v("#qnClub"), nat: v("#qnNat"), foot: v("#qnFoot"), shirt: v("#qnShirt") }; };
  $("#qnFull").onclick = () => { const o = read(); closeSheet(); go("giocatori", { pdraft: { ...newPlayerDraft(), ...Object.fromEntries(Object.entries(o).filter(([, v]) => v && (!Array.isArray(v) || v.length))) }, playerId: null, edraft: null }); };
  $("#qnf").onsubmit = e => { e.preventDefault(); const o = read(); if (!o.first && !o.last) { toast(t("Scrivi almeno nome o cognome")); return; } const id = uid(); closeSheet(); put("players", id, { ...newPlayerRec(o.first, o.last, o.roles[0], o.club), ...o, verdict: "seguire" }); toast(t("Giocatore salvato")); go("giocatori", { playerId: id, ptab: "profilo", pdraft: null }); };
})(A.newPlayer);

/* ---------- ricerca: per categoria, giocatori per reparto, lista o griglia ---------- */
const DEPTS = [["gk", "Portieri"], ["def", "Difensori"], ["mid", "Centrocampisti"], ["att", "Attaccanti"], ["", "Senza ruolo"]];
const deptOf = p => { const g = roleGroup(mainRole(p)); return g === "gk" ? "gk" : g === "dc" || g === "fb" ? "def" : g === "mid" ? "mid" : g ? "att" : ""; };
function playerCard(id, p) { const pr = profile(id); return `<button type="button" class="pcard" data-a="openPlayer" data-id="${id}">${avatar(p)}<span class="pcn">${esc(pname(p))}</span><span class="m">${esc(roleL(mainRole(p)) || "—")}</span><span class="m">${esc(p.club || "")}${age(p) != null ? " · " + t("{n} anni", { n: age(p) }) : ""}</span><span class="pcr ${sc(pr.rating)}">${f1(pr.rating)}</span></button>`; }
R.cerca = (orig => () => {
  const raw = ui.q.trim(); if (raw.length < 2) return orig(); const h = orig(); const tab = ui.stab || "all"; if (tab !== "all" && tab !== "players") return viewToggle() + h;
  const { res } = Search.run(raw); if (!res.players.length) return h; const grid = ui.sview === "grid";
  const rows = res.players.slice(0, tab === "all" ? 24 : 120); const byD = {}; for (const r of rows) (byD[deptOf(r[1])] = byD[deptOf(r[1])] || []).push(r);
  const sec = `<section class="panel"><div class="row between"><h2>${t("Giocatori")} <span class="m">${res.players.length}</span></h2>${viewToggle()}</div>${DEPTS.filter(([k]) => byD[k]).map(([k, n]) => `<h3 class="dhead">${t(n)} <span class="m">${byD[k].length}</span></h3>${grid ? `<div class="pgridv">${byD[k].map(([id, p]) => playerCard(id, p)).join("")}</div>` : `<div class="list">${byD[k].map(([id, p]) => playerItem(id, p)).join("")}</div>`}`).join("")}</section>`;
  const a = h.indexOf("<section class=\"panel\"><h2>" + t("Giocatori")); if (a < 0) return h; const b = h.indexOf("</section>", a) + 10; return h.slice(0, a) + sec + h.slice(b);
})(R.cerca);
function viewToggle() { const g = ui.sview === "grid"; return `<div class="seg vtog" role="group" aria-label="${t("Vista")}"><button data-a="sView" data-v="list" aria-pressed="${!g}" title="${t("Lista")}">☰ ${t("Lista")}</button><button data-a="sView" data-v="grid" aria-pressed="${g}" title="${t("Griglia")}">▦ ${t("Griglia")}</button></div>`; }
A.sView = el => { ui.sview = el.dataset.v; if (ui.view === "cerca") $("#view").innerHTML = R.cerca(); else render(true); };
// anche l'elenco Giocatori a lista o griglia, raggruppabile per reparto
R.giocatori = (orig => () => {
  const h = orig(); if (ui.pdraft || ui.edraft || (ui.playerId && P(ui.playerId))) return h;
  const k = h.lastIndexOf('<section class="panel"><div class="list">'); if (k < 0) return h;
  const rows = filterPlayers(ui.pf); const grid = ui.sview === "grid", byDept = ui.pgroup === "dept";
  const body = byDept ? DEPTS.map(([d, n]) => { const r = rows.filter(([, p]) => deptOf(p) === d); return r.length ? `<h3 class="dhead">${t(n)} <span class="m">${r.length}</span></h3>${grid ? `<div class="pgridv">${r.map(([id, p]) => playerCard(id, p)).join("")}</div>` : `<div class="list">${r.map(([id, p]) => playerItem(id, p)).join("")}</div>`}` : ""; }).join("") : grid ? `<div class="pgridv">${rows.map(([id, p]) => playerCard(id, p)).join("")}</div>` : null;
  const bar = `<div class="row between vbar"><div class="seg"><button data-a="pGroup" data-v="" aria-pressed="${!byDept}">${t("Tutti")}</button><button data-a="pGroup" data-v="dept" aria-pressed="${byDept}">${t("Per reparto")}</button></div>${viewToggle()}</div>`;
  if (body == null) return h.slice(0, k) + bar + h.slice(k);
  const end = h.indexOf("</section>", k) + 10; return h.slice(0, k) + bar + `<section class="panel">${body || `<div class="empty">${t("Nessun giocatore trovato.")}</div>`}</section>` + h.slice(end);
})(R.giocatori);
A.pGroup = el => { ui.pgroup = el.dataset.v; render(true); };

/* ---------- calendario: tocca un giorno ---------- */
A.calDay = el => {
  const d = el.dataset.d; ui.calDay = d; render(true);
  const ms = [...S.matches.entries()].filter(([, m]) => m.date === d && !m.archived).sort((a, b) => cmpTxt(a[1].time, b[1].time)); const mt = [...S.meetings.entries()].filter(([, x]) => x.date === d);
  sheet(`<div class="row between"><h2 class="cap1">${new Date(d + "T12:00:00").toLocaleDateString(locale(), { weekday: "long", day: "numeric", month: "long" })}</h2><button class="btn sm ghost" data-a="closeSheetBtn" aria-label="${t("Chiudi")}">✕</button></div>
   <div class="list">${ms.map(([id, m]) => matchItem(id, m)).join("")}${mt.map(([id, x]) => meetingItem(id, x)).join("")}${!ms.length && !mt.length ? `<div class="empty">${t("Niente in programma in questo giorno.")}</div>` : ""}</div>
   <div class="row end"><button class="btn" data-a="calNewMeet" data-d="${d}">+ ${t("Riunione")}</button><button class="btn pri" data-a="newMatchOn" data-d="${d}">+ ${t("Partita")}</button></div>`);
};
A.calNewMeet = el => { closeSheet(); meetSheet(null, el.dataset.d); };
A.newMatchOn = (orig => function (el) { closeSheet(); return orig(el); })(A.newMatchOn);
R.calendario = (orig => () => orig().replace('<div class="cal">', `<p class="m calhint">${t("Tocca un giorno per vedere cosa c'è o per aggiungere una partita o una riunione.")}</p><div class="cal">`))(R.calendario);

/* ---------- partita guidata passo per passo ---------- */
const STEPS = [["formazioni", "Arrivo e distinta", "Arrival and team sheet"], ["prima", "Prima della partita", "Before kick-off"], ["live", "Durante", "During"], ["dopo", "Dopo la partita", "After the match"], ["registro", "Registro", "Log"], ["multimedia", "Multimedia", "Media"]];
function stepDone(k, m) { const pre = m.pre || {}; return k === "formazioni" ? !!(m.sheet || (m.phases && Object.keys(m.phases).length)) : k === "prima" ? !!((pre.focus && pre.focus.chk && Object.values(pre.focus.chk).some(Boolean)) || pre.notes || Object.keys(pre.players || {}).length) : k === "live" ? (m.events || []).length > 0 : k === "dopo" ? m.status === "vista" || !!(m.post && m.post.fit && Object.keys(m.post.fit).length) : k === "registro" ? (m.events || []).length > 0 : k === "multimedia" ? [...S.media.values()].some(x => x.ownerId === ui.matchId) : false; }
window.matchPage = (orig => function (id) {
  const m = S.matches.get(id); let h = orig(id);
  const a = h.indexOf('<div class="tabs noprint">'); if (a < 0) return h; const b = h.indexOf("</div>", a) + 6;
  const n = (m.events || []).length; const steps = `<div class="tabs noprint steps">${STEPS.map(([k, it, en], i) => `<button data-a="mtab" data-t="${k}" aria-pressed="${ui.mtab === k}" class="${stepDone(k, m) ? "done" : ""}"><span class="sn">${stepDone(k, m) ? "✓" : i + 1}</span>${esc(L({ it, en }))}${k === "registro" ? ` (${n})` : ""}</button>`).join("")}</div>`;
  h = h.slice(0, a) + steps + h.slice(b);
  const i = STEPS.findIndex(s => s[0] === ui.mtab); const nx = STEPS[i + 1], pv = STEPS[i - 1];
  const nav = `<div class="row between stepnav noprint">${pv ? `<button class="btn" data-a="mtab" data-t="${pv[0]}">← ${esc(L({ it: pv[1], en: pv[2] }))}</button>` : "<span></span>"}${nx ? `<button class="btn pri" data-a="mtab" data-t="${nx[0]}">${t("Avanti")}: ${esc(L({ it: nx[1], en: nx[2] }))} →</button>` : ""}</div>`;
  const s = h.lastIndexOf('<section class="panel sigfoot'); return s > 0 ? h.slice(0, s) + nav + h.slice(s) : h + nav;
})(window.matchPage);
A.openMatch = (orig => function (el) { orig(el); const m = S.matches.get(el.dataset.id); if (m && m.status !== "vista" && ui.mtab === "prima" && !stepDone("formazioni", m)) { ui.mtab = "formazioni"; render(); } })(A.openMatch);
// «Durante»: cronometro, tempo e nota vocale spiegati; 3 passi chiari
window.liveView = (orig => function (id, m) {
  let h = orig(id, m);
  h = h.replace('<div class="row" style="gap:12px"><span class="clock" id="clock">', `<div class="row" style="gap:12px"><div class="clockbox"><span class="lbl">⏱ ${t("Cronometro")}</span><span class="clock" id="clock">`).replace('<span class="m" id="minLbl"></span></div>', '<span class="m" id="minLbl"></span></div></div>');
  h = h.replace(`data-a="tToggle">${t("Avvia")}</button>`, `data-a="tToggle">▶ ${t("Avvia")}</button>`).replace(`data-a="tToggle">${t("Pausa")}</button>`, `data-a="tToggle">⏸ ${t("Pausa")}</button>`);
  h = h.replace('<div class="seg">', `<span class="lbl lblh">${t("Tempo")}</span><div class="seg">`);
  const guide = Prefs.get("liveGuideOff", false) ? "" : `<div class="lguide"><ol><li><b>${t("Avvia il cronometro")}</b> ${t("al fischio (o scegli il tempo: 1T, 2T…)")}</li><li><b>${t("Tocca l'azione")}</b> ${t("✓ riuscita · ✗ sbagliata · = neutra")}</li><li><b>${t("Completa i dettagli")}</b> ${t("zona, come l'ha fatto, pressione: bastano 3 secondi")}</li></ol><button class="btn sm ghost" data-a="lguideOff">${t("Ho capito")}</button></div>`;
  return guide + h;
})(window.liveView);
A.lguideOff = () => { Prefs.set("liveGuideOff", true); render(true); };

/* ---------- profili ideali: aderenza all'ideale ---------- */
// ogni requisito ha un minimo e un livello ideale: chi è solo al minimo vale circa il 70%, il 100% arriva solo se tutto è al livello ideale
const idealTarget = (r, s) => r.target != null && r.target !== "" && !isNaN(+r.target) ? +r.target : Math.min(s.max, +r.min + (s.max - s.min) * 0.2);
window.idealCompat = (orig => function (pid, ideal) {
  const base = orig(pid, ideal); const pr = profile(pid), s = Cfg.get().scale; let num = 0, den = 0, above = 0, rated = 0;
  for (const r of ideal.req || []) { const [a, k] = r.key.split("|"); const v = (pr.attr[a] || {})[k]; if (v == null) continue; rated++; const w = +r.imp || 1; den += w; const mn = +r.min, tg = Math.max(mn + 0.01, idealTarget(r, s));
    let sc0; if (v >= tg) sc0 = 1; else if (v >= mn) { sc0 = 0.7 + 0.3 * (v - mn) / (tg - mn); above++; } else sc0 = Math.max(0, 0.7 * (1 - (mn - v) / ((s.max - s.min) * 0.3))); if (v >= tg) above++; num += sc0 * w; }
  let pct = den ? num / den : 0; pct = pct * Math.pow(0.88, base.flags.length) * (base.fails.length ? 0.9 : 1) * (0.6 + 0.4 * (base.coverage || 0));
  return { ...base, pct: Math.round(pct * 100), above, rated };
})(window.idealCompat);
idealCompat = window.idealCompat;
// editor: livello ideale accanto al minimo, caratteristiche proposte dalle priorità del ruolo, chi lo chiede
window.idealEditor = (orig => function () {
  const d = ui.idraft; const s = Cfg.get().scale;
  let h = orig().replace(/(<input type="number" data-ri="(\d+)" data-k="min"[^>]*>)/g, (m0, inp, i) => `${inp}<input type="number" data-ri="${i}" data-k="target" min="${s.min}" max="${s.max}" step="${s.step}" value="${esc((d.req[+i] || {}).target ?? "")}" placeholder="${d.req[+i] ? f1(idealTarget(d.req[+i], s)) : t("ideale")}" aria-label="${t("Livello ideale")}">`);
  h = h.replace(`<p class="sub small">${t("Per ogni caratteristica decisiva indica il livello minimo e quanto conta. «Essenziale» sotto il minimo viene segnalato.")}</p>`, `<p class="sub small">${t("Per ogni caratteristica: quanto conta, il livello minimo accettabile e il livello ideale. Solo chi è al livello ideale in tutto arriva al 100%: nella realtà c'è sempre qualcosa da migliorare.")}</p><div class="reqhead m"><span>${t("Caratteristica")}</span><span>${t("Importanza")}</span><span>${t("Minimo")}</span><span>${t("Ideale")}</span></div>`);
  const staffOpts = [...S.staff.entries()].map(([sid, x]) => `<option value="${sid}" ${d.by === sid ? "selected" : ""}>${esc(x.name)} · ${esc(staffRoleL(x.role))}</option>`).join("");
  const steps = `<div class="banner info small idsteps"><b>${t("Come si costruisce un profilo ideale")}</b><ol><li>${t("Il bisogno della squadra: sistema, ruolo e cosa chiede l'allenatore.")}</li><li>${t("Le caratteristiche decisive del ruolo, con minimo e livello ideale.")}</li><li>${t("Età, piede, fisico e budget.")}</li><li>${t("I candidati: piano A, B e C, da decidere con lo staff.")}</li></ol></div>`;
  h = h.replace('<section class="panel"><h2>' + t("Identità del ruolo") + "</h2>", steps + '<section class="panel"><h2>' + t("Identità del ruolo") + "</h2>");
  h = h.replace('<label class="f full">' + t("Cosa deve fare nel nostro modello di gioco?"), `<label class="f">${t("Richiesto da")}<select id="idBy"><option value="">—</option>${staffOpts}</select></label><label class="f">${t("Per quando (finestra di mercato)")}<input type="text" id="idWin" value="${esc(d.window || "")}" placeholder="${t("es. gennaio 2027")}"></label><label class="f full">${t("Cosa deve fare nel nostro modello di gioco?")}`);
  h = h.replace(/<button class="btn sm" data-a="idealTemplate">[^<]*<\/button>/, `<button class="btn sm pri" data-a="idealPrio">${t("Proponi le caratteristiche del ruolo")}</button>`);
  return h;
})(window.idealEditor);
window.syncIdeal = (orig => function () { orig(); const d = ui.idraft; if (!d) return; if ($("#idBy")) d.by = $("#idBy").value; if ($("#idWin")) d.window = $("#idWin").value.trim(); })(window.syncIdeal);
syncIdeal = window.syncIdeal;
A.idealPrio = () => { syncIdeal(); const d = ui.idraft; if (!d.role) { toast(t("Scegli prima il ruolo principale.")); return; } const s = Cfg.get().scale; const keys = prioList({ roles: [d.role], archetype: d.archetype || "" }).filter(k => Cfg.area(k.split("|")[0])); const have = new Set(d.req.map(r => r.key));
  keys.slice(0, 8).forEach((k, i) => { if (have.has(k)) return; const mn = Math.round(s.max * (i < 3 ? 0.68 : 0.62) / s.step) * s.step; d.req.push({ key: k, imp: i < 3 ? 3 : i < 6 ? 2 : 1, min: mn, target: Math.min(s.max, Math.round((mn + (s.max - s.min) * 0.2) / s.step) * s.step) }); });
  if (!d.name) d.name = roleL(d.role); toast(t("Caratteristiche proposte in ordine di importanza: adattale all'idea dell'allenatore")); render(true); };
// pagina del profilo: confronta i candidati scelti
window.idealPage = (orig => function (id) {
  let h = orig(id); const sel = ui.idealSel = (ui.idealSel || []).filter(P);
  h = h.replace(/<div class="item click" data-a="openPlayer" data-id="([^"]+)"><div class="score/g, (m0, pid) => `<div class="item click" data-a="openPlayer" data-id="${pid}"><button type="button" class="cmpbox" data-a="idealSelT" data-id="${pid}" aria-pressed="${sel.includes(pid)}" title="${t("Aggiungi al confronto")}" aria-label="${t("Aggiungi al confronto")}">⇄</button><div class="score`);
  h = h.replace(`<h2>${t("Classifica di compatibilità")}</h2>`, `<div class="row between"><h2>${t("Classifica di aderenza")}</h2><button class="btn sm pri" data-a="idealSelGo" ${sel.length >= 2 ? "" : "disabled"}>⇄ ${t("Confronta selezionati ({n})", { n: sel.length })}</button></div>`);
  return h.replace(`${t("Calcolata sulle medie delle tue valutazioni. «Copertura» indica quanti requisiti hai già valutato per quel giocatore.")}`, `${t("Quanto ogni giocatore osservato si avvicina all'ideale (100% = tutto al livello ideale). Tocca ⇄ su due o più giocatori per confrontarli.")}`);
})(window.idealPage);
Object.assign(A, {
  idealSelT: (el, e) => { e.stopPropagation(); const s = new Set(ui.idealSel || []); s.has(el.dataset.id) ? s.delete(el.dataset.id) : s.size < 4 && s.add(el.dataset.id); ui.idealSel = [...s]; render(true); },
  idealSelGo: () => { ui.cmp = [...ui.idealSel]; ui.cmpIdeal = ui.idealId; put("settings", "compare", { ...(S.settings.get("compare") || {}), ids: [...ui.cmp] }); ui.idealSel = []; resetSub(); ui.idealId = null; go("confronto"); }
});
// staff: i profili ideali nascono in riunione
R.staff = (orig => () => {
  if (ui.stTab !== "ideals" || ui.meetId) { const h = orig(); return h.replace(/(<button data-a="stTab" data-t="people"[^>]*>[^<]*<\/button>)/, `<button data-a="stTab" data-t="ideals" aria-pressed="false">${t("Profili ideali")}</button>$1`); }
  ui.stTab = "meet"; let h = orig(); ui.stTab = "ideals"; h = h.replace(/<button class="btn pri" data-a="editMeet">[^<]*<\/button>/, `<button class="btn pri" data-a="newIdeal">+ ${t("Nuovo profilo ideale")}</button>`);
  h = h.replace(/aria-pressed="true"/, 'aria-pressed="false"').replace(/(<button data-a="stTab" data-t="people"[^>]*>[^<]*<\/button>)/, `<button data-a="stTab" data-t="ideals" aria-pressed="true">${t("Profili ideali")}</button>$1`);
  const a = h.indexOf("</div>", h.indexOf('<div class="tabs">')) + 6; const rows = [...S.ideals.entries()].filter(([, x]) => !x.archived);
  const body = `<section class="panel"><div class="row between"><div><h2>${t("Profili ideali della squadra")}</h2><p class="sub small">${t("Si definiscono con lo staff: ruolo, sistema, cosa chiede l'allenatore, caratteristiche decisive e piano A, B, C.")}</p></div><button class="btn pri" data-a="newIdeal">+ ${t("Nuovo profilo ideale")}</button></div>
   <div class="list" style="margin-top:6px">${rows.map(([iid, x]) => { const plan = (x.plan || []).filter(c => P(c.pid)).sort((a, b) => RANKS.indexOf(a.rank) - RANKS.indexOf(b.rank)); const mts = [...S.meetings.values()].filter(m => m.idealId === iid).length; return `<div class="item click" data-a="openIdeal" data-id="${iid}"><span class="vico">⭐</span><div class="grow"><div class="t">${esc(x.name)}</div><div class="m">${esc(roleL(x.role) || "")}${x.system ? " · " + esc(sysKey(x.system)) : ""}${x.by ? " · " + t("richiesto da {n}", { n: esc(staffName(x.by)) }) : ""}${x.window ? " · " + esc(x.window) : ""} · ${t("{n} riunioni", { n: mts })}</div><div class="chips" style="margin-top:4px">${plan.map(c => `<span class="pill c-blue">${c.rank} · ${esc(P(c.pid).last || pname(P(c.pid)))}</span>`).join("")}</div></div></div>`; }).join("") || `<div class="empty">${t("Nessun profilo ideale.")}</div>`}</div></section>`;
  return h.slice(0, a) + body;
})(R.staff);

/* ---------- confronto: più semplice ---------- */
R.confronto = (orig => () => {
  const h = orig(); const g = h.indexOf('<div class="grid2">'); let out = g > 0 ? h.slice(0, g) : h; const tail = h.indexOf('<section class="panel"><div class="row between" style="flex-wrap:wrap;gap:8px"><h2>' + t("Confronto personalizzato"));
  if (tail > g && g > 0) out = h.slice(0, g) + h.slice(tail, h.indexOf("</section>", h.indexOf('<div style="margin-top:12px">', tail)) + 10);
  const steps = `<div class="cmpsteps"><span class="${ui.cmp.length >= 2 ? "ok" : ""}">1 · ${t("Scegli 2–4 giocatori")} (${ui.cmp.length})</span><span class="${ui.cmpIdeal ? "ok" : ""}">2 · ${t("Se vuoi, un profilo ideale")}</span><span>3 · ${t("Scegli cosa confrontare")}</span></div>`;
  const grp = ui.cmpG || ""; out = out.replace('<section class="panel"><input type="search" id="cmpQ"', `${steps}<section class="panel"><div class="seg cmpdept" style="margin-bottom:8px">${[["", "Tutti"], ...DEPTS.slice(0, 4)].map(([k, n]) => `<button data-a="cmpG" data-v="${k}" aria-pressed="${grp === k}">${t(n)}</button>`).join("")}${ui.cmp.length ? `<button data-a="cmpClear">✕ ${t("Svuota")}</button>` : ""}</div><input type="search" id="cmpQ"`);
  if (grp) out = out.replace(/<button class="chip" data-a="cmp" data-id="([^"]+)"[^>]*>[^<]*<\/button>/g, (m0, id) => deptOf(P(id)) === grp || ui.cmp.includes(id) ? m0 : "");
  return out;
})(R.confronto);
Object.assign(A, { cmpG: el => { ui.cmpG = el.dataset.v; render(true); }, cmpClear: () => { ui.cmp = []; put("settings", "compare", { ...(S.settings.get("compare") || {}), ids: [] }); render(true); } });

/* ---------- squadra ombra: tre passi chiari ---------- */
R.squadre = (orig => () => { const h = orig(); const st = `<div class="cmpsteps"><span>1 · ${t("Crea la squadra e scegli il modulo")}</span><span>2 · ${t("Tocca una posizione sul campo")}</span><span>3 · ${t("Scegli il titolare e le alternative")}</span></div>`; const i = h.indexOf("</div></div>", h.indexOf('<div class="head">')); return i > 0 ? h.slice(0, i + 12) + st + h.slice(i + 12) : st + h; })(R.squadre);

/* =========================================================
   AREA DATI: prestazioni di tutti i giocatori
   ========================================================= */
const DCOLS = [["rating", "Rating", r => r.rating], ["data", "Voto dai dati", r => r.dr], ["fit", "Idoneità", r => r.fit], ["mins", "Minuti", r => r.d.mins], ["ev", "Azioni", r => r.d.ev.length], ["succ", "% riuscita", r => r.succ], ...MX.map(([k, l]) => [k, l + " /90", r => r.d.p90[k]])];
function dataRows() {
  const f = ui.df = ui.df || { dept: "", comp: "", age: "", sort: "rating", x: "data", y: "rating", min: 0 };
  return [...S.players.entries()].filter(([, p]) => !p.archived).map(([id, p]) => { const d = playerData(id); const pr = profile(id); const jd = d.ev.filter(e => ["+", "-"].includes(evOutcome(e))); const lf = latestFit(id);
    return { id, p, d, rating: pr.rating, dr: d.ev.length ? dataRating(id).rating : null, fit: lf ? fitScore(lf[2]) : null, succ: jd.length ? Math.round(jd.filter(e => evOutcome(e) === "+").length / jd.length * 100) : null, evals: playerEvals(id).length };
  }).filter(r => (!f.dept || deptOf(r.p) === f.dept) && (!f.comp || (r.p.league || "") === f.comp) && (!f.age || (age(r.p) != null && age(r.p) <= +f.age)) && r.d.mins >= +f.min);
}
function scatter(rows, fx, fy, lx, ly) {
  const pts = rows.map(r => [fx(r), fy(r), r]).filter(([x, y]) => x != null && y != null && !isNaN(x) && !isNaN(y)); if (pts.length < 2) return `<p class="m">${t("Servono almeno 2 giocatori con entrambi i valori.")}</p>`;
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys); const W = 560, H = 320, P0 = 40; const X = v => P0 + (x1 === x0 ? 0.5 : (v - x0) / (x1 - x0)) * (W - P0 - 14), Y = v => H - 30 - (y1 === y0 ? 0.5 : (v - y0) / (y1 - y0)) * (H - 50);
  const mx = mean(xs), my = mean(ys);
  return `<svg viewBox="0 0 ${W} ${H}" class="scatter" role="img" aria-label="${esc(lx)} / ${esc(ly)}"><line x1="${X(mx)}" x2="${X(mx)}" y1="14" y2="${H - 30}" stroke="var(--line)" stroke-dasharray="3 3"/><line y1="${Y(my)}" y2="${Y(my)}" x1="${P0}" x2="${W - 14}" stroke="var(--line)" stroke-dasharray="3 3"/>
   <text x="${W - 14}" y="${H - 8}" text-anchor="end" font-size="11" fill="var(--muted)">${esc(lx)} →</text><text x="6" y="12" font-size="11" fill="var(--muted)">↑ ${esc(ly)}</text>
   ${pts.map(([x, y, r]) => `<g class="sdot" data-a="openPlayer" data-id="${r.id}"><circle cx="${X(x)}" cy="${Y(y)}" r="6" fill="${r.p.example ? "var(--blue)" : "var(--accent)"}" fill-opacity=".75"/><text x="${X(x) + 8}" y="${Y(y) + 4}" font-size="10.5" fill="var(--ink)">${esc(r.p.last || pname(r.p))}</text><title>${esc(pname(r.p))}: ${f1(x)} / ${f1(y)}</title></g>`).join("")}</svg><p class="m">${t("Le linee tratteggiate sono le medie: in alto a destra chi va meglio su entrambi i valori.")}</p>`;
}
R.dati = () => {
  const rows = dataRows(); const f = ui.df; const col = k => DCOLS.find(c => c[0] === k) || DCOLS[0];
  const sorted = rows.slice().sort((a, b) => (col(f.sort)[2](b) ?? -1e9) - (col(f.sort)[2](a) ?? -1e9));
  const comps = [...new Set([...S.players.values()].map(p => p.league).filter(Boolean))].sort(cmpTxt);
  const show = ["rating", "data", "fit", "mins", "ev", "succ", "goals", "xg", "kp", "prog", "drb", "duel", "rec"];
  const totals = { players: rows.length, mins: rows.reduce((s, r) => s + r.d.mins, 0), ev: rows.reduce((s, r) => s + r.d.ev.length, 0), evals: rows.reduce((s, r) => s + r.evals, 0) };
  const top = sorted.filter(r => col(f.sort)[2](r) != null).slice(0, 10); const mxv = Math.max(...top.map(r => col(f.sort)[2](r)), 1);
  const selF = (id, cur, opts) => `<select id="${id}">${opts.map(([k, n]) => `<option value="${k}" ${String(cur) === String(k) ? "selected" : ""}>${esc(n)}</option>`).join("")}</select>`;
  const colOpts = DCOLS.map(([k, l]) => [k, t(l.replace(" /90", "")) + (l.endsWith("/90") ? " /90" : "")]);
  return `<div class="head"><div><h1>${t("Dati")}</h1><p class="sub">${t(PAGE_DESC.dati)}</p></div></div>
  <section class="panel"><div class="fgrid"><label class="f">${t("Reparto")}${selF("df_dept", f.dept, [["", t("Tutti")], ...DEPTS.slice(0, 4).map(([k, n]) => [k, t(n)])])}</label><label class="f">${t("Campionato")}${selF("df_comp", f.comp, [["", t("Tutti")], ...comps.map(c => [c, c])])}</label><label class="f">${t("Età fino a")}<input type="number" id="df_age" value="${esc(f.age)}"></label><label class="f">${t("Minuti osservati almeno")}<input type="number" id="df_min" value="${esc(f.min || "")}"></label></div></section>
  <div class="stats"><div class="stat"><b>${totals.players}</b><span>${t("Giocatori")}</span></div><div class="stat"><b>${Math.round(totals.mins / 60)}</b><span>${t("Ore osservate")}</span></div><div class="stat"><b>${totals.ev}</b><span>${t("Azioni registrate")}</span></div><div class="stat"><b>${totals.evals}</b><span>${t("Valutazioni")}</span></div></div>
  <div class="grid2"><section class="panel"><div class="row between"><h2>${t("Classifica")}</h2><label class="sortsel"><span>${t("per")}</span>${selF("df_sort", f.sort, colOpts)}</label></div><div class="col" style="margin-top:10px;gap:6px">${top.map(r => { const v = col(f.sort)[2](r); return `<div class="pb click" data-a="openPlayer" data-id="${r.id}"><div class="lab"><span>${esc(pname(r.p))} <span class="m">· ${esc(roleL(mainRole(r.p)) || "")}</span></span><span class="mono">${f1(v)}${["fit", "succ"].includes(f.sort) ? "%" : ""}</span></div><div class="bar"><i style="width:${Math.max(3, v / mxv * 100)}%"></i></div></div>`; }).join("") || `<p class="m">${t("Nessun dato.")}</p>`}</div></section>
   <section class="panel"><div class="row between" style="flex-wrap:wrap;gap:6px"><h2>${t("Grafico a dispersione")}</h2><div class="row"><label class="sortsel"><span>X</span>${selF("df_x", f.x, colOpts)}</label><label class="sortsel"><span>Y</span>${selF("df_y", f.y, colOpts)}</label></div></div>${scatter(rows, col(f.x)[2], col(f.y)[2], t(col(f.x)[1]), t(col(f.y)[1]))}</section></div>
  <section class="panel"><h2>${t("Tutti i giocatori")}</h2><div class="tw dtable" style="margin-top:8px"><table><thead><tr><th>${t("Giocatore")}</th>${show.map(k => `<th class="n"><button class="thsort ${f.sort === k ? "on" : ""}" data-a="dSort" data-k="${k}">${esc(t(col(k)[1].replace(" /90", "")))}${col(k)[1].endsWith("/90") ? " /90" : ""}</button></th>`).join("")}</tr></thead><tbody>${sorted.map(r => `<tr class="click" data-a="dOpen" data-id="${r.id}"><td><b>${esc(pname(r.p))}</b>${r.p.example ? ` <span class="pill c-grey">${t("Esempio")}</span>` : ""}<div class="m">${esc(roleL(mainRole(r.p)) || "")}${r.p.club ? " · " + esc(r.p.club) : ""}</div></td>${show.map(k => { const v = col(k)[2](r); return `<td class="n">${v == null ? "–" : ["mins", "ev", "goals"].includes(k) ? Math.round(v) : ["fit", "succ"].includes(k) ? v + "%" : f1(v)}</td>`; }).join("")}</tr>`).join("") || `<tr><td colspan="${show.length + 1}" class="m">${t("Nessun giocatore con questi filtri.")}</td></tr>`}</tbody></table></div>
   <p class="m" style="margin-top:6px">${t("Tutto calcolato dalle partite che hai visto, dalle azioni registrate e dalle tue valutazioni: ogni modifica aggiorna subito i numeri.")}</p></section>`;
};
document.addEventListener("change", e => { const id = e.target && e.target.id; if (!id || !id.startsWith("df_")) return; ui.df[id.slice(3)] = e.target.value; render(true); });
Object.assign(A, { dSort: (el, e) => { e && e.stopPropagation(); ui.df.sort = el.dataset.k; render(true); }, dOpen: el => { resetSub(); go("giocatori", { playerId: el.dataset.id, ptab: "analisi" }); } });

/* ---------- accesso: bandiere e tema sempre nello stesso posto ---------- */
Lock.render = (orig => function (html) { orig.call(this, html); const box = this.root().querySelector(".lockbox"); if (!box) return; const br = box.querySelector(":scope > .brand"), lt = box.querySelector(":scope > .lt"); if (br && lt && !br.closest(".lhead")) { const w = document.createElement("div"); w.className = "lhead"; br.before(w); w.append(br, lt); } })(Lock.render);

/* ---------- Panoramica: semplice e chiara ---------- */
R.panoramica = () => {
  const prof = Profile.get(); const td = today(); const in7 = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  const pl = [...S.players.entries()].filter(([, p]) => !p.archived); const ms = [...S.matches.entries()].filter(([, m]) => !m.archived);
  const evs = [...S.evals.entries()].filter(([, e]) => !e.archived).sort((a, b) => cmpTxt(b[1].date, a[1].date));
  const week = ms.filter(([, m]) => m.status !== "vista" && m.date >= td && m.date <= in7).sort((a, b) => cmpTxt(a[1].date + (a[1].time || ""), b[1].date + (b[1].time || "")));
  const nextAll = ms.filter(([, m]) => m.status !== "vista" && m.date >= td).sort((a, b) => cmpTxt(a[1].date, b[1].date));
  const meets = [...S.meetings.entries()].filter(([, x]) => x.date >= td && x.date <= in7).sort((a, b) => cmpTxt(a[1].date + (a[1].time || ""), b[1].date + (b[1].time || "")));
  const tasks = [...S.tasks.entries()].filter(([, x]) => x.status !== "done" && P(x.playerId)).sort((a, b) => cmpTxt(a[1].due || "9", b[1].due || "9"));
  const toEval = ms.filter(([id, m]) => m.status === "vista" && focusOf(m) && !(m.post && m.post.fit && m.post.fit[m.focus] && m.post.fit[m.focus].dec)).slice(0, 4);
  const checks = pl.filter(([, p]) => p.nextCheck && p.nextCheck <= in7).sort((a, b) => a[1].nextCheck.localeCompare(b[1].nextCheck));
  const reminder = (window.syncReminder ? syncReminder() : "") + Backup.reminder(); const anyEx = ["players", "evals", "matches"].some(c => [...S[c].values()].some(x => x && x.example));
  const empty = !pl.length && !ms.length;
  const qa = `<div class="qa"><button class="qab pri" data-a="newMatch"><span class="qi">🎯</span><b>${t("Nuova partita")}</b><small>${t("con il giocatore obiettivo")}</small></button><button class="qab" data-a="newPlayer"><span class="qi">👤</span><b>${t("Nuovo giocatore")}</b><small>${t("in pochi secondi")}</small></button><button class="qab" data-a="pickEvalPlayer"><span class="qi">📝</span><b>${t("Nuovo report")}</b><small>${t("valuta un giocatore")}</small></button><button class="qab" data-a="editMeet"><span class="qi">👥</span><b>${t("Riunione")}</b><small>${t("con lo staff")}</small></button></div>`;
  const stat = (n, l, v) => `<button class="stat click" data-a="menuGo" data-v="${v}"><b>${n}</b><span>${l}</span></button>`;
  const todo = [...toEval.map(([id, m]) => `<div class="item click" data-a="openMatch" data-id="${id}"><span class="vico">✍</span><div class="grow"><div class="t">${t("Completa il giudizio su {n}", { n: esc(pname(P(m.focus))) })}</div><div class="m">${esc(m.home)} – ${esc(m.away)} · ${fmtDate(m.date)}</div></div></div>`), ...tasks.slice(0, 5).map(([tid, x]) => `<div class="item click" data-a="${x.matchId ? "runTask" : "editTask"}" data-id="${tid}"><span class="vico">🎯</span><div class="grow"><div class="t">${esc(pname(P(x.playerId)))}</div><div class="m">${esc(x.what || "")}${x.due ? " · " + t("entro il {d}", { d: fmtDate(x.due) }) : ""}</div></div></div>`), ...checks.slice(0, 3).map(([id, p]) => `<div class="item click" data-a="openPlayer" data-id="${id}"><span class="vico">🔁</span><div class="grow"><div class="t">${t("Rivedere {n}", { n: esc(pname(p)) })}</div><div class="m">${fmtDate(p.nextCheck)}</div></div></div>`)].join("");
  return `<div class="head"><div><h1>${esc(greet(firstName()))}</h1><p class="sub">${t(PAGE_DESC.panoramica)}</p></div></div>
  ${reminder}${qa}
  ${empty ? `<div class="empty">${t("L'archivio è vuoto. Aggiungi il primo giocatore o la prossima partita da vedere.")} <button class="btn sm" data-a="loadEx">${t("Carica esempi")}</button></div>` : `
  <div class="stats">${stat(nextAll.length, t("Partite in programma"), "partite")}${stat(pl.length, t("Giocatori"), "giocatori")}${stat(evs.length, t("Report"), "report")}${stat(tasks.length, t("Incarichi aperti"), "staff")}</div>
  <div class="grid2"><section class="panel"><div class="row between"><h2>${t("Questa settimana")}</h2><button class="btn sm ghost" data-a="menuGo" data-v="calendario">${t("Calendario")} →</button></div><div class="list" style="margin-top:6px">${week.map(([id, m]) => matchItem(id, m)).join("")}${meets.map(([id, x]) => meetingItem(id, x)).join("")}${!week.length && !meets.length ? `<div class="empty">${t("Niente in programma nei prossimi 7 giorni.")}${nextAll[0] ? `<br>${t("Prossima partita")}: <b>${esc(nextAll[0][1].home)} – ${esc(nextAll[0][1].away)}</b> · ${fmtDate(nextAll[0][1].date)}` : ""}</div>` : ""}</div></section>
   <section class="panel"><h2>${t("Da fare")}</h2><div class="list" style="margin-top:6px">${todo || `<div class="empty">${t("Tutto in ordine: nessun incarico aperto.")}</div>`}</div></section></div>
  <section class="panel"><div class="row between"><h2>${t("Ultimi report")}</h2><button class="btn sm ghost" data-a="menuGo" data-v="report">${t("Tutti i report")} →</button></div><div class="list" style="margin-top:6px">${evs.slice(0, 4).map(([id, e]) => evalItem(id, e, true)).join("") || `<div class="empty">${t("Nessuna valutazione.")}</div>`}</div></section>
  ${anyEx ? `<div class="banner small row between"><span>${t("Ci sono dati di esempio: servono per provare l'app.")}</span><button class="btn sm" data-a="clearEx">${t("Elimina esempi")}</button></div>` : ""}`}`;
};
// se la prima schermata è stata disegnata prima che tutto fosse caricato, ridisegnala con bandiere e tema nuovi
setTimeout(() => { try { const r = $("#lockRoot"); if (!App.unlocked && r && !r.hidden && r.querySelector('[data-a="setLang"]')) { if (r.querySelector("#s1")) Lock.signup(!Accounts.list().length); else if (r.querySelector("#loginForm")) Lock.show(); } } catch (e) { } }, 0);
window.addEventListener("load", () => setTimeout(() => { try { const r = $("#lockRoot"); if (!App.unlocked && r && !r.hidden && r.querySelector('[data-a="setLang"]')) { if (r.querySelector("#s1")) Lock.signup(!Accounts.list().length); else if (r.querySelector("#loginForm")) Lock.show(); } } catch (e) { } }, 50));

/* 5.6.1 — dal menu si torna sempre alla pagina principale (anche Liste, Profili ideali, Staff) */
const clearMain = () => { ui.listId = null; ui.idealId = null; ui.idraft = null; ui.meetId = null; };
document.addEventListener("click", e => { if (e.target.closest(".nav a,.mbar a,[data-a=\"menuGo\"]")) clearMain(); }, true);
window.addEventListener("hashchange", clearMain, true);
A.menuGo = (orig => (el, e) => { clearMain(); orig(el, e); })(A.menuGo);

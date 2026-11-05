"use strict";
/* =========================================================
   MM Scout — strumenti da scout professionista, semplici:
   interpretazione del ruolo, forma, potenziale, status,
   affidabilità del giudizio, contesto della gara, domande
   prima del fischio d'inizio, conclusione del report e
   qualità delle evidenze.
   ========================================================= */
const ARCHETYPES_DEF = [
  ["gk-pali", "Portiere tra i pali", "Shot-stopping goalkeeper", "gk"], ["gk-mod", "Portiere moderno (gioca con i piedi)", "Sweeper keeper (good with feet)", "gk"],
  ["dc-marc", "Marcatore", "Stopper / marker", "dc"], ["dc-imp", "Centrale impostatore", "Ball-playing centre-back", "dc"], ["dc-cop", "Centrale di copertura", "Covering centre-back", "dc"],
  ["fb-dif", "Terzino difensivo", "Defensive full-back", "fb"], ["fb-spi", "Terzino di spinta", "Attacking full-back", "fb"], ["fb-inv", "Terzino che stringe dentro", "Inverted full-back", "fb"], ["fb-quinto", "Quinto a tutta fascia", "Wing-back", "fb"],
  ["mid-reg", "Regista basso", "Deep-lying playmaker", "mid"], ["mid-rot", "Mediano di rottura", "Ball-winning midfielder", "mid"], ["mid-btb", "Box-to-box", "Box-to-box", "mid"], ["mid-ins", "Mezzala d'inserimento", "Goal-scoring midfielder", "mid"], ["mid-pal", "Mezzala di palleggio", "Passing midfielder", "mid"],
  ["am-rif", "Rifinitore", "Creator / number 10", "am"], ["am-ins", "Trequartista d'inserimento", "Attacking runner from midfield", "am"],
  ["w-cla", "Ala classica", "Traditional winger", "w"], ["w-inv", "Ala invertita", "Inverted winger", "w"], ["w-rac", "Ala di raccordo", "Link-up winger", "w"],
  ["st-pos", "Prima punta di posizione (boa)", "Target striker", "st"], ["st-mov", "Prima punta di movimento", "Mobile striker", "st"], ["st-sec", "Seconda punta", "Second striker", "st"], ["st-f9", "Falso 9", "False nine", "st"]
];
const PREQ_DEF = [
  ["q1", "Gioca nel suo ruolo naturale?", "Is he playing in his natural role?", "giocatore"], ["q2", "È al 100% fisicamente?", "Is he 100% fit?", "giocatore"], ["q3", "È in un buon momento di forma?", "Is he in good form?", "giocatore"], ["q4", "Batte i calci piazzati?", "Does he take set pieces?", "giocatore"], ["q5", "È un leader in campo?", "Is he a leader on the pitch?", "giocatore"],
  ["q6", "Il sistema di gioco della squadra è chiaro?", "Is the team's system clear?", "squadra"], ["q7", "Costruisce dal basso?", "Do they build from the back?", "squadra"], ["q8", "Pressa alto?", "Do they press high?", "squadra"], ["q9", "Difende basso?", "Do they defend deep?", "squadra"], ["q10", "Cambia struttura in possesso?", "Do they change shape in possession?", "squadra"],
  ["q11", "L'avversario pressa alto?", "Does the opponent press high?", "avversario"], ["q12", "Lascia spazio alle spalle?", "Do they leave space in behind?", "avversario"], ["q13", "Gioca diretto?", "Do they play direct?", "avversario"], ["q14", "Difende a uomo?", "Do they mark man-to-man?", "avversario"], ["q15", "Cambia modulo durante la gara?", "Do they change system during the game?", "avversario"],
  ["q16", "È un derby o una gara molto sentita?", "Is it a derby or a high-stakes game?", "contesto"], ["q17", "È una partita decisiva?", "Is it a decisive match?", "contesto"], ["q18", "Il campo è difficile?", "Is the pitch difficult?", "contesto"], ["q19", "Il meteo incide?", "Does the weather affect play?", "contesto"], ["q20", "L'arbitraggio è permissivo?", "Is the refereeing lenient?", "contesto"]
];
const PREQ_GROUPS = [["giocatore", "Sul giocatore", "About the player"], ["squadra", "Sulla sua squadra", "About his team"], ["avversario", "Sull'avversario", "About the opponent"], ["contesto", "Sul contesto", "About the context"]];
const CONTEXT_DEF = [["intensity", "Intensità della partita", "Match intensity"], ["opponent", "Livello dell'avversario", "Opponent level"], ["pressure", "Pressione ambientale", "Environmental pressure"], ["tactical", "Difficoltà tattica", "Tactical difficulty"], ["speed", "Velocità del gioco", "Game speed"]];
const CONCL_DEF = [["strong", "È abbastanza forte per il livello richiesto?", "Is he good enough for the required level?"], ["fit", "È compatibile con il modello di gioco?", "Does he fit the playing model?"], ["afford", "È sostenibile economicamente?", "Is he financially realistic?"], ["grow", "Può ancora migliorare?", "Can he still improve?"]];
const FORM = [["up", "In crescita", "Improving", "↑", "good"], ["stable", "Stabile", "Stable", "=", "blue"], ["down", "In calo", "Declining", "↓", "bad"]];
const EUSTATUS = [["eu", "Comunitario", "EU"], ["assim", "Assimilato (SEE/Svizzera)", "EEA / Swiss"], ["noneu", "Extracomunitario", "Non-EU"]];
const MORPHO = [["longi", "Longilineo", "Long-limbed"], ["normo", "Normolineo", "Average build"], ["brevi", "Brevilineo", "Compact build"]];
const o3 = arr => arr.map(([id, it, en]) => ({ id, it, en }));

Migrate.config = (orig => function () {
  orig.call(Migrate);
  const c = S.settings.get("config"); if (!c || (c.v || 0) >= 5) return;
  c.archetypes = c.archetypes || ARCHETYPES_DEF.map(([id, it, en, group]) => ({ id, it, en, group }));
  c.preQuestions = c.preQuestions || PREQ_DEF.map(([id, it, en, group]) => ({ id, it, en, group }));
  c.areaWeights = c.areaWeights || { tat: 30, tec: 30, men: 20, fis: 20, por: 40 };
  c.v = 5; put("settings", "config", c);
})(Migrate.config);

/* ---------- utilità ---------- */
function roleGroup(r) { r = r || ""; if (/Portiere/.test(r)) return "gk"; if (/Difensore/.test(r)) return "dc"; if (/Terzino|Quinto/.test(r)) return "fb"; if (/Mediano|Regista|Centrocampista|Mezzala/.test(r)) return "mid"; if (/Trequartista/.test(r)) return "am"; if (/Ala/.test(r)) return "w"; if (/Punta|Falso|Seconda/.test(r)) return "st"; return ""; }
function archetypesFor(roleId) { const g = roleGroup(roleId); const all = Cfg.get().archetypes || []; const f = all.filter(a => !a.hidden && (!g || a.group === g)); return f.length ? f : all.filter(a => !a.hidden); }
const archL = id => L((Cfg.get().archetypes || []).find(a => a.id === id)) || "";
function semester(p) { if (!p || !p.birth || p.birth.length < 7) return null; return +p.birth.slice(5, 7) <= 6 ? 1 : 2; }
function formPill(f) { const x = FORM.find(z => z[0] === f); return x ? `<span class="pill c-${x[4]}" title="${t("Stato di forma")}">${x[3]} ${esc(L({ it: x[1], en: x[2] }))}</span>` : ""; }
function reliability(pid) {
  const evs = playerEvals(pid).map(x => x[1]); const mins = evs.reduce((s, e) => s + (+e.minutes || 0), 0); const ms = new Set(evs.map(e => e.matchId || e.date)).size;
  const lvl = ms >= 4 && mins >= 300 ? 3 : ms >= 2 && mins >= 120 ? 2 : evs.length ? 1 : 0;
  return { lvl, ms, mins, label: [t("Nessuna"), t("Bassa"), t("Media"), t("Alta")][lvl] };
}
function reliabilityPill(pid) { const r = reliability(pid); if (!r.lvl) return ""; return `<span class="pill ${["", "c-amber", "c-blue", "c-good"][r.lvl]}" title="${t("{m} partite, {n} minuti osservati", { m: r.ms, n: r.mins })}">${t("Affidabilità")}: ${r.label}</span>`; }
function evidenceQuality(e) {
  const p = P(e.playerId); const cfg = Cfg.get(); const rated = visAreas(p).filter(a => Object.keys((e.r || {})[a.id] || {}).length);
  const ev = (e.evidence || []).filter(x => (x.text || "").trim()); if (!rated.length) return 0; if (!ev.length) return 1;
  const per = a => ev.filter(x => x.area === a.id).length; const withMin = ev.filter(x => String(x.min || "").trim()).length / ev.length;
  if (rated.every(a => per(a) >= Math.max(1, cfg.minEvidence))) return 5; if (rated.every(a => per(a) >= 2)) return 4; if (withMin >= 0.8 && rated.every(a => per(a) >= 1)) return 3; return 2;
}
const EQ_L = () => ["", t("Solo opinioni"), t("Azioni isolate"), t("Evidenze con contesto"), t("Evidenze ripetute"), t("Evidenze sufficienti per ogni giudizio")];
function eqPill(q) { if (!q) return ""; return `<span class="pill ${q >= 4 ? "c-good" : q === 3 ? "c-blue" : "c-amber"}" title="${t("Qualità delle evidenze")}">${t("Evidenze")} ${q}/5 · ${esc(EQ_L()[q])}</span>`; }
function stars(n) { return n ? "●".repeat(n) + "○".repeat(5 - n) : "—"; }
function contextView(ctx) { if (!ctx || !Object.keys(ctx).length) return ""; return `<div class="ctxgrid">${CONTEXT_DEF.map(([k, it, en]) => `<div><span class="m">${esc(L({ it, en }))}</span><b class="mono">${stars(+ctx[k] || 0)}</b></div>`).join("")}</div>`; }
function contextEdit(prefix, ctx) { ctx = ctx || {}; return `<div class="ctxedit">${CONTEXT_DEF.map(([k, it, en]) => `<div class="row between"><span>${esc(L({ it, en }))}</span><div class="seg" data-ctx="${prefix}" data-k="${k}">${[1, 2, 3, 4, 5].map(v => `<button type="button" data-v="${v}" aria-pressed="${+ctx[k] === v}">${v}</button>`).join("")}</div></div>`).join("")}</div>`; }
function readContext(prefix) { const o = {}; $$(`[data-ctx="${prefix}"]`).forEach(s => { const b = s.querySelector('[aria-pressed="true"]'); if (b) o[s.dataset.k] = +b.dataset.v; }); return o; }
function conclusionEdit(c) { c = c || {}; return CONCL_DEF.map(([k, it, en]) => `<div class="row between" style="padding:6px 0;border-top:1px solid var(--line)"><span>${esc(L({ it, en }))}</span><div class="seg" data-concl="${k}">${[["si", t("Sì")], ["forse", t("Da capire")], ["no", t("No")]].map(([v, n]) => `<button type="button" data-v="${v}" aria-pressed="${c[k] === v}">${n}</button>`).join("")}</div></div>`).join(""); }
function readConclusion() { const o = {}; $$("[data-concl]").forEach(s => { const b = s.querySelector('[aria-pressed="true"]'); if (b) o[s.dataset.concl] = b.dataset.v; }); return o; }
function conclusionView(c) { if (!c || !Object.keys(c).length) return ""; const lab = { si: t("Sì"), forse: t("Da capire"), no: t("No") }, col = { si: "c-good", forse: "c-amber", no: "c-bad" }; return `<div class="col" style="gap:4px;margin-top:8px">${CONCL_DEF.filter(([k]) => c[k]).map(([k, it, en]) => `<div class="row between small"><span>${esc(L({ it, en }))}</span><span class="pill ${col[c[k]]}">${lab[c[k]]}</span></div>`).join("")}</div>`; }
// selezione nei gruppi di pulsanti (contesto, conclusione, domande)
document.addEventListener("click", e => { const b = e.target.closest("[data-ctx] button,[data-concl] button,[data-pq] button"); if (!b) return; const seg = b.parentElement; const was = b.getAttribute("aria-pressed") === "true"; seg.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", "false")); if (!was) b.setAttribute("aria-pressed", "true"); });

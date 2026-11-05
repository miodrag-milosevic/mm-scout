"use strict";
/* =========================================================
   MM Scout — registro partita completo:
   PRIMA (preparazione), DURANTE (registrazione con 1 tocco),
   DOPO (sintesi e valutazioni) e REGISTRO (filtri e modifica).
   Ogni azione è collegata ai parametri della valutazione.
   ========================================================= */
const LIVE_GROUPS_DEF = [["frequenti", "Frequenti", "Frequent"], ["possesso", "Con palla", "On the ball"], ["senzapalla", "Senza palla", "Off the ball"], ["difesa", "Fase difensiva", "Defending"], ["transizioni", "Transizioni", "Transitions"], ["inattive", "Palle inattive", "Set pieces"], ["fisico", "Fisico", "Physical"], ["mentale", "Mentale", "Mental"], ["portiere", "Portiere", "Goalkeeper"], ["eventi", "Eventi", "Match events"]];
// [id, italiano, inglese, gruppo, parametri collegati "area|parametro", tipo, esito fisso]
const LIVE_CATS_DEF = [
  ["Ricezione", "Ricezione", "Reception", "possesso", ["tat|Ricezione palla", "tec|Controllo palla"]],
  ["Controllo orientato", "Controllo orientato", "Directional touch", "possesso", ["tec|Controllo orientato"]],
  ["Ricezione sotto pressione", "Ricezione sotto pressione", "Receiving under pressure", "possesso", ["tec|Gioco sotto pressione"]],
  ["Scanning", "Scanning prima di ricevere", "Scanning before receiving", "possesso", ["tat|Visione", "men|Consapevolezza"]],
  ["Passaggio", "Passaggio corto", "Short pass", "possesso", ["tec|Passaggio", "tec|Precisione"]],
  ["Passaggio progressivo", "Passaggio progressivo", "Progressive pass", "possesso", ["tec|Passaggio", "tat|Visione"]],
  ["Filtrante", "Filtrante", "Through ball", "possesso", ["tec|Passaggi chiave", "tat|Visione"]],
  ["Cambio di gioco", "Cambio di gioco", "Switch of play", "possesso", ["tec|Precisione", "tat|Visione"]],
  ["Cross / Assist", "Cross", "Cross", "possesso", ["tec|Assist", "tec|Precisione"]],
  ["Conduzione", "Conduzione palla", "Ball carry", "possesso", ["tec|Conduzione palla"]],
  ["Dribbling", "Dribbling / 1vs1", "Dribble / 1v1", "possesso", ["tec|Dribbling", "tat|1vs1"]],
  ["Occasione creata", "Occasione creata", "Chance created", "possesso", ["tec|Passaggi chiave", "tec|Incisività offensiva"]],
  ["Tiro", "Tiro", "Shot", "possesso", ["tec|Tiro"]],
  ["Colpo di testa", "Colpo di testa", "Header", "possesso", ["tec|Colpo di testa"]],
  ["Protezione palla", "Protezione / spalle alla porta", "Shielding / back to goal", "possesso", ["fis|Protezione palla", "fis|Spalle alla porta"]],
  ["Piede debole", "Uso del piede debole", "Weak foot use", "possesso", ["tec|Uso entrambi i piedi"]],
  ["Perdita palla", "Perdita palla", "Ball loss", "possesso", ["tec|Controllo palla", "men|Presa decisioni"]],
  ["Smarcamento", "Smarcamento", "Getting open", "senzapalla", ["tat|Smarcamento", "tat|Senza palla"]],
  ["Attacco profondità", "Attacco della profondità", "Run in behind", "senzapalla", ["tat|Attacco della profondità"]],
  ["Inserimento", "Inserimento in area", "Run into the box", "senzapalla", ["tat|Capacità d'inserimento", "tat|Senso del gol"]],
  ["Tra le linee", "Movimento tra le linee", "Movement between the lines", "senzapalla", ["tat|Ricezione tra le linee"]],
  ["Apre spazi", "Apre spazio ai compagni", "Creates space for team-mates", "senzapalla", ["tat|Aprire gli spazi"]],
  ["Superiorità", "Crea superiorità", "Creates an overload", "senzapalla", ["tat|Creare superiorità numerica"]],
  ["Supporto", "Si offre / sostegno", "Offers support", "senzapalla", ["tat|Supporto al centrocampo"]],
  ["Pressing", "Pressing", "Pressing", "difesa", ["fis|Intensità", "tat|Rottura del gioco avversario"]],
  ["Contrasto", "Contrasto", "Tackle", "difesa", ["tec|Contrasti"]],
  ["Lettura / Anticipo", "Intercetto / anticipo", "Interception / anticipation", "difesa", ["tat|Anticipo", "tat|Lettura del gioco"]],
  ["Duello a terra", "Duello a terra", "Ground duel", "difesa", ["fis|Forza", "fis|Aggressività"]],
  ["Duello aereo", "Duello aereo", "Aerial duel", "difesa", ["fis|Duelli aerei", "fis|Elevazione"]],
  ["Posizione", "Posizionamento", "Positioning", "difesa", ["tat|Posizione"]],
  ["Marcatura", "Marcatura", "Marking", "difesa", ["tat|Abilità difensive"]],
  ["Copertura", "Copertura / diagonale", "Cover / diagonal", "difesa", ["tat|Abilità difensive", "tat|Posizione"]],
  ["Recupero palla", "Recupero palla", "Ball recovery", "difesa", ["tat|Rottura del gioco avversario"]],
  ["Chiusura", "Respinta / chiusura", "Clearance / block", "difesa", ["tat|Abilità difensive"]],
  ["Fallo", "Fallo commesso", "Foul committed", "difesa", ["men|Autocontrollo"]],
  ["Contropressing", "Reazione a palla persa", "Reaction to losing the ball", "transizioni", ["men|Determinazione", "tat|Rottura del gioco avversario"]],
  ["Ripiegamento", "Ripiegamento", "Tracking back", "transizioni", ["tat|Ripiegamenti difensivi"]],
  ["Ripartenza", "Ripartenza / contropiede", "Counter-attack", "transizioni", ["tat|Contropiede"]],
  ["Prima scelta", "Prima scelta dopo il recupero", "First choice after winning the ball", "transizioni", ["men|Presa decisioni"]],
  ["Angolo", "Calcio d'angolo", "Corner kick", "inattive", ["tec|Precisione"]],
  ["Punizione", "Punizione", "Free kick", "inattive", ["tec|Tiro", "tec|Precisione"]],
  ["Rigore", "Rigore", "Penalty", "inattive", ["tec|Freddezza"]],
  ["Rimessa", "Rimessa laterale", "Throw-in", "inattive", ["tec|Precisione"]],
  ["Palla inattiva difensiva", "Difesa su palla inattiva", "Defending a set piece", "inattive", ["tat|Abilità difensive", "fis|Duelli aerei"]],
  ["Scatto / Velocità", "Scatto / velocità", "Sprint / pace", "fisico", ["fis|Velocità", "fis|Scatto sul breve"]],
  ["Cambio di passo", "Cambio di passo", "Change of pace", "fisico", ["fis|Cambio di passo", "fis|Accelerazione"]],
  ["Intensità", "Intensità / sforzi ripetuti", "Intensity / repeated efforts", "fisico", ["fis|Intensità", "fis|Resistenza"]],
  ["Calo fisico", "Calo fisico", "Drop in energy", "fisico", ["fis|Resistenza", "fis|Capacità aerobica"]],
  ["Equilibrio", "Equilibrio / agilità", "Balance / agility", "fisico", ["fis|Equilibrio", "fis|Agilità"]],
  ["Atteggiamento", "Atteggiamento", "Attitude", "mentale", ["men|Determinazione"]],
  ["Reazione all'errore", "Reazione all'errore", "Reaction to a mistake", "mentale", ["men|Gestione degli errori"]],
  ["Leadership", "Guida i compagni", "Leads team-mates", "mentale", ["men|Leadership", "men|Carisma"]],
  ["Comunicazione", "Comunicazione", "Communication", "mentale", ["men|Uomo squadra"]],
  ["Linguaggio del corpo", "Linguaggio del corpo", "Body language", "mentale", ["men|Personalità"]],
  ["Nervosismo", "Protesta / nervosismo", "Protest / frustration", "mentale", ["men|Autocontrollo", "men|Temperamento"]],
  ["Concentrazione", "Concentrazione", "Concentration", "mentale", ["men|Concentrazione", "men|Livello d'attenzione"]],
  ["Parata / Uscita", "Parata", "Save", "portiere", ["por|Parate", "por|Reattività"]],
  ["Uscita alta", "Uscita alta", "Claiming a cross", "portiere", ["por|Uscite alte"]],
  ["Uscita bassa", "Uscita bassa", "Low exit", "portiere", ["por|Uscite basse"]],
  ["1vs1 portiere", "1vs1", "1v1", "portiere", ["por|1vs1 in uscita"]],
  ["Presa", "Presa", "Handling", "portiere", ["por|Presa"]],
  ["Posizionamento portiere", "Posizionamento", "Positioning", "portiere", ["por|Posizionamento tra i pali"]],
  ["Gioco con i piedi", "Gioco con i piedi", "Distribution with feet", "portiere", ["por|Gioco con i piedi"]],
  ["Rinvio", "Rinvio", "Kicking", "portiere", ["por|Rinvii"]],
  ["Guida difesa", "Guida la difesa", "Commands the defence", "portiere", ["por|Guida della difesa"]],
  ["Gol", "Gol", "Goal", "eventi", ["tec|Finalizzazione", "tat|Senso del gol"], "event", "+"],
  ["Assist", "Assist", "Assist", "eventi", ["tec|Assist"], "event", "+"],
  ["Ammonizione", "Ammonizione", "Yellow card", "eventi", ["men|Autocontrollo"], "event", "-"],
  ["Espulsione", "Espulsione", "Red card", "eventi", ["men|Autocontrollo"], "event", "-"],
  ["Entra", "Entra in campo", "Comes on", "eventi", [], "event", "="],
  ["Esce", "Esce dal campo", "Goes off", "eventi", [], "event", "="],
  ["Infortunio", "Infortunio", "Injury", "eventi", [], "event", "="],
  ["Cambio posizione", "Cambio di posizione", "Change of position", "eventi", [], "event", "="]
];
const WARMUP_DEF = [["Concentrato", "Concentrato", "Focused"], ["Comunica", "Comunica", "Communicates"], ["Carico", "Carico / motivato", "Fired up"], ["Teso", "Teso", "Tense"], ["Isolato", "Isolato", "Isolated"], ["Leader", "Guida il riscaldamento", "Leads the warm-up"], ["Tecnica pulita", "Tecnica pulita nel riscaldamento", "Clean technique in warm-up"], ["Svogliato", "Svogliato", "Half-hearted"]];
const CHECK_DEF = [["formazioni", "Formazioni ufficiali raccolte", "Official line-ups collected"], ["ruolo", "Ruolo previsto dei giocatori da osservare", "Expected role of target players"], ["avversario", "Livello e modulo dell'avversario", "Opponent's level and system"], ["condizioni", "Campo e meteo annotati", "Pitch and weather noted"], ["riscaldamento", "Riscaldamento osservato", "Warm-up observed"], ["obiettivo", "Obiettivo della missione chiaro", "Mission objective clear"]];
const HALVES = { 1: 0, 2: 45, 3: 90, 4: 105 };
const halfL = h => ({ 1: t("1T"), 2: t("2T"), 3: t("1TS"), 4: t("2TS") }[h] || "1T");
const BODY = [["Destro", "Destro", "Right foot"], ["Sinistro", "Sinistro", "Left foot"], ["Testa", "Testa", "Head"], ["Altro", "Altro", "Other"]];

/* ---------- configurazione (migrazione alla v4) ---------- */
Migrate.config = (orig => function () {
  orig.call(Migrate);
  const c = S.settings.get("config"); if (!c || (c.v || 0) >= 4) return;
  c.liveGroups = LIVE_GROUPS_DEF.map(([id, it, en]) => ({ id, it, en }));
  const old = new Map((c.liveCats || []).map(x => [x.id, x]));
  c.liveCats = LIVE_CATS_DEF.map(([id, it, en, group, params, kind, fixed]) => ({ id, it, en, group, params, area: (params[0] || "men|").split("|")[0] || "men", kind: kind || "", fixed: fixed || "", hidden: (old.get(id) || {}).hidden || false }));
  c.warmupChips = WARMUP_DEF.map(([id, it, en]) => ({ id, it, en })); c.preChecklist = CHECK_DEF.map(([id, it, en]) => ({ id, it, en }));
  c.v = 4; put("settings", "config", c);
})(Migrate.config);
const catOf = id => Cfg.get().liveCats.find(x => x.id === id);
function evOutcome(e) { const c = catOf(e.c); return c && c.fixed ? c.fixed : e.o; }
function zoneL(z) { if (!z) return ""; const a = z.x < 34 ? t("difensiva") : z.x < 67 ? t("centrale") : t("offensiva"); const b = z.y < 34 ? t("sinistra") : z.y < 67 ? t("centro") : t("destra"); return t("zona {a} {b}", { a, b }); }
function evText(e) { const c = catOf(e.c); const o = evOutcome(e); const extra = [e.z ? zoneL(e.z) : "", e.pr ? t("pressione {n}/5", { n: e.pr }) : "", e.b ? L(BODY.map(([id, it, en]) => ({ id, it, en })).find(x => x.id === e.b)) : ""].filter(Boolean).join(", "); return `${liveCatL(e.c)}${c && c.kind === "event" ? "" : " " + (o === "+" ? "✓" : o === "-" ? "✗" : "=")}${extra ? " (" + extra + ")" : ""}${e.n ? ": " + e.n : ""}`; }
function matchMinutes(m, pid) {
  const ev = (m.events || []).filter(e => e.p === pid); const inn = ev.find(e => e.c === "Entra"), out = ev.find(e => e.c === "Esce" || e.c === "Espulsione");
  const pre = ((m.pre || {}).players || {})[pid] || {}; if (!inn && pre.status === "Panchina") return out ? 0 : 0;
  const start = inn ? inn.t : 0, end = out ? out.t : 90; return Math.max(0, end - start);
}
function paramStats(pid, matchId) {
  const out = {};
  for (const [mid, m] of S.matches) { if (matchId && mid !== matchId) continue; for (const e of (m.events || [])) { if (e.p !== pid) continue; const c = catOf(e.c); if (!c) continue; const o = evOutcome(e); for (const k of (c.params || [])) { const s = out[k] = out[k] || { n: 0, pos: 0, neg: 0 }; s.n++; if (o === "+") s.pos++; else if (o === "-") s.neg++; } } }
  return out;
}
function suggestFrom(st) { const s = Cfg.get().scale; if (!st || st.n < 2) return null; const mid = (s.min + s.max) / 2; let v = mid + ((st.pos - st.neg) / st.n) * (s.max - s.min) * 0.4; v = Math.round(v / s.step) * s.step; return Math.max(s.min, Math.min(s.max, +v.toFixed(2))); }
function liveHint(d, aid, pid) { if (!d || !d.playerId) return ""; d._ps = d._ps && d._psKey === d.matchId + d.playerId ? d._ps : paramStats(d.playerId, d.matchId || null); d._psKey = d.matchId + d.playerId; const st = d._ps[aid + "|" + pid]; if (!st) return ""; return ` <small class="lh" title="${t("Azioni registrate collegate a questo parametro")}">${t("{n} az.", { n: st.n })} · ${Math.round(st.pos / st.n * 100)}%+</small>`; }
function liveSuggestBanner(d) {
  if (!d || !d.playerId) return ""; const ps = paramStats(d.playerId, d.matchId || null); let n = 0;
  for (const k in ps) { const [a, p] = k.split("|"); if (suggestFrom(ps[k]) != null && ((d.r || {})[a] || {})[p] == null) n++; }
  const tot = Object.values(ps).reduce((s, x) => s + x.n, 0); if (!tot) return "";
  return `<div class="banner info row between"><span>${d.matchId ? t("Per questa partita hai registrato {n} azioni collegate ai parametri.", { n: tot }) : t("Hai registrato {n} azioni collegate ai parametri di questo giocatore.", { n: tot })}${n ? " " + t("Posso proporti {n} voti: li controlli e li correggi tu.", { n }) : ""}</span>${n ? `<button class="btn sm pri" data-a="lSuggest">${t("Proponi voti dalle azioni")}</button>` : ""}</div>`;
}

/* ---------- pagina partita ---------- */
window.matchPage = function (id) {
  const m = S.matches.get(id); const tabs = [["prima", t("Prima")], ["live", t("Durante")], ["dopo", t("Dopo")], ["registro", t("Registro ({n})", { n: (m.events || []).length })], ["multimedia", t("Multimedia")]];
  if (!tabs.some(x => x[0] === ui.mtab)) ui.mtab = "live";
  const body = ui.mtab === "prima" ? prePage(id, m) : ui.mtab === "dopo" ? postPage(id, m) : ui.mtab === "registro" ? logPage(id, m) : ui.mtab === "multimedia" ? mediaSection("match", id) : liveView(id, m);
  return `<div class="row between noprint"><button class="btn ghost sm" data-a="closeMatch">← ${t("Partite")}</button><div class="row"><button class="btn sm" data-a="shareItem" data-kind="match" data-id="${id}">${ico("share")} ${t("Condividi")}</button><button class="btn sm" data-a="toggleArchive" data-coll="matches" data-id="${id}">${m.archived ? t("Ripristina") : t("Archivia")}</button><button class="btn sm" data-a="editMatch" data-id="${id}">${t("Modifica")}</button></div></div>
  <div class="head"><div><h1>${esc(m.home)} – ${esc(m.away)}${m.score ? " " + esc(m.score) : ""}${exB(m)}${archB(m)}</h1><p class="sub">${fmtDate(m.date)} ${esc(m.time || "")} · ${esc(L(Cfg.get().matchTypes.find(x => x.id === m.type)) || m.type || "")} ${m.competition ? "· " + esc(m.competition) : ""} ${m.venue ? "· " + esc(m.venue) : ""}</p>${Author.line(m)}${matchLinks(id, m)}</div><span class="pill ${m.status === "vista" ? "c-good" : "c-blue"}">${m.status === "vista" ? t("Vista") : t("In programma")}</span></div>
  <div class="tabs noprint">${tabs.map(([k, n]) => `<button data-a="mtab" data-t="${k}" aria-pressed="${ui.mtab === k}">${n}</button>`).join("")}</div>${body}`;
};

/* ---------- DURANTE: registrazione veloce ---------- */
window.liveView = function (id, m) {
  if (!ui.timer || ui.timerFor !== id) { ui.timer = tGet(id); ui.timerFor = id; }
  const tg = (m.targets || []).filter(P); if (!ui.liveP || !tg.includes(ui.liveP)) ui.liveP = tg[0] || null;
  if (!ui.lgroup) ui.lgroup = "frequenti";
  return `<div class="livebar"><div class="row between"><div class="row" style="gap:12px"><span class="clock" id="clock">00:00</span><span class="m" id="minLbl"></span></div>
    <div class="row"><button class="btn ${ui.timer.run ? "" : "pri"}" data-a="tToggle">${ui.timer.run ? t("Pausa") : t("Avvia")}</button>${Voice.btn()}<div class="seg">${[1, 2, 3, 4].map(h => `<button data-a="lHalf" data-h="${h}" aria-pressed="${ui.timer.half === h}" title="${[t("Primo tempo"), t("Secondo tempo"), t("Primo tempo supplementare"), t("Secondo tempo supplementare")][h - 1]}">${halfL(h)}</button>`).join("")}</div></div></div>
    <div class="lplayers" id="lplayers">${livePlayersHtml(m)}</div></div>
   <div class="llast" id="llast" hidden></div>${tg.length ? `<div class="lgroups" id="lgroups"></div><div class="ltiles" id="ltiles"></div>` : `<div class="empty">${t("Aggiungi i giocatori da osservare con «+ giocatore».")}</div>`}

   <p class="m" style="margin-top:10px">${t("Tocca ✓ positiva, = neutra, ✗ negativa: l'azione viene registrata subito con il minuto. Zona, pressione e piede li aggiungi con «Dettagli», anche dopo.")}</p>`;
};
function livePlayersHtml(m) {
  const tg = (m.targets || []).filter(P); const others = [...S.players.entries()].filter(([x, p]) => !tg.includes(x) && !p.archived).sort((a, b) => pname(a[1]).localeCompare(pname(b[1])));
  return tg.map(x => { const p = P(x); const n = (m.events || []).filter(e => e.p === x).length; return `<button class="lchip" data-a="liveP" data-id="${x}" aria-pressed="${ui.liveP === x}">${p.shirt ? `<b>${esc(p.shirt)}</b>` : ""}${esc(p.last || pname(p))}<small>${n}</small></button>`; }).join("") +
    `<select id="addTarget" aria-label="${t("aggiungi giocatore")}"><option value="">+ ${t("giocatore")}</option>${others.map(([x, p]) => `<option value="${x}">${esc(pname(p))}</option>`).join("")}</select><button class="btn sm ghost" data-a="quickPlayer" data-id="${ui.matchId}">+ ${t("notato al volo")}</button>`;
}
function liveGroupsFor(p) { const c = Cfg.get(); return c.liveGroups.filter(g => g.id !== "portiere" || isGK(p)); }
function frequentCats(pid) {
  const cnt = {}; for (const [, m] of S.matches) for (const e of (m.events || [])) if (e.p === pid) cnt[e.c] = (cnt[e.c] || 0) + 1;
  const cats = Cfg.get().liveCats.filter(c => !c.hidden && c.kind !== "event" && (c.group !== "portiere" || isGK(P(pid))));
  const fav = (S.settings.get("liveFav") || {}).ids || [];
  const byUse = cats.filter(c => cnt[c.id]).sort((a, b) => cnt[b.id] - cnt[a.id]).map(c => c.id);
  const role = mainRole(P(pid)) || ""; const roleDef = isGK(P(pid)) ? ["Parata / Uscita", "Uscita alta", "Presa", "Gioco con i piedi", "Posizionamento portiere", "Guida difesa"] : /Difensore|Terzino/.test(role) ? ["Duello a terra", "Duello aereo", "Lettura / Anticipo", "Posizione", "Marcatura", "Passaggio", "Passaggio progressivo", "Copertura"] : /Mediano|Regista|Centrocampista|Mezzala/.test(role) ? ["Ricezione", "Scanning", "Passaggio", "Passaggio progressivo", "Ricezione sotto pressione", "Pressing", "Recupero palla", "Contropressing"] : /Punta|Falso|Seconda/.test(role) ? ["Smarcamento", "Attacco profondità", "Tiro", "Protezione palla", "Colpo di testa", "Ricezione", "Pressing", "Occasione creata"] : ["Ricezione", "Dribbling", "Conduzione", "Cross / Assist", "Occasione creata", "Tiro", "Ripiegamento", "Smarcamento"];
  return [...new Set([...fav, ...byUse, ...roleDef])].filter(id => cats.some(c => c.id === id)).slice(0, 10);
}
function renderLive() {
  const m = S.matches.get(ui.matchId); if (!m || !$("#lplayers")) return; const p = P(ui.liveP);
  $("#lplayers").innerHTML = livePlayersHtml(m); bindAddTarget();
  const gs = $("#lgroups"), ts = $("#ltiles"); if (!gs || !p) return;
  const groups = liveGroupsFor(p); if (!groups.some(g => g.id === ui.lgroup)) ui.lgroup = "frequenti";
  const pev = (m.events || []).filter(e => e.p === ui.liveP);
  gs.innerHTML = groups.map(g => { const n = g.id === "frequenti" ? 0 : pev.filter(e => (catOf(e.c) || {}).group === g.id).length; return `<button data-a="lgroup" data-g="${g.id}" aria-pressed="${ui.lgroup === g.id}">${esc(L(g))}${n ? ` <small>${n}</small>` : ""}</button>`; }).join("");
  const fav = new Set((S.settings.get("liveFav") || {}).ids || []);
  const cats = ui.lgroup === "frequenti" ? frequentCats(ui.liveP).map(catOf) : Cfg.get().liveCats.filter(c => c.group === ui.lgroup && !c.hidden);
  ts.innerHTML = cats.map(c => { const ev = pev.filter(e => e.c === c.id); const pos = ev.filter(e => evOutcome(e) === "+").length, neg = ev.filter(e => evOutcome(e) === "-").length;
    return `<div class="ltile" data-cat="${esc(c.id)}"><div class="ln"><span>${esc(L(c))}</span><span class="lcnt">${ev.length ? `<b class="tp">${pos}</b>/<b class="tm">${neg}</b>/${ev.length}` : ""}<button class="lstar ${fav.has(c.id) ? "on" : ""}" data-a="lfav" data-c="${esc(c.id)}" title="${t("Metti tra i frequenti")}" aria-label="${t("Metti tra i frequenti")}">★</button></span></div>
    ${c.kind === "event" ? `<div class="lo one"><button class="${c.fixed === "+" ? "op" : c.fixed === "-" ? "om" : "on"}" data-a="lrec" data-c="${esc(c.id)}" data-o="${c.fixed || "="}">${t("Registra")}</button></div>` : `<div class="lo ${App.cfgDevice().hideNeutral ? "two" : ""}"><button class="op" data-a="lrec" data-c="${esc(c.id)}" data-o="+" aria-label="${t("Positiva")}">✓</button><button class="om" data-a="lrec" data-c="${esc(c.id)}" data-o="-" aria-label="${t("Negativa")}">✗</button>${App.cfgDevice().hideNeutral ? "" : `<button class="on" data-a="lrec" data-c="${esc(c.id)}" data-o="=" aria-label="${t("Neutra")}">=</button>`}</div>`}</div>`; }).join("");
  renderLast();
}
function renderLast() {
  const el = $("#llast"); if (!el) return; const m = S.matches.get(ui.matchId); const e = (m.events || [])[m.events.length - 1];
  if (!e) { el.hidden = true; return; } el.hidden = false; const o = evOutcome(e);
  el.innerHTML = `<span class="code" style="background:transparent;color:inherit">${halfL(e.h)} ${e.t}'</span><span class="grow"><b class="${o === "+" ? "tp" : o === "-" ? "tm" : ""}">${o === "+" ? "✓" : o === "-" ? "✗" : "="}</b> ${esc(liveCatL(e.c))} · ${esc((P(e.p) || {}).last || pname(P(e.p)))}${e.z || e.pr || e.n ? " · " + t("con dettagli") : ""}</span><button class="btn sm" data-a="ldet" data-e="${e.id}">${t("Dettagli")}</button><button class="btn sm" data-a="undo">${t("Annulla")}</button>`;
}
function bindAddTarget() { const at = $("#addTarget"); if (at) at.onchange = e => { if (!e.target.value) return; const m = S.matches.get(ui.matchId); put("matches", ui.matchId, { ...m, targets: [...(m.targets || []), e.target.value] }); ui.liveP = e.target.value; render(true); }; }
window.bindLive = function () { if (ui.view === "partite" && ui.matchId && ui.mtab === "live") { renderLive(); tickClock(); if (!clockH) clockH = setInterval(tickClock, 1000); } if (ui.view === "partite" && ui.matchId && ui.mtab === "registro") bindLogFilters(); };
window.tickClock = function () { const c = $("#clock"); if (!c) { clearInterval(clockH); clockH = null; return; } const s = tSec(ui.timer); c.textContent = String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); $("#minLbl").textContent = t("minuto {n}'", { n: minuteOf(ui.timer) }); };
window.renderLiveLog = function () { };
function liveDetails(eid) {
  const m = S.matches.get(ui.matchId); const e = (m.events || []).find(x => x.id === eid); if (!e) return; const c = catOf(e.c); const tg = (m.targets || []).filter(P);
  let z = e.z || null;
  sheet(`<div class="row between"><h2>${esc(liveCatL(e.c))}</h2><button class="btn sm ghost" data-a="closeSheetBtn">✕</button></div>
   <div class="fgrid"><label class="f">${t("Giocatore")}<select id="ldP">${tg.map(x => `<option value="${x}" ${x === e.p ? "selected" : ""}>${esc(pname(P(x)))}</option>`).join("")}</select></label>
    <label class="f">${t("Azione")}<select id="ldC">${Cfg.get().liveGroups.map(g => `<optgroup label="${esc(L(g))}">${Cfg.get().liveCats.filter(x => x.group === g.id).map(x => `<option value="${esc(x.id)}" ${x.id === e.c ? "selected" : ""}>${esc(L(x))}</option>`).join("")}</optgroup>`).join("")}</select></label>
    <label class="f">${t("Minuto")}<input type="number" id="ldT" value="${e.t}" min="0" max="130"></label>
    <label class="f">${t("Tempo")}<select id="ldH">${[1, 2, 3, 4].map(h => `<option value="${h}" ${e.h === h ? "selected" : ""}>${halfL(h)}</option>`).join("")}</select></label></div>
   ${c && c.kind === "event" ? "" : `<div><div class="m" style="font-weight:600;margin-bottom:6px">${t("Esito")}</div><div class="seg" id="ldO">${[["+", "✓ " + t("Positiva")], ["-", "✗ " + t("Negativa")], ["=", "= " + t("Neutra")]].filter(([v]) => v !== "=" || !App.cfgDevice().hideNeutral || e.o === "=").map(([v, n]) => `<button data-v="${v}" aria-pressed="${e.o === v}">${n}</button>`).join("")}</div></div>`}
   <div><div class="m" style="font-weight:600;margin-bottom:6px">${t("Zona del campo (tocca il riquadro)")}</div>${zonePicker(z, "ldZ")}</div>
   <div class="row"><div><div class="m" style="font-weight:600;margin-bottom:6px">${t("Pressione avversaria")}</div><div class="seg" id="ldPr">${[1, 2, 3, 4, 5].map(v => `<button data-v="${v}" aria-pressed="${e.pr === v}">${v}</button>`).join("")}</div></div>
   <div><div class="m" style="font-weight:600;margin-bottom:6px">${t("Piede / parte del corpo")}</div><div class="seg" id="ldB">${BODY.map(([id, it, en]) => `<button data-v="${id}" aria-pressed="${e.b === id}">${esc(L({ it, en }))}</button>`).join("")}</div></div></div>
   <label class="f">${t("Nota")}<input type="text" id="ldN" value="${esc(e.n)}"></label>
   <div class="row between"><button class="btn danger" id="ldDel">${t("Elimina")}</button><button class="btn pri" id="ldSave">${t("Salva")}</button></div>`, true);
  const segs = ["#ldO", "#ldPr", "#ldB"]; segs.forEach(s => { const el = $(s); if (el) el.onclick = ev => { const b = ev.target.closest("button"); if (!b) return; const was = b.getAttribute("aria-pressed") === "true"; el.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", "false")); if (!(was && s !== "#ldO")) b.setAttribute("aria-pressed", "true"); }; });
  bindZonePicker("ldZ", () => z, nz => { z = nz; });
  const val = s => { const b = $(s) && $(s).querySelector('[aria-pressed="true"]'); return b ? b.dataset.v : ""; };
  $("#ldSave").onclick = () => { const mm = S.matches.get(ui.matchId); const ne = { ...e, p: $("#ldP").value, c: $("#ldC").value, t: +$("#ldT").value || e.t, h: +$("#ldH").value, o: val("#ldO") || e.o, z, pr: +val("#ldPr") || null, b: val("#ldB") || "", n: $("#ldN").value.trim() }; put("matches", ui.matchId, { ...mm, events: mm.events.map(x => x.id === e.id ? ne : x) }); closeSheet(); toast(t("Azione aggiornata")); render(true); };
  $("#ldDel").onclick = () => { const mm = S.matches.get(ui.matchId); put("matches", ui.matchId, { ...mm, events: mm.events.filter(x => x.id !== e.id) }); closeSheet(); toast(t("Azione eliminata")); render(true); };
}

/* ---------- REGISTRO: filtri, modifica, riepilogo ---------- */
function logPage(id, m) {
  const f = ui.lf = ui.lf || { p: "", g: "", o: "", h: "" }; const tg = (m.targets || []).filter(P);
  const ev = (m.events || []).filter(e => (!f.p || e.p === f.p) && (!f.g || (catOf(e.c) || {}).group === f.g) && (!f.o || evOutcome(e) === f.o) && (!f.h || String(e.h) === f.h)).sort((a, b) => (a.h - b.h) || (a.t - b.t));
  const groups = Cfg.get().liveGroups.filter(g => g.id !== "frequenti");
  return `<section class="panel"><div class="fgrid"><label class="f">${t("Giocatore")}<select id="lf_p"><option value="">${t("Tutti")}</option>${tg.map(x => `<option value="${x}" ${f.p === x ? "selected" : ""}>${esc(pname(P(x)))}</option>`).join("")}</select></label>
   <label class="f">${t("Fase")}<select id="lf_g"><option value="">${t("Tutte")}</option>${groups.map(g => `<option value="${g.id}" ${f.g === g.id ? "selected" : ""}>${esc(L(g))}</option>`).join("")}</select></label>
   <label class="f">${t("Esito")}<select id="lf_o"><option value="">${t("Tutti")}</option><option value="+" ${f.o === "+" ? "selected" : ""}>✓ ${t("Positiva")}</option><option value="=" ${f.o === "=" ? "selected" : ""}>= ${t("Neutra")}</option><option value="-" ${f.o === "-" ? "selected" : ""}>✗ ${t("Negativa")}</option></select></label>
   <label class="f">${t("Tempo")}<select id="lf_h"><option value="">${t("Tutti")}</option>${[1, 2, 3, 4].map(h => `<option value="${h}" ${f.h === String(h) ? "selected" : ""}>${halfL(h)}</option>`).join("")}</select></label></div></section>
  <div class="grid2"><section class="panel"><h2>${t("Azioni ({n})", { n: ev.length })}</h2><div class="list" style="margin-top:6px">${ev.map(e => { const o = evOutcome(e); return `<div class="item"><span class="code">${halfL(e.h)} ${e.t}'</span><div class="grow"><div class="t"><span class="${o === "+" ? "tp" : o === "-" ? "tm" : ""}">${e.c === "Nota vocale" ? "🎙" : e.c === "Nota scritta" ? "✍" : o === "+" ? "✓" : o === "-" ? "✗" : "="}</span> ${esc(liveCatL(e.c))} <span class="muted" style="font-weight:400">· ${esc(pname(P(e.p)))}</span></div><div class="m">${esc(L((Cfg.get().liveGroups.find(g => g.id === (catOf(e.c) || {}).group)) || {}))}${e.z ? " · " + esc(zoneL(e.z)) : ""}${e.pr ? " · " + t("pressione {n}/5", { n: e.pr }) : ""}${e.n ? " · " + esc(e.n) : ""}</div>${e.mediaId && S.media.get(e.mediaId) ? `<audio controls preload="none" class="vnote" data-blob="${S.media.get(e.mediaId).blobId}"></audio>` : ""}</div><button class="btn sm ghost" data-a="ldet" data-e="${e.id}">${t("Modifica")}</button></div>`; }).join("") || `<div class="empty">${t("Nessuna azione con questi filtri.")}</div>`}</div></section>
  <section class="panel"><h2>${t("Riepilogo per giocatore")}</h2>${tg.map(pid => { const pe = (m.events || []).filter(e => e.p === pid); if (!pe.length) return ""; const zones = pe.filter(e => e.z).map(e => e.z);
    return `<h3 style="margin-top:12px">${esc(pname(P(pid)))} · ${t("{n} azioni", { n: pe.length })} · ${Math.round(pe.filter(e => evOutcome(e) === "+").length / pe.length * 100)}% +</h3>${groupTable(pe)}${zones.length ? `<h3 style="margin-top:10px">${t("Mappa delle zone")}</h3>${heatBlock(pe, "m" + pid)}` : ""}${trackPanel(pe)}`; }).join("") || `<p class="muted">${t("Nessuna azione registrata.")}</p>`}</section></div>`;
}
function groupTable(evs) {
  const rows = {}; for (const e of evs.filter(x => x.c !== "Nota vocale" && x.c !== "Nota scritta")) { const g = (catOf(e.c) || {}).group || "altro"; const o = evOutcome(e); const r = rows[g] = rows[g] || { n: 0, p: 0, m: 0 }; r.n++; if (o === "+") r.p++; else if (o === "-") r.m++; }
  return `<div class="tw"><table><thead><tr><th>${t("Fase")}</th><th class="n">${t("Azioni")}</th><th class="n">✓</th><th class="n">✗</th><th class="n">%+</th></tr></thead><tbody>${Object.entries(rows).map(([g, r]) => `<tr><td>${esc(L(Cfg.get().liveGroups.find(x => x.id === g)) || g)}</td><td class="n">${r.n}</td><td class="n">${r.p}</td><td class="n">${r.m}</td><td class="n">${Math.round(r.p / r.n * 100)}%</td></tr>`).join("")}</tbody></table></div>`;
}
function bindLogFilters() { ["p", "g", "o", "h"].forEach(k => { const el = $("#lf_" + k); if (el) el.onchange = () => { ui.lf[k] = el.value; render(true); }; }); }

/* ---------- PRIMA: preparazione ---------- */
function prePage(id, m) {
  const c = Cfg.get(); const pre = m.pre || {}; const sysOpts = c.systems.map(x => ({ id: x, it: x, en: x })); const tg = (m.targets || []).filter(P);
  const W = [["", "—", "—"], ["Sereno", "Sereno", "Clear"], ["Nuvoloso", "Nuvoloso", "Cloudy"], ["Pioggia", "Pioggia", "Rain"], ["Vento", "Vento", "Wind"], ["Caldo", "Caldo", "Hot"], ["Freddo", "Freddo", "Cold"], ["Neve", "Neve", "Snow"]].map(([id, it, en]) => ({ id, it, en }));
  const PI = [["", "—", "—"], ["Erba naturale", "Erba naturale", "Natural grass"], ["Sintetico", "Sintetico", "Artificial"], ["Pesante", "Terreno pesante", "Heavy pitch"], ["Irregolare", "Terreno irregolare", "Uneven pitch"]].map(([id, it, en]) => ({ id, it, en }));
  return `<section class="panel"><h2>${t("Preparazione della missione")}</h2><div class="fgrid" style="margin-top:10px">
    <label class="f full">${t("Obiettivo della missione")}<textarea id="pr_goal" style="min-height:60px">${esc(m.goal)}</textarea></label>
    <label class="f">${t("Sistema di gioco casa")}${sel("pr_sysHome", sysOpts, m.sysHome, "—")}</label><label class="f">${t("Sistema di gioco trasferta")}${sel("pr_sysAway", sysOpts, m.sysAway, "—")}</label>
    <label class="f">${t("Meteo")}${sel("pr_weather", W, pre.weather)}</label><label class="f">${t("Campo")}${sel("pr_pitch", PI, pre.pitch)}</label>
    <label class="f full">${t("Formazione casa (numero e nome, uno per riga)")}<textarea id="pr_lh">${esc(pre.lineupHome)}</textarea></label>
    <label class="f full">${t("Formazione trasferta (numero e nome, uno per riga)")}<textarea id="pr_la">${esc(pre.lineupAway)}</textarea></label>
    <label class="f full">${t("Note prima della gara (arrivo, contesto, classifica, assenze)")}<textarea id="pr_notes">${esc(pre.notes)}</textarea></label></div></section>
  <section class="panel"><h2>${t("Domande prima del fischio d'inizio")}</h2><p class="sub small">${t("Rispondi in pochi secondi: il contesto cambia il significato di ogni azione.")}</p>
   <div class="grid2" style="margin-top:8px">${PREQ_GROUPS.map(([g, it, en]) => { const qs = (c.preQuestions || []).filter(x => x.group === g && !x.hidden); if (!qs.length) return ""; return `<div><h3>${esc(L({ it, en }))}</h3>${qs.map(x => `<div class="row between" style="padding:5px 0;border-top:1px solid var(--line)"><span class="small">${esc(L(x))}</span><div class="seg" data-pq="${esc(x.id)}">${[["si", t("Sì")], ["no", t("No")], ["nd", "?"]].map(([v, n]) => `<button type="button" data-v="${v}" aria-pressed="${((pre.q || {})[x.id]) === v}">${n}</button>`).join("")}</div></div>`).join("")}</div>`; }).join("")}</div></section>
  <section class="panel"><h2>${t("Giocatori da osservare: riscaldamento e ruolo previsto")}</h2>${tg.map(pid => { const pp = (pre.players || {})[pid] || {}; return `<div class="item" style="flex-wrap:wrap;align-items:flex-start" data-pp="${pid}">${avatar(P(pid))}<div class="grow col" style="gap:6px"><b>${esc(pname(P(pid)))}</b>
      <div class="row"><select data-k="status" style="width:auto">${[["", t("Stato —")], ["Titolare", t("Titolare")], ["Panchina", t("In panchina")], ["Assente", t("Non convocato / assente")]].map(([v, n]) => `<option value="${v}" ${pp.status === v ? "selected" : ""}>${n}</option>`).join("")}</select><select data-k="role" style="width:auto"><option value="">${t("Ruolo previsto —")}</option>${c.roles.map(r => `<option value="${esc(r.id)}" ${pp.role === r.id ? "selected" : ""}>${esc(L(r))}</option>`).join("")}</select></div>
      <div class="chips">${(c.warmupChips || []).filter(x => !x.hidden).map(x => `<button type="button" class="chip" data-wc="${esc(x.id)}" aria-pressed="${(pp.chips || []).includes(x.id)}">${esc(L(x))}</button>`).join("")}</div>
      <input type="text" data-k="note" value="${esc(pp.note)}" placeholder="${t("Nota sul riscaldamento e sull'atteggiamento")}"></div></div>`; }).join("") || `<div class="empty">${t("Aggiungi i giocatori da osservare con «Modifica».")}</div>`}</section>
  <div class="row end"><button class="btn pri" data-a="savePre">${t("Salva preparazione")}</button></div>`;
}

/* ---------- DOPO: sintesi della gara ---------- */
function postPage(id, m) {
  const c = Cfg.get(), s = c.scale; const post = m.post || {}; const tg = (m.targets || []).filter(P); const evs = [...S.evals.entries()].filter(([, e]) => e.matchId === id);
  const grades = []; for (let v = s.max; v >= s.min; v -= (s.max - s.min > 10 ? 5 : s.step)) grades.push(+v.toFixed(2));
  return `<section class="panel"><h2>${t("Risultato e analisi delle squadre")}</h2><div class="fgrid" style="margin-top:10px"><label class="f">${t("Risultato")}<input type="text" id="po_score" value="${esc(m.score)}" placeholder="2-1"></label><label class="f">${t("Condizioni (campo, meteo, pubblico)")}<input type="text" id="po_cond" value="${esc(m.conditions)}"></label>
    <label class="f full">${t("Squadra di casa: idea di gioco e note")}<textarea id="po_home">${esc(m.homeNotes)}</textarea></label><label class="f full">${t("Squadra in trasferta: idea di gioco e note")}<textarea id="po_away">${esc(m.awayNotes)}</textarea></label>
    <label class="f full">${t("Note generali e giocatori da segnalare")}<textarea id="po_notes">${esc(m.notes)}</textarea></label></div>
    <h3 style="margin-top:14px">${t("Contesto della gara")}</h3>${contextEdit("m", post.context)}</section>
  ${tg.map(pid => { const p = P(pid); const pp = (post.players || {})[pid] || {}; const pe = (m.events || []).filter(e => e.p === pid); const ev = evs.find(([, e]) => e.playerId === pid);
    return `<section class="panel" data-po="${pid}"><div class="row between"><div class="row">${avatar(p)}<div><h2>${esc(pname(p))}</h2><div class="m">${pe.length ? t("{n} azioni registrate", { n: pe.length }) + " · " + Math.round(pe.filter(e => evOutcome(e) === "+").length / pe.length * 100) + "% +" : t("Nessuna azione registrata")}</div></div></div>${ev ? `<button class="btn sm" data-a="openEvalPlayer" data-id="${ev[0]}">${t("Apri valutazione")}</button>` : `<button class="btn sm pri" data-a="evalFromMatch" data-id="${pid}">${t("Crea valutazione completa")}</button>`}</div>
     <div class="fgrid" style="margin-top:10px"><label class="f">${t("Minuti giocati")}<input type="number" data-k="minutes" value="${esc(pp.minutes ?? matchMinutes(m, pid))}"></label>
      <label class="f">${t("Voto della partita")}<select data-k="grade"><option value="">—</option>${grades.map(v => `<option value="${v}" ${String(pp.grade) === String(v) ? "selected" : ""}>${f1(v)}</option>`).join("")}</select></label>
      <label class="f">${t("Condizione fisica")}<select data-k="cond">${[["", "—"], ["Ottima", t("Ottima")], ["Buona", t("Buona")], ["Normale", t("Normale")], ["Affaticato", t("Affaticato")], ["Infortunato", t("Infortunato")]].map(([v, n]) => `<option value="${v}" ${pp.cond === v ? "selected" : ""}>${n}</option>`).join("")}</select></label>
      <label class="f">${t("Giudizio dopo la gara")}<select data-k="verdict"><option value="">—</option>${c.verdicts.map(v => `<option value="${esc(v.id)}" ${pp.verdict === v.id ? "selected" : ""}>${esc(L(v))}</option>`).join("")}</select></label>
      <label class="f full">${t("Sintesi in 2 righe")}<textarea data-k="note" style="min-height:60px">${esc(pp.note)}</textarea></label></div>
     ${pe.length ? groupTable(pe) : ""}</section>`; }).join("")}
  <div class="row end"><label class="chk"><input type="checkbox" id="po_apply" checked> ${t("Aggiorna il giudizio nel profilo dei giocatori")}</label><button class="btn pri" data-a="savePost">${t("Salva e segna la partita come vista")}</button></div>`;
}

/* ---------- profilo giocatore: partite e azioni ---------- */
window.ptab = (orig => function (id, p, pr) {
  if (ui.ptab !== "azioni") return orig(id, p, pr);
  const ms = [...S.matches.entries()].filter(([, m]) => (m.targets || []).includes(id) || (m.events || []).some(e => e.p === id)).sort((a, b) => (b[1].date || "").localeCompare(a[1].date || ""));
  const all = ms.flatMap(([, m]) => (m.events || []).filter(e => e.p === id)); const ps = paramStats(id);
  const grades = ms.map(([, m]) => ({ label: fmtDate(m.date).slice(0, 5), v: +(((m.post || {}).players || {})[id] || {}).grade || null })).filter(x => x.v).reverse();
  const byCat = {}; for (const e of all) { const o = evOutcome(e); const r = byCat[e.c] = byCat[e.c] || { n: 0, p: 0, z: 0, m: 0 }; r.n++; if (o === "+") r.p++; else if (o === "-") r.m++; else r.z++; }
  return `<section class="panel"><h2>${t("Partite osservate")}</h2><div class="list" style="margin-top:6px">${ms.map(([mid, m]) => { const pe = (m.events || []).filter(e => e.p === id); const pp = ((m.post || {}).players || {})[id] || {}; return `<div class="item click" data-a="openMatch" data-id="${mid}"><div class="mono small" style="width:54px">${fmtDate(m.date).slice(0, 5)}</div><div class="grow"><div class="t">${esc(m.home)} – ${esc(m.away)} ${esc(m.score || "")}</div><div class="m">${t("{n} azioni", { n: pe.length })}${pe.length ? " · " + Math.round(pe.filter(e => evOutcome(e) === "+").length / pe.length * 100) + "% +" : ""}${pp.minutes != null ? " · " + pp.minutes + "'" : ""}${pp.cond ? " · " + esc(t(pp.cond)) : ""}</div></div>${pp.grade ? `<div class="score ${sc(+pp.grade)}">${f1(+pp.grade)}</div>` : ""}</div>`; }).join("") || `<div class="empty">${t("Nessuna partita collegata.")}</div>`}</div>
    ${grades.length >= 2 ? `<h3 style="margin-top:12px">${t("Voti partita")}</h3>${lineChart(grades)}` : ""}</section>
  ${all.length ? `<div class="grid2"><section class="panel"><h2>${t("Azioni per fase")}</h2>${groupTable(all)}${all.some(e => e.z) ? `<h3 style="margin-top:12px">${t("Mappa delle zone")}</h3>${heatBlock(all, "p" + id)}` : ""}<h3 style="margin-top:12px">${t("Qualità dei dati tracciati")}</h3>${trackPanel(all)}</section>
   <section class="panel"><h2>${t("Azioni nel dettaglio")}</h2><div class="tw"><table><thead><tr><th>${t("Azione")}</th><th class="n">${t("Tot.")}</th><th class="n">✓</th><th class="n">=</th><th class="n">✗</th><th class="n">%+</th></tr></thead><tbody>${Object.entries(byCat).sort((a, b) => b[1].n - a[1].n).map(([k, r]) => `<tr><td>${esc(liveCatL(k))}</td><td class="n">${r.n}</td><td class="n">${r.p}</td><td class="n">${r.z}</td><td class="n">${r.m}</td><td class="n">${Math.round(r.p / r.n * 100)}%</td></tr>`).join("")}</tbody></table></div></section></div>
  <section class="panel"><h2>${t("Collegamento con i parametri di valutazione")}</h2><p class="sub small">${t("Ogni azione registrata alimenta i parametri collegati. Il voto proposto è un punto di partenza: il giudizio finale resta tuo.")}</p><div class="tw" style="margin-top:8px"><table><thead><tr><th>${t("Area")}</th><th>${t("Parametro")}</th><th class="n">${t("Azioni")}</th><th class="n">%+</th><th class="n">${t("Voto proposto")}</th><th class="n">${t("Tuo voto medio")}</th></tr></thead><tbody>${Object.entries(ps).sort((a, b) => b[1].n - a[1].n).map(([k, st]) => { const [a, pp] = k.split("|"); const A0 = Cfg.area(a); if (!A0) return ""; return `<tr><td>${esc(L(A0))}</td><td>${esc(paramL(A0, pp))}</td><td class="n">${st.n}</td><td class="n">${Math.round(st.pos / st.n * 100)}%</td><td class="n">${f1(suggestFrom(st))}</td><td class="n">${f1((pr.attr[a] || {})[pp])}</td></tr>`; }).join("")}</tbody></table></div></section>` : ""}`;
})(window.ptab);

/* ---------- valutazione creata dalla partita ---------- */
window.importLive = function (showToast) {
  const d = ui.edraft; const m = S.matches.get(d.matchId); if (!m) return; const have = new Set(d.evidence.map(e => e.liveId)); let n = 0; const p = P(d.playerId);
  for (const e of (m.events || []).filter(e => e.p === d.playerId && !have.has(e.id) && e.c !== "Nota vocale" && e.c !== "Nota scritta").sort((a, b) => (a.h - b.h) || (a.t - b.t))) { const c = catOf(e.c); let area = c ? c.area : "tec"; if (!visAreas(p).some(a => a.id === area)) area = visAreas(p)[0].id; d.evidence.push({ area, min: String(e.t), text: evText(e), liveId: e.id }); n++; }
  if (showToast) toast(n ? t("{n} evidenze importate", { n }) : t("Niente di nuovo da importare"));
};
A.evalFromMatch = el => {
  const mid = ui.matchId, pid = el.dataset.id; const m = S.matches.get(mid); const d = newEvalDraft(pid, mid); const pp = ((m.post || {}).players || {})[pid] || {};
  d.minutes = String(pp.minutes ?? matchMinutes(m, pid)); const zones = (m.events || []).filter(e => e.p === pid && e.z).map(e => e.z); if (zones.length) d.positions = zones.slice(0, 14);
  if (pp.note) d.summary = pp.note; if (m.post && m.post.context) d.context = { ...m.post.context }; if (m.sysHome) d.sysHome = m.sysHome; if (m.sysAway) d.sysAway = m.sysAway;
  go("giocatori", { edraft: d, playerId: pid, matchId: null, openAreas: null }); importLive(false); render();
};

/* ---------- azioni ---------- */
Object.assign(A, {
  lgroup: el => { ui.lgroup = el.dataset.g; renderLive(); },
  liveP: el => { ui.liveP = el.dataset.id; renderLive(); },
  lrec: el => {
    if (!ui.liveP) { toast(t("Scegli prima il giocatore")); return; }
    const m = S.matches.get(ui.matchId); const ev = { id: uid(), t: minuteOf(ui.timer), h: ui.timer.half, p: ui.liveP, c: el.dataset.c, o: el.dataset.o, n: "" };
    put("matches", ui.matchId, { ...m, events: [...(m.events || []), ev] });
    try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) { }
    const tile = el.closest(".ltile"); if (tile) { tile.classList.remove("hit"); void tile.offsetWidth; tile.classList.add("hit"); }
    renderLive(); if (!App.cfgDevice().liveDetailsOff) liveDetails(ev.id);
  },
  lfav: (el, e) => { e.stopPropagation(); const f = new Set((S.settings.get("liveFav") || {}).ids || []); if (f.has(el.dataset.c)) f.delete(el.dataset.c); else f.add(el.dataset.c); put("settings", "liveFav", { ids: [...f] }); renderLive(); },
  ldet: el => liveDetails(el.dataset.e),
  undo: () => { const m = S.matches.get(ui.matchId); if (!(m.events || []).length) return; put("matches", ui.matchId, { ...m, events: m.events.slice(0, -1) }); toast(t("Ultima azione annullata")); renderLive(); },
  lHalf: el => { const h = +el.dataset.h; const tm = ui.timer; tSet(ui.matchId, { run: false, start: 0, base: HALVES[h] * 60, half: h }); render(true); },
  savePre: () => {
    const m = S.matches.get(ui.matchId); const v = s => $(s) ? $(s).value : ""; const pre = { ...(m.pre || {}), weather: v("#pr_weather"), pitch: v("#pr_pitch"), lineupHome: v("#pr_lh"), lineupAway: v("#pr_la"), notes: v("#pr_notes"), check: {}, players: {} };
    pre.q = {}; $$("[data-pq]").forEach(s => { const b = s.querySelector('[aria-pressed="true"]'); if (b) pre.q[s.dataset.pq] = b.dataset.v; });
    $$("[data-pp]").forEach(row => { const o = {}; row.querySelectorAll("[data-k]").forEach(x => o[x.dataset.k] = x.value); o.chips = [...row.querySelectorAll(".chip[aria-pressed=true]")].map(x => x.dataset.wc); pre.players[row.dataset.pp] = o; });
    put("matches", ui.matchId, { ...m, goal: v("#pr_goal"), sysHome: v("#pr_sysHome"), sysAway: v("#pr_sysAway"), pre }); toast(t("Preparazione salvata")); render(true);
  },
  savePost: () => {
    const m = S.matches.get(ui.matchId); const v = s => $(s) ? $(s).value : ""; const post = { ...(m.post || {}), players: {}, context: readContext("m") }; const apply = $("#po_apply") && $("#po_apply").checked;
    $$("[data-po]").forEach(row => { const o = {}; row.querySelectorAll("[data-k]").forEach(x => o[x.dataset.k] = x.value); o.minutes = o.minutes === "" ? null : +o.minutes; post.players[row.dataset.po] = o; if (apply && o.verdict) { const p = P(row.dataset.po); if (p && p.verdict !== o.verdict) put("players", row.dataset.po, { ...p, verdict: o.verdict }); } });
    put("matches", ui.matchId, { ...m, score: v("#po_score"), conditions: v("#po_cond"), homeNotes: v("#po_home"), awayNotes: v("#po_away"), notes: v("#po_notes"), post, status: "vista" }); toast(t("Partita salvata e segnata come vista")); render(true);
  },
  lSuggest: () => { syncEval(); const d = ui.edraft; const ps = paramStats(d.playerId, d.matchId || null); let n = 0; for (const k in ps) { const [a, p] = k.split("|"); const s = suggestFrom(ps[k]); if (s == null) continue; d.r[a] = d.r[a] || {}; if (d.r[a][p] == null) { d.r[a][p] = s; n++; } } toast(t("{n} voti proposti: controllali e correggili", { n })); render(true); }
});
// scelta dei «chip» del riscaldamento senza ridisegnare
document.addEventListener("click", e => { const b = e.target.closest("[data-wc]"); if (b) b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") !== "true"); });

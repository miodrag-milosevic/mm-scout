"use strict";
/* =========================================================
   MM Scout — valutazione per ruolo e tocco personale:
   · caratteristiche in ordine di importanza per ogni ruolo
     (classico e interpretazione moderna);
   · proiezione: livello attuale, potenziale, dove può
     arrivare, entro quando, dove deve migliorare;
   · fuori dal campo (comportamento osservabile) con tutele
     per i minori;
   · per conto di chi lavori (club, agenzia, agente FIFA…);
   · bandiere nel menu della lingua.
   ========================================================= */

/* ---------- caratteristiche mancanti (aggiunte una volta sola) ---------- */
const NEW_PARAMS = [["tec", "Cross", "Crossing"], ["tec", "Calci piazzati", "Set pieces"], ["tat", "Pressing", "Pressing"], ["tat", "Scanning", "Scanning"]];
const LIVE_LINK = { "Cross / Assist": ["tec|Cross", "tec|Assist"], "Angolo": ["tec|Calci piazzati", "tec|Precisione"], "Punizione": ["tec|Calci piazzati", "tec|Tiro"], "Pressing": ["tat|Pressing", "fis|Intensità"], "Contropressing": ["tat|Pressing", "men|Determinazione"], "Scanning": ["tat|Scanning", "tat|Visione"] };
Migrate.config = (orig => function () {
  orig.call(Migrate);
  const c = S.settings.get("config"); if (!c || (c.v || 0) >= 6) return;
  for (const [aid, it, en] of NEW_PARAMS) { const a = (c.areas || []).find(x => x.id === aid); if (a && !a.params.some(p => p.id === it)) a.params.push({ id: it, it, en }); }
  for (const lc of (c.liveCats || [])) if (LIVE_LINK[lc.id]) { lc.params = LIVE_LINK[lc.id]; lc.area = lc.params[0].split("|")[0]; }
  c.v = 6; put("settings", "config", c);
})(Migrate.config);

/* ---------- importanza delle caratteristiche per ruolo ---------- */
const ROLE_PRIO = {
  "Portiere": "por|Parate por|Posizionamento tra i pali por|Reattività por|Uscite alte por|1vs1 in uscita por|Presa por|Gioco con i piedi por|Guida della difesa por|Uscite basse por|Rinvii men|Concentrazione men|Personalità men|Gestione degli errori fis|Esplosività fis|Elevazione fis|Agilità",
  "Difensore centrale": "tat|Posizione tat|Lettura del gioco tat|Anticipo fis|Duelli aerei tec|Contrasti tat|Abilità difensive tec|Colpo di testa fis|Forza tec|Passaggio tec|Gioco sotto pressione men|Concentrazione men|Leadership fis|Velocità tat|Ripiegamenti difensivi tat|Scanning",
  "Terzino": "tat|Abilità difensive tat|Posizione fis|Velocità fis|Resistenza tec|Cross tec|Contrasti tat|Ripiegamenti difensivi tat|Supporto al centrocampo tec|Conduzione palla tec|Passaggio tat|1vs1 fis|Accelerazione men|Concentrazione tat|Lettura del gioco",
  "Quinto": "fis|Resistenza fis|Velocità tec|Cross tat|Supporto al centrocampo tat|Ripiegamenti difensivi tec|Conduzione palla tat|1vs1 tat|Attacco della profondità fis|Capacità aerobica tec|Assist tat|Abilità difensive fis|Accelerazione fis|Intensità tec|Dribbling",
  "Mediano": "tat|Posizione tat|Rottura del gioco avversario tat|Lettura del gioco tec|Contrasti tat|Anticipo tat|Pressing fis|Intensità fis|Resistenza tec|Passaggio tec|Gioco sotto pressione men|Uomo squadra tat|Scanning fis|Duelli aerei men|Concentrazione",
  "Regista": "tat|Visione tat|Scanning tec|Passaggio tec|Gioco sotto pressione tat|Lettura del gioco tec|Controllo orientato tec|Precisione men|Presa decisioni tec|Passaggi chiave tat|Posizione men|Personalità tec|Calci piazzati men|Leadership tec|Tecnica",
  "Centrocampista centrale": "tec|Passaggio tat|Lettura del gioco fis|Resistenza tat|Supporto al centrocampo tec|Gioco sotto pressione tat|Scanning fis|Intensità tat|Pressing tec|Controllo orientato men|Presa decisioni tat|Capacità d'inserimento tec|Contrasti men|Uomo squadra tec|Tiro",
  "Mezzala": "tat|Capacità d'inserimento fis|Resistenza tec|Passaggio tat|Supporto al centrocampo tec|Conduzione palla fis|Intensità tat|Pressing tec|Gioco sotto pressione tat|Ricezione tra le linee tec|Tiro men|Uomo squadra tat|Scanning tec|Passaggi chiave fis|Fisicità",
  "Trequartista": "tat|Ricezione tra le linee tat|Visione tec|Passaggi chiave tec|Controllo orientato tec|Dribbling tec|Gioco sotto pressione tat|Imprevedibilità tec|Tiro tec|Assist men|Presa decisioni tat|Scanning tec|Calci piazzati men|Estrosità fis|Cambio di passo",
  "Ala": "tat|1vs1 tec|Dribbling fis|Accelerazione fis|Velocità tec|Cross tec|Conduzione palla tat|Attacco della profondità tec|Tiro tec|Assist tat|Imprevedibilità fis|Cambio di passo tat|Ripiegamenti difensivi tec|Uso entrambi i piedi tat|Pressing",
  "Seconda punta": "tat|Ricezione tra le linee tec|Finalizzazione tat|Senso del gol tec|Passaggi chiave tec|Dribbling tat|Smarcamento tat|Attacco della profondità tec|Tiro tec|Controllo orientato tec|Freddezza fis|Cambio di passo tat|Imprevedibilità tec|Assist",
  "Punta centrale": "tec|Finalizzazione tat|Senso del gol tat|Attacco della profondità tec|Freddezza tat|Smarcamento tec|Colpo di testa fis|Spalle alla porta fis|Protezione palla tec|Tiro fis|Duelli aerei tat|Fa reparto da solo fis|Forza tat|Pressing tec|Uso entrambi i piedi",
  "Falso 9": "tat|Ricezione tra le linee tec|Passaggi chiave tat|Visione tec|Controllo orientato tec|Gioco sotto pressione tec|Finalizzazione tat|Aprire gli spazi tec|Dribbling tat|Smarcamento men|Presa decisioni tat|Scanning tec|Tiro tat|Pressing tec|Tecnica"
};
// interpretazioni moderne del ruolo: le caratteristiche che contano di più salgono in cima
const ARCH_PRIO = {
  "gk-mod": "por|Gioco con i piedi por|Uscite basse por|1vs1 in uscita tec|Passaggio", "gk-pali": "por|Parate por|Reattività por|Posizionamento tra i pali",
  "dc-marc": "tec|Contrasti fis|Duelli aerei fis|Forza tat|Anticipo", "dc-imp": "tec|Passaggio tec|Gioco sotto pressione tec|Conduzione palla tat|Visione", "dc-cop": "tat|Lettura del gioco fis|Velocità tat|Posizione tat|Ripiegamenti difensivi",
  "fb-dif": "tat|Abilità difensive tec|Contrasti tat|Posizione", "fb-spi": "tec|Cross fis|Resistenza tat|Attacco della profondità tec|Assist", "fb-inv": "tec|Passaggio tec|Gioco sotto pressione tat|Supporto al centrocampo tat|Scanning", "fb-quinto": "fis|Resistenza tec|Cross fis|Velocità",
  "mid-reg": "tat|Visione tat|Scanning tec|Passaggio", "mid-rot": "tat|Rottura del gioco avversario tec|Contrasti tat|Pressing fis|Aggressività", "mid-btb": "fis|Resistenza tat|Capacità d'inserimento fis|Intensità tec|Conduzione palla", "mid-ins": "tat|Capacità d'inserimento tat|Senso del gol tec|Tiro tec|Finalizzazione", "mid-pal": "tec|Passaggio tec|Controllo orientato tec|Gioco sotto pressione tat|Scanning",
  "am-rif": "tec|Passaggi chiave tat|Visione tec|Assist tat|Ricezione tra le linee", "am-ins": "tat|Capacità d'inserimento tat|Attacco della profondità tec|Finalizzazione tat|Senso del gol",
  "w-cla": "tec|Cross fis|Velocità tat|1vs1 tec|Assist", "w-inv": "tec|Tiro tec|Conduzione palla tat|Ricezione tra le linee tec|Finalizzazione", "w-rac": "tec|Passaggio tat|Ricezione tra le linee tec|Gioco sotto pressione tat|Aprire gli spazi",
  "st-pos": "fis|Spalle alla porta fis|Duelli aerei tec|Colpo di testa fis|Protezione palla fis|Forza", "st-mov": "tat|Attacco della profondità fis|Accelerazione tat|Smarcamento tec|Finalizzazione", "st-sec": "tat|Ricezione tra le linee tec|Passaggi chiave tec|Dribbling", "st-f9": "tat|Ricezione tra le linee tat|Aprire gli spazi tec|Passaggi chiave"
};
const splitPrio = s => s.split(/ (?=[a-z]{3}\|)/);
function roleKey(r) { r = r || ""; if (ROLE_PRIO[r]) return r; if (/^Terzino/.test(r)) return "Terzino"; if (/^Quinto/.test(r)) return "Quinto"; if (/^Ala/.test(r)) return "Ala"; return ""; }
function prioList(p) { const k = roleKey(mainRole(p)); const base = k ? splitPrio(ROLE_PRIO[k]) : []; const arch = p && p.archetype && ARCH_PRIO[p.archetype] ? splitPrio(ARCH_PRIO[p.archetype]) : []; return [...new Set([...arch, ...base])]; }
function prioRank(p) { const m = new Map(); prioList(p).forEach((k, i) => m.set(k, i)); return m; }
function isKeyParam(p, aid, pid) { const r = prioRank(p).get(aid + "|" + pid); return r != null && r < 6; }
window.visParams = (orig => function (p, a) {
  const list = orig(p, a); const rk = prioRank(p); if (!rk.size) return list; const pos = new Map(list.map((x, i) => [x.id, i]));
  return list.slice().sort((x, y) => (rk.get(a.id + "|" + x.id) ?? 999 + pos.get(x.id)) - (rk.get(a.id + "|" + y.id) ?? 999 + pos.get(y.id)));
})(window.visParams);
window.visAreas = (orig => function (p) {
  const list = orig(p); const pl = prioList(p); if (!pl.length) return list; const first = a => { const i = pl.findIndex(k => k.startsWith(a.id + "|")); return i < 0 ? 999 : i; };
  return list.slice().sort((a, b) => first(a) - first(b));
})(window.visAreas);

/* ---------- proiezione: oggi, potenziale, dove può arrivare ---------- */
const WHEN = [["now", "Già pronto", "Ready now"], ["1", "Entro 1 stagione", "Within 1 season"], ["2", "In 2-3 stagioni", "In 2-3 seasons"], ["3", "Oltre 3 stagioni", "More than 3 seasons"]];
function projEdit(pj) {
  pj = pj || {}; const lv = Cfg.get().levels; const lsel = (id, v) => `<select id="${id}"><option value="">— ${t("nessuno")} —</option>${lv.map(l => `<option value="${esc(l.id)}" ${l.id === v ? "selected" : ""}>${esc(l.id)} · ${esc(L(l))}</option>`).join("")}</select>`;
  return `<section class="panel"><h2>${t("Il mio giudizio: oggi e domani")}</h2><p class="sub small">${t("Il tocco personale del report: dove è oggi il giocatore, dove può arrivare e su cosa deve lavorare.")}</p>
   <div class="fgrid" style="margin-top:10px"><label class="f">${t("Livello attuale")}${lsel("pjNow", pj.now)}</label><label class="f">${t("Potenziale")}${lsel("pjPot", pj.pot)}</label>
    <label class="f">${t("Quando può arrivarci")}<select id="pjWhen"><option value="">—</option>${WHEN.map(([k, it, en]) => `<option value="${k}" ${pj.when === k ? "selected" : ""}>${esc(L({ it, en }))}</option>`).join("")}</select></label>
    <label class="f full">${t("Dove può arrivare")}<input type="text" id="pjCeil" value="${esc(pj.ceil)}" placeholder="${t("es. titolare in una squadra di metà classifica della massima serie")}"></label>
    <label class="f full">${t("Dove deve migliorare")}<textarea id="pjImp" style="min-height:60px" placeholder="${t("Le 2-3 cose concrete su cui deve lavorare")}">${esc(pj.imp)}</textarea></label>
    <label class="f full">${t("La mia valutazione personale")}<textarea id="pjMe" style="min-height:70px" placeholder="${t("Che giocatore è, in parole tue, per lo staff")}">${esc(pj.me)}</textarea></label></div></section>`;
}
function readProj() { const v = s => $(s) ? $(s).value.trim() : ""; return { now: v("#pjNow"), pot: v("#pjPot"), when: v("#pjWhen"), ceil: v("#pjCeil"), imp: v("#pjImp"), me: v("#pjMe") }; }
function projView(pj, big) {
  if (!pj || !(pj.now || pj.pot || pj.ceil || pj.imp || pj.me)) return ""; const lv = id => { const l = Cfg.level(id); return l ? `<b class="lvl">${esc(id)}</b> ${esc(L(l))}` : "—"; }; const w = WHEN.find(x => x[0] === pj.when);
  return `<div class="proj ${big ? "big" : ""}"><div class="projrow"><div><span class="m">${t("Oggi")}</span><div>${lv(pj.now)}</div></div><div class="arrow">→</div><div><span class="m">${t("Potenziale")}</span><div>${lv(pj.pot)}</div></div>${w ? `<div><span class="m">${t("Quando")}</span><div>${esc(L({ it: w[1], en: w[2] }))}</div></div>` : ""}</div>
   ${pj.ceil ? `<p><b>${t("Dove può arrivare")}:</b> ${esc(pj.ceil)}</p>` : ""}${pj.imp ? `<p><b>${t("Dove deve migliorare")}:</b> ${esc(pj.imp)}</p>` : ""}${pj.me ? `<p class="pme">«${esc(pj.me)}»</p>` : ""}</div>`;
}
function latestProj(pid) { const ev = playerEvals(pid).map(x => x[1]).filter(e => e.proj && (e.proj.now || e.proj.pot || e.proj.me)).sort((a, b) => (b.date || "").localeCompare(a.date || "")); return ev[0] ? ev[0].proj : null; }
window.evalHeader = (orig => function (e) { return orig(e) + projView(e.proj); })(window.evalHeader);

/* ---------- fuori dal campo (con tutele per i minori) ---------- */
const OFF_SEL = {
  train: [["", "—"], ["top", "Esemplare"], ["ok", "Buono"], ["var", "Discontinuo"]],
  mates: [["", "—"], ["pos", "Positivo, aiuta i compagni"], ["neu", "Nella norma"], ["neg", "Difficile"]],
  errors: [["", "—"], ["calm", "Reagisce con calma"], ["var", "A volte si innervosisce"], ["bad", "Perde il controllo"]],
  school: [["", "—"], ["reg", "Regolare (riferito dal club o dalla famiglia)"], ["chk", "Da verificare"], ["na", "Non pertinente"]],
  family: [["", "—"], ["yes", "Presente e collaborativo"], ["unk", "Non noto"]],
  contact: [["", "—"], ["club", "Il club"], ["fam", "La famiglia (genitori o tutori)"], ["agent", "L'agente"]],
  source: [["", "—"], ["dir", "Osservazione diretta"], ["club", "Il club"], ["fam", "La famiglia"], ["agent", "L'agente"], ["media", "Fonti pubbliche"]]
};
const OFF_LAB = [["train", "Atteggiamento in allenamento"], ["mates", "Con compagni, staff e arbitro"], ["errors", "Reazione a errori e sconfitte"], ["school", "Percorso scolastico"], ["family", "Supporto della famiglia"], ["contact", "Riferimento per i contatti"], ["source", "Fonte delle informazioni"]];
const isMinor = p => { const a = age(p); return a != null && a < 18; };
function privacyNote(p) { return `<div class="banner ${isMinor(p) ? "bad" : "info"} small">${isMinor(p) ? "<b>" + t("Giocatore minorenne.") + "</b> " : ""}${t("Annota solo comportamenti osservabili nel contesto sportivo o informazioni date dal club o dalla famiglia. Mai dati sensibili (salute, religione, origine, situazione economica o familiare). Per foto e video di minori serve il consenso dei genitori o tutori.")}</div>`; }
function offFieldPanel(id, p) {
  const o = p.off || {}; const v = (k) => { const x = (OFF_SEL[k] || []).find(z => z[0] === o[k]); return x && x[0] ? t(x[1]) : ""; };
  const rows = OFF_LAB.map(([k, l]) => v(k) ? `<dt>${t(l)}</dt><dd>${esc(v(k))}</dd>` : "").join("") + (o.celebr ? `<dt>${t("Esultanza e linguaggio del corpo")}</dt><dd>${esc(o.celebr)}</dd>` : "") + (o.comm ? `<dt>${t("Comunicazione e lingue")}</dt><dd>${esc(o.comm)}</dd>` : "") + (o.date ? `<dt>${t("Data")}</dt><dd>${fmtDate(o.date)}</dd>` : "");
  return `<section class="panel"><div class="row between"><h2>${t("Fuori dal campo")}</h2><button class="btn sm noprint" data-a="editOff" data-id="${id}">${t("Modifica")}</button></div>
   <p class="sub small">${t("Come si allena, come sta con il gruppo, come esulta e reagisce: aiuta a capire il carattere, soprattutto nei giovani.")}</p>
   ${rows ? `<dl class="kv" style="margin-top:8px">${rows}</dl>${o.notes ? `<p style="margin-top:8px;white-space:pre-wrap">${esc(o.notes)}</p>` : ""}` : `<p class="m" style="margin-top:8px">${t("Nessuna osservazione fuori dal campo.")}</p>`}
   ${isMinor(p) ? `<p class="m" style="margin-top:8px">${p.consent && p.consent.media ? "✓ " + t("Consenso dei genitori per foto e video registrato il {d}", { d: fmtDate(p.consent.date || "") }) : "⚠ " + t("Nessun consenso dei genitori per foto e video: non aggiungerli.")}</p>` : ""}</section>`;
}
function offFieldSheet(id) {
  const p = P(id), o = p.off || {}; const s = k => `<select id="of_${k}">${OFF_SEL[k].map(([v, l]) => `<option value="${v}" ${o[k] === v ? "selected" : ""}>${esc(t(l))}</option>`).join("")}</select>`;
  sheet(`<h2>${t("Fuori dal campo")}: ${esc(pname(p))}</h2>${privacyNote(p)}
   <div class="fgrid">${OFF_LAB.filter(([k]) => k !== "school" || isMinor(p) || o.school).map(([k, l]) => `<label class="f">${t(l)}${s(k)}</label>`).join("")}
    <label class="f">${t("Data")}<input type="date" id="of_date" value="${esc(o.date || today())}"></label>
    <label class="f full">${t("Esultanza e linguaggio del corpo")}<input type="text" id="of_celebr" value="${esc(o.celebr)}" placeholder="${t("es. corre dai compagni, coinvolge la panchina")}"></label>
    <label class="f full">${t("Comunicazione e lingue")}<input type="text" id="of_comm" value="${esc(o.comm)}" placeholder="${t("es. parla con i compagni, guida i più giovani")}"></label>
    <label class="f full">${t("Note (solo fatti osservabili)")}<textarea id="of_notes" style="min-height:70px">${esc(o.notes)}</textarea></label>
    ${isMinor(p) ? `<label class="chk full"><input type="checkbox" id="of_consent" ${p.consent && p.consent.media ? "checked" : ""}> ${t("I genitori o tutori hanno dato il consenso per foto e video")}</label>` : ""}</div>
   <div class="row end"><button class="btn" data-a="closeSheetBtn">${t("Annulla")}</button><button class="btn pri" id="ofSave">${t("Salva")}</button></div>`, true);
  $("#ofSave").onclick = () => { const g = k => ($("#of_" + k) || {}).value || ""; const off = { date: g("date"), celebr: g("celebr").trim(), comm: g("comm").trim(), notes: g("notes").trim() }; OFF_LAB.forEach(([k]) => { if ($("#of_" + k)) off[k] = g(k); });
    const pp = P(id); const patch = { off }; if ($("#of_consent")) patch.consent = { media: $("#of_consent").checked, date: $("#of_consent").checked ? (pp.consent && pp.consent.media ? pp.consent.date : today()) : "" };
    put("players", id, { ...pp, ...patch }); closeSheet(); toast(t("Salvato")); render(true); };
}
A.editOff = el => offFieldSheet(el.dataset.id);
// foto di un minore: prima il consenso
A.pickPhoto = (orig => async function () { const d = ui.pdraft; if (d && isMinor(d) && !(d.consent && d.consent.media)) { confirmSheet(t("È un minorenne: confermi di avere il consenso dei genitori o tutori per la foto?"), async () => { d.consent = { media: true, date: today() }; await orig(); }); return; } return orig(); })(A.pickPhoto);

/* ---------- per conto di chi lavoro ---------- */
const ORG_TYPES = [["club", "Club"], ["agency", "Agenzia"], ["agent", "Agente FIFA"], ["fed", "Federazione"], ["self", "Lavoro personale / indipendente"]];
const Orgs = {
  list() { return (Profile.get().orgs || []); },
  active() { return Profile.get().activeOrg || ""; },
  // committente per i nuovi elementi: quello che stai guardando (filtro «Lavoro per») o, se nessuno, quello attivo
  cur() { const f = typeof ui !== "undefined" && ui.orgF; return f && f !== "_none" && this.get(f) ? f : this.active(); },
  get(id) { return this.list().find(o => o.id === id); },
  name(id) { const o = this.get(id); return o ? o.name : ""; },
  sel(id, v) { const l = this.list(); if (!l.length) return ""; return `<label class="f">${t("Per conto di")}<select id="${id}"><option value="">— ${t("nessuno")} —</option>${l.map(o => `<option value="${o.id}" ${o.id === v ? "selected" : ""}>${esc(o.name)}</option>`).join("")}</select></label>`; }
};
Author.line = (orig => function (o) { const h = orig.call(this, o); if (!h || !o || !o.org || !Orgs.name(o.org)) return h; return h.replace(/<\/span><\/div>$/, ` · ${t("per conto di {n}", { n: `<b>${esc(Orgs.name(o.org))}</b>` })}</span></div>`); })(Author.line);
function orgsPanel() {
  const l = Orgs.list(), act = Orgs.active();
  return `<section class="panel"><h2>${t("Per chi lavoro")}</h2><p class="sub small">${t("Se sei uno scout esterno, indica per quale club, agenzia o agente lavori. Ciò che crei viene segnato con il committente attivo; puoi cambiarlo su ogni giocatore, partita o valutazione.")}</p>
   <div class="list" style="margin-top:8px">${l.map(o => `<div class="item"><input type="radio" name="actOrg" data-a="setActOrg" data-id="${o.id}" ${o.id === act ? "checked" : ""} aria-label="${t("Attivo")}"><div class="grow"><div class="t">${esc(o.name)} ${o.id === act ? `<span class="pill c-good">${t("attivo")}</span>` : ""}</div><div class="m">${esc(t((ORG_TYPES.find(x => x[0] === o.type) || ["", ""])[1]))}${o.from ? " · " + fmtDate(o.from) : ""}${o.to ? " – " + fmtDate(o.to) : ""}</div></div><button class="btn sm ghost" data-a="editOrg" data-id="${o.id}">${t("Modifica")}</button></div>`).join("") || `<p class="m">${t("Nessun committente.")}</p>`}</div>
   <div class="row" style="margin-top:8px"><button class="btn sm" data-a="editOrg">+ ${t("Aggiungi committente")}</button>${act ? `<button class="btn sm ghost" data-a="setActOrg" data-id="">${t("Nessun committente attivo")}</button>` : ""}</div></section>`;
}
function saveOrgs(orgs, activeOrg) { const pr = Profile.get(); put("settings", "profile", { ...pr, orgs, activeOrg: activeOrg !== undefined ? activeOrg : pr.activeOrg }); }
Object.assign(A, {
  setActOrg: el => { saveOrgs(Orgs.list(), el.dataset.id || ""); toast(t("Salvato")); render(true); },
  editOrg: el => { const id = el.dataset.id; const o = id ? Orgs.get(id) : { type: "club", from: today() };
    sheet(`<h2>${id ? t("Modifica committente") : t("Aggiungi committente")}</h2><div class="fgrid"><label class="f full">${t("Nome")}<input type="text" id="orgN" value="${esc(o.name)}" placeholder="${t("es. FC Esempio, Agenzia Esempio")}"></label><label class="f">${t("Tipo")}<select id="orgT">${ORG_TYPES.map(([k, n]) => `<option value="${k}" ${o.type === k ? "selected" : ""}>${esc(t(n))}</option>`).join("")}</select></label><label class="f">${t("Dal")}<input type="date" id="orgF" value="${esc(o.from)}"></label><label class="f">${t("Al")}<input type="date" id="orgTo" value="${esc(o.to)}"></label></div>
     <div class="row between">${id ? `<button class="btn danger" id="orgDel">${t("Elimina")}</button>` : "<span></span>"}<div class="row"><button class="btn" data-a="closeSheetBtn">${t("Annulla")}</button><button class="btn pri" id="orgSave">${t("Salva")}</button></div></div>`);
    $("#orgSave").onclick = () => { const n = $("#orgN").value.trim(); if (!n) { toast(t("Scrivi il nome")); return; } const no = { id: id || uid(), name: n, type: $("#orgT").value, from: $("#orgF").value, to: $("#orgTo").value }; const l = Orgs.list().filter(x => x.id !== no.id); l.push(no); saveOrgs(l, Orgs.active() || no.id); closeSheet(); render(true); };
    if ($("#orgDel")) $("#orgDel").onclick = () => { saveOrgs(Orgs.list().filter(x => x.id !== id), Orgs.active() === id ? "" : Orgs.active()); closeSheet(); render(true); }; }
});
R.profilo = (orig => () => orig() + orgsPanel())(R.profilo);

/* ---------- bandiere nel menu della lingua ---------- */
const FLAGS = { it: "🇮🇹", en: "🇬🇧", de: "🇩🇪", sr: "🇷🇸", es: "🇪🇸", fr: "🇫🇷" };
window.renderShell = (orig => function () { orig(); const s = $("#langSel"); if (s) [...s.options].forEach(o => { o.textContent = FLAGS[o.value] || o.value.toUpperCase(); }); const sc = $(".scoutcard small"); if (sc && Orgs.active() && Orgs.name(Orgs.active())) sc.textContent = t("per conto di {n}", { n: Orgs.name(Orgs.active()) }); })(window.renderShell);
Lock.langTheme = (orig => function () { return orig.call(this).replace(/data-v="(it|en|de|sr|es|fr)" aria-pressed="(true|false)">[A-Z]{2}</g, (m, k, pr) => `data-v="${k}" aria-pressed="${pr}" title="${(LANGS.find(x => x[0] === k) || [])[1] || k}">${FLAGS[k]} ${k.toUpperCase()}<`); })(Lock.langTheme);
// 5.3: «= Neutra» torna visibile (terza scelta a destra) anche se era stata nascosta di serie nella 5.2
(() => { try { if (!Prefs.get("neutralBack53", false)) { const d = Prefs.get("device", {}); if (d.hideNeutral) { d.hideNeutral = false; Prefs.set("device", d); } Prefs.set("neutralBack53", true); } } catch (e) { } })();

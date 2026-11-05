"use strict";
/* =========================================================
   MM Scout 5.8 — © 2026 Miodrag Milosevic. Tutti i diritti riservati.
   Vietato copiare, modificare o divulgare senza il consenso dell'autore.
   ---------------------------------------------------------
   1. Registro partita completo per ogni ruolo (portiere compreso),
      classico e moderno, con tutti i «Come l'ha fatto»
   2. Valutazione: ruolo nella partita sul campo, parametri del ruolo,
      voto con barra o con numero (controllato)
   3. Coerenza con tutti i dati + decisione finale del club
   4. Tag: crea, rinomina, colora, elimina, pagina Tag, ricerca «#tag»
   5. Controllo degli input in tutta l'app (in ogni lingua)
   ========================================================= */
const v58x = s => esc(s == null ? "" : String(s));

/* ---------- 1. Registro partita: azioni e dettagli per ogni ruolo ---------- */
const F58 = [
  ["gkpos", "Posizione sul tiro", "Position for the shot", 0, [["giusto", "Posizione giusta", "Well positioned", 1], ["angolo", "Copre bene palo e angolo", "Covers post and angle", 1], ["avanti", "Troppo avanti", "Too far off the line", -1], ["dietro", "Troppo arretrato", "Too deep", -1]]],
  ["gkpresa", "Tipo di presa", "Type of catch", 0, [["sicura", "Presa sicura", "Secure catch", 1], ["duetempi", "In due tempi", "Two-step catch", 0], ["sfugge", "Gli sfugge", "Spills it", -1]]],
  ["gkaltezza", "Altezza del tiro", "Height of the shot", 0, [["raso", "Rasoterra", "Low", 0], ["mezza", "Mezza altezza", "Mid height", 0], ["alto", "Alto", "High", 0], ["traversa", "Sotto la traversa", "Under the bar", 0]]],
  ["gkdist", "Distanza del tiro", "Distance of the shot", 0, [["piccola", "Area piccola", "Six-yard box", 0], ["area", "Dentro l'area", "Inside the box", 0], ["fuori", "Da fuori area", "From outside the box", 0]]],
  ["gkresp", "Respinta", "Parry", 0, [["lontano", "Lontano o in angolo", "Away or out for a corner", 1], ["laterale", "Laterale", "To the side", 0], ["centrale", "Centrale (pericolosa)", "Central (dangerous)", -1]]],
  ["gkriposiz", "Dopo la parata", "After the save", 0, [["rapido", "Si rialza e si riposiziona subito", "Gets up and resets quickly", 1], ["lento", "Lento a riposizionarsi", "Slow to reset", -1]]],
  ["gkmani", "Rinvio con le mani", "Hand distribution", 0, [["corto", "Corto a un compagno", "Short to a teammate", 0], ["lungo", "Lungo per la ripartenza", "Long to start a counter", 1], ["rotolato", "Rotolato a terra", "Rolled out", 0]]],
  ["gkfuori", "Uscita fuori area", "Sweeping outside the box", 0, [["anticipa", "Esce e anticipa l'attaccante", "Comes out and gets there first", 1], ["resta", "Resta in porta", "Stays on the line", 0], ["tardi", "Esce in ritardo", "Comes out late", -1]]],
  ["gkrig", "Esito del rigore", "Penalty outcome", 0, [["parato", "Parato", "Saved", 1], ["intuito", "Intuito ma non parato", "Right way, not saved", 0], ["spiazzato", "Spiazzato", "Sent the wrong way", -1]]],
  ["sovtipo", "Tipo di sovrapposizione", "Type of overlap", 0, [["esterna", "Esterna (overlap)", "Outside (overlap)", 0], ["interna", "Interna (underlap)", "Inside (underlap)", 0]]],
  ["spondatipo", "Come fa la sponda", "How he lays it off", 0, [["piede", "Di piede", "With the foot", 0], ["testa", "Di testa", "With the head", 0], ["petto", "Con il petto", "With the chest", 0]]],
  ["areamov", "Movimento in area", "Movement in the box", 0, [["primo", "Attacca il primo palo", "Attacks the near post", 0], ["secondo", "Attacca il secondo palo", "Attacks the far post", 0], ["dischetto", "Si stacca sul dischetto", "Drops to the penalty spot", 0], ["limite", "Resta al limite", "Stays at the edge of the box", 0]]],
  ["lineadif", "Gestione della linea", "Line management", 0, [["sale", "Sale e mette in fuorigioco", "Steps up for offside", 1], ["scappa", "Scappa all'indietro in tempo", "Drops off in time", 1], ["rompe", "Rompe la linea", "Breaks the line", -1]]],
  ["dif1v1", "Uno contro uno difensivo", "Defensive one against one", 0, [["chiude", "Chiude la linea e indirizza fuori", "Closes the line and shows outside", 1], ["temporeggia", "Temporeggia", "Delays", 0], ["saltato", "Viene saltato", "Gets beaten", -1], ["fallo", "Commette fallo", "Commits a foul", -1]]],
  ["ddir", "Direzione del dribbling", "Direction of the dribble", 0, [["dentro", "Verso l'interno", "Inside", 0], ["fuori", "Verso l'esterno o il fondo", "Outside or to the byline", 0]]],
  ["intens", "Livello di intensità", "Intensity level", 0, [["alta", "Alta per tutta la gara", "High all match", 1], ["media", "Media", "Average", 0], ["bassa", "Bassa", "Low", -1]]],
  ["calo", "Quando cala", "When he drops off", 0, [["presto", "Già nel primo tempo", "Already in the first half", -1], ["m60", "Dopo il 60'", "After 60'", 0], ["m75", "Dopo il 75'", "After 75'", 0]]],
  ["nervcausa", "Verso chi", "Directed at", 0, [["arbitro", "L'arbitro", "The referee", 0], ["avversario", "Un avversario", "An opponent", 0], ["compagni", "I compagni", "Teammates", 0], ["panchina", "La panchina", "The bench", 0]]],
  ["conc", "Livello di concentrazione", "Concentration level", 0, [["sempre", "Sempre dentro la partita", "Always switched on", 1], ["cali", "Qualche calo", "Some lapses", 0], ["distratto", "Si distrae nei momenti chiave", "Switches off at key moments", -1]]]
];
// [id, it, en, gruppo, parametri collegati, dettagli]
const C58 = [
  ["Riflessi", "Riflessi (tiro ravvicinato)", "Reflexes (close-range shot)", "portiere", ["por|Reattività", "por|Parate"], ["gkdist", "gkaltezza", "gkresp", "gkriposiz"]],
  ["Rigore (portiere)", "Rigore affrontato", "Penalty faced", "portiere", ["por|Parate", "men|Concentrazione"], ["gkrig", "rigdir"]],
  ["Palla alta in area", "Palla alta in area (cross)", "High ball in the box (cross)", "portiere", ["por|Uscite alte", "por|Presa"], ["uscita", "gkpresa", "stacco"]],
  ["Copertura della profondità", "Copertura della profondità (fuori area)", "Sweeping (outside the box)", "portiere", ["por|Uscite basse", "tat|Lettura del gioco"], ["gkfuori", "uscita"]],
  ["Costruzione dal basso (portiere)", "Costruzione dal basso", "Build-up from the back", "portiere", ["por|Gioco con i piedi", "tec|Gioco sotto pressione"], ["gkpiedi", "ptipo", "linee", "tocchi"]],
  ["Rinvio con le mani", "Rinvio con le mani", "Hand distribution", "portiere", ["por|Rinvii"], ["gkmani", "plen"]],
  ["Sovrapposizione", "Sovrapposizione", "Overlap", "senzapalla", ["tat|Senza palla", "tat|Creare superiorità numerica"], ["sovtipo", "smtempo", "smesito"]],
  ["Movimento in area", "Movimento in area", "Movement in the box", "senzapalla", ["tat|Senso del gol", "tat|Attacco della profondità"], ["areamov", "smtempo", "smesito"]],
  ["Sponda", "Sponda / gioco spalle alla porta", "Lay-off / back to goal", "possesso", ["fis|Spalle alla porta", "tec|Controllo palla"], ["spondatipo", "avvlev", "dest"]],
  ["Linea difensiva", "Gestione della linea difensiva", "Defensive line management", "difesa", ["tat|Posizione", "tat|Lettura del gioco"], ["lineadif", "com"]],
  ["Uno contro uno difensivo", "Uno contro uno difensivo", "Defensive one against one", "difesa", ["tat|Abilità difensive", "tat|1vs1"], ["dif1v1", "avvlev", "ori"]]
];
const ADDF58 = { "Presa": ["gkpresa", "gkaltezza", "gkdist"], "Posizionamento portiere": ["gkpos", "ori", "com"], "Parata / Uscita": ["gkaltezza", "gkdist", "gkresp", "gkriposiz"], "1vs1 portiere": ["gkpos", "gkresp"], "Uscita bassa": ["gkfuori"], "Guida difesa": ["leadtipo"], "Dribbling": ["ddir"], "Intensità": ["intens"], "Calo fisico": ["calo"], "Nervosismo": ["nervcausa"], "Concentrazione": ["conc"] };
Migrate.config = (orig => function () {
  orig.call(Migrate); const c = S.settings.get("config"); if (!c || (c.v58 || 0) >= 1) return;
  c.liveFacets = c.liveFacets || []; for (const f of F58) if (!c.liveFacets.some(x => x.id === f[0])) c.liveFacets.push(facetFromDef(f));
  c.liveCats = c.liveCats || []; for (const [id, it, en, group, params, facets] of C58) if (!c.liveCats.some(x => x.id === id)) c.liveCats.push({ id, it, en, group, params, area: params[0].split("|")[0], kind: "", fixed: "", hidden: false, facets });
  for (const lc of c.liveCats) { const add = ADDF58[lc.id]; if (add) lc.facets = [...new Set([...(lc.facets || []), ...add])]; }
  c.v58 = 1; put("settings", "config", c);
})(Migrate.config);
// gruppo Portiere in cima (solo per i portieri) e sottogruppi
if (typeof MACRO !== "undefined") { const oth = MACRO.find(m => m[0] === "oth"); if (oth) oth[3] = oth[3].filter(x => x !== "portiere"); if (!MACRO.some(m => m[0] === "gk")) MACRO.unshift(["gk", "🧤 Portiere", "🧤 Goalkeeper", ["portiere"]]); }
if (typeof SUBS !== "undefined") {
  SUBS.portiere = [["Tra i pali", ["Parata / Uscita", "Presa", "Riflessi", "Posizionamento portiere", "Rigore (portiere)"]], ["Uscite", ["Uscita alta", "Palla alta in area", "Uscita bassa", "1vs1 portiere", "Copertura della profondità"]], ["Con la palla", ["Gioco con i piedi", "Costruzione dal basso (portiere)", "Rinvio", "Rinvio con le mani"]], ["Guida", ["Guida difesa"]]];
  const addTo = (g, sub, ids) => { const s = (SUBS[g] || []).find(x => x[0] === sub); if (s) for (const id of ids) if (!s[1].includes(id)) s[1].push(id); };
  addTo("possesso", "Costruire", ["Sponda"]); addTo("senzapalla", "Attaccare lo spazio", ["Movimento in area"]); addTo("senzapalla", "Per la squadra", ["Sovrapposizione"]); addTo("difesa", "Duelli", ["Uno contro uno difensivo"]); addTo("difesa", "Lettura e posizione", ["Linea difensiva"]);
}
// azioni proposte in «Frequenti» in base a ruolo e interpretazione (classica o moderna)
const ROLE_FREQ = {
  "gk-pali": ["Parata / Uscita", "Riflessi", "Presa", "Posizionamento portiere", "Uscita alta", "Palla alta in area", "1vs1 portiere", "Guida difesa", "Rinvio", "Rigore (portiere)"],
  "gk-mod": ["Gioco con i piedi", "Costruzione dal basso (portiere)", "Copertura della profondità", "Parata / Uscita", "Uscita bassa", "Rinvio con le mani", "Rinvio", "Guida difesa", "1vs1 portiere", "Posizionamento portiere"],
  gk: ["Parata / Uscita", "Presa", "Riflessi", "Posizionamento portiere", "Uscita alta", "Uscita bassa", "1vs1 portiere", "Gioco con i piedi", "Guida difesa", "Rinvio"],
  "dc-marc": ["Marcatura", "Duello aereo", "Duello a terra", "Contrasto", "Uno contro uno difensivo", "Lettura / Anticipo", "Chiusura", "Posizione", "Comunicazione", "Passaggio"],
  "dc-imp": ["Passaggio progressivo", "Passaggio", "Cambio di gioco", "Conduzione", "Ricezione sotto pressione", "Linea difensiva", "Duello aereo", "Lettura / Anticipo", "Posizione", "Copertura"],
  "dc-cop": ["Copertura", "Linea difensiva", "Lettura / Anticipo", "Posizione", "Chiusura", "Duello a terra", "Duello aereo", "Copertura preventiva", "Comunicazione", "Passaggio"],
  "dc-brac": ["Conduzione", "Passaggio progressivo", "Uno contro uno difensivo", "Copertura", "Sovrapposizione", "Duello a terra", "Duello aereo", "Cross / Assist", "Linea difensiva", "Lettura / Anticipo"],
  "dc-lib": ["Copertura", "Lettura / Anticipo", "Conduzione", "Passaggio progressivo", "Linea difensiva", "Chiusura", "Posizione", "Comunicazione", "Cambio di gioco", "Copertura preventiva"],
  dc: ["Duello aereo", "Duello a terra", "Lettura / Anticipo", "Posizione", "Marcatura", "Linea difensiva", "Passaggio", "Passaggio progressivo", "Copertura", "Uno contro uno difensivo"],
  "fb-dif": ["Uno contro uno difensivo", "Duello a terra", "Marcatura", "Copertura", "Ripiegamento", "Posizione", "Linea difensiva", "Passaggio", "Duello aereo", "Contrasto"],
  "fb-spi": ["Sovrapposizione", "Cross / Assist", "Conduzione", "Ripiegamento", "Uno contro uno difensivo", "Dribbling", "Passaggio", "Scatto / Velocità", "Copertura", "Attacco profondità"],
  "fb-inv": ["Ricezione", "Tra le linee", "Passaggio progressivo", "Scanning", "Copertura preventiva", "Contropressing", "Uno contro uno difensivo", "Posizione", "Passaggio", "Ricezione sotto pressione"],
  "fb-quinto": ["Sovrapposizione", "Cross / Assist", "Ripiegamento", "Uno contro uno difensivo", "Conduzione", "Dribbling", "Attacco profondità", "Intensità", "Scatto / Velocità", "Copertura"],
  "fb-cos": ["Passaggio progressivo", "Conduzione", "Ricezione sotto pressione", "Linea difensiva", "Uno contro uno difensivo", "Copertura", "Passaggio", "Duello a terra", "Sovrapposizione", "Lettura / Anticipo"],
  fb: ["Uno contro uno difensivo", "Sovrapposizione", "Cross / Assist", "Duello a terra", "Ripiegamento", "Copertura", "Passaggio", "Conduzione", "Posizione", "Marcatura"],
  "mid-reg": ["Scanning", "Ricezione sotto pressione", "Passaggio progressivo", "Cambio di gioco", "Passaggio", "Posizione", "Copertura preventiva", "Lettura / Anticipo", "Contropressing", "Ricezione"],
  "mid-rot": ["Contrasto", "Recupero palla", "Pressing", "Duello a terra", "Lettura / Anticipo", "Copertura", "Contropressing", "Passaggio", "Duello aereo", "Fallo tattico"],
  "mid-btb": ["Inserimento", "Conduzione", "Pressing", "Recupero palla", "Ripiegamento", "Passaggio progressivo", "Tiro", "Intensità", "Duello a terra", "Contropressing"],
  "mid-ins": ["Inserimento", "Attacco profondità", "Movimento in area", "Tiro", "Smarcamento", "Passaggio", "Pressing", "Colpo di testa", "Ricezione", "Ripiegamento"],
  "mid-pal": ["Ricezione sotto pressione", "Scanning", "Passaggio progressivo", "Tra le linee", "Passaggio", "Conduzione", "Filtrante", "Dribbling", "Contropressing", "Protezione palla"],
  mid: ["Ricezione", "Scanning", "Passaggio", "Passaggio progressivo", "Ricezione sotto pressione", "Pressing", "Recupero palla", "Contropressing", "Inserimento", "Copertura"],
  "am-rif": ["Tra le linee", "Ricezione sotto pressione", "Filtrante", "Occasione creata", "Dribbling", "Scanning", "Tiro", "Passaggio progressivo", "Protezione palla", "Contropressing"],
  "am-ins": ["Inserimento", "Attacco profondità", "Movimento in area", "Tiro", "Tra le linee", "Occasione creata", "Pressing", "Smarcamento", "Colpo di testa", "Contropressing"],
  am: ["Tra le linee", "Filtrante", "Occasione creata", "Dribbling", "Tiro", "Ricezione sotto pressione", "Scanning", "Inserimento", "Pressing", "Passaggio progressivo"],
  "w-cla": ["Dribbling", "Cross / Assist", "Attacco profondità", "Scatto / Velocità", "Conduzione", "Ripiegamento", "Occasione creata", "Tiro", "Pressing", "Smarcamento"],
  "w-inv": ["Dribbling", "Tiro", "Tra le linee", "Occasione creata", "Conduzione", "Filtrante", "Pressing", "Ripiegamento", "Attacco profondità", "Ricezione"],
  "w-rac": ["Ricezione", "Tra le linee", "Passaggio", "Supporto", "Smarcamento", "Pressing", "Ripiegamento", "Dribbling", "Cross / Assist", "Occasione creata"],
  "w-tor": ["Ripiegamento", "Uno contro uno difensivo", "Cross / Assist", "Sovrapposizione", "Conduzione", "Intensità", "Dribbling", "Pressing", "Copertura", "Passaggio"],
  w: ["Dribbling", "Cross / Assist", "Tiro", "Occasione creata", "Conduzione", "Attacco profondità", "Pressing", "Ripiegamento", "Tra le linee", "Smarcamento"],
  "st-pos": ["Sponda", "Duello aereo", "Colpo di testa", "Protezione palla", "Movimento in area", "Tiro", "Pressing", "Smarcamento", "Duello a terra", "Supporto"],
  "st-mov": ["Attacco profondità", "Movimento in area", "Smarcamento", "Tiro", "Inserimento", "Pressing", "Scatto / Velocità", "Colpo di testa", "Apre spazi", "Contropressing"],
  "st-sec": ["Tra le linee", "Tiro", "Smarcamento", "Dribbling", "Occasione creata", "Filtrante", "Attacco profondità", "Pressing", "Movimento in area", "Supporto"],
  "st-f9": ["Tra le linee", "Apre spazi", "Filtrante", "Ricezione sotto pressione", "Occasione creata", "Supporto", "Dribbling", "Tiro", "Pressing", "Scanning"],
  st: ["Tiro", "Movimento in area", "Attacco profondità", "Colpo di testa", "Sponda", "Smarcamento", "Protezione palla", "Pressing", "Duello aereo", "Occasione creata"]
};
window.frequentCats = (orig => function (pid) {
  const p = P(pid); if (!p) return orig(pid); const cfg = Cfg.get(); const gk = isGK(p);
  const cats = cfg.liveCats.filter(c => !c.hidden && c.kind !== "event" && (c.group !== "portiere" || gk));
  const cnt = {}; for (const [, m] of S.matches) for (const e of (m.events || [])) if (e.p === pid) cnt[e.c] = (cnt[e.c] || 0) + 1;
  const fav = (S.settings.get("liveFav") || {}).ids || []; const byUse = cats.filter(c => cnt[c.id]).sort((a, b) => cnt[b.id] - cnt[a.id]).map(c => c.id);
  const rg = gk ? "gk" : roleGroup(mainRole(p)); const def = ROLE_FREQ[p.archetype] || ROLE_FREQ[rg] || [];
  return [...new Set([...fav, ...def, ...byUse])].filter(id => cats.some(c => c.id === id)).slice(0, 12);
})(window.frequentCats);
frequentCats = window.frequentCats;

/* ---------- 2. Valutazione: ruolo nella partita, voti con barra o numero ---------- */
const evRoles = d => (d.roles && d.roles.length ? d.roles : (P(d.playerId) || {}).roles || []).filter(Boolean);
const RK = {
  gk: { por: "*", tec: "Passaggio;Gioco sotto pressione;Controllo palla;Uso entrambi i piedi", tat: "Posizione;Lettura del gioco;Anticipo", fis: "Elevazione;Agilità;Esplosività;Equilibrio" },
  dc: { tat: "Posizione;Lettura del gioco;Anticipo;Abilità difensive;Rottura del gioco avversario;1vs1;Pressing;Scanning", fis: "Fisicità;Forza;Duelli aerei;Elevazione;Velocità;Scatto sul breve;Aggressività", tec: "Contrasti;Passaggio;Gioco sotto pressione;Controllo palla;Colpo di testa;Uso entrambi i piedi;Precisione" },
  fb: { tat: "Posizione;Lettura del gioco;Ripiegamenti difensivi;1vs1;Abilità difensive;Creare superiorità numerica;Supporto al centrocampo;Senza palla;Pressing;Anticipo", fis: "Velocità;Resistenza;Capacità aerobica;Accelerazione;Intensità;Agilità;Scatto sul breve", tec: "Cross;Passaggio;Contrasti;Conduzione palla;Controllo orientato;Dribbling;Assist" },
  mid: { tat: "Visione;Posizione;Lettura del gioco;Ricezione palla;Ricezione tra le linee;Scanning;Pressing;Rottura del gioco avversario;Supporto al centrocampo;Capacità d'inserimento;Ripiegamenti difensivi;Anticipo", fis: "Resistenza;Capacità aerobica;Intensità;Equilibrio;Agilità;Aggressività", tec: "Passaggio;Gioco sotto pressione;Controllo palla;Controllo orientato;Passaggi chiave;Precisione;Contrasti;Tecnica;Uso entrambi i piedi;Tiro" },
  am: { tat: "Visione;Ricezione tra le linee;Imprevedibilità;Smarcamento;Creare superiorità numerica;Capacità d'inserimento;Scanning;Senza palla;Aprire gli spazi;Pressing", fis: "Agilità;Equilibrio;Cambio di passo;Accelerazione", tec: "Passaggi chiave;Assist;Dribbling;Tecnica;Controllo orientato;Gioco sotto pressione;Tiro;Incisività offensiva;Abilità offensive;Calci piazzati;Freddezza" },
  w: { tat: "1vs1;Imprevedibilità;Creare superiorità numerica;Attacco della profondità;Smarcamento;Contropiede;Ripiegamenti difensivi;Senza palla;Pressing", fis: "Velocità;Accelerazione;Scatto sul breve;Cambio di passo;Esplosività;Agilità;Resistenza", tec: "Dribbling;Cross;Assist;Tiro;Conduzione palla;Incisività offensiva;Abilità offensive;Uso entrambi i piedi;Finalizzazione" },
  st: { tat: "Senso del gol;Attacco della profondità;Smarcamento;Fa reparto da solo;Aprire gli spazi;Contropiede;Pressing;Ricezione palla", fis: "Fisicità;Forza;Duelli offensivi;Duelli aerei;Protezione palla;Spalle alla porta;Elevazione;Esplosività;Velocità;Potenza", tec: "Finalizzazione;Tiro;Colpo di testa;Freddezza;Controllo palla;Incisività offensiva;Uso entrambi i piedi;Tecnica" }
};
const RK_EXTRA = { "Falso 9": ["am"], "Seconda punta": ["am"], "Trequartista": [], "Regista": [], "Quinto sinistro": ["w"], "Quinto destro": ["w"] };
const keysFor = r => { if (keysFor.c[r]) return keysFor.c[r]; const g = isGK({ roles: [r] }) ? "gk" : roleGroup(r); const set = new Set(); const cfg = Cfg.get();
  for (const gg of [g, ...(RK_EXTRA[r] || [])]) { const def = RK[gg] || {}; for (const a of cfg.areas) { if (a.id === "men") { a.params.forEach(x => set.add("men|" + x.id)); continue; } const d = def[a.id]; if (!d) continue; if (d === "*") a.params.forEach(x => set.add(a.id + "|" + x.id)); else d.split(";").forEach(x => set.add(a.id + "|" + x)); } }
  for (const h of ((cfg.roleHide || {})[r] || [])) set.delete(h); return (keysFor.c[r] = set); };
keysFor.c = {};
window.evalEditor = (orig => function () {
  let h = orig(); const d = ui.edraft; if (!d) return h; const p = P(d.playerId); const s = Cfg.get().scale; const roles = evRoles(d); const all = !!ui.eAllParams;
  // campo con i ruoli della partita
  const rp = rolePitch({ roles, archetype: d.archetype || (p || {}).archetype || "" }).replace('id="rolePitch"', 'id="evRolePitch"').replace(t("Tocca un ruolo per sceglierlo: il primo è il principale (★) e decide i parametri della valutazione. Tocca un punto libero del campo per la posizione esatta."), t("Tocca il ruolo (o i ruoli) in cui ha giocato in questa partita: i parametri sotto si adattano. Il primo è il principale (★)."));
  const box = `<div class="evroles" style="margin-top:14px"><div class="row between"><b class="small">${t("Ruolo in questa partita")}</b>${d.roles && d.roles.length ? `<button class="btn sm ghost" data-a="evRolesReset">${t("Come nel profilo")}</button>` : `<span class="m">${t("come nel profilo")}</span>`}</div>${rp}</div>`;
  h = h.replace(`<div style="margin-top:12px"><div class="row between"><b class="small">${t("Posizioni nella partita")}</b>`, box + `<div style="margin-top:12px"><div class="row between"><b class="small">${t("Zone occupate nella partita")}</b>`);
  // parametri del ruolo: barra + numero, i non pertinenti nascosti (salvo se già valutati)
  const keys = roles.map(keysFor); const codes = roles.map(r => roleCode(r));
  let hidden = 0;
  h = h.replace(/<div class="slrow([^"]*)"><span>([\s\S]*?)<\/span><input type="range"([^>]*?)data-ak="([^"]+)" data-at="([^"]+)"([^>]*)><button class="vchip" data-a="clrParam" data-ak="[^"]+" data-at="[^"]+" title="[^"]*">([^<]*)<\/button><\/div>/g, (m, cls, name, a1, ak, at, a2, val) => {
    const key = ak + "|" + at.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&"); const rated = val !== "–";
    const fit = roles.map((r, i) => keys[i].has(key) ? codes[i] : null).filter(Boolean); const show = all || rated || !roles.length || fit.length;
    if (!show) hidden++;
    return `<div class="slrow${cls}${show ? "" : " rhide"}" data-key="${v58x(key)}"><span>${name}${roles.length > 1 && fit.length && fit.length < roles.length ? `<span class="rbadges">${fit.map(c => `<i>${v58x(c)}</i>`).join("")}</span>` : ""}</span><input type="range"${a1}data-ak="${ak}" data-at="${at}"${a2}><span class="vnumw"><input class="vnum" type="text" inputmode="decimal" autocomplete="off" data-vak="${ak}" data-vat="${at}" value="${rated ? v58x(val) : ""}" placeholder="–" aria-label="${t("Voto")} (${s.min}–${s.max})"><button type="button" class="vclr" data-a="clrParam" data-ak="${ak}" data-at="${at}" title="${t("Tocca per togliere il voto")}" aria-label="${t("Tocca per togliere il voto")}">✕</button><span class="vchip" hidden>${val}</span></span><div class="vmsg" hidden></div></div>`;
  });
  const info = roles.length ? `<div class="banner info small evrinfo"><span>${t("Parametri per: {r}", { r: roles.map(r => v58x(L(Cfg.role(r)) || r)).join(", ") })}${hidden ? " · " + t("{n} parametri meno importanti per il ruolo nascosti", { n: hidden }) : ""}</span><button class="btn sm" data-a="evAllParams">${all ? t("Solo quelli del ruolo") : t("Mostra tutti i parametri")}</button></div>` : "";
  const firstArea = h.indexOf('<details class="area'); if (firstArea > 0 && info) h = h.slice(0, firstArea) + info + h.slice(firstArea);
  // coerenza con tutti i dati
  const pr = p ? profile(d.playerId) : {}; const dr = p && typeof dataRating === "function" ? dataRating(d.playerId) : {}; const parts = [pr.rating, dr.rating].filter(v => v != null); const tot = parts.length ? mean(parts) : null;
  const coh = `<section class="panel coh"><h2>${t("Coerenza con tutti i dati")}</h2><p class="sub small">${t("Il voto di questa valutazione confrontato con la media delle tue valutazioni e con il voto calcolato dalle azioni registrate.")}</p>
   <div class="row cohrow"><div class="rbox"><span>${t("Questa valutazione")}</span><b id="cohThis">${f1(evalRating(d))}</b></div><div class="rbox"><span>${t("Media delle tue valutazioni")}</span><b>${f1(pr.rating)}</b></div><div class="rbox"><span>${t("Voto dai dati")}</span><b>${f1(dr.rating)}</b></div><div class="rbox r-rating"><span>${t("Media complessiva")}</span><b id="cohTot" data-v="${tot ?? ""}">${f1(tot)}</b></div></div>
   <div id="cohWarn"></div><p class="m">🏛 ${t("Il voto è un supporto: la decisione finale spetta al direttore sportivo insieme allo staff e all'allenatore.")}</p></section>`;
  const sumIdx = h.indexOf('<section class="panel"><label class="f">' + t("Sintesi finale (2-3 frasi chiare per tutto lo staff)")); if (sumIdx > 0) h = h.slice(0, sumIdx) + coh + h.slice(sumIdx);
  setTimeout(cohUpdate, 0);
  return h;
})(window.evalEditor);
evalEditor = window.evalEditor;
function cohUpdate() { const d = ui.edraft; const el = $("#cohWarn"), tt = $("#cohThis"), tot = $("#cohTot"); if (!d || !el || !tt) return; const r = evalRating(d); tt.textContent = f1(r); const T = tot && tot.dataset.v !== "" ? +tot.dataset.v : null; const s = Cfg.get().scale;
  if (r == null || T == null) { el.innerHTML = ""; return; } const diff = r - T; const lim = (s.max - s.min) * 0.1;
  el.innerHTML = Math.abs(diff) >= lim ? `<div class="banner ${diff > 0 ? "" : "info"} small">${diff > 0 ? t("Questa valutazione è più alta di {d} rispetto alla media di tutti i dati: controlla che le evidenze lo giustifichino.", { d: f1(Math.abs(diff)) }) : t("Questa valutazione è più bassa di {d} rispetto alla media di tutti i dati: può essere una giornata no, annotalo nel contesto.", { d: f1(Math.abs(diff)) })}</div>` : `<div class="okc">✓ ${t("Coerente con i dati raccolti.")}</div>`; }
window.updAvg = (orig => function (aid) { orig(aid); cohUpdate(); })(window.updAvg);
updAvg = window.updAvg;
// campo dei ruoli nella valutazione
document.addEventListener("click", e => {
  const d = ui.edraft; if (!d || ui.pdraft) return; const svg = e.target.closest && e.target.closest("#evRolePitch"); const rm = e.target.closest && e.target.closest(".evroles [data-rmain], .evroles [data-rdel], .evroles [data-rarch]"); if (!svg && !rm) return;
  e.preventDefault(); e.stopPropagation(); syncEval(); let roles = evRoles(d).slice();
  if (rm) { if (rm.dataset.rmain) roles = [rm.dataset.rmain, ...roles.filter(x => x !== rm.dataset.rmain)]; else if (rm.dataset.rdel) roles = roles.filter(x => x !== rm.dataset.rdel); else if (rm.dataset.rarch) d.archetype = d.archetype === rm.dataset.rarch ? "" : rm.dataset.rarch; }
  else { const g = e.target.closest("[data-rspot]"); if (!g) return; const r = g.dataset.rspot; roles = roles.includes(r) ? roles.filter(x => x !== r) : [...roles, r]; }
  d.roles = roles; render(true);
}, true);
Object.assign(A, {
  evRolesReset: () => { syncEval(); delete ui.edraft.roles; render(true); },
  evAllParams: () => { syncEval(); ui.eAllParams = !ui.eAllParams; render(true); },
  clrParam: (orig => function (el) { orig(el); if (el.classList.contains("vclr")) { el.textContent = "✕"; const row = el.closest(".slrow"); const n = row && row.querySelector(".vnum"); if (n) n.value = ""; const m = row && row.querySelector(".vmsg"); if (m) m.hidden = true; cohUpdate(); } })(A.clrParam)
});
const scoreParse = (raw, s) => { const v = String(raw).trim().replace(",", "."); if (v === "") return { empty: true }; if (!/^\d{1,3}(\.\d{1,2})?$/.test(v)) return { err: "chars" }; const n = +v; if (n < s.min || n > s.max) return { err: "range" }; const st = s.step || 1; return { v: Math.round(Math.round(n / st) * st * 100) / 100 }; };
document.addEventListener("input", e => {
  const el = e.target; if (!el || !el.classList) return;
  if (el.classList.contains("vnum")) { const d = ui.edraft; if (!d) return; const s = Cfg.get().scale; const row = el.closest(".slrow"); const msg = row.querySelector(".vmsg"); const r = scoreParse(el.value, s);
    if (r.err) { el.classList.add("vbad"); el.setAttribute("aria-invalid", "true"); msg.hidden = false; msg.textContent = r.err === "chars" ? t("Scrivi solo un numero (es. 7 o 7,5): lettere e simboli non sono ammessi.") : t("Il voto deve essere tra {a} e {b}.", { a: s.min, b: s.max }); return; }
    el.classList.remove("vbad"); el.removeAttribute("aria-invalid"); msg.hidden = true; if (r.empty) return;
    const ak = el.dataset.vak, at = el.dataset.vat; d.r[ak] = d.r[ak] || {}; d.r[ak][at] = r.v; const rg = row.querySelector('input[type="range"]'); if (rg) rg.value = r.v; row.classList.remove("unset"); const vc = row.querySelector(".vchip"); if (vc) vc.textContent = f1(r.v); updAvg(ak); return; }
  if (el.type === "range" && el.closest && el.closest(".slrow")) { const n = el.closest(".slrow").querySelector(".vnum"); if (n) { n.value = f1(+el.value); n.classList.remove("vbad"); const m = el.closest(".slrow").querySelector(".vmsg"); if (m) m.hidden = true; } }
});
document.addEventListener("focusout", e => { const el = e.target; if (el && el.classList && el.classList.contains("vnum") && !el.classList.contains("vbad") && el.value.trim()) { const r = scoreParse(el.value, Cfg.get().scale); if (r.v != null) el.value = f1(r.v); } });

/* ---------- 3. Decisione finale del club ---------- */
const CLUB_DEC = [["ingaggiare", "Ingaggiare", "c-good"], ["seguire", "Continuare a seguire", "c-blue"], ["attesa", "In attesa di altre visioni", "c-amber"], ["no", "Non procedere", "c-bad"]];
const CLUB_WHO = [["ds", "Direttore sportivo"], ["all", "Allenatore"], ["staff", "Staff tecnico"], ["capo", "Capo scout"]];
function clubDecBox(id) {
  const p = P(id); if (!p) return ""; const cd = p.clubDec || {}; const dec = CLUB_DEC.find(x => x[0] === cd.dec); const pr = profile(id); const dr = typeof dataRating === "function" ? dataRating(id) : {}; const parts = [pr.rating, dr.rating].filter(v => v != null); const tot = parts.length ? mean(parts) : null;
  return `<section class="panel clubdec"><div class="row between"><div class="grow"><b>🏛 ${t("Decisione finale del club")}</b>
   <div class="m">${dec ? `<span class="pill ${dec[2]}">${t(dec[1])}</span> · ${fmtDate(cd.date)}${(cd.who || []).length ? " · " + cd.who.map(w => t((CLUB_WHO.find(x => x[0] === w) || [w, w])[1])).join(", ") : ""}${cd.note ? " · " + v58x(cd.note) : ""}` : t("Non ancora presa: la decide il direttore sportivo con lo staff e l'allenatore.")}</div>
   <div class="m cohline">${t("Voto scout")} <b>${f1(pr.rating)}</b> · ${t("Dai dati")} <b>${f1(dr.rating)}</b> · ${t("Media complessiva")} <b>${f1(tot)}</b></div></div>
   <button class="btn sm" data-a="clubDec" data-id="${id}">${dec ? t("Aggiorna decisione") : t("Registra decisione")}</button></div></section>`;
}
window.playerPage = (orig => function (id) { const h = orig(id); const i = h.indexOf('<div class="tabs'); const box = clubDecBox(id); return i > 0 ? h.slice(0, i) + box + h.slice(i) : box + h; })(window.playerPage);
A.clubDec = el => { const id = el.dataset.id; const p = P(id); if (!p) return; const cd = p.clubDec || {};
  sheet(`<div class="row between"><h2>🏛 ${t("Decisione finale del club")}</h2><button class="btn sm ghost" data-a="closeSheetBtn" aria-label="${t("Chiudi")}">✕</button></div>
   <p class="sub small">${t("Il report dello scout è un supporto. La decisione la prendono insieme il direttore sportivo, lo staff e l'allenatore: registrala qui per tenerne traccia.")}</p>
   <div class="col" style="gap:6px;margin-top:8px">${CLUB_DEC.map(([k, n, c]) => `<label class="chk"><input type="radio" name="cdDec" value="${k}" ${cd.dec === k ? "checked" : ""}> <span class="pill ${c}">${t(n)}</span></label>`).join("")}</div>
   <div class="m" style="margin-top:10px;font-weight:600">${t("Chi ha deciso")}</div><div class="row" style="flex-wrap:wrap;gap:10px">${CLUB_WHO.map(([k, n]) => `<label class="chk"><input type="checkbox" data-cdw="${k}" ${(cd.who || []).includes(k) ? "checked" : ""}> ${t(n)}</label>`).join("")}</div>
   <div class="fgrid" style="margin-top:10px"><label class="f">${t("Data")}<input type="date" id="cdDate" value="${v58x(cd.date || today())}"></label><label class="f full">${t("Motivo (facoltativo)")}<input type="text" id="cdNote" maxlength="200" value="${v58x(cd.note || "")}"></label></div>
   <div class="row between" style="margin-top:12px">${cd.dec ? `<button class="btn danger" data-a="clubDecDel" data-id="${id}">${t("Togli la decisione")}</button>` : "<span></span>"}<div class="row"><button class="btn" data-a="closeSheetBtn">${t("Annulla")}</button><button class="btn pri" data-a="clubDecSave" data-id="${id}">${t("Salva")}</button></div></div>`); };
A.clubDecSave = el => { const id = el.dataset.id; const p = P(id); const dec = ($('input[name="cdDec"]:checked') || {}).value; if (!dec) { toast(t("Scegli la decisione")); return; }
  put("players", id, { ...p, clubDec: { dec, date: $("#cdDate").value || today(), who: $$("[data-cdw]").filter(x => x.checked).map(x => x.dataset.cdw), note: $("#cdNote").value.trim() } }); closeSheet(); toast(t("Decisione registrata")); render(true); };
A.clubDecDel = el => { const id = el.dataset.id; const p = P(id); const { clubDec, ...rest } = p; put("players", id, rest); closeSheet(); render(true); };
if (typeof FIELD_L !== "undefined") FIELD_L.clubDec = "decisione del club";

/* ---------- 4. Tag ---------- */
ICONS.tag = '<path d="M3 3h8.6l9.4 9.4-8.6 8.6L3 11.6zm4.5 2.8a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4z"/>';
PAGE_DESC.tag = "Etichette per ritrovare in un attimo giocatori, partite, report e note. Creale, rinominale, cambiane il colore. Nella ricerca scrivi #nome.";
window.views = (orig => function () { const v = orig(); if (!v.some(x => x !== "-" && x[0] === "tag")) { const i = v.findIndex(x => x !== "-" && x[0] === "liste"); v.splice(i >= 0 ? i + 1 : v.length, 0, ["tag", t("Tag")]); } return v; })(window.views);
if (typeof NAV_GROUPS !== "undefined" && NAV_GROUPS[1] && !NAV_GROUPS[1][1].includes("tag")) NAV_GROUPS[1][1].push("tag");
const TAG_COLORS = ["#2F6690", "#1E6A47", "#7A4E9E", "#B8730F", "#8C3B3B", "#2D6E6E", "#5C7A29", "#4A4A4A"];
const nrm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
function tagItems(tg) { const n = nrm(tg.name);
  return { players: [...S.players.entries()].filter(([, p]) => !p.archived && (p.tags || []).includes(tg.id)), matches: [...S.matches.entries()].filter(([, m]) => !m.archived && (m.tags || []).includes(tg.id)), evals: [...S.evals.entries()].filter(([, e]) => !e.archived && (e.tags || []).includes(tg.id)), notes: [...S.notes.entries()].filter(([, x]) => !x.archived && (x.tags || []).some(s => nrm(s) === n)) }; }
const tagCount = it => it.players.length + it.matches.length + it.evals.length + it.notes.length;
function noteOnlyTags() { const known = new Set(Cfg.get().tags.map(x => nrm(x.name))); const out = new Map(); for (const [, n] of S.notes) for (const s of (n.tags || [])) if (!known.has(nrm(s))) out.set(nrm(s), s); return [...out.values()]; }
function tagResults(tg) { const it = tagItems(tg); const sec = (title, arr, fn) => arr.length ? `<h3 class="dhead">${title} <span class="m">${arr.length}</span></h3><div class="list">${arr.map(fn).join("")}</div>` : "";
  return `${sec(t("Giocatori"), it.players, ([id, p]) => playerItem(id, p))}${sec(t("Partite"), it.matches, ([id, m]) => matchItem(id, m))}${sec(t("Valutazioni"), it.evals, ([id, e]) => evalItem(id, e, true))}${it.notes.length ? `<h3 class="dhead">${t("Note")} <span class="m">${it.notes.length}</span></h3><div class="ngrid">${it.notes.map(([id, n]) => noteCard(id, n)).join("")}</div>` : ""}` || `<div class="empty">${t("Nessun elemento con questo tag: aggiungilo dalla scheda di un giocatore, di una partita, di una valutazione o di una nota.")}</div>`; }
R.tag = () => { const c = Cfg.get(); const tags = c.tags || []; const sel = tags.find(x => x.id === ui.tagSel) || null; const extra = noteOnlyTags();
  return `<div class="head"><div><h1>${t("Tag")}</h1><p class="sub">${t(PAGE_DESC.tag)}</p></div></div>
   <section class="panel"><h2>${t("Nuovo tag")}</h2><div class="row tagnew" style="margin-top:8px"><input type="text" id="tagNewN" maxlength="40" placeholder="${t("es. Under 21, Mercato estivo, Da rivedere")}" aria-label="${t("Nome del tag")}" data-vrule="tag"><input type="color" id="tagNewC" value="${TAG_COLORS[tags.length % TAG_COLORS.length]}" aria-label="${t("Colore")}"><button class="btn pri" data-a="tagCreate">+ ${t("Crea tag")}</button></div></section>
   <section class="panel"><h2>${t("I tuoi tag")} <span class="m">${tags.length}</span></h2><div class="taglist">${tags.map(tg => { const n = tagCount(tagItems(tg)); return `<div class="tagrow ${sel && sel.id === tg.id ? "on" : ""}"><button class="tagopen" data-a="tagOpen" data-id="${tg.id}"><span class="tdot" style="background:${v58x(tg.color)}"></span><b>${v58x(tg.name)}</b><span class="m">${t("{n} elementi", { n })}</span></button><input type="color" value="${v58x(tg.color)}" data-tagcol="${tg.id}" aria-label="${t("Colore")}: ${v58x(tg.name)}" title="${t("Cambia colore")}"><button class="btn sm ghost" data-a="tagRen" data-id="${tg.id}" title="${t("Rinomina")}" aria-label="${t("Rinomina")}">✎</button><button class="btn sm ghost" data-a="tagDel" data-id="${tg.id}" title="${t("Elimina")}" aria-label="${t("Elimina")}">🗑</button></div>`; }).join("") || `<div class="empty">${t("Nessun tag. Creane uno qui sopra.")}</div>`}</div>
   ${extra.length ? `<p class="m" style="margin-top:10px">${t("Tag usati solo nelle note")}: ${extra.map(s => `<button class="chip" data-a="searchSet" data-q="#${v58x(s)}">#${v58x(s)}</button>`).join(" ")}</p>` : ""}</section>
   ${sel ? `<section class="panel"><div class="row between"><h2><span class="tdot" style="background:${v58x(sel.color)}"></span> ${v58x(sel.name)}</h2><button class="btn sm ghost" data-a="tagOpen" data-id="">${t("Chiudi")}</button></div>${tagResults(sel)}</section>` : `<p class="m">${t("Tocca un tag per vedere tutto quello che lo contiene.")}</p>`}`; };
const tagSave = c => { Cfg.save(c); };
Object.assign(A, {
  tagOpen: el => { ui.tagSel = el.dataset.id || null; render(true); },
  tagCreate: () => { const i = $("#tagNewN"); const name = (i.value || "").trim(); if (!name) { toast(t("Scrivi il nome del tag")); i.focus(); return; } if (!vCheck(i)) { i.focus(); return; } const c = clone(Cfg.get()); if (c.tags.some(x => nrm(x.name) === nrm(name))) { toast(t("Esiste già un tag con questo nome")); return; }
    const id = uid(); c.tags.push({ id, name, color: $("#tagNewC").value || TAG_COLORS[0] }); tagSave(c); ui.tagSel = id; toast(t("Tag creato: {n}", { n: name })); render(true); },
  tagRen: el => { const c = clone(Cfg.get()); const tg = c.tags.find(x => x.id === el.dataset.id); if (!tg) return; const old = tg.name;
    promptSheet(t("Rinomina tag"), t("Nome del tag"), old, v => { const name = String(v || "").trim(); if (!name) return; if (!TAG_RE.test(name)) { toast(t("Il nome del tag può contenere lettere, numeri, spazi e - _ /")); return; } if (c.tags.some(x => x.id !== tg.id && nrm(x.name) === nrm(name))) { toast(t("Esiste già un tag con questo nome")); return; } tg.name = name; tagSave(c);
      for (const [nid, n] of [...S.notes]) if ((n.tags || []).some(s => nrm(s) === nrm(old))) put("notes", nid, { ...n, tags: n.tags.map(s => nrm(s) === nrm(old) ? name : s) }); toast(t("Tag rinominato")); render(true); }); },
  tagDel: el => { const id = el.dataset.id; const c = clone(Cfg.get()); const tg = c.tags.find(x => x.id === id); if (!tg) return; const n = tagCount(tagItems(tg));
    confirmSheet(t("Eliminare il tag «{t}»? Viene tolto da {n} elementi, che restano nell'archivio.", { t: tg.name, n }), () => { c.tags = c.tags.filter(x => x.id !== id); tagSave(c);
      for (const coll of ["players", "matches", "evals"]) for (const [xid, o] of [...S[coll]]) if ((o.tags || []).includes(id)) put(coll, xid, { ...o, tags: o.tags.filter(x => x !== id) });
      for (const [nid, x] of [...S.notes]) if ((x.tags || []).some(s => nrm(s) === nrm(tg.name))) put("notes", nid, { ...x, tags: x.tags.filter(s => nrm(s) !== nrm(tg.name)) });
      if (ui.tagSel === id) ui.tagSel = null; closeSheet(); toast(t("Tag eliminato")); render(true); }, t("Elimina")); }
});
document.addEventListener("change", e => { const el = e.target; if (!el || !el.dataset || !el.dataset.tagcol) return; const c = clone(Cfg.get()); const tg = c.tags.find(x => x.id === el.dataset.tagcol); if (!tg) return; tg.color = el.value; tagSave(c); render(true); });
document.addEventListener("keydown", e => { if (e.key === "Enter" && e.target && e.target.id === "tagNewN") { e.preventDefault(); A.tagCreate(); } });
// ricerca con «#tag»
R.cerca = (orig => () => { const raw = (ui.q || "").trim(); if (!raw.startsWith("#")) return orig(); const q = nrm(raw.slice(1));
  const tags = Cfg.get().tags.filter(tg => !q || nrm(tg.name).includes(q)); const extra = noteOnlyTags().filter(s => !q || nrm(s).includes(q));
  const body = tags.map(tg => `<section class="panel"><div class="row between"><h2><span class="tdot" style="background:${v58x(tg.color)}"></span> ${v58x(tg.name)} <span class="m">${tagCount(tagItems(tg))}</span></h2><button class="btn sm ghost" data-a="tagGo" data-id="${tg.id}">${t("Apri il tag")} →</button></div>${tagResults(tg)}</section>`).join("")
    + extra.map(s => { const pseudo = { id: "", name: s, color: "#888" }; return `<section class="panel"><h2>#${v58x(s)}</h2>${tagResults(pseudo)}</section>`; }).join("");
  return `<div class="head"><div><h1>${t("Cerca")}</h1><p class="sub">${t("Tag che contengono «{q}»", { q: v58x(raw.slice(1)) })}</p></div></div>${body || `<div class="empty">${t("Nessun tag con questo nome.")} <button class="btn sm" data-a="menuGo" data-v="tag">${t("Vai ai tag")}</button></div>`}`; })(R.cerca);
A.tagGo = el => { ui.tagSel = el.dataset.id; resetSub(); go("tag"); };
if (typeof SR !== "undefined") { SR.ideas = (orig => function () { const a = orig.call(this); const tg = (Cfg.get().tags || [])[0]; if (tg) a.splice(1, 0, "#" + tg.name); return [...new Set(a)].slice(0, 7); })(SR.ideas); SR.tips = (orig => function () { return [...orig.call(this), t("Scrivi # e il nome di un tag (es. #Under 21) per vedere tutto quello che ha quel tag.")]; })(SR.tips); }
if (typeof VIEW_L !== "undefined") VIEW_L.tag = "Tag";

/* ---------- 5. Controllo degli input ---------- */
const RX = {
  person: /^[\p{L}\p{M}][\p{L}\p{M}' ’.\-]*$/u,
  place: /^[\p{L}\p{M}][\p{L}\p{M}' ’.\-()/,]*$/u,
  team: /^[\p{L}\p{M}\d][\p{L}\p{M}\d' ’.\-&/()+,]*$/u,
  score: /^\d{1,2}\s?[-–:]\s?\d{1,2}(\s?\(.{1,20}\))?$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
  phone: /^\+?[\d\s()\-/.]{5,20}$/,
  url: /^https?:\/\/[^\s]+\.[^\s]{2,}/i,
  money: /^[\d\s.,'’€$£kKmMlnLNCHFchfmio\-]+$/,
  initials: /^[\p{L}]{1,4}$/u,
  int: /^-?\d+$/
};
const TAG_RE = /^[\p{L}\p{M}\d][\p{L}\p{M}\d \-_/+.]*$/u;
const Y = new Date().getFullYear();
const VRULES = {
  person: ["pFirst", "pLast", "pAlias", "qpFirst", "qpLast", "qnFirst", "qnLast", "suName", "prName", "sfN", "isN", "cAgent", "vnN"],
  place: ["pBirthCity", "pBirthCountry", "pNat", "pNat2", "qnNat", "pf_nat", "prCity"],
  team: ["pClub", "pClubFirst", "qnClub", "eHome", "eAway", "mHome", "mAway", "nmH", "nmA", "shHome", "shAway", "cOwner", "pLeague", "mComp", "nmC", "shComp", "orgN", "prOrg"],
  score: ["eScore", "mi_score", "po_score"],
  email: ["suEmail", "prEmail", "lgEmail", "recEmail", "isE", "sfE"],
  phone: ["prPhone", "isT", "sfP"],
  url: ["lkU", "pubUrl"],
  money: ["cSalary", "cValue"],
  initials: ["prInit"]
};
const VRANGE = { pH: [120, 230], pW: [30, 140], pShirt: [1, 99], qpShirt: [1, 99], qnShirt: [1, 99], eShirt: [1, 99], eMin: [0, 130], manMin: [0, 130], ldT: [0, 130], phMin: [0, 130], pBirthYear: [1950, Y], qpYear: [1950, Y], qnYear: [1950, Y], idAgeMin: [10, 45], idAgeMax: [10, 45], idH: [140, 210], pf_ageMin: [10, 50], pf_ageMax: [10, 50], pf_contract: [0, 120], df_age: [10, 50], df_min: [0, 20000], sDays: [0, 400] };
const ruleOf = el => { if (el.dataset.vrule) return el.dataset.vrule; if (el.dataset.np === "first" || el.dataset.np === "last") return "person"; const id = el.id; if (!id) return el.type === "number" ? "num" : el.type === "email" ? "email" : el.type === "url" ? "url" : ""; for (const k in VRULES) if (VRULES[k].includes(id)) return k; if (VRANGE[id] || el.type === "number") return "num"; if (el.type === "email") return "email"; if (el.type === "url") return "url"; if (id === "pBirth") return "birth"; return ""; };
const VMSG = {
  person: () => t("Usa solo lettere, spazi, apostrofo, punto e trattino (niente numeri o simboli)."),
  place: () => t("Usa solo lettere, spazi, apostrofo, trattino e parentesi."),
  team: () => t("Usa lettere, numeri, spazi e . ' - & / ( ) (es. FC Esempio 2010)."),
  score: () => t("Scrivi il risultato così: 2-1."),
  email: () => t("Indirizzo email non valido (es. nome@dominio.ch)."),
  phone: () => t("Numero di telefono non valido: usa cifre, spazi, + e trattini."),
  url: () => t("Indirizzo non valido: deve iniziare con https://"),
  money: () => t("Importo non valido: usa numeri, punto o virgola e la valuta (es. 1,5 mln €)."),
  initials: () => t("Solo lettere, al massimo 4."),
  tag: () => t("Il nome del tag può contenere lettere, numeri, spazi e - _ /"),
  birth: () => t("La data di nascita non è plausibile."),
  numchars: () => t("Scrivi solo numeri interi."),
  range: (a, b) => t("Inserisci un numero tra {a} e {b}.", { a, b })
};
function vCheck(el, live) {
  const rule = ruleOf(el); if (!rule) return true; const raw = el.value; const v = raw.trim(); let msg = "";
  if (v) {
    if (rule === "num") { const r = VRANGE[el.id] || [el.min !== "" ? +el.min : null, el.max !== "" ? +el.max : null]; if (!RX.int.test(v) && !(el.step && el.step !== "1" && /^-?\d+([.,]\d+)?$/.test(v))) msg = VMSG.numchars(); else if (!live && ((r[0] != null && +v.replace(",", ".") < r[0]) || (r[1] != null && +v.replace(",", ".") > r[1]))) msg = VMSG.range(r[0] ?? "–", r[1] ?? "–"); }
    else if (rule === "birth") { if (!live && (v > today() || v < "1950-01-01")) msg = VMSG.birth(); }
    else if (rule === "tag") { if (!TAG_RE.test(v)) msg = VMSG.tag(); }
    else if (rule === "email" || rule === "url" || rule === "score") { if (!live && !RX[rule].test(v)) msg = VMSG[rule](); else if (live && rule === "score" && /[^\d\s\-–:()a-zA-Z.]/.test(v)) msg = VMSG.score(); else if (live && rule === "email" && /\s/.test(v)) msg = VMSG.email(); }
    else if (RX[rule] && !RX[rule].test(v)) msg = VMSG[rule]();
  }
  vShow(el, msg); return !msg;
}
function vShow(el, msg) {
  let box = el.nextElementSibling && el.nextElementSibling.classList && el.nextElementSibling.classList.contains("vmsg2") ? el.nextElementSibling : null;
  if (msg) { el.classList.add("vbad"); el.setAttribute("aria-invalid", "true"); if (!box) { box = document.createElement("span"); box.className = "vmsg2"; box.setAttribute("role", "alert"); el.after(box); } box.textContent = "⚠ " + msg; }
  else { el.classList.remove("vbad"); el.removeAttribute("aria-invalid"); if (box) box.remove(); }
}
// numeri: niente lettere nemmeno mentre scrivi
document.addEventListener("beforeinput", e => { const el = e.target; if (!el || el.tagName !== "INPUT" || el.type !== "number" || !e.data) return; if (/[^\d]/.test(e.data) && !(el.step && el.step !== "1" && /[.,]/.test(e.data))) { e.preventDefault(); vShow(el, VMSG.numchars()); setTimeout(() => { if (!el.classList.contains("vbad")) return; vCheck(el, true); }, 1600); } });
document.addEventListener("input", e => { const el = e.target; if (el && el.tagName === "INPUT" && !el.classList.contains("vnum")) vCheck(el, true); });
document.addEventListener("focusout", e => { const el = e.target; if (el && el.tagName === "INPUT" && !el.classList.contains("vnum")) vCheck(el, false); });
// prima di salvare: niente campi sbagliati
const SAVE_RE = /^(save|.*Save$|.*Salva|todoSave|noteSave|clubDecSave|tagCreate|qp|qpSave|quickSave|saveQuick|newPlayerSave|savePlayer|saveMatch|saveMeet|saveTask|saveIdeal|saveProfile|saveOrg|saveStaff|matchSave|setup)/;
document.addEventListener("click", e => { const b = e.target.closest && e.target.closest("button"); if (!b) return; const a = b.dataset.a || ""; const isSave = SAVE_RE.test(a) || (b.classList.contains("pri") && (b.type === "submit" || b.closest("form")));
  if (!isSave) return; const scope = b.closest(".sheet, form, #view, .lockbox") || document; const bad = [...scope.querySelectorAll("input")].filter(i => i.offsetParent !== null && !i.classList.contains("vnum") && !vCheck(i, false));
  const badN = [...scope.querySelectorAll("input.vnum.vbad")]; if (!bad.length && !badN.length) return;
  e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); toast(t("Correggi i campi segnati in rosso prima di salvare."), 4000); const f = bad[0] || badN[0]; if (f) { f.focus(); f.scrollIntoView({ block: "center", behavior: "smooth" }); } }, true);
document.addEventListener("submit", e => { const f = e.target; const bad = [...f.querySelectorAll("input")].filter(i => i.offsetParent !== null && !vCheck(i, false)); if (!bad.length) return; e.preventDefault(); e.stopImmediatePropagation(); toast(t("Correggi i campi segnati in rosso prima di salvare."), 4000); bad[0].focus(); }, true);

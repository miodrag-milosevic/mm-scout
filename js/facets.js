"use strict";
/* =========================================================
   MM Scout 5.4 — dettagli delle azioni (personalizzabili)
   Per ogni azione registrata in partita lo scout può
   segnare COME è avvenuta: tipo di passaggio, linee
   superate, tipo di smarcamento, orientamento del corpo,
   trigger del pressing, tempo di reazione… Le voci nascono
   dalle schede di osservazione dei capitoli tecnici e
   tattici del manuale di scouting e si possono cambiare
   tutte (Impostazioni › Dettagli azioni).
   Ogni opzione ha un «valore» (⬆ · ⬇) che pesa, insieme a
   zona e pressione, nel voto proposto dai dati.
   ========================================================= */
// [id, it, en, multipla, [[id, it, en, valore], …]]
const FACETS_DEF = [
  ["ori", "Orientamento del corpo", "Body orientation", 0, [["aperto", "Aperto verso la giocata", "Open to the play", 1], ["profilo", "Di profilo", "Side-on", 0], ["chiuso", "Chiuso / spalle alla porta", "Closed / back to goal", 0]]],
  ["scan", "Scanning prima di ricevere", "Scanning before receiving", 0, [["piu", "Più controlli", "Several checks", 1], ["uno", "Un controllo", "One check", 0], ["no", "Nessun controllo", "No check", -1]]],
  ["ctrl", "Primo controllo", "First touch", 0, [["orient", "Orientato", "Directional", 1], ["pulito", "Pulito", "Clean", 0], ["sistemare", "Da sistemare", "Needs a second touch", -1], ["perso", "Perso", "Lost", -1]]],
  ["tempo", "Gestione del tempo", "Use of time", 0, [["guadagna", "Guadagna tempo", "Gains time", 1], ["mantiene", "Mantiene il tempo", "Keeps time", 0], ["perde", "Perde tempo", "Loses time", -1]]],
  ["tocchi", "Tocchi", "Touches", 0, [["prima", "Di prima", "First time", 0], ["due", "Due tocchi", "Two touches", 0], ["tre", "Tre o più tocchi", "Three or more touches", 0]]],
  ["ptipo", "Tipo di passaggio", "Type of pass", 0, [["sicurezza", "Di sicurezza", "Safe pass", 0], ["progressivo", "Progressivo", "Progressive", 1], ["filtrante", "Filtrante", "Through ball", 1], ["cambio", "Cambio di gioco", "Switch of play", 1], ["vertical", "Verticalizzazione", "Vertical pass", 1], ["rottura", "Rompe le linee", "Line-breaking", 1], ["assist", "Assist", "Assist", 1]]],
  ["plen", "Lunghezza", "Length", 0, [["corto", "Corto", "Short", 0], ["medio", "Medio", "Medium", 0], ["lungo", "Lungo", "Long", 0]]],
  ["linee", "Linee superate", "Lines broken", 0, [["l0", "Nessuna", "None", 0], ["l1", "Una linea", "One line", 0], ["l2", "Due linee", "Two lines", 1], ["l3", "Tre o più", "Three or more", 1]]],
  ["smtipo", "Tipo di smarcamento", "Type of movement", 0, [["appoggio", "Di appoggio (viene incontro)", "Short support (comes short)", 0], ["sostegno", "Di sostegno (dietro la palla)", "Support behind the ball", 0], ["ampiezza", "In ampiezza", "Wide", 0], ["profondita", "In profondità", "In behind", 1], ["linee", "Tra le linee", "Between the lines", 1], ["contro", "Contromovimento", "Double movement", 1], ["libera", "Libera spazio a un compagno", "Frees space for a team-mate", 1]]],
  ["smtempo", "Tempo del movimento", "Timing of the run", 0, [["giusto", "Giusto", "Well timed", 1], ["anticipo", "In anticipo", "Too early", 0], ["ritardo", "In ritardo", "Too late", -1], ["offside", "In fuorigioco", "Offside", -1]]],
  ["sep", "Separazione dal difensore", "Separation from the defender", 0, [["ampia", "Ampia", "Clear", 1], ["sufficiente", "Sufficiente", "Enough", 0], ["nessuna", "Nessuna", "None", -1]]],
  ["smesito", "Esito del movimento", "Outcome of the movement", 0, [["ricezione", "Riceve il pallone", "Receives the ball", 1], ["spazio", "Crea spazio a un compagno", "Creates space for a team-mate", 1], ["superiorita", "Crea superiorità", "Creates an overload", 1], ["nessuno", "Non servito", "Not found", 0]]],
  ["metri", "Metri guadagnati", "Metres gained", 0, [["m10", "Meno di 10 m", "Under 10 m", 0], ["m30", "10–30 m", "10–30 m", 0], ["m30p", "Oltre 30 m", "Over 30 m", 1]]],
  ["avv", "Avversari superati", "Opponents beaten", 0, [["a0", "Nessuno", "None", 0], ["a1", "Uno", "One", 0], ["a2", "Due", "Two", 1], ["a3", "Tre o più", "Three or more", 1]]],
  ["dec", "Scelta finale", "Final choice", 0, [["pass", "Passaggio", "Pass", 0], ["tiro", "Tiro", "Shot", 0], ["dribbling", "Dribbling", "Dribble", 0], ["cross", "Cross", "Cross", 0], ["fallo", "Subisce fallo", "Wins a foul", 1], ["perde", "Perde palla", "Loses the ball", -1]]],
  ["dtipo", "Tipo di dribbling", "Type of dribble", 0, [["velocita", "In velocità", "With pace", 0], ["finta", "Con finta", "With a feint", 0], ["stretto", "In spazio stretto", "In tight space", 1], ["giro", "Protezione e giro", "Shield and turn", 0], ["forza", "Di forza", "With strength", 0]]],
  ["crtipo", "Tipo di cross", "Type of cross", 0, [["alto", "Alto sul secondo palo", "High to the far post", 0], ["teso", "Teso sul primo palo", "Driven to the near post", 1], ["rasoterra", "Rasoterra / cut-back", "Low / cut-back", 1], ["arretrato", "Arretrato al limite", "Pulled back to the edge", 0], ["anticipato", "Anticipato dalla trequarti", "Early cross", 0], ["fondo", "Dal fondo", "From the by-line", 0]]],
  ["inarea", "Compagni in area", "Team-mates in the box", 0, [["c0", "Nessuno", "None", 0], ["c1", "Uno", "One", 0], ["c2", "Due", "Two", 0], ["c3", "Tre o più", "Three or more", 0]]],
  ["cresito", "Esito del cross", "Outcome of the cross", 0, [["gol", "Gol", "Goal", 1], ["occasione", "Occasione", "Chance", 1], ["respinto", "Respinto", "Cleared", 0], ["fuori", "Fuori misura", "Off target", -1]]],
  ["tirotipo", "Tipo di conclusione", "Type of finish", 0, [["collo", "Collo pieno", "Laces", 0], ["piatto", "Piatto", "Side-foot", 0], ["giro", "A giro", "Curled", 0], ["volo", "Al volo", "Volley", 1], ["pallonetto", "Pallonetto", "Chip", 1], ["punta", "Di punta", "Toe-poke", 0]]],
  ["occ", "Qualità dell'occasione", "Quality of the chance", 0, [["grande", "Grande occasione", "Big chance", -1], ["media", "Occasione media", "Medium chance", 0], ["bassa", "Occasione difficile", "Difficult chance", 1]]],
  ["tiresito", "Esito della conclusione", "Outcome of the shot", 0, [["gol", "Gol", "Goal", 1], ["porta", "In porta", "On target", 0], ["palo", "Palo / traversa", "Woodwork", 0], ["fuori", "Fuori", "Off target", -1], ["murato", "Murato", "Blocked", 0]]],
  ["trigger", "Trigger del pressing", "Pressing trigger", 0, [["controllo", "Controllo imperfetto", "Poor touch", 1], ["lento", "Passaggio lento", "Slow pass", 1], ["spalle", "Ricezione spalle alla porta", "Receiver facing own goal", 1], ["retro", "Retropassaggio", "Back pass", 1], ["scoperto", "Pallone scoperto", "Uncovered ball", 1], ["nessuno", "Nessun trigger (esce a vuoto)", "No trigger (presses blindly)", -1]]],
  ["angolo", "Angolo di pressione", "Pressing angle", 0, [["interna", "Chiude la linea interna", "Closes the inside lane", 1], ["esterno", "Indirizza verso l'esterno", "Shows him outside", 1], ["frontale", "Frontale", "Head-on", 0], ["dietro", "Da dietro (in recupero)", "From behind (recovering)", 0]]],
  ["presito", "Esito della pressione", "Outcome of the press", 0, [["recupero", "Recupero palla", "Ball won", 1], ["errore", "Errore avversario", "Forced error", 1], ["forzato", "Passaggio forzato", "Forced pass", 0], ["retro", "Costringe al retropassaggio", "Forces a back pass", 0], ["lato", "Costringe al cambio lato", "Forces a switch", 0], ["superato", "Viene superato", "Gets bypassed", -1]]],
  ["com", "Comunicazione", "Communication", 0, [["guida", "Parla e guida i compagni", "Talks and guides team-mates", 1], ["gesti", "Solo con i gesti", "Gestures only", 0], ["nessuna", "Nessuna", "None", -1]]],
  ["reaz", "Tempo di reazione", "Reaction time", 0, [["r2", "Entro 2 secondi", "Within 2 seconds", 1], ["r5", "2–5 secondi", "2–5 seconds", 0], ["lenta", "Lenta o assente", "Slow or none", -1]]],
  ["cpscelta", "Prima scelta dopo la perdita", "First choice after losing the ball", 0, [["recupero", "Attacca subito il pallone", "Attacks the ball at once", 1], ["ritarda", "Pressione ritardante", "Delaying pressure", 0], ["linee", "Chiude le linee di passaggio", "Closes passing lanes", 0], ["copertura", "Copertura preventiva", "Covers the space", 0]]],
  ["trprima", "Prima azione in transizione", "First action in transition", 0, [["sprint", "Sprint in avanti", "Sprint forward", 0], ["conduzione", "Conduzione", "Carry", 0], ["passaggio", "Passaggio in avanti", "Forward pass", 1], ["sicurezza", "Passaggio di sicurezza", "Safe pass", 0], ["copertura", "Copertura", "Covering", 0], ["pressione", "Pressione", "Pressure", 0]]],
  ["aertipo", "Tipo di duello aereo", "Type of aerial duel", 0, [["difensivo", "Difensivo", "Defensive", 0], ["offensivo", "Offensivo", "Attacking", 0], ["inattiva", "Su palla inattiva", "From a set piece", 0], ["lancio", "Su lancio lungo", "From a long ball", 0]]],
  ["stacco", "Tempo di stacco", "Timing of the jump", 0, [["giusto", "Giusto", "Well timed", 1], ["anticipo", "In anticipo", "Too early", 0], ["ritardo", "In ritardo", "Too late", -1]]],
  ["dest", "Destinazione del pallone", "Where the ball goes", 0, [["compagno", "A un compagno", "To a team-mate", 1], ["lontano", "Allontanato", "Cleared away", 0], ["avversario", "A un avversario", "To an opponent", -1]]],
  ["avvlev", "Avversario diretto", "Direct opponent", 0, [["forte", "Più forte / più alto", "Stronger / taller", 1], ["pari", "Alla pari", "Evenly matched", 0], ["debole", "Più debole", "Weaker", -1]]],
  ["contr", "Tipo di intervento", "Type of challenge", 0, [["piedi", "In piedi", "Standing", 0], ["scivolata", "In scivolata", "Sliding", 0], ["spalla", "Spalla a spalla", "Shoulder to shoulder", 0], ["dietro", "Da dietro (rischioso)", "From behind (risky)", -1]]],
  ["lettipo", "Tipo di lettura", "Type of read", 0, [["anticipo", "Anticipa l'avversario", "Gets in front of the opponent", 1], ["intercetto", "Intercetta il passaggio", "Intercepts the pass", 1], ["posizione", "Si posiziona prima", "Positions himself early", 1], ["avvisa", "Segnala il pericolo", "Warns of danger", 0]]],
  ["letliv", "Livello di lettura", "Level of reading", 0, [["reazione", "Reazione", "Reaction", 0], ["anticipazione", "Anticipazione", "Anticipation", 0], ["previsione", "Previsione", "Prediction", 1], ["manipolazione", "Manipolazione", "Manipulation", 1], ["controllo", "Controllo della gara", "Game control", 1]]],
  ["posdim", "Cosa offre con la posizione", "What his position offers", 1, [["ampiezza", "Ampiezza", "Width", 0], ["profondita", "Profondità", "Depth", 0], ["linea", "Linea di passaggio", "Passing lane", 0], ["mezzo", "Occupa il mezzo spazio", "Occupies the half-space", 0], ["copertura", "Copertura", "Cover", 0], ["accorcia", "Accorcia", "Steps up", 0], ["distanza", "Distanze giuste tra i reparti", "Right distances between lines", 1]]],
  ["marctipo", "Tipo di marcatura", "Type of marking", 0, [["uomo", "A uomo", "Man-to-man", 0], ["zona", "A zona", "Zonal", 0], ["mista", "Mista", "Mixed", 0]]],
  ["dist", "Distanza dall'avversario", "Distance from the opponent", 0, [["stretta", "Stretta", "Tight", 0], ["giusta", "Giusta", "Right", 1], ["larga", "Troppo larga", "Too loose", -1]]],
  ["covlinea", "Posizione rispetto alla linea", "Position relative to the line", 0, [["linea", "In linea", "In line", 1], ["davanti", "Davanti", "Ahead", 0], ["dietro", "Dietro (tiene in gioco)", "Behind (plays them onside)", -1]]],
  ["rischio", "Lettura del rischio", "Reading the risk", 0, [["prima", "Prima del pericolo", "Before the danger", 1], ["durante", "Durante l'azione", "During the action", 0], ["tardi", "In ritardo", "Too late", -1]]],
  ["perdcausa", "Causa della perdita", "Cause of the loss", 0, [["controllo", "Controllo sbagliato", "Poor touch", 0], ["passaggio", "Passaggio sbagliato", "Misplaced pass", 0], ["pressione", "Pressione avversaria", "Opponent's pressure", 1], ["scelta", "Scelta sbagliata", "Wrong choice", -1], ["dribbling", "Dribbling fallito", "Failed dribble", 0]]],
  ["dectipo", "Tipo di decisione", "Type of decision", 0, [["conservativa", "Conservativa", "Conservative", 0], ["progressiva", "Progressiva", "Progressive", 1], ["creativa", "Creativa", "Creative", 1], ["difensiva", "Difensiva", "Defensive", 0], ["strategica", "Strategica (gestisce il ritmo)", "Strategic (manages the tempo)", 0]]],
  ["dscelta", "Qualità della scelta", "Quality of the choice", 0, [["migliore", "La migliore possibile", "The best option", 1], ["buona", "Buona", "Good", 0], ["peggiore", "C'era di meglio", "There was a better option", -1]]],
  ["spexec", "Esecuzione", "Delivery", 0, [["primo", "Primo palo", "Near post", 0], ["secondo", "Secondo palo", "Far post", 0], ["corto", "Corto / schema", "Short / routine", 0], ["limite", "Al limite dell'area", "To the edge of the box", 0], ["porta", "In porta", "On goal", 0]]],
  ["rigdir", "Direzione", "Direction", 0, [["sx", "Sinistra", "Left", 0], ["centro", "Centrale", "Centre", 0], ["dx", "Destra", "Right", 0]]],
  ["falltipo", "Tipo di fallo", "Type of foul", 0, [["tattico", "Tattico (ferma la ripartenza)", "Tactical (stops a counter)", 1], ["ritardo", "In ritardo", "Late", -1], ["mano", "Di mano", "Handball", -1], ["proteste", "Per proteste", "Dissent", -1]]],
  ["reazerr", "Reazione", "Reaction", 0, [["subito", "Reagisce subito", "Bounces back at once", 1], ["calo", "Si abbatte", "Drops his head", -1], ["protesta", "Protesta", "Protests", -1], ["nasconde", "Si nasconde dal gioco", "Hides from the game", -1]]],
  ["leadtipo", "Come guida", "How he leads", 0, [["voce", "Con la voce", "With his voice", 0], ["esempio", "Con l'esempio", "By example", 0], ["organizza", "Organizza la squadra", "Organises the team", 1], ["incoraggia", "Incoraggia i compagni", "Encourages team-mates", 0]]],
  ["postura", "Postura", "Posture", 0, [["positiva", "Positiva", "Positive", 1], ["neutra", "Neutra", "Neutral", 0], ["negativa", "Negativa", "Negative", -1]]],
  ["sprint", "Durata dello sprint", "Length of the sprint", 0, [["breve", "Breve (sotto 10 m)", "Short (under 10 m)", 0], ["medio", "Medio (10–30 m)", "Medium (10–30 m)", 0], ["lungo", "Lungo (oltre 30 m)", "Long (over 30 m)", 1]]],
  ["paratipo", "Tipo di intervento del portiere", "Type of save", 0, [["tuffo", "In tuffo", "Diving", 1], ["piede", "Con il piede", "With the foot", 0], ["bloccata", "Bloccata", "Caught", 1], ["respinta", "Respinta laterale", "Parried wide", 0], ["corta", "Respinta corta", "Parried into danger", -1]]],
  ["uscita", "Tempo dell'uscita", "Timing of coming out", 0, [["giusto", "Giusto", "Well timed", 1], ["ritardo", "In ritardo", "Too late", -1], ["resta", "Resta in porta", "Stays on his line", 0]]],
  ["gkpiedi", "Gioco con i piedi", "Distribution", 0, [["corto", "Corto al difensore", "Short to a defender", 0], ["medio", "Al centrocampo", "To midfield", 1], ["lancio", "Lancio lungo", "Long ball", 0], ["pressione", "Sotto pressione", "Under pressure", 1]]]
];
// quali dettagli compaiono per ogni azione (si cambia dalle impostazioni)
const CAT_FACETS = {
  "Ricezione": ["ori", "scan", "ctrl", "tempo"], "Controllo orientato": ["ori", "scan", "ctrl"], "Ricezione sotto pressione": ["scan", "ori", "ctrl", "tempo", "dscelta"], "Scanning": ["scan", "ori", "dscelta"],
  "Passaggio": ["ptipo", "plen", "tocchi", "linee"], "Passaggio progressivo": ["ptipo", "linee", "plen", "tocchi"], "Filtrante": ["linee", "plen", "tocchi"], "Cambio di gioco": ["plen", "tocchi", "ori"],
  "Cross / Assist": ["crtipo", "inarea", "cresito", "tocchi"], "Conduzione": ["metri", "avv", "linee", "dec"], "Dribbling": ["dtipo", "avv", "dec"], "Occasione creata": ["ptipo", "occ"],
  "Tiro": ["tirotipo", "tocchi", "occ", "tiresito"], "Colpo di testa": ["stacco", "occ", "tiresito"], "Protezione palla": ["ori", "avvlev", "dec"], "Piede debole": ["ptipo", "tocchi"], "Perdita palla": ["perdcausa", "ori"],
  "Smarcamento": ["smtipo", "smtempo", "sep", "smesito"], "Attacco profondità": ["smtempo", "sep", "smesito"], "Inserimento": ["smtempo", "smesito"], "Tra le linee": ["ori", "scan", "sep", "smesito"], "Apre spazi": ["smtipo", "smesito"], "Superiorità": ["posdim", "smesito"], "Supporto": ["smtipo", "smtempo"],
  "Pressing": ["trigger", "angolo", "presito", "com"], "Contrasto": ["contr", "avvlev"], "Lettura / Anticipo": ["lettipo", "letliv"], "Duello a terra": ["avvlev", "contr"], "Duello aereo": ["aertipo", "stacco", "dest", "avvlev"],
  "Posizione": ["posdim", "ori", "com"], "Marcatura": ["marctipo", "dist", "ori"], "Copertura": ["covlinea", "rischio", "ori", "com"], "Recupero palla": ["lettipo", "trprima"], "Chiusura": ["contr", "rischio"], "Fallo": ["falltipo"],
  "Contropressing": ["reaz", "cpscelta", "ori", "com"], "Ripiegamento": ["reaz", "ori"], "Ripartenza": ["reaz", "trprima", "dscelta"], "Prima scelta": ["dectipo", "dscelta", "reaz"],
  "Angolo": ["spexec"], "Punizione": ["spexec", "tiresito"], "Rigore": ["rigdir", "tiresito"], "Rimessa": ["plen"], "Palla inattiva difensiva": ["marctipo", "aertipo"],
  "Scatto / Velocità": ["sprint", "avvlev"], "Cambio di passo": ["avvlev"], "Equilibrio": ["avvlev"],
  "Atteggiamento": ["postura"], "Reazione all'errore": ["reazerr"], "Leadership": ["leadtipo"], "Comunicazione": ["com"], "Linguaggio del corpo": ["postura"],
  "Parata / Uscita": ["paratipo"], "Uscita alta": ["uscita", "stacco"], "Uscita bassa": ["uscita"], "1vs1 portiere": ["uscita", "ori"], "Gioco con i piedi": ["gkpiedi", "plen"], "Rinvio": ["plen"], "Guida difesa": ["com"]
};
const facetFromDef = ([id, it, en, multi, opts]) => ({ id, it, en, multi: !!multi, opts: opts.map(([oid, oit, oen, w]) => ({ id: oid, it: oit, en: oen, w })) });
Migrate.config = (orig => function () {
  orig.call(Migrate);
  const c = S.settings.get("config"); if (!c || (c.fv || 0) >= 1) return;
  if (!Array.isArray(c.liveFacets)) c.liveFacets = FACETS_DEF.map(facetFromDef);
  for (const lc of (c.liveCats || [])) if (!Array.isArray(lc.facets)) lc.facets = (CAT_FACETS[lc.id] || []).slice();
  c.fv = 1; put("settings", "config", c);
})(Migrate.config);

/* ---------- utilità ---------- */
const Facet = {
  all() { return Cfg.get().liveFacets || []; },
  get(id) { return this.all().find(f => f.id === id); },
  forCat(cid) { const c = catOf(cid); if (!c) return []; return (c.facets || []).map(id => this.get(id)).filter(f => f && !f.hidden); },
  vals(e, f) { const v = (e.d || {})[f.id]; return v == null || v === "" ? [] : Array.isArray(v) ? v : [v]; },
  opts(e) { const out = []; for (const [fid, v] of Object.entries(e.d || {})) { const f = this.get(fid); if (!f) continue; for (const oid of (Array.isArray(v) ? v : [v])) { const o = (f.opts || []).find(x => x.id === oid); if (o) out.push([f, o]); } } return out; },
  text(e) { return this.opts(e).map(([, o]) => L(o)).join(" · "); },
  score(e) { return this.opts(e).reduce((s, [, o]) => s + (+o.w || 0), 0); }
};
// i dettagli pesano nel voto proposto: una giocata difficile riuscita vale di più, un errore banale pesa di più
window.evWeight = (orig => function (e, c, m) {
  const w = orig(e, c, m); const s = Facet.score(e); if (!s) return w; const o = evOutcome(e);
  const f = o === "+" ? 1 + 0.07 * s : o === "-" ? 1 - 0.07 * s : 1; return w * Math.max(0.75, Math.min(1.3, f));
})(window.evWeight);
// testo dell'azione (usato quando le azioni diventano evidenze della valutazione)
window.evText = function (e) {
  const c = catOf(e.c); const o = evOutcome(e);
  const extra = [Facet.text(e), e.z ? zoneL(e.z) : "", e.pr ? t("pressione {n}/5", { n: e.pr }) : "", e.b ? L(BODY.map(([id, it, en]) => ({ id, it, en })).find(x => x.id === e.b)) : ""].filter(Boolean).join(", ");
  return `${liveCatL(e.c)}${c && c.kind === "event" ? "" : " " + (o === "+" ? "✓" : o === "-" ? "✗" : "=")}${extra ? " (" + extra + ")" : ""}${e.n ? ": " + e.n : ""}`;
};
// metriche dell'analisi: i dettagli rendono i conteggi più precisi
(() => {
  const set = (k, fn) => { const r = MX.find(x => x[0] === k); if (r) r[3] = fn; };
  const d = (e, k) => (e.d || {})[k];
  set("shots", e => e.c === "Tiro" || (e.c === "Colpo di testa" && (e.o !== "=" || !!d(e, "tiresito"))));
  set("sot", e => (e.c === "Tiro" || e.c === "Colpo di testa") && (["gol", "porta"].includes(d(e, "tiresito")) || (!d(e, "tiresito") && e.o === "+")));
  set("prog", e => e.o === "+" && (e.c === "Passaggio progressivo" || e.c === "Cambio di gioco" || (["Passaggio", "Piede debole"].includes(e.c) && ["progressivo", "filtrante", "cambio", "vertical", "rottura"].includes(d(e, "ptipo"))) || ["l2", "l3"].includes(d(e, "linee"))));
  set("kp", e => e.o === "+" && (e.c === "Occasione creata" || e.c === "Filtrante" || (e.c === "Cross / Assist" && ["gol", "occasione"].includes(d(e, "cresito")))));
  set("rec", e => e.o === "+" && (["Recupero palla", "Lettura / Anticipo", "Chiusura"].includes(e.c) || (e.c === "Pressing" && d(e, "presito") === "recupero") || (e.c === "Contropressing" && d(e, "cpscelta") === "recupero")));
})();
window.shotXG = (orig => function (e) { let x = orig(e); if (!x) return x; const q = (e.d || {}).occ; if (q === "grande") x = Math.max(x, 0.35) * 1.4; else if (q === "bassa") x *= 0.6; return Math.min(0.85, x); })(window.shotXG);

/* ---------- scheda «Dettagli» dell'azione ---------- */
function facetBlock(cid, d) {
  const fs = Facet.forCat(cid);
  return `${fs.map(f => { const cur = (d || {})[f.id]; const sel = cur == null ? [] : Array.isArray(cur) ? cur : [cur];
    return `<div class="fct"><div class="m fctl">${esc(L(f))}${f.multi ? ` <small>(${t("più scelte")})</small>` : ""}</div><div class="chips" data-fct="${esc(f.id)}" data-multi="${f.multi ? 1 : 0}">${(f.opts || []).filter(o => !o.hidden).map(o => `<button type="button" class="chip" data-v="${esc(o.id)}" aria-pressed="${sel.includes(o.id)}">${esc(L(o))}</button>`).join("")}</div></div>`; }).join("")}
   <button type="button" class="btn sm ghost fctedit" data-a="facetQuick" data-c="${esc(cid)}">⚙ ${fs.length ? t("Personalizza i dettagli di questa azione") : t("Aggiungi dettagli a questa azione")}</button>`;
}
function readFacets() { const d = {}; $$("[data-fct]").forEach(g => { const v = [...g.querySelectorAll('.chip[aria-pressed="true"]')].map(b => b.dataset.v); if (!v.length) return; d[g.dataset.fct] = g.dataset.multi === "1" ? v : v[0]; }); return d; }
document.addEventListener("click", e => { const b = e.target.closest("[data-fct] .chip"); if (!b) return; const g = b.closest("[data-fct]"); const on = b.getAttribute("aria-pressed") === "true"; if (g.dataset.multi !== "1") g.querySelectorAll(".chip").forEach(x => x.setAttribute("aria-pressed", "false")); b.setAttribute("aria-pressed", on ? "false" : "true"); });

window.liveDetails = function (eid, keep) {
  const mid = ui.evMatch || ui.matchId; const m = S.matches.get(mid); if (!m) return; const e = (m.events || []).find(x => x.id === eid); if (!e) return; const tg = [...new Set([...(m.targets || []).filter(P), e.p].filter(P))];
  const cur = keep || e; let z = cur.z || null; const c0 = catOf(cur.c);
  sheet(`<div class="row between"><h2>${esc(liveCatL(cur.c))}</h2><button class="btn sm ghost" data-a="closeSheetBtn" aria-label="${t("Chiudi")}">✕</button></div>
   <div class="fgrid"><label class="f">${t("Giocatore")}<select id="ldP">${tg.map(x => `<option value="${x}" ${x === cur.p ? "selected" : ""}>${esc(pname(P(x)))}</option>`).join("")}</select></label>
    <label class="f">${t("Azione")}<select id="ldC">${Cfg.get().liveGroups.map(g => `<optgroup label="${esc(L(g))}">${Cfg.get().liveCats.filter(x => x.group === g.id).map(x => `<option value="${esc(x.id)}" ${x.id === cur.c ? "selected" : ""}>${esc(L(x))}</option>`).join("")}</optgroup>`).join("")}</select></label>
    <label class="f">${t("Minuto")}<input type="number" id="ldT" value="${cur.t}" min="0" max="130"></label>
    <label class="f">${t("Tempo")}<select id="ldH">${[1, 2, 3, 4].map(h => `<option value="${h}" ${cur.h === h ? "selected" : ""}>${halfL(h)}</option>`).join("")}</select></label></div>
   ${c0 && c0.kind === "event" ? "" : `<div><div class="m fctl">${t("Esito")}</div><div class="seg" id="ldO">${[["+", "✓ " + t("Positiva")], ["-", "✗ " + t("Negativa")], ["=", "= " + t("Neutra")]].filter(([v]) => v !== "=" || !App.cfgDevice().hideNeutral || cur.o === "=").map(([v, n]) => `<button data-v="${v}" aria-pressed="${cur.o === v}">${n}</button>`).join("")}</div></div>`}
   <div class="fctbox" id="ldF"><div class="m fctl" style="font-size:13px">${t("Come l'ha fatto")}</div>${facetBlock(cur.c, cur.d)}</div>
   <div><div class="m fctl">${t("Zona del campo (tocca il riquadro)")}</div>${zonePicker(z, "ldZ")}</div>
   <div class="row"><div><div class="m fctl">${t("Pressione avversaria")}</div><div class="seg" id="ldPr">${[1, 2, 3, 4, 5].map(v => `<button data-v="${v}" aria-pressed="${cur.pr === v}">${v}</button>`).join("")}</div></div>
   <div><div class="m fctl">${t("Piede / parte del corpo")}</div><div class="seg" id="ldB">${BODY.map(([id, it, en]) => `<button data-v="${id}" aria-pressed="${cur.b === id}">${esc(L({ it, en }))}</button>`).join("")}</div></div></div>
   <label class="f">${t("Nota")}<input type="text" id="ldN" value="${esc(cur.n)}"></label>
   <div class="row between"><button class="btn danger" id="ldDel">${t("Elimina")}</button><button class="btn pri" id="ldSave">${t("Salva")}</button></div>`, true);
  ["#ldO", "#ldPr", "#ldB"].forEach(s => { const el = $(s); if (el) el.onclick = ev => { const b = ev.target.closest("button"); if (!b) return; const was = b.getAttribute("aria-pressed") === "true"; el.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", "false")); if (!(was && s !== "#ldO")) b.setAttribute("aria-pressed", "true"); }; });
  bindZonePicker("ldZ", () => z, nz => { z = nz; });
  const val = s => { const b = $(s) && $(s).querySelector('[aria-pressed="true"]'); return b ? b.dataset.v : ""; };
  const draft = () => ({ ...e, p: $("#ldP").value, c: $("#ldC").value, t: +$("#ldT").value || e.t, h: +$("#ldH").value, o: val("#ldO") || e.o, z, pr: +val("#ldPr") || null, b: val("#ldB") || "", n: $("#ldN").value.trim(), d: readFacets() });
  $("#ldC").onchange = () => { const d = draft(); const keepD = {}; const ok = new Set(Facet.forCat(d.c).map(f => f.id)); for (const k in d.d) if (ok.has(k)) keepD[k] = d.d[k]; d.d = keepD; liveDetails(eid, d); };
  ui._ldDraft = () => draft();
  $("#ldSave").onclick = () => { const mm = S.matches.get(mid); const ne = draft(); if (!Object.keys(ne.d).length) delete ne.d; closeSheet(); put("matches", mid, { ...mm, events: mm.events.map(x => x.id === e.id ? ne : x) }); toast(t("Azione aggiornata")); render(true); };
  $("#ldDel").onclick = () => { const mm = S.matches.get(mid); closeSheet(); put("matches", mid, { ...mm, events: mm.events.filter(x => x.id !== e.id) }); toast(t("Azione eliminata")); render(true); };
};

/* ---------- personalizzazione rapida dalla scheda Dettagli ---------- */
function facetQuick(cid, back) {
  const c = clone(Cfg.get()); const lc = c.liveCats.find(x => x.id === cid); if (!lc) return; lc.facets = lc.facets || [];
  const order = [...lc.facets, ...c.liveFacets.map(f => f.id).filter(id => !lc.facets.includes(id))];
  sheet(`<div class="row between"><h2>${t("Dettagli di «{a}»", { a: esc(L(lc)) })}</h2><button class="btn sm ghost" data-a="closeSheetBtn">✕</button></div>
   <p class="sub small">${t("Spunta i gruppi di dettagli che vuoi vedere per questa azione. Puoi crearne di nuovi: scrivi il nome e le opzioni separate da virgola.")}</p>
   <div class="fqlist">${order.map(id => { const f = c.liveFacets.find(x => x.id === id); if (!f) return ""; return `<label class="chk fqrow"><input type="checkbox" value="${esc(id)}" ${lc.facets.includes(id) ? "checked" : ""}> <b>${esc(L(f))}</b> <span class="m">${esc((f.opts || []).filter(o => !o.hidden).map(o => L(o)).join(" · "))}</span></label>`; }).join("")}</div>
   <div class="panel" style="padding:10px;margin:0"><b>${t("Nuovo gruppo di dettagli")}</b><div class="fgrid" style="margin-top:6px"><label class="f">${t("Nome")}<input type="text" id="fqN" placeholder="${t("es. Piede usato nel controllo")}"></label><label class="f">${t("Opzioni (separate da virgola)")}<input type="text" id="fqO" placeholder="${t("es. Destro, Sinistro, Suola")}"></label></div></div>
   <div class="row between"><button class="btn ghost" data-a="goFacetSettings">${t("Tutte le impostazioni dei dettagli")}</button><div class="row"><button class="btn" id="fqBack">${t("Indietro")}</button><button class="btn pri" id="fqSave">${t("Salva")}</button></div></div>`, true);
  $("#fqBack").onclick = () => back ? back() : closeSheet();
  $("#fqSave").onclick = () => {
    const sel = $$(".fqlist input:checked").map(x => x.value); const n = $("#fqN").value.trim(), os = $("#fqO").value.split(",").map(x => x.trim()).filter(Boolean);
    if (n && os.length) { const id = "u" + uid(); c.liveFacets.push(facetNew(n, os, id)); sel.push(id); }
    lc.facets = order.filter(id => sel.includes(id)).concat(sel.filter(id => !order.includes(id)));
    Cfg.save(c); toast(t("Dettagli aggiornati")); back ? back() : closeSheet();
  };
}
function facetNew(name, opts, id) { const lab = s => { const o = { it: s, en: s }; if (Prefs.lang !== "it" && Prefs.lang !== "en") o[Prefs.lang] = s; return o; }; return { id: id || "u" + uid(), ...lab(name), multi: false, opts: opts.map(s => ({ id: "o" + uid().slice(-6) + Math.random().toString(36).slice(2, 4), ...lab(s), w: 0 })) }; }
A.facetQuick = el => { const cid = el.dataset.c; const d = ui._ldDraft ? ui._ldDraft() : null; const eid = d && d.id; facetQuick(cid, eid ? () => liveDetails(eid, { ...d, c: cid }) : null); };
A.goFacetSettings = () => { closeSheet(); ui.evMatch = null; ui.setTab = "dettagli"; resetSub(); go("impostazioni"); };

/* ---------- impostazioni: tutti i dettagli ---------- */
let fctDraft = null;
R.impostazioni = (orig => () => {
  if (ui.setTab !== "dettagli") fctDraft = null;
  const h = orig(); return h.replace(/(<button data-a="setTab" data-t="personalizza"[^>]*>[^<]*<\/button>)/, `$1<button data-a="setTab" data-t="dettagli" aria-pressed="${ui.setTab === "dettagli"}">${t("Dettagli azioni")}</button>`);
})(R.impostazioni);
SET.dettagli = () => {
  if (!fctDraft) fctDraft = clone(Cfg.get()); const c = fctDraft; const cats = c.liveCats.filter(x => !x.hidden); const cid = ui.fctCat && cats.some(x => x.id === ui.fctCat) ? ui.fctCat : (cats[0] || {}).id; const lc = c.liveCats.find(x => x.id === cid) || { facets: [] };
  const nm = x => esc(L(x));
  const wSel = (fi, oi, w) => `<select data-fw="${fi}.${oi}" aria-label="${t("Valore")}" title="${t("Valore nel voto proposto")}"><option value="1" ${w > 0 ? "selected" : ""}>⬆ ${t("positivo")}</option><option value="0" ${!w ? "selected" : ""}>· ${t("neutro")}</option><option value="-1" ${w < 0 ? "selected" : ""}>⬇ ${t("negativo")}</option></select>`;
  return `<div class="banner info row between"><span>${t("Scegli quali dettagli compaiono per ogni azione e modifica le opzioni. «Valore»: ⬆ rende più importante una giocata riuscita, ⬇ fa pesare di più un errore.")}</span><div class="row"><button class="btn sm ghost" data-a="fctReset">${t("Ripristina predefiniti")}</button><button class="btn sm pri" data-a="fctSave">${t("Salva modifiche")}</button></div></div>
  <section class="panel"><h2>${t("Dettagli per azione")}</h2><label class="f" style="max-width:360px;margin-top:8px">${t("Azione")}<select id="fctCat">${c.liveGroups.filter(g => g.id !== "frequenti").map(g => `<optgroup label="${esc(L(g))}">${cats.filter(x => x.group === g.id).map(x => `<option value="${esc(x.id)}" ${x.id === cid ? "selected" : ""}>${nm(x)}${(x.facets || []).length ? " · " + (x.facets || []).length : ""}</option>`).join("")}</optgroup>`).join("")}</select></label>
   <div class="list" style="margin-top:8px">${(lc.facets || []).map((id, i) => { const f = c.liveFacets.find(x => x.id === id); if (!f) return ""; return `<div class="item"><div class="grow"><b>${nm(f)}</b><div class="m">${esc((f.opts || []).filter(o => !o.hidden).map(o => L(o)).join(" · "))}</div></div><div class="opt-actions"><button data-a="fctMove" data-i="${i}" data-d="-1" title="${t("Su")}">↑</button><button data-a="fctMove" data-i="${i}" data-d="1" title="${t("Giù")}">↓</button><button data-a="fctToggle" data-f="${esc(id)}" title="${t("Togli")}">✕</button></div></div>`; }).join("") || `<div class="empty">${t("Nessun dettaglio per questa azione.")}</div>`}</div>
   <label class="f" style="max-width:360px;margin-top:10px">+ ${t("Aggiungi un dettaglio a questa azione")}<select id="fctAdd"><option value="">—</option>${c.liveFacets.filter(f => !(lc.facets || []).includes(f.id) && !f.hidden).map(f => `<option value="${esc(f.id)}">${nm(f)}</option>`).join("")}</select></label></section>
  <section class="panel"><div class="row between"><h2>${t("Gruppi di dettagli")}</h2><button class="btn sm" data-a="fctNew">+ ${t("Nuovo gruppo")}</button></div><p class="sub small">${t("Rinomina, aggiungi o togli opzioni. I nomi che scrivi valgono per la lingua che stai usando.")}</p>
   ${c.liveFacets.map((f, fi) => `<details class="area" ${ui.fctOpen === fi ? "open" : ""} data-fi="${fi}"><summary><h3>${nm(f)}${f.hidden ? " · " + t("nascosto") : ""}</h3><span class="m">${t("{n} opzioni", { n: (f.opts || []).length })} · ${t("usato in {n} azioni", { n: c.liveCats.filter(x => (x.facets || []).includes(f.id)).length })}</span></summary>
     <div class="row" style="margin:6px 0"><input type="text" data-fn="${fi}" value="${esc(L(f))}" style="flex:1" aria-label="${t("Nome")}"><label class="chk small"><input type="checkbox" data-fm="${fi}" ${f.multi ? "checked" : ""}> ${t("più scelte")}</label><button class="btn sm ghost" data-a="fctHide" data-fi="${fi}">${f.hidden ? t("Mostra") : t("Nascondi")}</button><button class="btn sm ghost danger" data-a="fctDel" data-fi="${fi}">${t("Elimina")}</button></div>
     ${(f.opts || []).map((o, oi) => `<div class="opt-row three"><input type="text" data-fo="${fi}.${oi}" value="${esc(L(o))}" aria-label="${t("Opzione")}">${wSel(fi, oi, o.w)}<div class="opt-actions"><button data-a="fctOptMove" data-fi="${fi}" data-oi="${oi}" data-d="-1">↑</button><button data-a="fctOptMove" data-fi="${fi}" data-oi="${oi}" data-d="1">↓</button><button data-a="fctOptDel" data-fi="${fi}" data-oi="${oi}" title="${t("Elimina")}">✕</button></div></div>`).join("")}
     <button class="btn sm" style="margin:6px 0 10px" data-a="fctOptAdd" data-fi="${fi}">+ ${t("Opzione")}</button></details>`).join("")}</section>
  <div class="row end"><button class="btn pri" data-a="fctSave">${t("Salva modifiche")}</button></div>`;
};
// legge i campi del modulo nella bozza
function fctRead() {
  const c = fctDraft; if (!c) return; const setLab = (o, v) => { if (L(o) === v) return; o[Prefs.lang] = v; if (Prefs.lang === "it") o.it = v; };
  $$("[data-fn]").forEach(x => setLab(c.liveFacets[+x.dataset.fn], x.value.trim() || L(c.liveFacets[+x.dataset.fn])));
  $$("[data-fm]").forEach(x => c.liveFacets[+x.dataset.fm].multi = x.checked);
  $$("[data-fo]").forEach(x => { const [fi, oi] = x.dataset.fo.split(".").map(Number); const o = c.liveFacets[fi].opts[oi]; if (o) setLab(o, x.value.trim() || L(o)); });
  $$("[data-fw]").forEach(x => { const [fi, oi] = x.dataset.fw.split(".").map(Number); const o = c.liveFacets[fi].opts[oi]; if (o) o.w = +x.value; });
  const d = $$("details.area[data-fi]").find(x => x.open); ui.fctOpen = d ? +d.dataset.fi : ui.fctOpen;
}
const fctLc = () => fctDraft.liveCats.find(x => x.id === ($("#fctCat") || {}).value) || fctDraft.liveCats[0];
Object.assign(A, {
  fctSave: () => { fctRead(); Cfg.save(clone(fctDraft)); fctDraft = null; toast(t("Dettagli salvati")); render(true); },
  fctReset: () => confirmSheet(t("Ripristinare i dettagli predefiniti? I dettagli già registrati nelle azioni restano."), () => { const c = clone(Cfg.get()); c.liveFacets = FACETS_DEF.map(facetFromDef); for (const lc of c.liveCats) lc.facets = (CAT_FACETS[lc.id] || []).slice(); Cfg.save(c); fctDraft = null; }),
  fctMove: el => { fctRead(); const lc = fctLc(); const i = +el.dataset.i, j = i + +el.dataset.d; if (j < 0 || j >= lc.facets.length) return; [lc.facets[i], lc.facets[j]] = [lc.facets[j], lc.facets[i]]; render(true); },
  fctToggle: el => { fctRead(); const lc = fctLc(); const id = el.dataset.f; lc.facets = lc.facets || []; lc.facets = lc.facets.includes(id) ? lc.facets.filter(x => x !== id) : [...lc.facets, id]; render(true); },
  fctNew: () => { fctRead(); fctDraft.liveFacets.push(facetNew(t("Nuovo dettaglio"), [t("Opzione 1"), t("Opzione 2")])); ui.fctOpen = fctDraft.liveFacets.length - 1; render(true); },
  fctHide: el => { fctRead(); const f = fctDraft.liveFacets[+el.dataset.fi]; f.hidden = !f.hidden; render(true); },
  fctDel: el => { fctRead(); const f = fctDraft.liveFacets[+el.dataset.fi]; fctDraft.liveFacets.splice(+el.dataset.fi, 1); for (const lc of fctDraft.liveCats) lc.facets = (lc.facets || []).filter(x => x !== f.id); ui.fctOpen = null; render(true); },
  fctOptAdd: el => { fctRead(); const f = fctDraft.liveFacets[+el.dataset.fi]; f.opts.push(facetNew("x", [t("Nuova opzione")]).opts[0]); ui.fctOpen = +el.dataset.fi; render(true); },
  fctOptDel: el => { fctRead(); fctDraft.liveFacets[+el.dataset.fi].opts.splice(+el.dataset.oi, 1); ui.fctOpen = +el.dataset.fi; render(true); },
  fctOptMove: el => { fctRead(); const a = fctDraft.liveFacets[+el.dataset.fi].opts; const i = +el.dataset.oi, j = i + +el.dataset.d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; ui.fctOpen = +el.dataset.fi; render(true); }
});
document.addEventListener("change", e => { if (e.target && e.target.id === "fctCat") { fctRead(); ui.fctCat = e.target.value; render(true); } if (e.target && e.target.id === "fctAdd" && e.target.value) A.fctToggle({ dataset: { f: e.target.value } }); });

/* ---------- registro: dettagli nell'elenco, filtri ---------- */
window.logPage = function (id, m) {
  const f = ui.lf = ui.lf || { p: "", g: "", o: "", h: "" }; const tg = [...new Set([...(m.targets || []), ...(m.events || []).map(e => e.p)])].filter(P);
  const ev = (m.events || []).filter(e => (!f.p || e.p === f.p) && (!f.g || (catOf(e.c) || {}).group === f.g) && (!f.o || evOutcome(e) === f.o) && (!f.h || String(e.h) === f.h)).sort((a, b) => (a.h - b.h) || (a.t - b.t));
  const groups = Cfg.get().liveGroups.filter(g => g.id !== "frequenti");
  return `<section class="panel"><div class="fgrid"><label class="f">${t("Giocatore")}<select id="lf_p"><option value="">${t("Tutti")}</option>${tg.map(x => `<option value="${x}" ${f.p === x ? "selected" : ""}>${esc(pname(P(x)))}</option>`).join("")}</select></label>
   <label class="f">${t("Fase")}<select id="lf_g"><option value="">${t("Tutte")}</option>${groups.map(g => `<option value="${g.id}" ${f.g === g.id ? "selected" : ""}>${esc(L(g))}</option>`).join("")}</select></label>
   <label class="f">${t("Esito")}<select id="lf_o"><option value="">${t("Tutti")}</option><option value="+" ${f.o === "+" ? "selected" : ""}>✓ ${t("Positiva")}</option><option value="=" ${f.o === "=" ? "selected" : ""}>= ${t("Neutra")}</option><option value="-" ${f.o === "-" ? "selected" : ""}>✗ ${t("Negativa")}</option></select></label>
   <label class="f">${t("Tempo")}<select id="lf_h"><option value="">${t("Tutti")}</option>${[1, 2, 3, 4].map(h => `<option value="${h}" ${f.h === String(h) ? "selected" : ""}>${halfL(h)}</option>`).join("")}</select></label></div></section>
  <div class="grid2"><section class="panel"><h2>${t("Azioni ({n})", { n: ev.length })}</h2><div class="list" style="margin-top:6px">${ev.map(e => evRow(e)).join("") || `<div class="empty">${t("Nessuna azione con questi filtri.")}</div>`}</div></section>
  <section class="panel"><h2>${t("Riepilogo per giocatore")}</h2>${tg.map(pid => { const pe = (m.events || []).filter(e => e.p === pid); if (!pe.length) return ""; const zones = pe.filter(e => e.z);
    return `<h3 style="margin-top:12px">${esc(pname(P(pid)))} · ${t("{n} azioni", { n: pe.length })} · ${Math.round(pe.filter(e => evOutcome(e) === "+").length / pe.length * 100)}% +</h3>${groupTable(pe)}${zones.length ? `<h3 style="margin-top:10px">${t("Mappa delle zone")}</h3>${heatBlock(pe, "m" + pid)}` : ""}${trackPanel(pe)}`; }).join("") || `<p class="muted">${t("Nessuna azione registrata.")}</p>`}</section></div>`;
};
function evRow(e, withMatch) {
  const o = evOutcome(e); const fx = Facet.text(e); const mid = withMatch ? matchOfEvent(e.id) : null; const m = mid ? S.matches.get(mid) : null;
  return `<div class="item"><span class="code">${halfL(e.h)} ${e.t}'</span><div class="grow"><div class="t"><span class="${o === "+" ? "tp" : o === "-" ? "tm" : ""}">${e.c === "Nota vocale" ? "🎙" : e.c === "Nota scritta" ? "✍" : o === "+" ? "✓" : o === "-" ? "✗" : "="}</span> ${esc(liveCatL(e.c))} <span class="muted" style="font-weight:400">· ${esc(pname(P(e.p)))}</span></div>
   ${fx ? `<div class="fxline">${esc(fx)}</div>` : ""}<div class="m">${m ? esc(m.home + " – " + m.away) + " · " + fmtDate(m.date) + " · " : ""}${esc(L((Cfg.get().liveGroups.find(g => g.id === (catOf(e.c) || {}).group)) || {}))}${e.z ? " · " + esc(zoneL(e.z)) : ""}${e.pr ? " · " + t("pressione {n}/5", { n: e.pr }) : ""}${e.b ? " · " + esc(L(BODY.map(([id, it, en]) => ({ id, it, en })).find(x => x.id === e.b))) : ""}${e.n ? " · " + esc(e.n) : ""}</div>${e.mediaId && S.media.get(e.mediaId) ? `<audio controls preload="none" class="vnote" data-blob="${S.media.get(e.mediaId).blobId}"></audio>` : ""}</div><button class="btn sm ghost" data-a="ldetAny" data-e="${e.id}">${t("Modifica")}</button></div>`;
}
function matchOfEvent(eid) { for (const [mid, m] of S.matches) if ((m.events || []).some(e => e.id === eid)) return mid; return null; }
A.ldetAny = el => { const mid = matchOfEvent(el.dataset.e); if (!mid) return; ui.evMatch = mid; liveDetails(el.dataset.e); };
window.closeSheet = (orig => function () { ui.evMatch = null; ui._ldDraft = null; return orig.apply(this, arguments); })(window.closeSheet);

/* ---------- mappa delle zone: tocca un riquadro per vedere le azioni ---------- */
const HEATEV = {};
window.heatmapSVG = (orig => function (points, o = {}) {
  const svg = orig(points, o); if (!o.key) return svg; const W = 105 / 6, H = 68 / 5; const cnt = {}; for (const p of points) { const q = zoneOf(p); if (q) cnt[q.s + "-" + q.c] = (cnt[q.s + "-" + q.c] || 0) + 1; }
  let hits = ""; for (let s = 0; s < 6; s++) for (let c = 0; c < 5; c++) if (cnt[s + "-" + c]) hits += `<rect class="hz" data-a="heatZone" data-k="${o.key}" data-zs="${s}" data-zc="${c}" x="${s * W}" y="${c * H}" width="${W}" height="${H}" fill="transparent"><title>${esc(zoneL(zoneCenter(s, c)))} · ${t("{n} azioni", { n: cnt[s + "-" + c] })}</title></rect>`;
  return svg.replace(/<\/svg>$/, hits + "</svg>");
})(window.heatmapSVG);
window.heatBlock = function (events, key) {
  const f = (ui.heat || {})[key] || "all"; const sel = events.filter(e => e.z && (f === "all" || evOutcome(e) === f)); const pts = sel.map(e => e.z); HEATEV[key] = sel;
  if (!events.some(e => e.z)) return `<p class="m">${t("Aggiungi la zona alle azioni (con «Dettagli») per vedere la mappa.")}</p>`;
  return `<div class="seg" style="margin-bottom:8px">${[["all", t("Tutte")], ["+", "✓ " + t("Positive")], ["-", "✗ " + t("Negative")]].map(([v, n]) => `<button data-a="heatF" data-k="${key}" data-v="${v}" aria-pressed="${f === v}">${n}</button>`).join("")}</div><div class="pitchbox" style="max-width:420px">${heatmapSVG(pts, { key, color: f === "-" ? "#E07070" : f === "+" ? "#5CC48B" : "#F2C14E" })}</div><p class="m">${t("{n} azioni con zona · 5 corsie × 6 fasce", { n: pts.length })} · ${t("tocca un riquadro per vedere le azioni")}</p>`;
};
// mappa sfumata dell'analisi: griglia invisibile toccabile sopra il colore
let HEAT_CTX = null;
window.smoothHeat = (orig => function (points, key) {
  const h = orig(points, key); const cx = HEAT_CTX; if (!cx || !points.length) return h; HEATEV[cx.key] = cx.events.filter(e => e.z);
  const W = 105 / 6, H = 68 / 5; const cnt = {}; for (const e of HEATEV[cx.key]) { const q = zoneOf(e.z); cnt[q.s + "-" + q.c] = (cnt[q.s + "-" + q.c] || 0) + 1; }
  let hits = ""; for (let s = 0; s < 6; s++) for (let c = 0; c < 5; c++) if (cnt[s + "-" + c]) hits += `<rect class="hz" data-a="heatZone" data-k="${cx.key}" data-zs="${s}" data-zc="${c}" x="${s * W}" y="${c * H}" width="${W}" height="${H}" fill="transparent"><title>${esc(zoneL(zoneCenter(s, c)))} · ${t("{n} azioni", { n: cnt[s + "-" + c] })}</title></rect>`;
  return h.replace('<svg viewBox="0 0 105 68" class="heatlines" aria-hidden="true">', `<svg viewBox="0 0 105 68" class="heatlines hzon">${hits}`).replace(/(<p class="m">[^<]*)<\/p>$/, `$1 · ${t("tocca una zona per vedere le azioni")}</p>`);
})(window.smoothHeat);
window.analysisTab = (orig => function (id, p) { HEAT_CTX = { key: "a" + id, events: playerData(id).ev }; try { return dataPanel(id, p) + orig(id, p) + howPanel(id); } finally { HEAT_CTX = null; } })(window.analysisTab);
window.reportTab = (orig => function (id, p) { HEAT_CTX = { key: "r" + id, events: playerData(id).ev }; try { return orig(id, p); } finally { HEAT_CTX = null; } })(window.reportTab);
A.heatZone = el => {
  const evs = (HEATEV[el.dataset.k] || []); const s = +el.dataset.zs, c = +el.dataset.zc; const here = evs.filter(e => { const q = zoneOf(e.z); return q && q.s === s && q.c === c; }).sort((a, b) => (a.h - b.h) || (a.t - b.t));
  const z = zoneCenter(s, c); const pos = here.filter(e => evOutcome(e) === "+").length, neg = here.filter(e => evOutcome(e) === "-").length; const players = new Set(here.map(e => e.p)); const multiM = new Set(here.map(e => matchOfEvent(e.id))).size > 1;
  const th = [t("Terzo difensivo"), t("Terzo centrale"), t("Terzo offensivo")][s <= 1 ? 0 : s <= 3 ? 1 : 2];
  const byCat = {}; for (const e of here) { const r = byCat[e.c] = byCat[e.c] || [0, 0, 0]; r[0]++; const o = evOutcome(e); if (o === "+") r[1]++; else if (o === "-") r[2]++; }
  sheet(`<div class="row between"><div><h2>📍 ${esc(zoneL(z))}</h2><p class="sub small">${th} · ${t("zona {n} di 30", { n: s * 5 + c + 1 })}${players.size === 1 ? " · " + esc(pname(P(here[0].p))) : ""}</p></div><button class="btn sm ghost" data-a="closeSheetBtn" aria-label="${t("Chiudi")}">✕</button></div>
   <div class="zcard"><div class="pitchbox zmini">${zoneGridSVG(z)}</div><div class="ctxgrid"><div><span class="m">${t("Azioni")}</span><b class="mono">${here.length}</b></div><div><span class="m">✓ ${t("Positive")}</span><b class="mono tp">${pos}</b></div><div><span class="m">✗ ${t("Negative")}</span><b class="mono tm">${neg}</b></div><div><span class="m">%+</span><b class="mono">${here.length ? Math.round(pos / here.length * 100) : 0}%</b></div></div></div>
   <div class="chips" style="margin:4px 0">${Object.entries(byCat).sort((a, b) => b[1][0] - a[1][0]).map(([k, r]) => `<span class="pill c-grey">${esc(liveCatL(k))} · ${r[0]}${r[1] || r[2] ? ` (${r[1]}✓ ${r[2]}✗)` : ""}</span>`).join("")}</div>
   <div class="list">${here.map(e => evRow(e, multiM)).join("") || `<div class="empty">${t("Nessuna azione in questa zona.")}</div>`}</div>`, true);
  $$(".zcard .zcell").forEach(r => r.style.pointerEvents = "none");
};

/* ---------- Analisi: voto dai dati e «come lo fa» ---------- */
function dataRating(pid) {
  const p = P(pid); const ps = paramStats(pid); const areas = visAreas(p); const w = Cfg.get().areaWeights || {}; const out = { area: {}, n: 0, ev: 0 };
  for (const a of areas) { const vals = []; for (const x of visParams(p, a)) { const st = ps[a.id + "|" + x.id]; const s = suggestFrom(st); if (s != null) { vals.push(s); out.n++; } } if (vals.length) out.area[a.id] = mean(vals); }
  let sw = 0, sv = 0; for (const a of areas) if (out.area[a.id] != null) { const ww = +(w[a.id] ?? 1) || 0; sw += ww; sv += ww * out.area[a.id]; } out.rating = sw ? sv / sw : null; return out;
}
function dataPanel(id, p) {
  const dr = dataRating(id); const pr = profile(id); const d = playerData(id); if (!d.ev.length) return "";
  const s = Cfg.get().scale; const diff = pr.rating != null && dr.rating != null ? dr.rating - pr.rating : null;
  return `<section class="panel"><div class="row between"><h2>${t("Voto dai dati registrati")}</h2><span class="pill c-blue">${t("{n} azioni", { n: d.ev.length })}</span></div>
   <p class="sub small">${t("Calcolato in automatico dalle azioni che hai registrato (esito, dettagli, zona, pressione, difficoltà della gara). Cambia subito se aggiungi, modifichi o elimini un'azione. Il tuo voto resta separato e decide tu.")}</p>
   <div class="row" style="margin-top:10px;gap:10px;flex-wrap:wrap"><div class="rbox r-rating"><span>${t("Dai dati")}</span><b>${f1(dr.rating)}</b></div><div class="rbox" style="background:var(--sunk)"><span>${t("Il tuo voto")}</span><b>${f1(pr.rating)}</b></div>${diff != null && Math.abs(diff) >= (s.max - s.min) * 0.08 ? `<div class="banner ${diff > 0 ? "info" : ""}" style="flex:1;min-width:220px;margin:0">${diff > 0 ? t("I dati dicono qualcosa in più del tuo voto: rivedi i parametri con più azioni positive.") : t("I dati sono sotto il tuo voto: controlla se servono altre partite o se il giudizio è troppo alto.")}</div>` : ""}</div>
   <div class="pgrid" style="margin-top:10px"><div class="params">${visAreas(p).map(a => dr.area[a.id] != null ? `<div class="pb"><div class="lab"><span>${esc(L(a))}</span><span class="mono">${f1(dr.area[a.id])}${pr.area[a.id] != null ? ` <span class="m">· ${t("tuo")} ${f1(pr.area[a.id])}</span>` : ""}</span></div><div class="bar"><i style="width:${pct(dr.area[a.id]) * 100}%"></i></div></div>` : "").join("") || `<p class="m">${t("Servono almeno 2 azioni collegate a un parametro.")}</p>`}</div></div></section>`;
}
function howPanel(id) {
  const evs = playerData(id).ev.filter(e => e.d && Object.keys(e.d).length); if (!evs.length) return `<section class="panel"><h2>${t("Come lo fa")}</h2><p class="m" style="margin-top:6px">${t("Segna i dettagli delle azioni (tipo di passaggio, smarcamento, orientamento del corpo…) nella scheda «Dettagli»: qui vedrai come gioca, non solo quanto.")}</p></section>`;
  const map = {}; for (const e of evs) for (const [f, o] of Facet.opts(e)) { const k = e.c + "|" + f.id; const r = map[k] = map[k] || { c: e.c, f, opts: {} }; const x = r.opts[o.id] = r.opts[o.id] || { o, n: 0, p: 0 }; x.n++; if (evOutcome(e) === "+") x.p++; }
  const rows = Object.values(map).sort((a, b) => Object.values(b.opts).reduce((s, x) => s + x.n, 0) - Object.values(a.opts).reduce((s, x) => s + x.n, 0)).slice(0, 12);
  return `<section class="panel"><h2>${t("Come lo fa")}</h2><p class="sub small">${t("Dai dettagli che hai segnato: quante volte e con che riuscita.")}</p><div class="howgrid" style="margin-top:8px">${rows.map(r => { const tot = Object.values(r.opts).reduce((s, x) => s + x.n, 0);
    return `<div class="how"><b>${esc(liveCatL(r.c))}</b> <span class="m">· ${esc(L(r.f))}</span>${Object.values(r.opts).sort((a, b) => b.n - a.n).map(x => `<div class="howr"><span>${esc(L(x.o))}</span><div class="bar"><i style="width:${x.n / tot * 100}%"></i></div><span class="mono small">${x.n} · ${Math.round(x.p / x.n * 100)}%✓</span></div>`).join("")}</div>`; }).join("")}</div></section>`;
}

/* ---------- esempi: dettagli plausibili sulle azioni di esempio ---------- */
Examples.load = (orig => function (silent) {
  const r = orig.call(this, silent);
  try { Undo.busy = true; for (const [mid, m] of [...S.matches]) { if (!m.example || !(m.events || []).length) continue; let ch = false;
    const evs = m.events.map(e => { if (e.d) return e; const fs = Facet.forCat(e.c); if (!fs.length) return e; const rnd = Examples.rng(e.id + e.c); const d = {}; const o = evOutcome(e);
      for (const f of fs.slice(0, 3)) { if (rnd() < 0.25) continue; let opts = (f.opts || []).filter(x => !x.hidden); const pref = opts.filter(x => o === "+" ? x.w >= 0 : o === "-" ? x.w <= 0 : true); if (pref.length && rnd() < 0.8) opts = pref; const pick = opts[Math.floor(rnd() * opts.length)]; if (pick) d[f.id] = f.multi ? [pick.id] : pick.id; }
      if (Object.keys(d).length) { ch = true; return { ...e, d }; } return e; });
    if (ch) { S.matches.set(mid, { ...m, events: evs }); Store.write("matches", mid); } } } catch (err) { console.warn(err); } finally { Undo.busy = false; }
  return r;
})(Examples.load);

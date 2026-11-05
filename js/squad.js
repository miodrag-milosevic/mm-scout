"use strict";
/* =========================================================
   MM Scout — dati di esempio: prima squadra di FANTASIA
   (FC Valdoria). Giocatori, società, carriere, date di
   nascita e valutazioni sono tutti INVENTATI: nessun
   riferimento a persone o club reali.
   ========================================================= */
const EX_SOURCE = { label: "dati inventati", date: "2026-11-04", coach: "Allenatore di esempio", season: "2026/27" };
// chiave, nome, cognome, ruolo, nascita, città, paese di nascita, nazionalità, piede, maglia, altezza, livello, giudizio, base voto, valore (mln €), contratto fino al, in prestito, carriera in breve
const EX_SQUAD = [
  ["mai", "Julien", "Morvan", "Portiere", "1996-09-17", "", "Guyana francese", "Francia", "Destro", 1, 190, "A", "prendere", 8.0, "", "", false, "Leader tecnico della squadra: tanti palloni passano dai suoi piedi."],
  ["ptr", "Paolo", "Cerrato", "Portiere", "1991-09-15", "", "Italia", "Italia", "Destro", 12, 191, "C", "seguire", 6.4, "", "", false, "Leader tecnico della squadra: tanti palloni passano dai suoi piedi."],
  ["tor", "Tommaso", "Lanfredi", "Portiere", "2005-08-25", "", "Italia", "Italia", "Destro", 22, 195, "C", "attenzione", 6.3, "", "", false, "Cresciuto nel settore giovanile del club, è uno dei punti di riferimento dello spogliatoio."],
  ["est", "Edison", "Cortez", "Quinto sinistro", "1998-08-20", "", "Ecuador", "Ecuador", "Sinistro", 83, 174, "B", "seguire", 6.8, "", "", false, "Titolare da più stagioni: affidabile, gioca quasi sempre e si adatta a moduli diversi."],
  ["dew", "Wout", "Verhaegen", "Difensore centrale", "2001-10-25", "", "Belgio", "Belgio", "Destro", 50, 191, "B", "seguire", 6.6, "", "", false, "Cresciuto nel settore giovanile del club, è uno dei punti di riferimento dello spogliatoio."],
  ["dia", "Adama", "Fofanah", "Difensore centrale", "2007-03-13", "", "Francia", "Francia", "Destro", 81, 186, "C", "attenzione", 6.2, "", "2031-06-30", false, "Rientrato da un prestito positivo, ora cerca spazio da titolare."],
  ["tom", "Jordan", "Ashworth", "Difensore centrale", "1998-03-22", "", "Canada", "Inghilterra", "Destro", 55, 185, "B", "seguire", 6.9, "10", "", false, "Molto duttile: ha giocato in più ruoli nelle ultime due stagioni."],
  ["pav", "Nemanja", "Ristović", "Difensore centrale", "2001-05-03", "", "Serbia", "Serbia", "Sinistro", 53, 195, "B", "prendere", 7.2, "", "", false, "Rientrato da un prestito positivo, ora cerca spazio da titolare."],
  ["bar", "Simone", "Brambati", "Terzino sinistro", "2004-07-21", "", "Italia", "Italia", "Sinistro", 57, 191, "B", "attenzione", 6.8, "", "", false, "Giovane in crescita: alterna partite con la prima squadra e con la squadra riserve."],
  ["gil", "Álvaro", "Pradas", "Difensore centrale", "1999-01-28", "", "Spagna", "Spagna", "Destro", 21, 184, "B", "attenzione", 7.0, "", "2031-06-30", false, "Rientrato da un prestito positivo, ora cerca spazio da titolare."],
  ["vla", "Martin", "Dobrev", "Difensore centrale", "2008-02-01", "", "Bulgaria", "Bulgaria", "Destro", 58, 191, "D", "seguire", 6.0, "", "", false, "Cresciuto nel settore giovanile del club, è uno dei punti di riferimento dello spogliatoio."],
  ["ftr", "Alessio", "Fumagalli", "Terzino destro", "2002-01-01", "", "Italia", "Italia", "Destro", 33, 178, "C", "seguire", 6.3, "", "", false, "Arrivato in estate da un altro campionato: si sta ancora adattando ai ritmi della lega."],
  ["gab", "Andrea", "Colnaghi", "Difensore centrale", "1999-05-09", "", "Italia", "Italia", "Destro", 63, 185, "B", "seguire", 6.7, "", "", false, "Cresciuto nel settore giovanile del club, è uno dei punti di riferimento dello spogliatoio."],
  ["lof", "Marcus", "Whitfield", "Mezzala", "1995-04-18", "", "Inghilterra", "Inghilterra", "Destro", 11, 191, "C", "rivedere", 6.5, "", "", false, "Titolare da più stagioni: affidabile, gioca quasi sempre e si adatta a moduli diversi."],
  ["pul", "Tyler", "Brennan", "Trequartista", "1999-06-04", "", "Stati Uniti", "Stati Uniti", "Destro", 10, 180, "A", "prendere", 7.7, "", "", false, "Rientrato da un prestito positivo, ora cerca spazio da titolare."],
  ["rab", "Théo", "Lemaire", "Mezzala", "1996-09-15", "", "Francia", "Francia", "Sinistro", 13, 193, "A", "attenzione", 7.4, "", "", false, "Leader tecnico della squadra: tanti palloni passano dai suoi piedi."],
  ["mod", "Dario", "Banović", "Regista", "1989-09-18", "", "Croazia", "Croazia", "Destro", 20, 171, "A", "attenzione", 7.8, "", "", false, "Leader tecnico della squadra: tanti palloni passano dai suoi piedi."],
  ["hut", "Kian", "Fletcher", "Ala destra", "2003-11-23", "", "Inghilterra", "Inghilterra", "Sinistro", 36, 172, "B", "seguire", 6.9, "", "", true, "Arrivato in estate da un altro campionato: si sta ancora adattando ai ritmi della lega."],
  ["mor", "Rayan", "Dewaele", "Quinto sinistro", "2003-01-21", "", "Belgio", "Belgio", "Sinistro", 27, 181, "B", "prendere", 7.0, "45", "2031-06-30", false, "Giovane in crescita: alterna partite con la prima squadra e con la squadra riserve."],
  ["com", "Mattia", "Verzeletti", "Mezzala", "2007-07-03", "", "Italia", "Italia", "Destro", 72, 184, "D", "seguire", 6.0, "", "", false, "Giovane in crescita: alterna partite con la prima squadra e con la squadra riserve."],
  ["jas", "Arlind", "Morina", "Mediano", "2002-02-10", "", "Svizzera", "Svizzera", "Sinistro", 3, 181, "B", "prendere", 7.1, "", "", false, "Molto duttile: ha giocato in più ruoli nelle ultime due stagioni."],
  ["sae", "Jens", "Vanderlinden", "Quinto destro", "1999-08-19", "", "Belgio", "Belgio", "Destro", 75, 178, "B", "seguire", 6.9, "", "", false, "Rientrato da un prestito positivo, ora cerca spazio da titolare."],
  ["cis", "Kevin", "Obasi", "Trequartista", "2005-07-24", "", "Italia", "Italia", "Destro", 29, 178, "C", "attenzione", 6.6, "20", "", false, "Giovane in crescita: alterna partite con la prima squadra e con la squadra riserve."],
  ["mus", "Malik", "Dawson", "Mezzala", "2002-05-26", "", "Stati Uniti", "Stati Uniti", "Destro", 68, 178, "C", "rivedere", 6.4, "", "", false, "Titolare da più stagioni: affidabile, gioca quasi sempre e si adatta a moduli diversi."],
  ["ram", "Tiago", "Faria", "Punta centrale", "2001-05-14", "", "Portogallo", "Portogallo", "Destro", 42, 184, "B", "seguire", 7.0, "", "2031-06-30", false, "Rientrato da un prestito positivo, ora cerca spazio da titolare."],
  ["chu", "Chidi", "Okonkwo", "Ala destra", "1999-08-06", "", "Nigeria", "Nigeria", "Sinistro", 6, 174, "C", "rivedere", 6.5, "", "", false, "Arrivato in estate da un altro campionato: si sta ancora adattando ai ritmi della lega."],
  ["cam", "Gabriele", "Rinaldi", "Punta centrale", "2008-02-14", "", "Italia", "Italia", "Destro", 90, 187, "C", "attenzione", 6.5, "", "", false, "Cresciuto nel settore giovanile del club, è uno dei punti di riferimento dello spogliatoio."],
];
// ruolo secondario (dalle posizioni indicate dal club)
const EX_ROLE2 = { dew: "Terzino destro", tom: "Terzino destro", bar: "Difensore centrale", gab: "Mediano", lof: "Trequartista", pul: "Ala destra", rab: "Mediano", mod: "Mediano", hut: "Trequartista", mor: "Ala sinistra", jas: "Regista", sae: "Ala destra", cis: "Seconda punta", mus: "Terzino destro", chu: "Quinto destro", est: "Terzino sinistro" };

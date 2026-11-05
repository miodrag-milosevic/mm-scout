/* MM Scout 5.11 — dati di esempio: solo di fantasia.
   Giocatori, società, staff, campionati e stadi degli esempi sono tutti inventati.
   I profili creati con versioni precedenti ricaricano da soli i nuovi esempi (i tuoi dati non cambiano).
   © Miodrag Milosevic. Vietato divulgare, copiare o modificare senza consenso dell'autore. */
"use strict";

const EX_GEN = 3; // generazione degli esempi: 2 = tutti inventati, 3 = con i committenti di esempio
window.exFict = () => true;
const exOld = () => { const g = (S.settings.get("exGen") || {}).v || 0; return g < EX_GEN && [...S.players.values(), ...S.matches.values()].some(o => o && o.example); };
function exRefresh() {
  // via le copie degli esempi vecchi dal cestino e dallo storico, poi esempi nuovi
  const prev = Undo.busy; Undo.busy = true;
  try {
    for (const [id, r] of [...S.trash]) if (r && (r.ex || (r.obj && r.obj.example))) { Trash.skip++; try { del("trash", id); } finally { Trash.skip--; } }
    const act = S.settings.get("activity"); if (act && act.items) { const items = act.items.filter(it => !it.ex); if (items.length !== act.items.length) put("settings", "activity", { ...act, items }); }
    Examples.load(true);
  } finally { Undo.busy = prev; }
  put("settings", "exGen", { v: EX_GEN }); try { Undo.clear(); } catch (e) { }
}
Examples.load = (orig => function () { const r = orig.apply(this, arguments); try { put("settings", "exGen", { v: EX_GEN }); } catch (e) { } return r; })(Examples.load);
Lock.enter = (orig => async function () { const r = await orig.apply(this, arguments);
  try { if (exOld()) { exRefresh(); render(); toast(t("Esempi aggiornati: ora ci sono anche due committenti di esempio, collegati a giocatori, partite e report.")); } } catch (e) { } return r; })(Lock.enter);

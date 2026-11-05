/* MM Scout 0.6.1 (beta) — campi su misura in tutta l'app.
   Ogni campo prende la larghezza giusta per quello che contiene: nomi, squadre, email, link e
   menu con voci lunghe occupano 2 colonne; date, numeri, ore, sigle e menu brevi 1 colonna;
   i testi lunghi (note) tutta la riga. Le colonne sono uguali in tutto il modulo e mai meno di 2;
   lo spazio che avanza a fine riga va ai campi della stessa riga, così le righe finiscono allineate.
   © Miodrag Milosevic. Vietato divulgare, copiare o modificare senza consenso dell'autore. */
"use strict";

// campi di testo che contengono valori brevi (sigle, risultato, iniziali…)
const SZ_SHORT = new Set(["eBy", "eScore", "mi_score", "po_score", "prInit", "pInit", "sfInit"]);
const szShortTxt = el => SZ_SHORT.has(el.id) || /score|init|shirt|maglia/i.test(el.id) || (el.maxLength > 0 && el.maxLength <= 12) || el.dataset.sz === "s";
let SZ_TW = 170; // larghezza di una colonna del modulo in cui sto lavorando (px)
function szOf(f) {
  if (f.classList.contains("full")) return "";
  const c = f.querySelector(":scope > input, :scope > select, :scope > textarea, :scope > .vhost > input, :scope > div > select"); if (!c) return "";
  if (c.tagName === "TEXTAREA") return "sz-full";
  if (c.tagName === "SELECT") { let mx = 0; for (const o of c.options) mx = Math.max(mx, (o.textContent || "").trim().length); return mx * 8.4 > SZ_TW - 42 ? "sz-l" : ""; }
  const ty = (c.getAttribute("type") || "text").toLowerCase();
  if (["text", "email", "url", "tel", "search", "password"].includes(ty)) return szShortTxt(c) || c.getAttribute("inputmode") === "numeric" ? "" : "sz-l";
  return "";
}
// nei menu con voci lunghe, passando sopra si legge la voce intera
const szTitle = s => { const o = s.selectedOptions && s.selectedOptions[0]; const tx = o ? o.textContent.trim() : ""; if (tx.length > 16) s.title = tx; else s.removeAttribute("title"); };
document.addEventListener("change", e => { if (e.target && e.target.tagName === "SELECT") szTitle(e.target); });
// quante colonne vuole un campo: i menu con voci molto lunghe (es. «Partita nell'archivio») fino a 4, mai più di quelle che ci sono
const szWant = f => { const s = f.querySelector(":scope > select, :scope > div > select"); if (!s) return 2; let mx = 0; for (const o of s.options) mx = Math.max(mx, (o.textContent || "").trim().length); return Math.max(2, Math.min(4, Math.ceil(mx / 17))); };
function szApply(root) {
  if (!root) return;
  for (const s of root.querySelectorAll("select")) szTitle(s);
  for (const g of root.querySelectorAll(".fgrid")) {
    const cols = (getComputedStyle(g).gridTemplateColumns || "").split(" ").filter(Boolean); const n = cols.length || 2; SZ_TW = parseFloat(cols[0]) || 170;
    const items = [];
    for (const f of g.children) {
      if (f.classList.contains("f")) { const k = szOf(f); f.classList.toggle("sz-l", k === "sz-l"); f.classList.toggle("sz-full", k === "sz-full"); }
      if (getComputedStyle(f).display === "none") continue;
      const full = f.classList.contains("full") || f.classList.contains("sz-full"); const L = f.classList.contains("sz-l");
      items.push({ f, full, L, span: full ? n : L ? Math.min(szWant(f), n) : 1 });
    }
    // righe senza buchi: lo spazio che avanza a fine riga va ai campi di quella riga (prima ai testi lunghi)
    const fill = (row, left) => { if (left <= 0 || !row.length) return; const order = [...row.filter(x => x.L).reverse(), ...row.filter(x => !x.L).reverse()]; let guard = 0;
      while (left > 0 && guard++ < 20) for (const x of order) { if (!left) break; if (x.span - (x.L ? 2 : 1) < 2) { x.span++; left--; } } };
    let row = [], pos = 0;
    for (const x of items) {
      if (x.full) { fill(row, n - pos); row = []; pos = 0; continue; }
      if (pos + x.span > n) { fill(row, n - pos); row = []; pos = 0; }
      row.push(x); pos += x.span;
    }
    for (const x of items) if (!x.full) x.f.style.gridColumn = x.span > 1 ? `span ${x.span}` : "";
  }
}
let szQ = 0;
const szRun = () => { if (szQ) return; szQ = requestAnimationFrame(() => { szQ = 0; try { szApply($("#view")); szApply($("#sheetRoot")); } catch (e) { } }); };
try { const mo = new MutationObserver(szRun); for (const sel of ["#view", "#sheetRoot"]) { const n = $(sel); if (n) mo.observe(n, { childList: true, subtree: true }); } } catch (e) { }
let szRz = 0; addEventListener("resize", () => { clearTimeout(szRz); szRz = setTimeout(szRun, 150); });

/* MM Scout 5.10.2 — posizione esatta (ruoli reali: mezzala destra/sinistra, centrale destro/sinistro, braccetto…),
   campo dei ruoli più leggibile, menu ridotto, indicazioni «beta» chiare.
   © Miodrag Milosevic. Vietato divulgare, copiare o modificare senza consenso dell'autore. */
"use strict";

/* ---------- 1. posizioni esatte: solo posizioni reali del calcio, legate al ruolo ---------- */
// [id, nome, x (0 porta nostra → 100 porta avversaria), y (0 fascia sinistra → 100 fascia destra)]
const POSV = {
  "Difensore centrale": [["dc-dx", "Centrale destro (difesa a 4)", 19, 62], ["dc-sx", "Centrale sinistro (difesa a 4)", 19, 38], ["dc-c3", "Centrale della difesa a 3", 17, 50], ["dc-bdx", "Braccetto destro (difesa a 3)", 21, 72], ["dc-bsx", "Braccetto sinistro (difesa a 3)", 21, 28]],
  "Quinto destro": [["qd-34", "Quinto destro (centrocampo a 4 o a 5)", 43, 93], ["qd-5", "Esterno destro di una difesa a 5", 30, 92]],
  "Quinto sinistro": [["qs-34", "Quinto sinistro (centrocampo a 4 o a 5)", 43, 7], ["qs-5", "Esterno sinistro di una difesa a 5", 30, 8]],
  "Mediano": [["med-v", "Vertice basso davanti alla difesa", 33, 50], ["med-dx", "Mediano destro (doppio mediano)", 35, 62], ["med-sx", "Mediano sinistro (doppio mediano)", 35, 38]],
  "Regista": [["reg-v", "Vertice basso davanti alla difesa", 33, 50], ["reg-2", "Regista in un centrocampo a due", 37, 42]],
  "Centrocampista centrale": [["cc-dx", "Centrale destro (centrocampo a 4)", 45, 62], ["cc-sx", "Centrale sinistro (centrocampo a 4)", 45, 38], ["cc-c", "Centrale di un centrocampo a 3", 47, 50]],
  "Mezzala": [["mez-dx", "Mezzala destra", 55, 78], ["mez-sx", "Mezzala sinistra", 55, 22]],
  "Trequartista": [["trq-c", "Trequartista centrale", 66, 50], ["trq-dx", "Trequartista destro (dietro la punta)", 68, 66], ["trq-sx", "Trequartista sinistro (dietro la punta)", 68, 34]],
  "Ala destra": [["ad-3", "Ala destra del tridente", 76, 88], ["ad-23", "Esterno destro della trequarti (4-2-3-1)", 68, 86], ["ad-4", "Esterno destro di centrocampo (4-4-2)", 58, 88]],
  "Ala sinistra": [["as-3", "Ala sinistra del tridente", 76, 12], ["as-23", "Esterno sinistro della trequarti (4-2-3-1)", 68, 14], ["as-4", "Esterno sinistro di centrocampo (4-4-2)", 58, 12]],
  "Seconda punta": [["sp-dx", "Seconda punta destra (coppia d'attacco)", 82, 62], ["sp-sx", "Seconda punta sinistra (coppia d'attacco)", 82, 38], ["sp-c", "Seconda punta dietro la prima", 78, 50]],
  "Punta centrale": [["pc-u", "Punta unica", 91, 50], ["pc-dx", "Punta destra (coppia d'attacco)", 89, 60], ["pc-sx", "Punta sinistra (coppia d'attacco)", 89, 40]]
};
const posVar = (role, id) => (POSV[role] || []).find(v => v[0] === id) || null;
window.posLabel = p => { const r = mainRole(p); const v = p && p.spot && posVar(r, p.spot); return v ? t(v[1]) : (r ? roleL(r) : ""); };

/* ---------- 2. campo dei ruoli: mezzala destra e sinistra, etichette leggibili, legenda separata ---------- */
const MEZ_SHORT = { sx: "Mezzala sx", dx: "Mezzala dx" };
window.rolePitch = (orig => function (d) {
  d = d || {}; let h = orig.apply(this, arguments); const isDraft = d === ui.pdraft;
  if (isDraft && d.spot && !posVar(mainRole(d), d.spot)) delete d.spot;
  // campo un po' più alto: la legenda sotto non tocca più le etichette
  h = h.replace('viewBox="-3 -3 111 74"', 'viewBox="-3 -3 111 78"').replace('<rect x="-3" y="-3" width="111" height="74"', '<rect x="-3" y="-3" width="111" height="78"').replace(/<text x="104" y="70\.6"/, '<text x="104" y="73.6"').replace(/<text x="1" y="70\.6"/, '<text x="1" y="73.6"');
  // la mezzala esiste a destra e a sinistra: due cerchi
  const sel = d.roles || []; const on = sel.includes("Mezzala"); const isMain = sel[0] === "Mezzala"; const side = d.spot === "mez-dx" ? "dx" : "sx";
  const g = (sd, x, y) => { const X = x * 1.05, Y = y * 0.68; const act = on && (isDraft ? side === sd : true); const cls = act ? (isMain ? " main" : " sec") : "";
    const lab = Prefs.lang === "it" ? MEZ_SHORT[sd] : t(MEZ_SHORT[sd]); const nm = t(sd === "dx" ? "Mezzala destra" : "Mezzala sinistra");
    return `<g class="rspot${cls}" data-rspot="Mezzala" data-rvar="mez-${sd}" role="button" tabindex="0" aria-pressed="${act}" aria-label="${esc(nm)}"><title>${esc(nm)}</title><circle cx="${X}" cy="${Y}" r="4.3"/><text x="${X}" y="${Y + 1.1}" text-anchor="middle" font-size="2.6" font-weight="800">${esc(roleCode("Mezzala"))}</text><text x="${X}" y="${Y + 7.4}" text-anchor="middle" font-size="2.15" class="rsn">${act && isMain ? "★ " : ""}${esc(lab)}</text></g>`; };
  const re = /<g class="rspot[^"]*" data-rspot="Mezzala"[\s\S]*?<\/g>/;
  if (re.test(h) && !h.includes('data-rvar="mez-dx"')) h = h.replace(re, g("sx", 55, 22) + g("dx", 55, 78));
  // scelta della posizione esatta (solo nella scheda del giocatore)
  const main = sel[0]; const vs = POSV[main] || [];
  if (isDraft && vs.length) {
    const row = `<div class="rvar"><span class="m">${t("Posizione esatta")}:</span>${vs.map(v => `<button type="button" class="chip" data-rvar="${v[0]}" aria-pressed="${d.spot === v[0]}">${esc(t(v[1]))}</button>`).join("")}</div>`;
    h = h.replace(/(<div class="rsel">[\s\S]*?<\/div>)/, "$1" + row);
  }
  return h;
})(window.rolePitch);
rolePitch = window.rolePitch;

document.addEventListener("click", e => {
  const el = e.target.closest && e.target.closest("[data-rvar]"); if (!el) return;
  const inPitch = el.closest("#rolePitch"), inRow = el.closest(".rvar"); if (!inPitch && !inRow) return; // il campo della valutazione resta com'è
  const d = ui.pdraft; if (!d) return; e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
  try { syncPlayer(); } catch (x) { }
  const vid = el.dataset.rvar; d.roles = d.roles || [];
  const role = Object.keys(POSV).find(r => POSV[r].some(v => v[0] === vid)); if (!role) return; const v = posVar(role, vid);
  if (inPitch) { // cerchio della mezzala (destra o sinistra)
    if (d.roles.includes(role) && (d.spot === vid || (d.roles[0] !== role))) { d.roles = d.roles.filter(x => x !== role); if ((d.spot || "").startsWith("mez-")) delete d.spot; }
    else { if (!d.roles.includes(role)) d.roles.push(role); if (d.roles[0] === role) { d.spot = vid; d.pos = { x: v[2], y: v[3] }; } }
  } else { // chip «posizione esatta» del ruolo principale
    if (d.spot === vid) delete d.spot; else { d.spot = vid; d.pos = { x: v[2], y: v[3] }; }
  }
  render(true);
}, true);
// cambiando il ruolo principale, la posizione esatta di un altro ruolo non resta appesa
document.addEventListener("click", e => { const b = e.target.closest && e.target.closest("[data-rmain],[data-rdel],[data-rspot]:not([data-rvar])"); if (!b || !ui.pdraft) return; setTimeout(() => { const d = ui.pdraft; if (d && d.spot && !posVar(mainRole(d), d.spot)) { delete d.spot; render(true); } }, 0); });

// la posizione esatta si vede negli elenchi e nella scheda
window.playerItem = (orig => function (id, p) { let h = orig.apply(this, arguments); try { const r = mainRole(p); if (p && p.spot && posVar(r, p.spot)) h = h.replace(`<div class="m">${esc(roleL(r))}`, `<div class="m">${esc(posLabel(p))}`); } catch (e) { } return h; })(window.playerItem);
playerItem = window.playerItem;
if (typeof playerCard === "function") { window.playerCard = (orig => function (id, p) { let h = orig.apply(this, arguments); try { const r = mainRole(p); if (p && p.spot && posVar(r, p.spot)) h = h.replace(`<span class="m">${esc(roleL(r))}</span>`, `<span class="m">${esc(posLabel(p))}</span>`); } catch (e) { } return h; })(window.playerCard); playerCard = window.playerCard; }
window.render = (orig => function () { const r = orig.apply(this, arguments); try { if (ui.view === "giocatori" && ui.playerId && !ui.pdraft) { const p = P(ui.playerId); const box = $("#view .cpitch"); if (p && p.spot && box && !box.querySelector(".cpos")) { const v = posVar(mainRole(p), p.spot); if (v) { const row = box.querySelector(".row"); (row || box).insertAdjacentHTML("afterend", `<div class="m cpos" style="margin-top:4px">${t("Posizione esatta")}: <b>${esc(t(v[1]))}</b></div>`); } } } } catch (e) { } return r; })(window.render);
render = window.render;
if (typeof FIELD_L !== "undefined") FIELD_L.spot = "posizione esatta";

/* ---------- 3. menu laterale: un solo pulsante per bloccare ---------- */
ICONS.switchp = '<path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-3.3 0-7 1.7-7 4v2h10.3a6 6 0 0 1-.3-2c0-1.4.5-2.7 1.3-3.7-1.4-.2-2.8-.3-4.3-.3zm9-.5V11l-3 2.5 3 2.5v-1.5h2.5V18H22v-5h-4zM15 19.5V21l3-2.5-3-2.5v1.5"/>';
window.renderShell = (orig => function () { orig.apply(this, arguments);
  // un solo pulsante: «Blocca ora» (come il lucchetto in alto). Dalla schermata di accesso si cambia profilo.
  try { $$('#side .side-foot [data-a="switchProfile"]').forEach(b => b.remove()); const tip = t("Blocca ora") + " · " + t("dalla schermata di accesso puoi anche cambiare profilo"); $$('[data-a="lockNow"]').forEach(b => { b.title = tip; if (b.dataset.tip) b.dataset.tip = t("Blocca ora"); }); } catch (e) { }
  try { const br = $("#side .brand"); if (br && !br.querySelector(".brbeta")) br.insertAdjacentHTML("beforeend", `<span class="brbeta" title="${t("Versione beta: possono esserci errori, anche gravi")}">BETA · v${APP_VERSION}</span>`); } catch (e) { }
  try { const f = $("#appFoot .fmade"); if (f && !f.dataset.v) { f.dataset.v = 1; const first = f.firstChild; if (first && first.nodeType === 3) first.textContent = `${appName()} · ${t("versione {v} (beta)", { v: APP_VERSION })} · Made with `; } } catch (e) { }
})(window.renderShell);
renderShell = window.renderShell;

/* ---------- 4. schermata di accesso e creazione account: beta ben visibile ---------- */
const lockBeta2 = () => { try { const box = $("#lockRoot .lockbox"); if (!box) return; const br = box.querySelector(".brand"); if (br && !br.querySelector(".brbeta")) br.insertAdjacentHTML("beforeend", `<span class="brbeta">BETA · v${APP_VERSION}</span>`); const lb = box.querySelector(".lbeta"); if (lb && !lb.dataset.v2) { lb.dataset.v2 = 1; lb.insertAdjacentHTML("beforeend", `<b class="lbwarn">${t("Possono esserci errori, anche gravi: fai spesso un backup e non usarla come unico archivio.")}</b>`); } } catch (e) { } };
new MutationObserver(() => lockBeta2()).observe(document.documentElement, { childList: true, subtree: true });

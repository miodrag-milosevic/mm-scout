"use strict";
/* =========================================================
   MM Scout — profili ideali per ruolo: descrivi il giocatore
   che cerchi (ruolo, età, piede, requisiti minimi per area,
   dati economici) e l'app calcola la compatibilità dei
   giocatori osservati.
   ========================================================= */
const IMP = [[3, "Essenziale", "Essential"], [2, "Importante", "Important"], [1, "Utile", "Nice to have"]];
function idealCompat(pid, ideal) {
  const p = P(pid), pr = profile(pid), s = Cfg.get().scale; const range = s.max - s.min;
  let num = 0, den = 0, rated = 0; const fails = [], misses = [];
  for (const r of ideal.req || []) {
    const [a, k] = r.key.split("|"); const v = (pr.attr[a] || {})[k]; const w = +r.imp || 1; den += w;
    if (v == null) { misses.push(r); continue; } rated++;
    const gap = Math.max(0, (+r.min) - v); const sc = Math.max(0, 1 - gap / (range * 0.3)); num += sc * w; if (gap > 0 && +r.imp === 3) fails.push(r);
  }
  let pct = den ? num / Math.max(1e-9, den - misses.reduce((x, r) => x + (+r.imp || 1), 0)) : 0; if (!rated) pct = 0;
  const flags = []; const age0 = age(p);
  if (ideal.ageMin && age0 != null && age0 < +ideal.ageMin) flags.push(t("troppo giovane")); if (ideal.ageMax && age0 != null && age0 > +ideal.ageMax) flags.push(t("età oltre il limite"));
  if (ideal.role && !(p.roles || []).includes(ideal.role) && !(ideal.role2 && (p.roles || []).includes(ideal.role2))) flags.push(t("ruolo diverso"));
  if (ideal.foot && p.foot && p.foot !== ideal.foot && p.foot !== "Ambidestro") flags.push(t("piede diverso"));
  if (ideal.heightMin && p.height && +p.height < +ideal.heightMin) flags.push(t("statura sotto il minimo"));
  if (ideal.eu && p.eu && ideal.eu !== p.eu && !(ideal.eu === "eu" && p.eu === "assim")) flags.push(t("status non compatibile"));
  pct = pct * Math.pow(0.88, flags.length) * (fails.length ? 0.85 : 1);
  return { pct: Math.round(pct * 100), coverage: (ideal.req || []).length ? rated / ideal.req.length : 0, fails, misses, flags };
}
function idealRanking(ideal) { return [...S.players.entries()].filter(([id, p]) => !p.archived && profile(id).n).map(([id, p]) => [id, p, idealCompat(id, ideal)]).sort((a, b) => b[2].pct - a[2].pct); }
const pctClass = n => n >= 80 ? "s-hi" : n >= 60 ? "s-md" : "s-lo";
function idealMatchPanel(pid) {
  const ids = [...S.ideals.entries()].filter(([, x]) => !x.archived); if (!ids.length || !profile(pid).n) return "";
  const rows = ids.map(([iid, x]) => [iid, x, idealCompat(pid, x)]).sort((a, b) => b[2].pct - a[2].pct).slice(0, 4);
  return `<section class="panel"><h2>${t("Compatibilità con i profili ideali")}</h2><div class="list" style="margin-top:6px">${rows.map(([iid, x, c]) => `<div class="item click" data-a="openIdeal" data-id="${iid}"><div class="score pct ${pctClass(c.pct)}">${c.pct}%</div><div class="grow"><div class="t">${esc(x.name)}</div><div class="m">${esc(roleL(x.role) || "")}${c.flags.length ? " · " + esc(c.flags.join(", ")) : ""}${c.fails.length ? " · " + t("{n} requisiti essenziali sotto il minimo", { n: c.fails.length }) : ""}</div></div></div>`).join("")}</div></section>`;
}
R.profili = () => {
  if (ui.idraft) return idealEditor();
  if (ui.idealId && S.ideals.get(ui.idealId)) return idealPage(ui.idealId);
  const rows = [...S.ideals.entries()].filter(([, x]) => !x.archived);
  return `<div class="head"><div><h1>${t("Profili ideali")}</h1><p class="sub">${t("Prima del nome viene il profilo: descrivi il giocatore che cerchi e confronta tutti quelli che hai osservato con gli stessi criteri.")}</p></div><button class="btn pri" data-a="newIdeal">+ ${t("Nuovo profilo ideale")}</button></div>
   ${rows.length ? `<div class="grid2">${rows.map(([id, x]) => { const top = idealRanking(x).slice(0, 3); return `<section class="panel click" data-a="openIdeal" data-id="${id}" style="cursor:pointer"><div class="row between"><h2>${esc(x.name)}</h2><span class="pill c-good">${esc(roleL(x.role) || "—")}</span></div><p class="m">${t("{n} requisiti", { n: (x.req || []).length })}${x.ageMin || x.ageMax ? " · " + t("età {a}-{b}", { a: x.ageMin || "…", b: x.ageMax || "…" }) : ""}${x.system ? " · " + esc(x.system) : ""}</p><div class="list" style="margin-top:6px">${top.map(([pid, p, c]) => `<div class="item"><div class="score ${pctClass(c.pct)}" style="width:52px">${c.pct}%</div><div class="grow t">${esc(pname(p))}</div></div>`).join("") || `<p class="m">${t("Nessun giocatore valutato.")}</p>`}</div></section>`; }).join("")}</div>`
      : `<div class="empty">${t("Nessun profilo ideale. Creane uno: ti propongo i requisiti tipici del ruolo e li adatti tu.")}</div>`}`;
};
function idealPage(id) {
  const x = S.ideals.get(id); const rk = idealRanking(x); const s = Cfg.get().scale;
  return `<div class="row between"><button class="btn ghost sm" data-a="backIdeals">← ${t("Profili ideali")}</button><div class="row"><button class="btn sm" data-a="editIdeal" data-id="${id}">${t("Modifica")}</button></div></div>
  <div class="head"><div><h1>${esc(x.name)}</h1><p class="sub">${esc(roleL(x.role) || "")}${x.role2 ? " / " + esc(roleL(x.role2)) : ""}${x.system ? " · " + esc(x.system) : ""}${x.ageMin || x.ageMax ? " · " + t("età {a}-{b}", { a: x.ageMin || "…", b: x.ageMax || "…" }) : ""}${x.foot ? " · " + esc(t(x.foot)) : ""}${x.heightMin ? " · ≥ " + esc(x.heightMin) + " cm" : ""}${x.maxValue ? " · " + t("budget {v}", { v: esc(x.maxValue) }) : ""}</p>${x.functions ? `<p style="margin-top:6px;white-space:pre-wrap">${esc(x.functions)}</p>` : ""}</div></div>
  <div class="split"><section class="panel"><h2>${t("Requisiti")}</h2>${(x.req || []).map(r => { const [a, k] = r.key.split("|"); const A0 = Cfg.area(a); return `<div class="row between small" style="padding:5px 0;border-top:1px solid var(--line)"><span>${esc(A0 ? paramL(A0, k) : k)} <span class="m">· ${esc(A0 ? L(A0) : "")}</span></span><span class="row"><span class="pill ${+r.imp === 3 ? "c-bad" : +r.imp === 2 ? "c-amber" : "c-grey"}">${esc(L(o3(IMP.map(([v, it, en]) => [String(v), it, en])).find(z => z.id === String(r.imp))))}</span><b class="mono">≥ ${f1(+r.min)}</b></span></div>`; }).join("") || `<p class="m">${t("Nessun requisito.")}</p>`}</section>
  <section class="panel"><h2>${t("Classifica di compatibilità")}</h2><p class="sub small">${t("Calcolata sulle medie delle tue valutazioni. «Copertura» indica quanti requisiti hai già valutato per quel giocatore.")}</p><div class="list" style="margin-top:6px">${rk.map(([pid, p, c]) => `<div class="item click" data-a="openPlayer" data-id="${pid}"><div class="score ${pctClass(c.pct)}" style="width:56px">${c.pct}%</div>${avatar(p)}<div class="grow"><div class="t">${esc(pname(p))}${exB(p)}</div><div class="m">${esc(roleL(mainRole(p)) || "")}${age(p) != null ? " · " + t("{n} anni", { n: age(p) }) : ""} · ${t("copertura {n}%", { n: Math.round(c.coverage * 100) })}${c.flags.length ? " · " + esc(c.flags.join(", ")) : ""}</div>${c.fails.length ? `<div class="m" style="color:var(--bad)">${t("Sotto il minimo")}: ${esc(c.fails.map(r => { const [a, k] = r.key.split("|"); const A0 = Cfg.area(a); return A0 ? paramL(A0, k) : k; }).join(", "))}</div>` : ""}</div></div>`).join("") || `<div class="empty">${t("Nessun giocatore valutato.")}</div>`}</div></section></div>`;
}
function newIdeal() { return { name: "", role: "", role2: "", system: "", functions: "", ageMin: "", ageMax: "", heightMin: "", foot: "", eu: "", maxValue: "", req: [] }; }
function idealEditor() {
  const d = ui.idraft, c = Cfg.get(), s = c.scale; const areas = c.areas.filter(a => !a.hidden);
  return `<div class="row"><button class="btn ghost sm" data-a="cancelIdeal">← ${t("Annulla")}</button></div>
  <div class="head"><h1>${d._id ? t("Modifica profilo ideale") : t("Nuovo profilo ideale")}</h1><div class="row">${d._id ? `<button class="btn danger" data-a="delIdeal">${t("Elimina")}</button>` : ""}<button class="btn" data-a="cancelIdeal">${t("Annulla")}</button><button class="btn pri" data-a="saveIdeal">${t("Salva")}</button></div></div>
  <section class="panel"><h2>${t("Identità del ruolo")}</h2><div class="fgrid" style="margin-top:10px">
   <label class="f full">${t("Nome del profilo")}<input type="text" id="idName" value="${esc(d.name)}" placeholder="${t("es. Mediano per il 4-3-3, estate 2027")}"></label>
   <label class="f">${t("Ruolo principale")}${sel("idRole", c.roles, d.role, "—")}</label><label class="f">${t("Ruolo secondario")}${sel("idRole2", c.roles, d.role2, "—")}</label>
   <label class="f">${t("Sistema di gioco")}${sel("idSys", c.systems.map(x => ({ id: x, it: x, en: x })), d.system, "—")}</label>
   <label class="f full">${t("Cosa deve fare nel nostro modello di gioco?")}<textarea id="idFunc" style="min-height:60px">${esc(d.functions)}</textarea></label></div></section>
  <section class="panel"><h2>${t("Dati di base ed economici")}</h2><div class="fgrid" style="margin-top:10px">
   <label class="f">${t("Età da")}<input type="number" id="idAgeMin" value="${esc(d.ageMin)}"></label><label class="f">${t("Età fino a")}<input type="number" id="idAgeMax" value="${esc(d.ageMax)}"></label>
   <label class="f">${t("Altezza minima (cm)")}<input type="number" id="idH" value="${esc(d.heightMin)}"></label>
   <label class="f">${t("Piede")}${sel("idFoot", [opt("Destro", "Destro", "Right"), opt("Sinistro", "Sinistro", "Left"), opt("Ambidestro", "Ambidestro", "Both")], d.foot, "—")}</label>
   <label class="f">${t("Status")}${sel("idEu", o3(EUSTATUS), d.eu, "—")}</label>
   <label class="f">${t("Budget massimo")}<input type="text" id="idVal" value="${esc(d.maxValue)}" placeholder="2 mln €"></label></div></section>
  <section class="panel"><div class="row between"><h2>${t("Requisiti minimi")}</h2><button class="btn sm" data-a="idealTemplate">${t("Proponi requisiti tipici del ruolo")}</button></div>
   <p class="sub small">${t("Per ogni caratteristica decisiva indica il livello minimo e quanto conta. «Essenziale» sotto il minimo viene segnalato.")}</p>
   <div class="col" style="margin-top:10px;gap:6px">${(d.req || []).map((r, i) => `<div class="opt-row three"><select data-ri="${i}" data-k="key">${areas.map(a => `<optgroup label="${esc(L(a))}">${a.params.filter(x => !x.hidden).map(x => `<option value="${a.id}|${esc(x.id)}" ${r.key === a.id + "|" + x.id ? "selected" : ""}>${esc(L(x))}</option>`).join("")}</optgroup>`).join("")}</select>
     <select data-ri="${i}" data-k="imp">${IMP.map(([v, it, en]) => `<option value="${v}" ${+r.imp === v ? "selected" : ""}>${esc(L({ it, en }))}</option>`).join("")}</select>
     <input type="number" data-ri="${i}" data-k="min" min="${s.min}" max="${s.max}" step="${s.step}" value="${esc(r.min)}" aria-label="${t("Minimo")}"><div class="opt-actions"><button data-a="idealRm" data-i="${i}">✕</button></div></div>`).join("") || `<p class="m">${t("Nessun requisito.")}</p>`}</div>
   <button class="btn sm" style="margin-top:8px" data-a="idealAdd">+ ${t("Requisito")}</button></section>
  <div class="row end editfoot"><button class="btn" data-a="cancelIdeal">${t("Annulla")}</button><button class="btn pri" data-a="saveIdeal">${t("Salva profilo ideale")}</button></div>`;
}
function syncIdeal() {
  const d = ui.idraft; if (!d || !$("#idName")) return; const v = s => $(s).value.trim();
  Object.assign(d, { name: v("#idName"), role: v("#idRole"), role2: v("#idRole2"), system: v("#idSys"), functions: $("#idFunc").value, ageMin: v("#idAgeMin"), ageMax: v("#idAgeMax"), heightMin: v("#idH"), foot: v("#idFoot"), eu: v("#idEu"), maxValue: v("#idVal") });
  $$("[data-ri]").forEach(el => { const r = d.req[+el.dataset.ri]; if (r) r[el.dataset.k] = el.dataset.k === "key" ? el.value : +el.value; });
}
Object.assign(A, {
  newIdeal: () => go("profili", { idraft: newIdeal(), idealId: null }),
  openIdeal: el => { closeSheet(); go("profili", { idealId: el.dataset.id, idraft: null }); },
  backIdeals: () => { ui.idealId = null; render(); },
  editIdeal: el => go("profili", { idraft: { ...clone(S.ideals.get(el.dataset.id)), _id: el.dataset.id } }),
  cancelIdeal: () => { ui.idraft = null; render(); },
  idealAdd: () => { syncIdeal(); const a = Cfg.get().areas.find(x => !x.hidden); ui.idraft.req.push({ key: a.id + "|" + a.params[0].id, imp: 2, min: Math.round((Cfg.get().scale.max * 0.7) * 2) / 2 }); render(true); },
  idealRm: el => { syncIdeal(); ui.idraft.req.splice(+el.dataset.i, 1); render(true); },
  idealTemplate: () => {
    syncIdeal(); const d = ui.idraft; if (!d.role) { toast(t("Scegli prima il ruolo principale.")); return; }
    const key = Object.keys(Examples.PLUS).find(k => d.role.startsWith(k)) || (/Quinto|Terzino/.test(d.role) ? "Quinto" : /Ala/.test(d.role) ? "Ala" : /Punta|Falso/.test(d.role) ? "Punta centrale" : "Mezzala");
    const plus = Examples.PLUS[key][0]; const s = Cfg.get().scale; const have = new Set(d.req.map(r => r.key));
    for (const [i, name] of plus.entries()) { const a = Cfg.get().areas.find(ar => ar.params.some(x => x.id === name)); if (!a || have.has(a.id + "|" + name)) continue; d.req.push({ key: a.id + "|" + name, imp: i < 3 ? 3 : 2, min: Math.round(s.max * (i < 3 ? 0.72 : 0.65) / s.step) * s.step }); }
    for (const name of ["Determinazione", "Professionalità"]) if (!have.has("men|" + name)) d.req.push({ key: "men|" + name, imp: 1, min: Math.round(s.max * 0.65 / s.step) * s.step });
    if (!d.name) d.name = roleL(d.role); toast(t("Requisiti proposti: adattali al tuo modello di gioco")); render(true);
  },
  saveIdeal: () => { syncIdeal(); const { _id, ...o } = ui.idraft; if (!o.name) { toast(t("Dai un nome al profilo")); return; } const id = _id || uid(); put("ideals", id, o); ui.idraft = null; ui.idealId = id; toast(t("Profilo ideale salvato")); render(); },
  delIdeal: () => confirmSheet(t("Eliminare questo profilo ideale?"), () => { del("ideals", ui.idraft._id); ui.idraft = null; ui.idealId = null; })
});

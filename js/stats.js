"use strict";
/* =========================================================
   MM Scout — importazione di statistiche da file CSV o da
   tabella incollata (Numbers, Excel, siti di dati): i nomi
   vengono abbinati ai giocatori anche se scritti in modo
   leggermente diverso.
   ========================================================= */
const StatsImp = {
  parse(text) {
    text = text.replace(/^﻿/, ""); const first = text.split(/\r?\n/)[0] || ""; const delim = ["\t", ";", ","].sort((a, b) => first.split(b).length - first.split(a).length)[0];
    const rows = []; let row = [], cur = "", q = false;
    for (let i = 0; i < text.length; i++) { const c = text[i]; if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; } else if (c === '"') q = true; else if (c === delim) { row.push(cur.trim()); cur = ""; } else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cur.trim()); if (row.some(x => x)) rows.push(row); row = []; cur = ""; } else cur += c; }
    row.push(cur.trim()); if (row.some(x => x)) rows.push(row); return rows;
  },
  guessName(h) { const n = h.map(x => Search.norm(x)); let i = n.findIndex(x => /^(player|giocatore|nome|name|spieler|igrac|calciatore)$/.test(x)); if (i < 0) i = n.findIndex(x => /player|giocatore|name|nome|spieler|igrac/.test(x)); return Math.max(0, i); },
  guessTeam(h) { const n = h.map(x => Search.norm(x)); return n.findIndex(x => /^(team|squadra|club|verein|klub|tim)$/.test(x) || /squad|team|club/.test(x)); },
  match(name, team) {
    const nq = Search.norm(name); let best = null, bs = 0;
    for (const [id, p] of S.players) { const cands = [pname(p), (p.last || "") + " " + (p.first || ""), p.alias, ((p.first || "")[0] || "") + ". " + (p.last || "")].filter(Boolean).map(x => Search.norm(x)); let s = Math.max(...cands.map(c => Search.sim(nq, c)), ...cands.map(c => c.includes(nq) || nq.includes(c) ? 0.92 : 0)); if (team && p.club && Search.sim(Search.norm(team), Search.norm(p.club)) > 0.7) s += 0.04; if (s > bs) { bs = s; best = id; } }
    return bs >= 0.8 ? best : "";
  },
  open() {
    sheet(`<h2>${t("Importa statistiche")}</h2><p class="sub small">${t("Carica un file CSV (da Numbers o Excel: Esporta › CSV) oppure incolla una tabella. La prima riga deve contenere i nomi delle colonne.")}</p>
     <div class="row"><button class="btn" id="stFile">${t("Scegli file CSV")}</button><span class="m" id="stFn"></span></div>
     <label class="f">${t("…oppure incolla qui la tabella")}<textarea id="stPaste" style="min-height:120px" class="mono small"></textarea></label>
     <label class="f">${t("Etichetta (stagione / competizione)")}<input type="text" id="stLabel" placeholder="${t("es. Campionato 2025/26")}"></label>
     <div class="row end"><button class="btn" data-a="closeSheetBtn">${t("Annulla")}</button><button class="btn pri" id="stNext">${t("Continua")}</button></div>`, true);
    let text = ""; $("#stFile").onclick = async () => { const [f] = await pickFile(".csv,.tsv,.txt,text/csv"); if (!f) return; text = await f.text(); $("#stFn").textContent = f.name; };
    $("#stNext").onclick = () => { const raw = text || $("#stPaste").value; const rows = this.parse(raw); if (rows.length < 2) { toast(t("Non trovo dati: servono almeno l'intestazione e una riga.")); return; } this.review(rows, $("#stLabel").value.trim() || today()); };
  },
  review(rows, label) {
    const head = rows[0], body = rows.slice(1, 501); let ni = this.guessName(head), ti = this.guessTeam(head);
    const pl = [...S.players.entries()].sort((a, b) => pname(a[1]).localeCompare(pname(b[1])));
    const draw = () => {
      $("#stRows").innerHTML = body.map((r, i) => { const m = this.match(r[ni] || "", ti >= 0 ? r[ti] : ""); return `<div class="item"><div class="grow"><div class="t">${esc(r[ni] || "")}</div><div class="m">${esc(ti >= 0 ? r[ti] || "" : "")}</div></div><select data-sr="${i}" style="max-width:52%"><option value="__skip">${t("Ignora")}</option><option value="__new" ${m ? "" : "selected"}>+ ${t("Crea nuovo giocatore")}</option>${pl.map(([id, p]) => `<option value="${id}" ${m === id ? "selected" : ""}>${esc(pname(p))}${p.club ? " · " + esc(p.club) : ""}</option>`).join("")}</select></div>`; }).join("");
      const ok = body.filter(r => this.match(r[ni] || "", ti >= 0 ? r[ti] : "")).length; $("#stSum").textContent = t("{a} righe · {b} abbinate automaticamente", { a: body.length, b: ok });
    };
    sheet(`<h2>${t("Abbina i giocatori")}</h2><div class="fgrid"><label class="f">${t("Colonna con il nome")}<select id="stNi">${head.map((h, i) => `<option value="${i}" ${i === ni ? "selected" : ""}>${esc(h)}</option>`).join("")}</select></label><label class="f">${t("Colonna con la squadra")}<select id="stTi"><option value="-1">—</option>${head.map((h, i) => `<option value="${i}" ${i === ti ? "selected" : ""}>${esc(h)}</option>`).join("")}</select></label></div>
      <p class="m" id="stSum"></p><div class="list" id="stRows" style="max-height:50vh;overflow:auto"></div>
      <div class="row end"><button class="btn" data-a="closeSheetBtn">${t("Annulla")}</button><button class="btn pri" id="stGo">${t("Importa")}</button></div>`, true);
    draw(); $("#stNi").onchange = e => { ni = +e.target.value; draw(); }; $("#stTi").onchange = e => { ti = +e.target.value; draw(); };
    $("#stGo").onclick = () => {
      let n = 0, created = 0;
      $$("[data-sr]").forEach(s => { const r = body[+s.dataset.sr]; let id = s.value; if (id === "__skip") return;
        const data = {}; head.forEach((h, i) => { if (i !== ni && i !== ti && r[i] !== undefined && r[i] !== "") data[h] = r[i]; });
        if (id === "__new") { id = uid(); const parts = String(r[ni] || "").trim().split(/\s+/); put("players", id, { first: parts.length > 1 ? parts.slice(0, -1).join(" ") : "", last: parts[parts.length - 1] || "", club: ti >= 0 ? r[ti] : "", roles: [], tags: [], listIds: [], contract: {}, physique: {}, pros: [], cons: [], injuries: [], relations: [], verdict: "rivedere", sex: "Uomo" }); created++; }
        const p = P(id); const stats = (p.stats || []).filter(x => x.label !== label); stats.push({ id: uid(), label, date: today(), data }); put("players", id, { ...p, stats }); n++; });
      closeSheet(); toast(t("{n} schede statistiche importate ({c} giocatori nuovi)", { n, c: created })); render(true);
    };
  }
};
function statsTab(id, p) {
  const st = (p.stats || []).slice().reverse();
  return `<section class="panel"><div class="row between"><h2>${t("Statistiche")}</h2><button class="btn sm noprint" data-a="importStats">${t("Importa statistiche")}</button></div>
   ${st.length ? st.map(s => `<div style="margin-top:12px"><div class="row between"><h3>${esc(s.label)}</h3><button class="btn sm ghost noprint" data-a="delStat" data-sid="${s.id}">✕</button></div><div class="statgrid">${Object.entries(s.data).map(([k, v]) => `<div><span class="m">${esc(k)}</span><b class="mono">${esc(v)}</b></div>`).join("")}</div></div>`).join("") : `<div class="empty" style="margin-top:8px">${t("Nessuna statistica. Importa un file CSV o incolla una tabella: i dati compaiono qui accanto alle tue valutazioni.")}</div>`}</section>`;
}
A.importStats = () => StatsImp.open();
A.delStat = el => { const p = P(ui.playerId); put("players", ui.playerId, { ...p, stats: (p.stats || []).filter(x => x.id !== el.dataset.sid) }); render(true); };
window.ptab = (orig => function (id, p, pr) { return ui.ptab === "statistiche" ? statsTab(id, p) : orig(id, p, pr); })(window.ptab);

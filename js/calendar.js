"use strict";
/* =========================================================
   MM Scout — calendario delle missioni: vista mensile,
   link della partita (diretta, biglietti, info, mappa),
   esportazione nel Calendario (.ics) con promemoria e
   collegamento diretto alla partita nell'app.
   ========================================================= */
const locale = () => ({ it: "it-IT", en: "en-GB", de: "de-DE", sr: "sr-Latn-RS", es: "es-ES", fr: "fr-FR" }[Prefs.lang] || "it-IT");
R.calendario = () => {
  const base = ui.calMonth ? new Date(ui.calMonth + "-01T12:00:00") : new Date(); const y = base.getFullYear(), mo = base.getMonth();
  const first = new Date(y, mo, 1), startDow = (first.getDay() + 6) % 7, days = new Date(y, mo + 1, 0).getDate();
  const ms = [...S.matches.entries()].filter(([, m]) => !m.archived && m.date); const byDay = {}; for (const e of ms) (byDay[e[1].date] = byDay[e[1].date] || []).push(e);
  const meets = [...(S.meetings || new Map()).entries()].filter(([, x]) => x.date); const mByDay = {}; for (const e of meets) (mByDay[e[1].date] = mByDay[e[1].date] || []).push(e);
  const pad = n => String(n).padStart(2, "0"); const ymd = d => `${y}-${pad(mo + 1)}-${pad(d)}`; const td = today(); const selD = ui.calDay || td;
  const wd = [...Array(7)].map((_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(locale(), { weekday: "short" }));
  let cells = ""; for (let i = 0; i < startDow; i++) cells += `<div class="cal-c off"></div>`;
  for (let d = 1; d <= days; d++) { const k = ymd(d); const list = byDay[k] || []; cells += `<button class="cal-c ${k === td ? "today" : ""} ${k === selD ? "sel" : ""}" data-a="calDay" data-d="${k}"><span class="cal-n">${d}</span>${list.slice(0, 3).map(([, m]) => `<span class="cal-ev ${m.status === "vista" ? "seen" : ""}">${esc(m.time || "")} ${esc((m.home || "").slice(0, 10))}</span>`).join("")}${list.length > 3 ? `<span class="m">+${list.length - 3}</span>` : ""}${(mByDay[k] || []).slice(0, 2).map(([, x]) => `<span class="cal-ev meet">${esc(x.time || "")} ${esc((x.title || t("Riunione")).slice(0, 12))}</span>`).join("")}</button>`; }
  const dayList = (byDay[selD] || []).sort((a, b) => (a[1].time || "").localeCompare(b[1].time || ""));
  const up = ms.filter(([, m]) => m.date >= td && m.status !== "vista").sort((a, b) => (a[1].date + (a[1].time || "")).localeCompare(b[1].date + (b[1].time || "")));
  return `<div class="head"><div><h1>${t("Calendario")}</h1><p class="sub">${t("Le tue missioni mese per mese. Aggiungile al Calendario del telefono con promemoria e link alla partita.")}</p></div><div class="row"><button class="btn" data-a="icsAll" ${up.length ? "" : "disabled"}>${t("Esporta le prossime ({n}) nel Calendario", { n: up.length })}</button><button class="btn pri" data-a="newMatchOn" data-d="${selD}">+ ${t("Partita")}</button></div></div>
  <section class="panel"><div class="row between"><button class="btn sm" data-a="calMove" data-v="-1" aria-label="${t("Mese precedente")}">‹</button><h2 class="cap1">${first.toLocaleDateString(locale(), { month: "long", year: "numeric" })}</h2><div class="row"><button class="btn sm ghost" data-a="calToday">${t("Oggi")}</button><button class="btn sm" data-a="calMove" data-v="1" aria-label="${t("Mese successivo")}">›</button></div></div>
   <div class="cal">${wd.map(w => `<div class="cal-h">${esc(w)}</div>`).join("")}${cells}</div></section>
  <div class="grid2"><section class="panel"><h2>${new Date(selD + "T12:00:00").toLocaleDateString(locale(), { weekday: "long", day: "numeric", month: "long" })}</h2><div class="list" style="margin-top:6px">${dayList.map(([id, m]) => matchItem(id, m)).join("")}${(mByDay[selD] || []).map(([id, x]) => meetingItem(id, x)).join("")}${!dayList.length && !(mByDay[selD] || []).length ? `<div class="empty">${t("Nessuna partita in questo giorno.")} <button class="btn sm" data-a="newMatchOn" data-d="${selD}">+ ${t("Partita")}</button> <button class="btn sm" data-a="editMeet" data-d="${selD}">+ ${t("Riunione")}</button></div>` : ""}</div></section>
   <section class="panel"><h2>${t("Prossime missioni")}</h2><div class="list" style="margin-top:6px">${meets.filter(([, x]) => x.date >= td).sort((a, b) => a[1].date.localeCompare(b[1].date)).slice(0, 4).map(([id, x]) => meetingItem(id, x)).join("")}${up.slice(0, 8).map(([id, m]) => matchItem(id, m)).join("") || `<div class="empty">${t("Nessuna partita in programma.")}</div>`}</div></section></div>`;
};
function matchLinks(id, m) {
  const L2 = [];
  if (m.linkStream) L2.push(`<a class="btn sm" href="${esc(m.linkStream)}" target="_blank" rel="noopener noreferrer">▶ ${t("Diretta / video")}</a>`);
  if (m.linkTickets) L2.push(`<a class="btn sm" href="${esc(m.linkTickets)}" target="_blank" rel="noopener noreferrer">${t("Biglietti / accrediti")}</a>`);
  if (m.linkInfo) L2.push(`<a class="btn sm" href="${esc(m.linkInfo)}" target="_blank" rel="noopener noreferrer">${t("Info partita")}</a>`);
  const where = m.address || m.venue; if (where) L2.push(`<a class="btn sm" href="https://maps.apple.com/?q=${encodeURIComponent(where)}" target="_blank" rel="noopener noreferrer">${t("Apri in Mappe")}</a>`);
  L2.push(`<button class="btn sm" data-a="icsOne" data-id="${id}">${t("Aggiungi al Calendario")}</button>`);
  return `<div class="row" style="margin-top:8px">${L2.join("")}</div>`;
}
function icsEsc(s) { return String(s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n"); }
function icsFold(line) { const out = []; while (line.length > 72) { out.push(line.slice(0, 72)); line = " " + line.slice(72); } out.push(line); return out.join("\r\n"); }
function buildIcs(entries) {
  const pub = (App.cfgDevice().publicUrl || (location.protocol === "https:" ? location.origin + location.pathname : "")).split("#")[0];
  const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z"; const L0 = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//MM Scout//IT", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
  for (const [id, m] of entries) {
    const d = m.date.replace(/-/g, ""); const tm = (m.time || "15:00").replace(":", "") + "00"; const targets = (m.targets || []).map(x => pname(P(x))).filter(Boolean);
    const desc = [m.goal ? t("Obiettivo") + ": " + m.goal : "", targets.length ? t("Da osservare") + ": " + targets.join(", ") : "", m.linkStream ? t("Diretta / video") + ": " + m.linkStream : "", m.linkTickets ? t("Biglietti / accrediti") + ": " + m.linkTickets : "", m.linkInfo ? t("Info partita") + ": " + m.linkInfo : "", pub ? appName() + ": " + pub + "#match-" + id : ""].filter(Boolean).join("\n");
    L0.push("BEGIN:VEVENT", "UID:" + id + "@mm-scout", "DTSTAMP:" + stamp, `DTSTART:${d}T${tm}`, "DURATION:PT2H", "SUMMARY:" + icsEsc(t("Scouting") + ": " + m.home + " – " + m.away), "LOCATION:" + icsEsc(m.address || m.venue || ""), "DESCRIPTION:" + icsEsc(desc));
    const url = pub ? pub + "#match-" + id : (m.linkStream || m.linkInfo || ""); if (url) L0.push("URL:" + url);
    L0.push("BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + icsEsc(m.home + " – " + m.away), "TRIGGER:-PT2H", "END:VALARM", "END:VEVENT");
  }
  L0.push("END:VCALENDAR"); return L0.map(icsFold).join("\r\n");
}
Object.assign(A, {
  calDay: el => { ui.calDay = el.dataset.d; render(true); },
  calMove: el => { const b = ui.calMonth ? new Date(ui.calMonth + "-01T12:00:00") : new Date(); b.setDate(1); b.setMonth(b.getMonth() + (+el.dataset.v)); ui.calMonth = b.toISOString().slice(0, 7); render(true); },
  calToday: () => { ui.calMonth = null; ui.calDay = today(); render(true); },
  newMatchOn: el => { matchForm(null, el.dataset.d); },
  icsOne: el => { const m = S.matches.get(el.dataset.id); download(`${(m.home + "-" + m.away).replace(/[^\w-]+/g, "_")}.ics`, buildIcs([[el.dataset.id, m]]), "text/calendar"); toast(t("Aprilo per aggiungerlo al Calendario")); },
  icsAll: () => { const td = today(); const up = [...S.matches.entries()].filter(([, m]) => !m.archived && m.date >= td && m.status !== "vista"); download(`mm-scout-${td}.ics`, buildIcs(up), "text/calendar"); toast(t("Aprilo per aggiungerlo al Calendario")); }
});

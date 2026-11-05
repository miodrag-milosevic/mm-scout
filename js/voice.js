"use strict";
/* =========================================================
   MM Scout — note vocali durante la partita: un tocco per
   registrare, un tocco per fermare. La nota viene salvata
   cifrata, con minuto e giocatore, nel registro della gara
   e nel profilo del giocatore.
   ========================================================= */
const Voice = {
  rec: null, chunks: [], start: 0, timer: null, ctx: null,
  supported() { return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder); },
  mime() { for (const m of ["audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg"]) if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) return m; return ""; },
  btn() { return this.supported() ? `<button class="btn ${this.rec ? "rec" : ""}" id="voiceBtn" data-a="voice">${this.rec ? "■ " + t("Ferma") + ' <span id="voiceT">0:00</span>' : "🎙 " + t("Nota vocale")}</button>` : ""; },
  async toggle() {
    if (this.rec) { this.rec.stop(); return; }
    if (!ui.liveP) { toast(t("Scegli prima il giocatore")); return; }
    let stream; try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { toast(t("Microfono non disponibile: controlla i permessi del browser.")); return; }
    const mime = this.mime(); this.chunks = []; const r = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    this.ctx = { matchId: ui.matchId, playerId: ui.liveP, minute: minuteOf(ui.timer), half: ui.timer.half };
    r.ondataavailable = e => { if (e.data && e.data.size) this.chunks.push(e.data); };
    r.onstop = async () => { stream.getTracks().forEach(tr => tr.stop()); clearInterval(this.timer); this.rec = null; this.updBtn(); await this.save(new Blob(this.chunks, { type: r.mimeType || mime || "audio/webm" })); };
    r.start(); this.rec = r; this.start = Date.now(); this.updBtn();
    this.timer = setInterval(() => { const s = Math.floor((Date.now() - this.start) / 1000); const el = $("#voiceT"); if (el) el.textContent = Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); if (s >= 180) r.stop(); }, 500);
  },
  updBtn() { const b = $("#voiceBtn"); if (b) b.outerHTML = this.btn(); },
  async save(blob) {
    const c = this.ctx; if (!c || !blob.size) return; const p = P(c.playerId); const ext = blob.type.includes("mp4") ? "m4a" : blob.type.includes("ogg") ? "ogg" : "webm";
    const name = `${t("Nota vocale")} ${c.minute}' – ${p ? (p.last || pname(p)) : ""}`;
    const file = new File([blob], name + "." + ext, { type: blob.type });
    try {
      const blobId = await Store.putBlob(file); const mid = uid();
      await put("media", mid, { owner: "match", ownerId: c.matchId, playerId: c.playerId, kind: "audio", name, mime: blob.type, size: blob.size, blobId, note: "", date: today(), minute: c.minute });
      const m = S.matches.get(c.matchId); put("matches", c.matchId, { ...m, events: [...(m.events || []), { id: uid(), t: c.minute, h: c.half, p: c.playerId, c: "Nota vocale", o: "=", n: "", mediaId: mid }] });
      toast(t("Nota vocale salvata")); if (window.renderLive) renderLive();
    } catch (e) { toast(t("Spazio insufficiente per {f}", { f: name })); }
  }
};
A.voice = () => Voice.toggle();

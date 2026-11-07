// MM Scout: rende l'app disponibile anche senza internet.
const CACHE = "mm-scout-v0.9.2";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./css/app.css", "./img/logo.jpg", "./img/logo.svg", "./js/vendor/qrcode.js", "./js/i18n.js", "./js/i18n-de.js", "./js/i18n-fr.js", "./js/i18n-sr.js", "./js/i18n-es.js", "./js/core.js", "./js/app.js", "./js/views.js", "./js/account.js", "./js/extra.js", "./js/live.js", "./js/sign.js", "./js/pro.js", "./js/search.js", "./js/profiles.js", "./js/calendar.js", "./js/voice.js", "./js/heat.js", "./js/stats.js", "./js/sync.js", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", "./apple-touch-icon.png", "./js/squad.js", "./js/zones.js", "./js/lineup.js", "./js/vendor/pdfjs/pdf.min.js", "./js/vendor/pdfjs/pdf.worker.min.js", "./js/undo.js", "./js/facets.js", "./js/ux54.js", "./js/more54.js", "./js/plan55.js", "./js/examples55.js", "./js/pro56.js", "./js/v562.js", "./js/v57.js", "./js/v58.js", "./js/v59.js", "./js/v510.js", "./js/v511.js", "./js/v512.js", "./js/v513.js", "./js/v514.js", "./js/v515.js", "./js/v516.js", "./js/v517.js", "./js/v518.js", "./js/v519.js", "./js/v520.js", "./js/v521.js", "./js/v522.js", "./js/v600.js", "./js/pro2.js", "./js/analysis.js", "./js/staff.js", "./js/examples2.js"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  // prima la rete (per gli aggiornamenti), la copia salvata se sei offline
  e.respondWith(fetch(e.request, { cache: "no-cache" }).then(r => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); } return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match("./index.html"))));
});

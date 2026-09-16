/* Minimaler Offline-Cache. Beim Ändern der Dateien CACHE hochzählen. */
var CACHE = 'betriebskosten-v2';
var FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  /* pdf.js bewusst mit im Vorrat, obwohl es 1,4 MB sind: "Zahlen suchen"
     soll auch im Funkloch gehen. Ohne diese beiden Dateien waere die
     Mustersuche erst nach dem ersten Onlinegebrauch offline verfuegbar. */
  './vendor/pdf.min.js',
  './vendor/pdf.worker.min.js'
];

/* GitHub Pages liefert alles mit "Cache-Control: max-age=600" aus. Ein
   normaler fetch() wird deshalb bis zu zehn Minuten lang aus dem
   HTTP-Cache des Browsers bedient - auch hier im Service Worker. Updates
   kaemen dadurch verspaetet an, obwohl die Strategie network-first ist.
   Ein frisch aus der URL gebauter Request mit cache:"reload" umgeht das.
   Bewusst aus der URL gebaut und nicht aus e.request: aus einem Request
   im Modus "navigate" laesst sich kein neuer Request konstruieren. */
function freshRequest(url) {
  return new Request(url, { cache: 'reload', credentials: 'same-origin' });
}

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(FILES); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { return k === CACHE ? null : caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* Network-first: online sieht man immer die aktuelle Version,
   offline kommt die zuletzt gespeicherte.
   Fremde Adressen (Google Fonts, pdf.js vom CDN) laufen bewusst am
   Service Worker vorbei - sie sind nicht Teil der App und duerfen
   offline einfach ausfallen. Die Seite bleibt dann trotzdem bedienbar,
   nur in der Systemschrift. */
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;

  var url;
  try { url = new URL(e.request.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(freshRequest(url.href)).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, copy); }).catch(function () {});
      return res;
    }).catch(function () {
      return caches.match(e.request).then(function (hit) {
        return hit || caches.match('./index.html');
      });
    })
  );
});

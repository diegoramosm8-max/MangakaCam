// Service worker de Manga Cam. Subí VERSION en cada release.
const VERSION = "v5";
const SHELL_CACHE = `manga-cam-shell-${VERSION}`;
const RUNTIME_CACHE = "manga-cam-runtime-v1"; // modelos/CDN: no cambian con la app
const SHELL_FILES = ["./", "./index.html", "./styles.css", "./app.js", "./manifest.json", "./icons/icon-192.png", "./icons/icon-512.png"];

self.addEventListener("install", (e) => {
  // Sin skipWaiting: la app avisa y el usuario decide cuándo actualizar.
  e.waitUntil(caches.open(SHELL_CACHE).then((c) => c.addAll(SHELL_FILES)).catch(() => {}));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== SHELL_CACHE && k !== RUNTIME_CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("message", (e) => { if (e.data === "SKIP_WAITING") self.skipWaiting(); });

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const own = new URL(req.url).origin === self.location.origin;
  if (own) {
    // Archivos propios: red primero (nunca queda una versión vieja), caché si no hay conexión.
    e.respondWith(fetch(req).then((res) => {
      if (res && res.status === 200) { const cp = res.clone(); caches.open(SHELL_CACHE).then((c) => c.put(req, cp)).catch(() => {}); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then((c) => c || (req.mode === "navigate" ? caches.match("./index.html") : new Response("", { status: 504 })))));
    return;
  }
  // CDN (MediaPipe, modelos, fuentes): caché primero, se guarda al primer uso.
  e.respondWith(caches.match(req).then((c) => c || fetch(req).then((res) => {
    if (res && (res.status === 200 || res.type === "opaque")) { const cp = res.clone(); caches.open(RUNTIME_CACHE).then((k) => k.put(req, cp)).catch(() => {}); }
    return res;
  }).catch(() => new Response("", { status: 504 }))));
});

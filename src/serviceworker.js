importScripts("./cache-polyfill.js");

self.addEventListener("install", function(e) {
  e.waitUntil(
    caches.open("xoxo").then(function(cache) {
      return cache.addAll([
        "/",
        // "../index.html",
        // "../index.js",
        "./manifest.json",
        "./css/normalize.css",
        "./css/skeleton.css",
        "./css/style.css",
        "./game.js",
        "./images/icon.png"
      ]);
    })
  );
});

self.addEventListener("fetch", function(event) {
  console.log(event.request.url);

  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});

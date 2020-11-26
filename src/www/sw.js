/* global fetch, caches, importScripts, self, config, URL */

importScripts("sw-config.js");


self.addEventListener("install", event => {
  console.log("Inside install");
  event.waitUntil(
    caches.open(config.prefetchCacheName)
        .then(cache => {
          // console.log("Cache opened,", cache);
          return cache.addAll(config.prefetchUrls);
        })
        .then(self.skipWaiting())
  );
  /*
  event.waitUntil(async function() {
    const cache = await caches.open(config.cacheName);
    await cache.addAll(config.cacheUrls);
  }());
  */
});



self.addEventListener("activate", event => {
  console.log("Inside activate");
  event.waitUntil(
    caches.keys()
        .then(cacheNames => {
          return cacheNames.filter(name => name !== config.prefetchCacheName);
        })
        .then(staleCaches => {
          // console.log("Deleting stale caches...", staleCaches);
          return Promise.all(
            staleCaches.map(staleCache => caches.delete(staleCache))
          );
        })
        .then(() => self.clients.claim())
  );
});



self.addEventListener("fetch", event => {
  const {request} = event, url = new URL(request.url);
  url.search = "";
  if(request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(url).then(response => {
        // console.log("Response found", request.url, response);
        if(response) {
          return response;
        }
        return fetch(request);
      })
    );
  }
});

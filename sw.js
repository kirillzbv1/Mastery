/* Mastery service worker - network-first so deploys show up immediately. */
var CACHE = 'mastery-runtime-v1';

self.addEventListener('install', function(e){
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(names){
      return Promise.all(names.map(function(n){ if(n!==CACHE) return caches.delete(n); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET'){ return; }
  var url = new URL(req.url);
  // Never cache cross-origin (e.g. Supabase / CDN) - always go to network.
  if(url.origin !== self.location.origin){ return; }
  // Network-first: try fresh, fall back to cache when offline.
  e.respondWith(
    fetch(req).then(function(res){
      var copy = res.clone();
      caches.open(CACHE).then(function(c){ c.put(req, copy); });
      return res;
    }).catch(function(){
      return caches.match(req).then(function(hit){
        return hit || caches.match('/index.html') || caches.match('/');
      });
    })
  );
});

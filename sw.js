// CabLine offline support: keeps the app and its scanner libraries on the device so scanning works with no internet.
var CACHE='cabline-offline-v1';
var LIBS=['https://cdnjs.cloudflare.com/ajax/libs/jsQR/1.4.0/jsQR.js','https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js','https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js','https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js','https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js'];
self.addEventListener('install',function(e){self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){return Promise.all(['./','./index.html','./manifest.json'].concat(LIBS).map(function(u){return c.add(u).catch(function(){});}));}));});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(n){return n!==CACHE;}).map(function(n){return caches.delete(n);}));}).then(function(){return self.clients.claim();}));});
self.addEventListener('fetch',function(e){var r=e.request;if(r.method!=='GET')return;var u=new URL(r.url);
  var ok=u.origin===location.origin||u.hostname==='cdnjs.cloudflare.com'||u.hostname==='www.gstatic.com';if(!ok)return;
  e.respondWith(fetch(r).then(function(res){if(res&&res.status===200){var cp=res.clone();caches.open(CACHE).then(function(c){c.put(r,cp);});}return res;})
    .catch(function(){return caches.match(r,{ignoreSearch:true}).then(function(m){return m||(r.mode==='navigate'?caches.match('./index.html'):Response.error());});}));});

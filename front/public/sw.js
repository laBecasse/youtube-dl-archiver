console.log('------------------------- Hello from sw.js --------------------')

const version = 'v0.14.15'
const staticCachePrefix = 'staticfiles'
const staticCacheName = staticCachePrefix + version
const imagesCacheName = 'images'

addEventListener('install', installEvent => {
  skipWaiting();
  installEvent.waitUntil(
    caches.open(staticCacheName)
      .then( staticCache => {
        return staticCache.addAll([
          '/js/app.js',
          '/js/chunk-vendors.js',
          '/css/app.css',
          '/css/chunk-vendors.css',
          '/style.css',
          '/bulma.min.css',
          '/logo.svg',
          '/manifest.json',
          '/'
        ]); // end return addAll
      }) // end open then
  ); // end waitUntil
}); // end addEventListener

addEventListener('activate', activateEvent => {
  activateEvent.waitUntil(
    caches.keys()
      .then( cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== staticCacheName &&
              cacheName.startsWith(staticCachePrefix)) {
              return caches.delete(cacheName)
            } // end if
          }) // end map
        ); // end return Promise.all
      }) // end keys then
      .then( () => {
        return clients.claim()
      }) // end then
  ); // end waitUntil
}); // end addEventListener



addEventListener('fetch', fetchEvent => {
  const request = fetchEvent.request
  //
  if (request.headers.get('Accept').includes('image')) {
    cacheFirst(fetchEvent, imagesCacheName, true)
    //else we fetch only content that are not video,
    // because partial content is not handling by fetch
    // and not json from the API, because HTTP Basic Auth is not supported 
  } else if (request.url.endsWith('manifest.json') ||
             (!request.headers.get('Accept').includes('video') &&
              !request.headers.get('Accept').includes('json'))) {
    cacheFirst(fetchEvent, staticCacheName, false)
  }
}); // end addEventListener


/*
 * Look in the cache for request
 * if the request matchs a cached entry
 * the cached response is returned
 * else request is fetched and returned
 * if caching is true, the fetched response will be cached
 * return a promise to be passed to fetchEvent.wailUntil
 */
function cacheFirst(fetchEvent, cacheName, caching) {
  const request = fetchEvent.request

  fetchEvent.respondWith(
    caches.match(request)
      .then(responseFromCache => {
        // see https://stackoverflow.com/questions/37934972/serviceworker-conflict-with-http-basic-auth
        // but doesn't work
        //request.credentials = "same-origin"

        if (responseFromCache) {
          return responseFromCache
        } else if (caching) {
          return fetch(request)
            .then (responseFromFetch => {
                const copy = responseFromFetch.clone()
                fetchEvent.waitUntil(
                  // Update the cache
                  caches.open(cacheName)
                    .then(cache => {
                      return cache.put(request, copy)
                    })
                )
              return responseFromFetch
            })
        } else {
          return fetch(request)
        }
      }))
}

// function mp4Caching() {
//   if (request.url.endsWith('.mp4')) {
//     return fetch(request)
//       .then(responseFromFetch => {
//         caches.open(videoCacheName)
//           .then(videoCache => {
//             return videoCache.put(request, responseFromFetch)
//           })
//       })
//   }

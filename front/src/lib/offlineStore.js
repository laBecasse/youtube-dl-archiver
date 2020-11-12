// cache of offline medias

let API_URL = process.env.VUE_APP_API_URL
let CACHE_NAME = 'offlineMedia'
let CACHE

function getCache() {
  if (CACHE) {
    return CACHE
  }

  const cacheAvailable = 'caches' in self;
  if (cacheAvailable) {
    CACHE = caches.open(CACHE_NAME)
    return CACHE
  } else {
    const err = new Error('cache is not supported by the browser')
    return Promise.reject(err)
  }
}

function getNotFoundRejection() {
  const err = new Error('not found')
  err.status = 404
  return Promise.reject(err)
}

function getRequestFromId(id) {
  return new Request(API_URL + '/medias/' + id)
}

function getIdFromRequest(req) {
  return req.url.substr(API_URL.length + 8)
}

export default {
  actions: {
    _offlineUrlFromId(context, id) {
      return context.dispatch('getOneMedia', id)
        .then(media => {
          const fileUrl = media.file_url
          if (!fileUrl) throw new Error('media file url is missing')
          return fileUrl
        })
    },
    makeOfflineMedia(context, id) {
      return Promise.all([context.dispatch('_offlineUrlFromId', id), getCache()])
        .then(objects => {
          const url = objects[0]
          const cache = objects[1]
          const req = getRequestFromId(id)
          return fetch(url).then(res => cache.put(req, res))
        })
    },
    deleteOfflineMedia(context, id) {
      return getCache()
        .then(cache => {
          const req = getRequestFromId(id)
          return cache.delete(req)
        })
    },
    getOfflineMediaURL(context, id) {
      return getCache()
        .then(cache => {
          const req = getRequestFromId(id)
          return cache.match(req)
        })
        .then(res => res ? res.blob(): getNotFoundRejection())
        .then(blob => URL.createObjectURL(blob))
    },
    getAllOfflineMedias(context, id) {
      return getCache()
        .then(cache => cache.keys())
        .then(keys => keys.map(getIdFromRequest))
        .then(ids => Promise.all(ids.map(id => context.dispatch('getOneMedia', id))))
    }
  }
}

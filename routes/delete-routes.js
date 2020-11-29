const MediaDB = require('../models/MediaDB.js')
const Archive = require('../models/Archive')
const Cache = require('../models/Cache.js')

module.exports = function (router, handleJson, handleError, links, cacheCol) {
  const mediaDB = MediaDB(links)
  const cache = Cache(cacheCol)

  router.delete('/medias/:id', (req, res) => {
    const dbId = req.params.id
    const promise = mediaDB.removeById(dbId)
          .then(media => {
            // if one media have been removed
            if (media) {
              return Archive.load(media)
                .then(archive => {
                  archive.remove()
                  return cache.add(media.url)
                    .then(() => media)
                })
            } else {
              return null
            }
          })
    handleJson(promise, req, res)
  })
}

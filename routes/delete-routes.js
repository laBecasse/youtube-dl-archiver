const MediaDB = require('../models/MediaDB.js')
const Archive = require('../models/Archive')

module.exports = function (router, links) {
  const mediaDB = MediaDB(links)

  let handleJson = function (promises, req, res) {
    promises.then(object => {
      if (object) {
        res.json(object)
      } else {
        res.status(404)
        res.json({ message: 'not found' })
      }
    })
      .catch(handleError(res))
  }

  let handleError = function (res) {
    return err => {
      console.error(err.stack)
      res.status(500)
        .json({ error: 'server error' })
    }
  }

  router.delete('/medias/:id', (req, res) => {
    const dbId = req.params.id
    const promise = mediaDB.removeById(dbId).then(media => {
      // if one media have been removed
      if (media) {
        return Archive.load(media.file_path)
          .then(archive => {
            archive.remove()
            return media
          })
      } else {
        return null
      }
    })
    handleJson(promise, req, res)
  })
}

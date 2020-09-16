
const MediaDB = require('../models/MediaDB.js')

module.exports = function (router, links) {
  const mediaDB = MediaDB(links)

  let getByUrl = function (req, res, next) {
    const url = req.query.url
    if (url) {
      handleJson(mediaDB.findByUrl(url), req, res)
    } else {
      next()
    }
  }

  let handleJson = function (promises, req, res) {
    promises.then(medias => {
      if (medias) {
        if (Array.isArray(medias)) {
          res.json(medias.map(media => media.toAPIJSON()))
        } else {
          res.json(medias.toAPIJSON())
        }
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

  router.get('/medias', getByUrl, (req, res) => {
    const limit = parseInt(req.query.limit) || 0
    const offset = parseInt(req.query.offset) || 0
    const to = (Date.parse(req.query.to)) ? new Date(req.query.to) : new Date()
    handleJson(mediaDB.findAll(limit, offset, to), req, res)
  })

  router.get('/search', getByUrl, (req, res) => {
    const limit = parseInt(req.query.limit) || 0
    const offset = parseInt(req.query.offset) || 0
    const text = req.query.text.trim()
    const query = (text.startsWith('"')) ? text : '"' + text.split(' ').join('" "') + '"'
    const uploader = req.query.uploader

    handleJson(mediaDB.search(query, uploader, limit, offset), req, res)
  })

  router.get('/medias/:id', (req, res) => {
    const dbId = req.params.id
    handleJson(mediaDB.findById(dbId), req, res)
  })
}

const Invidious = require('../libs/invidious')
const Ytt = require('../libs/ytt')
const Sepiasearch = require('../libs/sepiasearch')
const Downloader = require('../libs/downloader')
const MediaDB = require('../models/MediaDB.js')
const UnarchivedMedia = require('../models/UnarchivedMedia')

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
        .json({ error: err.stack })
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
    const text = req.query.text
    const uploader = req.query.uploader
    const platform = req.query.platform

    if (!text) {
      res.status(400)
      return res.json({ message: 'invalid request' })
    }

    let promise
    if (!platform) {
      const query = (!text || text.startsWith('"')) ? text : '"' + text.trim().split(' ').join('" "') + '"'

      promise = mediaDB.search(query, uploader, limit, offset)
    } else if (platform === 'youtube') {
      promise = (!offset) ? YttSearch(text, limit) : Promise.resolve([])
    } else if (platform === 'sepiasearch') {
      promise = (!offset) ? Sepiasearch.searchMetadataMedias(text) : Promise.resolve([])
    } else {
      promise = (!offset) ? Downloader.downloadMetadataFromSearch(text, platform)
        .then(infos => {
          return infos.map(info => UnarchivedMedia.create(info))
        }) : Promise.resolve([])

    }

    return handleJson(promise, req, res)

  })

  router.get('/medias/:id', (req, res) => {
    const dbId = req.params.id
    handleJson(mediaDB.findById(dbId), req, res)
  })
}

function emptyAnswerRejection(medias) {
  return  (medias.length) ? medias : Promise.reject(new Error('empty answer'))
}

function InvidiousSearch(query, limit) {
  return Invidious.downloadMetadataFromSearch(query).then(infos => infos.map(info => UnarchivedMedia.create(info)))
}

function YtDlSearch(query, limit) {
  return Downloader.downloadMetadataFromSearch(query, 'youtube')
    .then(infos => {
      const medias = infos.map(info => UnarchivedMedia.create(info))
      return medias
    })
}

function YttSearch(query, limit) {
  return Ytt.searchMetadataMedias(query, limit)
    .then(emptyAnswerRejection)
    .catch(e => {
        console.warn('Ytt empty answer for query: '+ query)      
      return InvidiousSeach(query, limit)
    })
    .then(emptyAnswerRejection)
    .catch(e => {
        console.warn('Invidious empty answer for query: '+ query)      
      return YtDlSearch(query, limit)
    })
}

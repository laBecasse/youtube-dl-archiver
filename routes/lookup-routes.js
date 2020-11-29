const UnarchivedMedia = require('../models/UnarchivedMedia')
const Downloader = require('../libs/downloader')
const Invidious = require('../libs/invidious')

module.exports = function (router, handleJSON, handleError) {
  router.get('/lookup', (req, res, next) => {
    const query = req.query.query
    const platform = req.query.platform

    if (!query || !platform) {
      return res.json({ message: 'invalid request' })
    }

    if (platform === 'invidious') {
      Invidious.downloadMetadataFromSearch(query)
        .then(infos => {
          const medias = infos.map(info => UnarchivedMedia.create(info).toAPIJSON())
          res.json(medias)
        })
        .catch(e => {
          res.status(500)
          res.json(e)
        })
    } else {
      Downloader.downloadMetadataFromSearch(query, platform)
        .then(infos => {
          const medias = infos.map(info => UnarchivedMedia.create(info).toAPIJSON())
          res.json(medias)
        })
        .catch(e => {
          res.status(500)
          res.json(e)
        })
    }
  })
}

const UnarchivedMedia = require('../models/UnarchivedMedia')
const Downloader = require('../libs/downloader')

module.exports = function (router) {
  router.get('/lookup', (req, res, next) => {
    const query = req.query.query
    const platform = req.query.platform

    if (!query || !platform) {
      return res.json({ message: 'invalid request' })
    }

    Downloader.downloadMetadataFromSearch(query, platform)
      .then(infos => {
        const medias = infos.map(info => UnarchivedMedia.create(info).toAPIJSON())
        res.json(medias)
      })
      .catch(e => {
        res.status(500)
        res.json(e)
      })
  })
}

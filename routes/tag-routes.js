const TagDB = require('../models/TagDB')
const MediaDB = require('../models/MediaDB')
const afterUpdate = require('../config').afterUpdate

module.exports = function (router, handleJson, handleError, tags, links) {
  const tagDB = TagDB(tags)
  const mediaDB = MediaDB(links)

  let checkTag = function (tag, res) {
    if (!tag && !(tag.includes(',') || tag.includes(' '))) {
      res.status(400)
      res.json({ message: 'invalid tag' })
    }
  }

  router.get('/tags', (req, res) => {
    handleJson(tagDB.getAllTags(), req, res)
  })

  router.get('/tags/:tag', (req, res, next) => {
    const tag = req.params.tag.trim()
    const limit = parseInt(req.query.limit) || 0
    const offset = parseInt(req.query.offset) || 0
    const to = (Date.parse(req.query.to)) ? new Date(req.query.to) : new Date()

    handleJson(mediaDB.findByTag(tag, limit, offset, to), req, res)
  })

  router.put('/tags/:tag', (req, res, next) => {
    const tag = req.params.tag.trim()
    const newTag = req.body.tag.trim()
    checkTag(newTag)
    handleJson(mediaDB.renameTag(tag, newTag), req, res)
  })

  router.put('/medias/:id/tags/:tag', (req, res, next) => {
    const mediaId = req.params.id
    const tag = req.params.tag.trim()
    checkTag(tag)
    handleJson(mediaDB.addTagToMedia(mediaId, tag), req, res)
      .then(afterUpdate)
  })

  router.delete('/medias/:id/tags/:tag', (req, res, next) => {
    const mediaId = req.params.id
    const tag = req.params.tag.trim()
    handleJson(mediaDB.removeTagFromMedia(mediaId, tag), req, res)
  })
}

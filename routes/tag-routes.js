const TagDB = require('../models/TagDB')
const MediaDB = require('../models/MediaDB')

module.exports = function (router, tags, links) {
  const tagDB = TagDB(tags)
  const mediaDB = MediaDB(links)

  let handleError = function (res) {
    return err => {
      console.error(err.stack)
      res.status(500)
        .json({ error: 'server error' })
    }
  }

  let handleJson = function (promises, req, res) {
    promises.then(objects => {
      if (objects) {
        if (Array.isArray(objects)) {
          res.json(objects.map(obj => {
            if (obj.toAPIJSON) {
              return obj.toAPIJSON()
            } else {
              return obj
            }
          }))
        } else {
          if (objects.toAPIJSON) {
            return res.json(objects.toAPIJSON())
          } else {
            return res.json(objects)
          }
        }
      } else {
        res.status(404)
        res.json({ message: 'not found' })
      }
    })
      .catch(handleError(res))
  }

  let checkTag = function (tag, res) {
    if (!tag) {
      res.status(400)
      res.json({ message: 'invalid tag' })
    }
  }

  router.get('/tags', (req, res) => {
    handleJson(tagDB.getAllTags(), req, res)
  })

  router.get('/tags/:tag', (req, res, next) => {
    const tag = req.params.tag
    handleJson(mediaDB.findByTag(tag), req, res)
  })

  router.put('/tags/:tag', (req, res, next) => {
    const tag = req.params.tag
    const newTag = req.body.tag
    checkTag(newTag)
    console.log(tag, newTag, req.body)
    handleJson(mediaDB.renameTag(tag, newTag), req, res)
  })

  router.put('/medias/:id/tags/:tag', (req, res, next) => {
    const mediaId = req.params.id
    const tag = req.params.tag
    checkTag(tag)
    handleJson(mediaDB.addTagToMedia(mediaId, tag), req, res)
  })

  router.delete('/medias/:id/tags/:tag', (req, res, next) => {
    const mediaId = req.params.id
    const tag = req.params.tag
    handleJson(mediaDB.removeTagFromMedia(mediaId, tag), req, res)
  })

}

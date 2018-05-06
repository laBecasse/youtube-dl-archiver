const Media = require('../models/Media.js')

module.exports = function (app, links) {
  const media = Media(links)

  let handleJson = function (promises, req, res) {
    promises.then(object => {
      if (object) {
        res.json(object)
      } else {
        res.status(404)
        res.json({message: 'not found'})
      }
    })
      .catch(handleError(res))
  }

  let handleError = function (res) {
    return err => {
      console.error(err.stack)
      res.status(500)
        .json({error: 'server error'})
    }
  }

  app.delete('/medias/:id', (req, res) => {
    const dbId = req.params.id
    handleJson(media.removeById(dbId), req, res)
  })
}

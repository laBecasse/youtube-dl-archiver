const MediaDB = require('../models/MediaDB.js')
const FilePath = require('../models/FilePath')

module.exports = function (router, links) {
  const media = MediaDB(links)

  let getByUrl = function (req, res, next) {
    const url = req.query.url
    if (url) {
      handleJson(media.findByUrl(url), req, res)
    } else {
      next()
    }
  }

  let handleJson = function (promises, req, res) {
    promises.then(medias => {
      if (medias) {
        if(medias.length)
          res.json(medias.map(media => media.toAPIJSON()))
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

  let handleFile = function (getFilePath, req, res, next) {
    const dbId = req.params.id

    media.findById(dbId)
      .then(m => {
        let filepath
        if (m && (filepath = getFilePath(m))) {
          res.sendFile(filepath)
        } else {
          res.status(404)
          res.send('not found')
        }
      })
      .catch(err => next(err))
  }

  router.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    next()
  })

  router.get('/medias', getByUrl, (req, res) => {
    const limit = parseInt(req.query.limit) || 0
    const offset = parseInt(req.query.offset) || 0
    handleJson(media.findAll(limit, offset), req, res)
  })

  router.get('/search', getByUrl, (req, res) => {
    const limit = parseInt(req.query.limit) || 0
    const offset = parseInt(req.query.offset) || 0
    const text = req.query.text
    const uploader = req.query.uploader
    console.log(uploader)
    
    handleJson(media.search(text, uploader, limit, offset), req, res)
  })

  router.get('/medias/:id', (req, res) => {
    const dbId = req.params.id
    handleJson(media.findById(dbId), req, res)
  })

  router.get('/medias/:id/file', (req, res, next) => {
    function getFilePath (m) {
      return FilePath.absolute(m.file_path)
    }

    return handleFile(getFilePath, req, res, next)
  })

  router.get('/medias/:id/thumbnail', (req, res, next) => {
    function getFilePath (m) {
      if (m.thumbnail) {
        return FilePath.absolute(m.thumbnail.file_path)
      } else {
        return undefined
      }
    }

    return handleFile(getFilePath, req, res, next)
  })

  router.get('/medias/:id/subtitle/:lang', (req, res, next) => {
    const lang = req.params.lang

    function getFilePath (m) {
      const subres = m.subtitles.find(sub => sub.lang === lang)
      if (subres) {
        return FilePath.absolute(subres.file_path)
      } else {
        return undefined
      }
    }

    return handleFile(getFilePath, req, res, next)
  })
}

const path = require('path')
const wrapper = require('../libs/wrappers')
const Media = require('../models/Media.js')
const Cache = require('../models/Cache.js')
const filePath = require('../models/FilePath')
const Downloader = require('../libs/downloader')

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

module.exports = function (router, links, cacheCol) {
  const cache = Cache(cacheCol)
  const media = Media(links)

  router.get('/update', (req, res, next) => {
    wrapper.getLinks()
      .then(links => {
        return bagOfPromises(createOrCache, links, 0)
      })
      .then(obj => {
        console.log('update finished')
      })
      .catch(err => {
        if (err) return next(err)
      })

    console.log('update started')
    return res.send('update started')
  })

  router.post('/medias', (req, res, next) => {
    const url = req.body.url
    if (url) {
      handleJson(createOrCache(url), req, res)
    } else {
      res.status(400)
      res.json({ message: 'url parameter needed' })
    }
  })

  let bagOfPromises = function (promise, args, start) {
    const step = 3
    const list = args.slice(start, start + step)
    return Promise.all(list.map(promise))
      .then(() => {
        if (args.length > start + step) {
          return bagOfPromises(promise, args, start + step)
        } else {
          return true
        }
      })
  }

  let createOrCache = function (url) {
    return cache.find(url)
      .then(obj => {
        if (!obj) {
          return create(url)
        } else {
          return Promise.resolve()
        }
      })
      .catch(err => {
        if (err.name !== 'InfoError') {
          console.error(err.stack)
        } else {
          return cache.add(url)
        }
      })
  }

  let create = function (url) {
    return media.findByUrl(url)
      .then(res => {
        if (res.length === 0) {
          return Downloader.download(url)
        } else {
          return []
        }
      })
      .catch(downError)
      .then(infos => {
        const promises = infos.map(info => {
          return createOne(url, info)
        })
        return Promise.all(promises)
      })
  }

  let createOne = function (url, info) {
    const absDirPath = filePath.getAbsDirPath(info)

    return Downloader.move(info, absDirPath)
      .then(files => {
        const fileExt = path.extname(info._filename)
        const filepath = filePath.relative(files.filter(testExt([fileExt]))[0])

        const thumbnails = files.filter(testExt(['.png', '.jpeg', '.jpg']))
                                   .map(filePath.relative)
        const subtitles = files.filter(testExt(['.vtt']))
              .map(filePath.relative)
        const test = ['youtube', 'dailymotion', 'soundcloud', 'vimeo'].includes(info.extractor)
        const mediaId = (test) ? info.webpage_url : info.url
        return media.add(mediaId, url, filepath, thumbnails, subtitles, info)
      })
  }

  let testExt = function (exts) {
    return (file) => exts.includes(path.extname(file).toLowerCase())
  }

  let downError = function (err) {
    if (err.name !== 'eexist') {
      return Promise.reject(err)
    }
  }
}

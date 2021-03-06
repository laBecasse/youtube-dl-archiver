const path = require('path')
const wrapper = require('../libs/wrappers')
const MediaDB = require('../models/MediaDB.js')
const Cache = require('../models/Cache.js')
const filePath = require('../models/FilePath')
const Downloader = require('../libs/downloader')
const Archive = require('../models/Archive')
const Media = require('../models/Media')
const DownloadState = require('../models/DownloadState')
const afterUpdate = require('../config').afterUpdate

module.exports = function (router, handleJson, handleError, links, cacheCol) {
  const cache = Cache(cacheCol)
  const mediaDB = MediaDB(links)

  router.get('/update', (req, res, next) => {
    console.log('update')
    wrapper.getLinks()
      .then(links => {
        return bagOfPromises(url => createOrCache(url, false), links, 0)
      })
      .then(obj => {
        console.log('update finished')
      })
      .catch(err => {
        if (err) console.log(err)
        return Promise.resolve()
      })

    console.log('update started')
    return res.send('update started')
  })


  router.get('/medias/state/:id', (req, res, next) => {
    const id = req.params.id
    const state = DownloadState.get(id)
    if (state) {
      return res.json(state)
    } else {
      res.status(404)
      return res.send()
    }
  })
  
  router
    .post('/medias', (req, res, next) => {
      const url = req.body.url
      const withDownload = req.body.withdownload
      if (url) {
        handleJson(create(url, withDownload), req, res)
          .then(afterUpdate)
        // const state = DownloadState.create(url)
        // create(url, withDownload)
        // .then(afterUpdate)
        // .then(medias => {
        //   state.status = 'downloaded'
        // })
        // res.json(state)
      } else {
        res.status(400)
        res.json({ message: 'url parameter needed' })
      }
    })

  router.put('/medias/download/:id', (req, res, next) => {
    const dbId = req.params.id
    handleJson(downloadOne(dbId), req, res)
      .then(afterUpdate)
  })

  let bagOfPromises = function (promise, args, start) {
    const step = 3
    const list = args.slice(start, start + step)
    return Promise.all(list.map(promise)).catch(e => Promise.resolve())
      .then(() => {
        if (args.length > start + step) {
          return bagOfPromises(promise, args, start + step)
        } else {
          return true
        }
      })
  }

  let createOrCache = function (url, withDownload = false) {
    return cache.find(url)
      .then(obj => {
        if (!obj) {
          return create(url, withDownload)
        } else {
          return Promise.resolve(null)
        }
      })
      .catch(err => {
        if (err.name !== 'InfoError') {
          console.error(err.stack)
          return cache.add(url)
        } else {
          return cache.add(url)
        }
      })
  }

  let create = function (url, withDownload) {
    // create only if the url is new
    return mediaDB.findByUrl(url)
      .then(res => {
        if (res.length === 0) {
          return Downloader.downloadMetadata(url)
            .catch(downError)
            .then(infos => {
              const promises = infos.map(info => {
                if (withDownload) {
                  return Downloader.downloadMedia(info)
                    .then(info => createOne(url, info))
                } else {
                  return createOne(url, info)
                }
              })
              return Promise.all(promises)
            })
        } else {
          return res
        }
      })
  }

  let createOne = function (url, info) {
    const absDirPath = filePath.getAbsDirPath(info)
    return Downloader.move(info, absDirPath)
      .then(files => {
        const archive = Archive.create(files)
        const media = Media.create(url, info, archive)
        return mediaDB.add(media)
      })
  }

  let downloadOne = function(id) {
    return mediaDB.findById(id)
      .then(media => {
        if (media.file_path === null) {
          return Archive.load(media)
            .then(archive => {
              let torrentPath
              if (archive.torrentPath) {
                torrentPath = Archive.absolute(archive.torrentPath)
              }
              return Downloader.createInfo(Archive.absolute(archive.infoPath), torrentPath)
            })
            .then(info => Downloader.downloadMedia(info))
            .then(info => {
              return Archive.load(media)
                .then(newArchive => {
                  const updatedMedia = Media.updateArchive(media, newArchive)
                  return mediaDB.replace(updatedMedia)
                })
            })
        } else {
          console.log('media already downloaded')
          return Promise.resolve(media)
        }
      })
  }

  let downError = function (err) {
    if (err.name !== 'eexist') {
      return Promise.reject(err)
    }
  }
}

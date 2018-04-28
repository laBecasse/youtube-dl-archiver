const wrapper = require('../libs/wrappers')
const Media = require('../models/Media.js')
const filePath = require('../models/FilePath')
const Downloader = require('../libs/downloader')

module.exports = function (app, collections) {
  const cache = collections.cache
  const collection = collections.links
  const media = Media(collection)

  app.get('/update', (req, res) => {
    create('')
      .then(() => {
        console.log('finish end')
        res.send('ok')
      })
      .catch(err => {
        console.log(err)
        res.send('error')
      })
    // wrapper.getLinks()
    //   .then(links => {
    //     let promises = []

    //     links.forEach(link => {
    //       cache.findOne({'url': link}, (err, r) => {
    //         if (err) throw err
    //         if (!r) {
    //           promises.push(
    //             Media(collection)
    //               .findOrDl(link)
    //               .catch(() => addToCache(link)))
    //         }
    //       })
    //     })
    //     res.send('ok')
    //   })
    //
  })

  let addToCache = function (link) {
    let item = { 'url': link }

    cache.insert(item, (err, res) => {
      if (err) return console.log(err)
      console.log('forget: ' + link)
    })
  }

  let create = function (url, forced) {
    return media.findUrl(url)
      .then(res => {
        console.log(res)
        if (res.length === 0 || forced) {
          return Downloader.info(url)
        } else {
          return []
        }
      })
      .then(infos => {
        return Promise.all(infos.map(createOne(url)))
      })
  }

  let createOne = function (url) {
    return info => {
      const absfilepath = filePath.absolute(info)
      const filepath = filePath.relative(info)

      return Downloader.download(info, absfilepath)
        .then(() => {
          return media.add(info.webpage_url, url, filepath, info)
        })
        .catch(downError)
    }
  }

  let downError = function (err) {
    if (err.message !== 'EEXIST') {
      return Promise.reject(err)
    }
  }
}

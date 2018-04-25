const path = require('path')
const Downloader = require('../libs/downloader')

const ARCHIVES_DIR = './archives/'

module.exports = function (collection) {
  let create = function (url, filepath, info) {
    return new Promise((resolve, reject) => {
      const item = {
        'url': url,
        'filepath': filepath,
        'info': info
      }

      collection.insert(item, (err, res) => {
        if (err) {
          reject(err)
        } else {
          console.log('create: ' + url)
          resolve(url)
        }
      })
    })
  }

  let remove = function (url) {
    return new Promise((resolve, reject) => {
      const selector = { 'url': url }

      collection.remove(selector, (err) => {
        if (err) return reject(err)
        resolve()
      })
    })
  }

  // we always use this function on url that
  // are not in the database
  let download = function (url) {
    return new Promise((resolve, reject) => {
      let dl = new Downloader(url)

      dl.getInfo()
        .then(info => {
          const uploader = info.uploader_id
          const filename = info._filename
          const extractor = info.extractor
          const dirpath = (uploader) ? path.join(ARCHIVES_DIR + extractor, uploader) : ARCHIVES_DIR + extractor
          const filepath = path.join(dirpath, filename)

          const item = {
            'url': url,
            'filepath': filepath,
            'info': info
          }

          dl.pipe(dirpath, filepath)
            .then(() => {
              resolve(item)
            })
            .catch(err => {
              if (err.message === 'EEXIST') {
                resolve(item)
              } else {
                reject(err)
              }
            })
        })
        .catch(reject)
    })
  }

  let downloadAndCreate = function (url) {
    return new Promise((resolve, reject) => {
      download(url)
        .then(item => {
          create(item.url, item.filepath, item.info)
            .then(item => resolve(item))
            .catch(reject)
        })
        .catch(reject)
    })
  }

  return {
    findOrDl: function (url) {
      return new Promise((resolve, reject) => {
        collection.findOne({'url': url}, function (err, item) {
          if (err) return reject(err)

          // if the url is saved in the database
          if (item) {
            const download = new Downloader(url)
            // if the file is still in archives
            download.exists(item.filepath)
              .then(exist => {
                if (exist) {
                  resolve(item)
                } else {
                  remove(url)
                    .then(() => {
                      downloadAndCreate(url)
                        .then(() => resolve(item))
                        .catch(resolve)
                    })
                    .catch(resolve)
                }
              })
          } else {
            downloadAndCreate(url)
              .then(() => resolve(item))
              .catch(reject)
          }
        })
      })
    }
  }
}

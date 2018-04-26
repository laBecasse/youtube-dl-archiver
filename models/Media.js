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

  let find = function (url) {
    return new Promise((resolve, reject) => {
      collection.findOne({'url': url}, (err, res) => {
        if (err) {
          reject(err)
        } else {
          resolve(res)
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
    let dl = new Downloader(url)
    let item

    return dl.getInfo()
      .then(info => {
        const uploader = info.uploader_id
        const filename = info._filename
        const extractor = info.extractor
        const dirpath = (uploader) ? path.join(ARCHIVES_DIR + extractor, uploader) : ARCHIVES_DIR + extractor
        const filepath = path.join(dirpath, filename)

        item = {
          'url': url,
          'filepath': filepath,
          'info': info
        }

        return dl.pipe(filepath)
      })
      .then(() => item)
      .catch(err => {
        if (err.message === 'EEXIST') {
          return Promise.resolve(item)
        } else {
          return Promise.reject(err)
        }
      })
  }

  let downloadAndCreate = function (url) {
    return download(url)
      .then(item => {
        return create(item.url, item.filepath, item.info)
      })
  }

  return {
    findOrDl: function (url) {
      return find(url)
        .then(item => {
          if (item) {
            // if the url is saved in the database
            const dl = new Downloader(url)

            // if the file is still in archives
            return dl.exists(item.filepath)
              .then(exist => {
                if (exist) {
                  return item
                } else {
                  return remove(url)
                    .then(() => {
                      return downloadAndCreate(url)
                    })
                }
              })
          } else {
            return downloadAndCreate(url)
          }
        })
    }
  }
}

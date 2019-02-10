const Mime = require('mime')

const HOST = process.env.HOST

const LANGS = ['fr', 'en']

module.exports = function (links) {

  let encodeURIPath = function(path) {
    return path.split('/').map(encodeURIComponent).join('/')
  }
  
  let build = function (obj) {
    if (obj) {
      let testSub = function (lang) {
        return fileName => {
          const re = new RegExp('.' + lang + '.')
          return re.test(fileName)
        }
      }

      let subtitlesArray
      if (obj.subtitles) {
        subtitlesArray = LANGS.reduce((res, lang) => {
          const filePath = obj.subtitles.find(testSub(lang))
          if (filePath) {
            res.push({
              url: HOST + '/archives/' + encodeURIPath(filePath),
              file_path: filePath,
              lang: lang
            })
          }
          return res
        }, [])
      }

      let thumb
      if (obj.thumbnails && obj.thumbnails.length > 0) {
        thumb = {
          url: HOST + '/archives/' + encodeURIPath(obj.thumbnails[0]),
          file_path: obj.thumbnails[0]
        }
      }

      return {
        id: obj._id,
        url: obj.url,
        media_url: obj.media_url,
        ext: obj.info.ext,
        mime: Mime.lookup(obj.info.ext),
        title: obj.info.title,
        description: obj.info.description,
        tags: obj.info.tags,
        uploader: obj.info.uploader,
        creator: obj.info.creator,
        channel_id: obj.info.channel_id,
        channel_url: obj.info.channel_url,
        creation_date: obj.creation_date,
        upload_date: obj.info.upload_date,
        file_url: HOST + '/archives/' + encodeURIPath(obj.file_path),
        file_path: obj.file_path,
        thumbnail: thumb,
        subtitles: subtitlesArray
      }
    } else {
      return null
    }
  }

  let insertOne = function (document) {
    let action = function (collection) {
      return new Promise((resolve, reject) => {
        collection.insertOne(document, (err, res) => {
          if (err) return reject(err)
          return resolve(document)
        })
      })
    }

    return links.apply(action)
  }

  let insert = function (mediaUrl, url, filepath, thumbnails, subtitles, info) {
    const selector = {
      'url': url,
      'media_url': mediaUrl
    }
    return find(selector)
      .then(conflict => {
        if (conflict.length === 0) {

          const date = new Date()
          
          const media = {
            'url': url,
            'media_url': mediaUrl,
            'file_path': filepath,
            'thumbnails': thumbnails,
            'subtitles': subtitles,
            'info': info,
            'creation_date': date.toISOString()
          }

          return insertOne(media)
        } else {
          const err = new Error('Index Key Error on url : ' + url + '\n mediaUrl ' + mediaUrl)
          err.name = 'DuplicateKey'
          err.code = 11000
          return Promise.reject(err)
        }
      })
  }

  let find = function (selector, limit, offset, sort) {
    limit = limit || 0
    offset = offset || 0
    sort = sort || {}

    let action = function (collection) {
      return new Promise((resolve, reject) => {
        collection.find(selector)
          .limit(limit)
          .skip(offset)
          .sort(sort)
          .toArray((err, res) => {
            if (err) {
              reject(err)
            } else {
              resolve(res)
            }
          })
      })
    }
    return links.apply(action)
  }

  let findOne = function (selector) {
    let action = function (collection) {
      return new Promise((resolve, reject) => {
        collection.findOne(selector, (err, res) => {
          if (err) {
            reject(err)
          } else {
            resolve(res)
          }
        })
      })
    }

    return links.apply(action)
  }

  let remove = function (id) {
    let action = function (collection) {
      return new Promise((resolve, reject) => {
        const selector = { '_id': links.ObjectID(id) }
        findOne(selector)
          .then(res => {
            collection.deleteOne(selector, (err, count) => {
              if (err) return reject(err)
              console.log("media " + id + " delected")
              resolve(res)
            })
          })
          .catch(reject)
      })
    }

    return links.apply(action)
  }

  let findUrl = function (url) {
    const selector = {
      $or: [
        {'url': url},
        {'media_url': url},
        {'info': {'webpage_url': url}}
      ]
    }
    return find(selector)
      .then(res => res.map(build))
  }

  let searchText = function (text, uploader, limit, offset) {
    limit = limit || 0
    offset = offset || 0
    let selector
    if (text & uploader) {
      selector = {
        $text: {$search: text},
        "info.uploader": uploader
      }
    } else {
      selector = {
        $text: {$search: text},
        uploader: uploader
      }
    }
    
    let action = function (collection) {
      return new Promise((resolve, reject) => {
        collection.find(selector)
          .project({score: {$meta: 'textScore'}})
          .sort({score: {$meta: 'textScore'}})
          .limit(limit)
          .skip(offset)
          .toArray((err, res) => {
            if (err) {
              reject(err)
            } else {
              resolve(res)
            }
          })
      })
    }
    return links.apply(action)
      .then(res => res.map(build))
  }

  let findUploader = function (uploader, limit, offset) {
    limit = limit || 0
    offset = offset || 0
    let selector = {
      "info.uploader": uploader
    }
    console.log(selector)
    let action = function (collection) {
      return new Promise((resolve, reject) => {
        collection.find(selector)
          .limit(limit)
          .skip(offset)
          .toArray((err, res) => {
            if (err) {
              reject(err)
            } else {
              resolve(res)
            }
          })
      })
    }
    return links.apply(action)
      .then(res => res.map(build))
  }

  return {
    add: function (mediaUrl, url, filepath, thumbnails, subtitles, info) {
      return insert(mediaUrl, url, filepath, thumbnails, subtitles, info)
        .then(document => {console.log(build(document)); return build(document)})
    },
    findByUrl: findUrl,
    findAll: function (limit, offset) {
      let selector = {}
      let sort = {
        'creation_date': -1}
      return find(selector, limit, offset, sort)
        .then(res => res.map(build))
    },
    findById: function (id) {
      let selector = {_id: new links.ObjectID(id)}
      return findOne(selector)
        .then(res => build(res))
    },
    search: function(text, uploader, limit, offset) {
      if (text) {
        return searchText(text, uploader, limit, offset)
      } else {
        return findUploader(uploader, limit, offset)
      }
    },
    removeById: function (id) {
      return remove(id)
    }
  }
}

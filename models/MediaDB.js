const Mime = require('mime')
const config = require('../config')
const Media = require('./Media')
const HOST = config.host

const LANGS = config.subtitleLangs

module.exports = function (links) {

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

  let insert = function (media) {
    const selector = {
      'url': media.url,
      'media_url': media.media_url
    }
    return find(selector)
      .then(conflict => {
        if (conflict.length === 0) {
          return insertOne(media)
            .then(() => {
              return findOne(selector)
            })
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
              console.log("media " + id + " deleted")
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
      .then(res => res.map(Media.createFromDocument))
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
        $text: { $search: text }
      }
    }

    console.log(selector)
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
  }

  let findUploader = function (uploader, limit, offset) {
    limit = limit || 0
    offset = offset || 0
    let sort = {
      creation_date: -1
    }

    let selector = {
      uploader: uploader
    }

    let action = function (collection) {
      return new Promise((resolve, reject) => {
        collection.find(selector)
          .sort(sort)
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
  }

  let build = function (obj) {
    if (obj) {
      if (Array.isArray(obj)) {
        return obj.map(o => new Media(o))
      } else {
        return new Media(obj)
      }
    } else {
      return null
    }
  }
  
  return {
    add: function (media) {
      return insert(media)
        .then(obj => build(obj))
    },
    findByUrl: findUrl,
    findAll: function (limit, offset) {
      let selector = {}
      let sort = {
        'creation_date': -1}
      return find(selector, limit, offset, sort)
        .then(build)
    },
    findById: function (id) {
      let selector = {_id: new links.ObjectID(id)}
      return findOne(selector)
        .then(build)
    },
    search: function(text, uploader, limit, offset) {
      if (text) {
        return searchText(text, uploader, limit, offset)
          .then(build)
      } else {
        return findUploader(uploader, limit, offset)
          .then(build)
      }
    },
    removeById: function (id) {
      return remove(id)
        .then(build)
    }
  }
}

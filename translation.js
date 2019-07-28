const Media = require('./models/Media')

const config = require('./config')
const MongoDB = require('./mongo-database')
config.mongo.collections.medias = 'medias'
const collections = MongoDB(config['mongo'])

// create collections if they don't exist
collections['medias'].create().catch(console.error)
const links = collections['links']

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


find({}).then(documents => {
  for(doc of documents) {
    const media = Media.createFromDocument(doc)
    media._id = media.id
    console.log(media)
    insertOne(media)
  }
})

let insertOne = function (document) {
  let action = function (collection) {
    return new Promise((resolve, reject) => {
      collection.insertOne(document, (err, res) => {
        if (err) return reject(err)
        resolve(res)
      })
    })
  }
  return collections['medias'].apply(action)
}


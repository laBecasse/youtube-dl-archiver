const config = require('./config')
const MongoDB = require('./mongo-database')

const collections = MongoDB(config['mongo'])

// rename key tags to downloadedTags
let action1 = function (collection) {
  const selector = {}
  const modifier = { $rename: { "tags": "downloadedTags" }}
  return new Promise((resolve, reject) => {
    collection.updateMany(selector, modifier, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}

collections['links'].apply(action1).then(console.log)

// replace null tags with empty array
let action2 = function (collection) {
  const selector = {tags: null}
  const modifier = {$set: {tags: []}}
  return new Promise((resolve, reject) => {
    collection.updateMany(selector, modifier, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}

collections['links'].apply(action2).then(console.log)

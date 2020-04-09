const config = require('./config')
const MongoDB = require('./mongo-database')

const collections = MongoDB(config['mongo'])

// replace null tags with empty array
let action = function (collection) {
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

collections['links'].apply(action).then(console.log)

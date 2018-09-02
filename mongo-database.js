const mongo = require('mongodb')
const MongoClient = mongo.MongoClient

module.exports = function (config) {
  const host = config['host']
  const dbName = config['db']
  const collections = config['collections']
  const url = 'mongodb://' + host

  let createCollection = function (collectionName) {
    let apply = function (action) {
      return new Promise(function (resolve, reject) {
        MongoClient.connect(url, { useNewUrlParser: true })
          .then(client => {
            // Client returned
            let db = client.db(dbName)
            db.collection(collectionName, {strict: true}, function (error, collection) {
              if (error) {
                console.log('Could not access collection: ' + error.message)
                reject(error)
              } else {
                action(collection)
                  .then(res => {
                    client.close()
                    resolve(res)
                  })
                  .catch(err => reject(err))
              }
            })
          })
          .catch(err => reject(err))
      })
    }

    let defineKey = function (keys) {
      let action = function (collection) {
        return new Promise((resolve, reject) => {
          collection.createIndex(keys, { unique: true }, function (err) {
            if (err) return reject(err)
            resolve(null)
          })
        })
      }
      return apply(action)
    }

    let create = function () {
      const url = 'mongodb://' + host
      return new Promise((resolve, reject) => {
        MongoClient.connect(url, { useNewUrlParser: true })
          .then(client => {
            // Client returned
            let db = client.db(dbName)
            db.createCollection(collectionName, err => {
              if (err) reject(err)
              else resolve()
            })
            client.close()
          })
      })
    }

    return {
      'create': create,
      'apply': apply,
      'defineKey': defineKey,
      'ObjectID': mongo.ObjectID
    }
  }

  const DB = {}

  for (let name in collections) {
    DB[name] = createCollection(collections[name])
  }

  return DB
}

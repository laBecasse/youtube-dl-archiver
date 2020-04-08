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

    let defineTextIndex = function (keys) {
      let action = function (collection) {
        return new Promise((resolve, reject) => {
          let columns = {}
          for (let key of keys) {
            columns[key] = 'text'
          }

          collection.createIndex(columns)
        })
      }

      return apply(action)
    }

    let createCollection = function () {
      return new Promise((resolve, reject) => {
        MongoClient.connect(url, { useNewUrlParser: true })
          .then(client => {
            // Client returned
            let db = client.db(dbName)
            db.createCollection(collectionName, err => {
              if (err) reject(err)
              else resolve()

              client.close()
            })
          })
      })
    }

    let createView = function (source, pipeline) {
      return new Promise((resolve, reject) => {
        MongoClient.connect(url, { useNewUrlParser: true })
          .then(client => {
            // Client returned
            let db = client.db(dbName)
            const options = {
              viewOn: collections[source],
              pipeline: pipeline
            }
            db.createCollection(collectionName, options, err => {
              if (err) reject(err)
              else resolve()

              client.close()
            })
          })
      })
    }

    return {
      createCollection: createCollection,
      createView: createView,
      apply: apply,
      defineKey: defineKey,
      defineTextIndex: defineTextIndex,
      ObjectID: mongo.ObjectID
    }
  }

  const DB = {}

  for (let name in collections) {
    DB[name] = createCollection(collections[name])
  }

  return DB
}

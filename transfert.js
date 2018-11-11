const config = require('./config.json')
const MongoDB = require('./mongo-database')

const collections = MongoDB(config['mongo'])

// create collections if they don't exist
collections['links'].create().catch(console.error)

var Db = require('tingodb')().Db,
    assert = require('assert');

var db = new Db('.', {});

var collection = db.collection("links");

collection.find({}, (e, r) => r.toArray((e,a) => {
  console.log(a.length)
  a.forEach(function(m){
    var d = m.creation_date
    var date = new Date()
    date.setYear(d.substring(0,4))
    date.setMonth(d.substring(4,6))
    date.setDate(d.substring(6,8))
    m.creation_date = date.toISOString()

    insertOne(m)
  })
}))


  let insertOne = function (document) {
    let action = function (collection) {
      return new Promise((resolve, reject) => {
        collection.insertOne(document, (err, res) => {
          if (err) return reject(err)
          resolve(res)
        })
      })
    }
    return collections['links'].apply(action)
  }

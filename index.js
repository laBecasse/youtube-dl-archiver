const express = require('express')
const bodyParser = require('body-parser')
const Db = require('tingodb')().Db

process.env.ARCHIVES_DIR = process.env.ARCHIVES_DIR || __dirname + '/archives'
process.env.HOST = process.env.HOST || 'http://localhost'
const port = process.env.PORT = process.env.PORT || 8000

const app = express()
const db = new Db(process.env.ARCHIVES_DIR + '/db', {})
const collections = {
  'links': db.collection('links'),
  'cache': db.collection('cache')
}
collections.cache.createIndex({ 'url': 1 }, { unique: true })
collections.links.createIndex({ 'url': 1, 'mediaUrl': 1 }, { unique: true })

app.set('json spaces', 40)
app.use(bodyParser.urlencoded({ extended: true }))

app.use('/static', express.static('ui'))

require('./routes')(app, collections)

app.listen(port, () => {
  console.log('We are live on http://localhost:' + port)
})

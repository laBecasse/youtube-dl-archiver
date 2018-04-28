const express = require('express')
const bodyParser = require('body-parser')
const Db = require('tingodb')().Db

process.env.ARCHIVES_DIR = process.env.ARCHIVES_DIR || __dirname + '/archives'

const app = express()
const db = new Db(process.env.ARCHIVES_DIR + '/db', {})
const collections = {
  'links': db.collection('links'),
  'cache': db.collection('cache')
}

const port = 8000

app.use(bodyParser.urlencoded({ extended: true }))

require('./routes')(app, collections)

app.listen(port, () => {
  console.log('We are live on http://localhost:' + port)
})

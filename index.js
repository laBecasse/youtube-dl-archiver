const express = require('express')
const bodyParser = require('body-parser')
const Db = require('tingodb')().Db

const app = express()
const db = new Db('./archives/db', {})
const collections = {
  'links': db.collection('links'),
  'cache': db.collection('cache')
}

const port = 8000
process.env.ROOT = process.env.ROOT || __dirname

app.use(bodyParser.urlencoded({ extended: true }))

require('./routes')(app, collections)

app.listen(port, () => {
  console.log('We are live on http://localhost:' + port)
})

const config = require('./config.json')
const express = require('express')
const bodyParser = require('body-parser')
const MongoDB = require('./mongo-database')

process.env.ARCHIVES_DIR = process.env.ARCHIVES_DIR || config['archives-dir']
process.env.HOST = process.env.HOST || 'http://localhost:8000'
const collections = MongoDB(config['mongo'])

// create collections if they don't exist
collections['links'].create().catch(console.error)
collections['cache'].create().catch(console.error)

const port = process.env.PORT || config['port'] || 8000
const app = express()

app.set('json spaces', 40)
app.use(bodyParser.urlencoded({ extended: true }))

app.use('/', express.static('ui'))

require('./routes')(app, collections)

app.listen(port, () => {
  console.log('We are live on http://localhost:' + port)
})

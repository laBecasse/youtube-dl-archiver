const path = require('path')
const config = require('./config')
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const MongoDB = require('./mongo-database')

// set environment
const collections = MongoDB(config['mongo'])

// create collections if they don't exist
collections[config.mongo.collections.links].create().catch(console.error)
const textKeys = ['info.title', 'info.description', 'info.tags', 'info.uploader', 'info.creator']
collections[config.mongo.collections.links].defineTextIndex(textKeys).catch(console.error)
collections[config.mongo.collections.cache].create().catch(console.error)

const port = config.port
const app = express()
app.use(cors())
app.set('json spaces', 40)
app.use(bodyParser.urlencoded({ extended: true }))

app.use('/', express.static('front/dist'))
app.use('/medias/*', express.static('front/dist'))
app.use('/archives', express.static(config.archivesDir))

const router = require('./routes')(collections)

app.use('/api', router)

app.listen(port, () => {
  console.log('We are live on http://localhost:' + port)
})

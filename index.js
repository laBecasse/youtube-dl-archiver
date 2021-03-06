const path = require('path')
const config = require('./config')
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const MongoDB = require('./mongo-database')

// set environment
const collections = MongoDB(config['mongo'])

// create collections if they don't exist
collections['links'].createCollection().catch(console.error)
//collections['links'].defineKey({creation_date: -1})
const textKeys = ['title', 'description', 'downloadedTags', 'tags', 'uploader', 'creator']
collections['links'].defineTextIndex(textKeys).catch(console.error)

// create view tags on links
const tagPipeline = [{$project:{"tags": 1, creation_date: 1}}, {$unwind: "$tags"}, {$group: {_id: "$tags", mediaCount: {$sum: 1}, creation_date: {$min: "$creation_date"}, update_date: {$max: "$creation_date"}}}]
collections['tags'].createView('links', tagPipeline)

const port = config.port
const app = express()
app.use(cors())
app.set('json spaces', 40)
app.use(bodyParser.json())

app.use('/', express.static('front/dist'))
app.use('/medias/*', express.static('front/dist'))
app.use('/archives', express.static(config.archivesDir))

const router = require('./routes')(collections)
const feeds = require('./routes/feeds')(collections)

app.use('/api', router)
app.use('/feed', feeds)

app.listen(port, () => {
  console.log('We are live on http://localhost:' + port)
})

require('./init').init(collections['links']).catch(console.log)

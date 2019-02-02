const path = require('path')
const config = require('./config.json')
const express = require('express')
const bodyParser = require('body-parser')
const MongoDB = require('./mongo-database')

process.env.ARCHIVES_DIR = process.env.ARCHIVES_DIR || config['archives-dir'] || path.join(__dirname, 'archives')
process.env.ARCHIVES_TMP_DIR = process.env.ARCHIVES_TMP_DIR || path.join(process.env.ARCHIVES_DIR, 'tmp')
process.env.YOUTUBE_DL_BIN = process.env.YOUTUBE_DL_BIN || path.join(__dirname, 'bin/youtube-dl')
process.env.HOST = process.env.HOST || config['host'] || 'http://localhost:8000'
const collections = MongoDB(config['mongo'])

// create collections if they don't exist
collections['links'].create().catch(console.error)
const textKeys = ['info.title', 'info.description', 'info.tags', 'info.uploader', 'info.creator']
collections['links'].defineTextIndex(textKeys).catch(console.error)
collections['cache'].create().catch(console.error)

const port = process.env.PORT || config['port'] || 8000
const app = express()

app.set('json spaces', 40)
app.use(bodyParser.urlencoded({ extended: true }))

app.use('/', express.static('ui'))
app.use('/archives', express.static(process.env.ARCHIVES_DIR))

const router = require('./routes')(collections)

app.use('/api', router)

app.listen(port, () => {
  console.log('We are live on http://localhost:' + port)
})

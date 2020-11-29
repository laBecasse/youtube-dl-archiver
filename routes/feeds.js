const express = require('express')
const findRoutes = require('./find-routes')
const tagRoutes = require('./tag-routes.js')

const xml = require('xml')
const UnarchivedMedia = require('../models/UnarchivedMedia')
const HOST = require('../config').host

module.exports = function (collections) {
  const router = express.Router()
  router.use(middleware)
  findRoutes(router, handleJson, handleError, collections['links'])
  tagRoutes(router, handleJson, handleError, collections['tags'], collections['links'])
  return router
}

let middleware = function (req, res, next) {
  req.query.limit = 10
  next()
}

let handleJson = function (promises, req, res) {
  return promises
    .then(object => {
      if (object) {
        if (Array.isArray(object) && object.length && object[0] instanceof UnarchivedMedia) {
          const xmlString = '<?xml version="1.0" encoding="UTF-8"?>' + rss(req.url, object)
          res.header('Content-Type', 'application/rss+xml')
          res.send(xmlString)
        } else {
          res.status(404)
          res.send('not found')
        }
      } else {
        res.status(404)
        res.json({ message: 'not found' })
        return []
      }
    })
    .catch(handleError(res))
}

const rss = (url, medias) => {
  const xmlObject = {
    rss: [
      {
        _attr: {
          version: '2.0',
          'xmlns:atom': 'http://www.w3.org/2005/Atom'
        }
      },
      {
        channel: [
          {
            'atom:link': {
              _attr: {
                href: url,
                rel: 'self',
                type: 'application/rss+xml'
              }
            }
          },
          { title: 'Media Archiver' },
          { link: HOST },
          { description: '' },
          { language: 'en-us' },
          ...medias.map((m) => {
            const media = m.toAPIJSON()
            return {
              item: [
                { title: media.title },
                { pubDate: media.creation_date },
                { link: HOST + '/medias/' + media.id },
                { guid: media.id },
                { description: { _cdata: getHTMLDescription(media) } }
              ]
            }
          })
        ]
      }
    ]
  }

  return xml(xmlObject)
}

const urlify = function (text) {
  var urlRegex = /(https?:\/\/[^\s]+)/g
  return text.replace(urlRegex, function (url) {
    return '<a href="' + url + '">' + url + '</a>'
  })
}

const htmlEscape = function (text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

const getHTMLDescription = function (media) {
  let description

  if (media.mime && media.file_url) {
    switch (media.mime.split('/')[0]) {
      case 'video':
        description = `<video controls="controls" poster="${media.thumbnails[0] && media.thumbnails[0].url}"><source src="${media.file_url}" type="${media.mime}"></video><br/>`
        break
      case 'audio':
        description = `<audio controls="controls" poster="${media.thumbnails[0] && media.thumbnails[0].url}"><source src="${media.file_url}" type="${media.mime}"></audio><br/>`
        break
    }
  }

  if (media.description) {
    let htmlDescription = htmlEscape(media.description)
    htmlDescription = urlify(htmlDescription)
    htmlDescription = htmlDescription.replace(/\r\n?|\n/g, '<br>')
    description += htmlDescription
  }

  return description
}

let handleError = function (res) {
  return err => {
    console.error(err.stack)
    res.status(500)
      .json({ error: 'server error' })
  }
}

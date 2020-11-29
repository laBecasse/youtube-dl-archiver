const express = require('express')
const updateRoutes = require('./update-routes')
const findRoutes = require('./find-routes')
const deleteRoutes = require('./delete-routes')
const tagRoutes = require('./tag-routes.js')
const lookupRoutes = require('./lookup-routes')
const tmpFileRoute = require('./tmp-file-route')
const UnarchivedMedia = require('../models/UnarchivedMedia')

module.exports = function (collections) {
  const router = express.Router()
  updateRoutes(router, handleJson, handleError, collections['links'], collections['cache'])
  findRoutes(router, handleJson, handleError, collections['links'])
  deleteRoutes(router, handleJson, handleError, collections['links'], collections['cache'])
  tagRoutes(router, handleJson, handleError, collections['tags'], collections['links'])
  lookupRoutes(router, handleJson, handleError)
  tmpFileRoute(router, handleJson, handleError, collections['links'])

  return router
}

let handleJson = function (promises, req, res) {
  return promises
    .then(object => {
      console.log(object)
      if (object) {
        if (Array.isArray(object)) {
          res.json(object.map(o => {
            if (o instanceof UnarchivedMedia) {
              return o.toAPIJSON()
            } else {
              return o
            }
          }))
          return object
        } else {
          res.json(object.toAPIJSON())
          return [object]
        }
      } else {
        res.status(404)
        res.json({ message: 'not found' })
        return []
      }
    })
    .catch(handleError(res))
}

let handleError = function (res) {
  return err => {
    console.error(err.stack)
    res.status(500)
      .json({ error: 'server error' })
  }
}

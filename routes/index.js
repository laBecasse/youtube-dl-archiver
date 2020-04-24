const express = require('express')
const updateRoutes = require('./update-routes')
const findRoutes = require('./find-routes')
const deleteRoutes = require('./delete-routes')
const tagRoutes = require('./tag-routes.js')
const lookupRoutes = require('./lookup-routes')

module.exports = function (collections) {
  const router = express.Router()
  updateRoutes(router, collections['links'], collections['cache'])
  findRoutes(router, collections['links'])
  deleteRoutes(router, collections['links'], collections['cache'])
  tagRoutes(router, collections['tags'], collections['links'])
  lookupRoutes(router)
  return router
}

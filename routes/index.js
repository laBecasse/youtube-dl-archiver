const express = require('express')
const updateRoutes = require('./update-routes')
const findRoutes = require('./find-routes')
const deleteRoutes = require('./delete-routes')

module.exports = function (collections) {
  const router = express.Router()
  updateRoutes(router, collections['links'], collections['cache'])
  findRoutes(router, collections['links'])
  deleteRoutes(router, collections['links'], collections['cache'])

  return router
}

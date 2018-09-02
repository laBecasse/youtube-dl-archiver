const updateRoutes = require('./update-routes')
const findRoutes = require('./find-routes')
const deleteRoutes = require('./delete-routes')

module.exports = function (app, collections) {
  updateRoutes(app, collections['links'], collections['cache'])
  findRoutes(app, collections['links'])
  deleteRoutes(app, collections['links'])
}

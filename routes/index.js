const updateRoutes = require('./update-routes')
const findRoutes = require('./find-routes')
const deleteRoutes = require('./delete-routes')

const uiRoutes = require('./ui-routes')

module.exports = function (app, collections) {
  updateRoutes(app, collections)
  findRoutes(app, collections.links)
  deleteRoutes(app, collections.links)
  uiRoutes(app)
}

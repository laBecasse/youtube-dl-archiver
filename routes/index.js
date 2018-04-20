const updateRoutes = require("./update-routes.js");

module.exports = function(app, collection) {
  updateRoutes(app, collection);
  // Other route groups could go here, in the future
};

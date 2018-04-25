const updateRoutes = require("./update-routes.js");

module.exports = function(app, collections) {
  updateRoutes(app, collections);
  // Other route groups could go here, in the future
};

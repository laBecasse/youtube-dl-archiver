const wrapper = require('../libs/wrappers')

module.exports = function (app, collections) {
  const cache = collections.cache
  const collection = collections.links

  const Media = require('../models/Media.js')

  app.get('/update', (req, res) => {
    wrapper.getLinks()
      .then(links => {
        let promises = []

        links.forEach(link => {
          cache.findOne({'url': link}, (err, r) => {
            if (err) throw err
            if (!r) {
              promises.push(
                Media(collection)
                  .findOrDl(link)
                  .catch(() => addToCache(link)))
            }
          })
        })
        res.send('ok')
      })
  })

  let addToCache = function (link) {
    let item = { 'url': link }

    cache.insert(item, (err, res) => {
      if (err) return console.log(err)
      console.log('forget: ' + link)
    })
  }
}

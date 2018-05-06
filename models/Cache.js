module.exports = function (cache) {
  return {
    find: function (url) {
      let selector = { 'url': url }
      return new Promise((resolve, reject) => {
        cache.findOne(selector, (err, res) => {
          if (err) return reject(err)
          resolve(res)
        })
      })
    },
    add: function (url) {
      let selector = { 'url': url }
      return new Promise((resolve, reject) => {
        cache.insert(selector, (err, res) => {
          if (err) return reject(err)
          console.log('forget: ' + url)
          resolve()
        })
      })
        .catch(err => {
          if (err.message !== 'duplicate key error index') {
            return Promise.reject(err)
          } else {
            return Promise.resolve()
          }
        })
    }
  }
}

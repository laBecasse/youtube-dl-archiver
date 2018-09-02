module.exports = function (cache) {
  return {
    find: function (url) {
      let selector = { 'url': url }

      let action = function (collection) {
        return new Promise((resolve, reject) => {
          collection.findOne(selector, (err, res) => {
            if (err) return reject(err)
            resolve(res)
          })
        })
      }

      return cache.apply(action)
    },
    add: function (url) {
      let selector = { 'url': url }
      let action = function (collection) {
        return new Promise((resolve, reject) => {
          collection.insert(selector, (err, res) => {
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

      return cache.apply(action)
    }
  }
}

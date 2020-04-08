module.exports = function (tags) {

  let getAll = function (selector, sort) {
    sort = sort || {}

    let action = function (collection) {
      return new Promise((resolve, reject) => {
        collection.find(selector)
          .sort(sort)
          .toArray((err, res) => {
            if (err) {
              reject(err)
            } else {
              resolve(res)
            }
          })
      })
    }
    return tags.apply(action)
  }

  return {
    getAllTags: getAll
  }
}

module.exports = function (collection) {
  let insert = function (mediaId, url, filepath, info) {
    return findMediaUrl(mediaId, url)
      .then(res => {
        if (!res) {
          const media = {
            'mediaId': mediaId,
            'filepath': filepath,
            'url': url,
            'info': info
          }
          return new Promise((resolve, reject) => {
            collection.insert(media, (err, res) => {
              if (err) {
                reject(err)
              } else {
                console.log('create: ' + mediaId)
                resolve(res)
              }
            })
          })
        } else {
          console.log(res)
          throw new Error('Conflict on mediaUrl key')
        }
      })
  }

  let find = function (selector) {
    return new Promise((resolve, reject) => {
      collection.find(selector, (err, res) => {
        if (err) {
          reject(err)
        } else {
          res.toArray((err, a) => resolve(a))
        }
      })
    })
  }

  let findOne = function (selector) {
    return new Promise((resolve, reject) => {
      collection.findOne(selector, (err, res) => {
        if (err) {
          reject(err)
        } else {
          resolve(res)
        }
      })
    })
  }
  
  let findMedia = function (mediaId) {
    let selector = {'mediaId': mediaId}
    return find(selector)
  }

  let update = function (mediaId, media) {
    return new Promise((resolve, reject) => {
      let selector = {'mediaId': mediaId}

      collection.update(selector, media, (err, res) => {
        if (err) {
          reject(err)
        } else {
          resolve(res)
        }
      })
    })
  }

  let remove = function (mediaId) {
    return new Promise((resolve, reject) => {
      const selector = { 'mediaId': mediaId }

      collection.remove(selector, (err) => {
        if (err) return reject(err)
        resolve()
      })
    })
  }

  let findUrl = function (url) {
    const selector = {
      'url': url
    }
    return find(selector)
  }

  let findMediaUrl = function (mediaId, url) {
    let selector = {
      'mediaId': mediaId,
      'url': url
    }
    return findOne(selector)
  }

  return {
    add: insert,
    findUrl: findUrl
  }
}

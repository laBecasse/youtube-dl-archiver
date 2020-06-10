const Media = require('./models/MediaDB')
const FilePath = require('./models/FilePath')
const Webtorrent = require('./libs/webtorrent')

let bagOfPromises = function (promise, args, start) {
  const step = 3
  const list = args.slice(start, start + step)
  return Promise.all(list.map(promise))
    .then(() => {
      if (args.length > start + step) {
        return bagOfPromises(promise, args, start + step)
      } else {
        return true
      }
    })
}

function seedAllMedias(Medias) {
  return new Promise((resolve, reject) => {
    return Medias.findAll().then(medias => {
      const filteredMedias = medias.filter(m => m.torrent_path).filter(m => m.file_path).slice(0,5)
      const mediaTorrentPaths = filteredMedias.map(m => FilePath.absolute(m.torrent_path))
      const mediaDirectoryPaths = filteredMedias.map(m => FilePath.absolute(m.file_path))

      const inputs = []
      for (let i = 0; i < mediaTorrentPaths.length; i++) {
        inputs[i] = [mediaDirectoryPaths[i], mediaTorrentPaths[i]]
      }
      return bagOfPromises(seed, inputs, 0)
    })
  })
}

function seed (arr) {
  return Webtorrent.seed(arr[0], arr[1])
    .catch(e => {
      console.log('error while seeding ' + arr[0] + ':\n' + e)
    })
}

module.exports = {
  init: function(links) {
    const Medias = Media(links)
    const promises = [seedAllMedias(Medias)]
    return Promise.all(promises)
  }
}

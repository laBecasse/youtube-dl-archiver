const fs = require('fs')
const createTorrent = require('create-torrent')
const parseTorrent = require('parse-torrent')
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
      const filteredMedias = medias.filter(m => m.torrent_path).filter(m => m.file_path).slice(0, 25)
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

// useful methods to find files whose has not the same infoHash than its torrent
// replace seed by test in seedAllMedias
function test (arr) {
  return new Promise((resolve, reject) => {
    const torrent = parseTorrent(fs.readFileSync(arr[1]))
    createTorrent(arr[0], { announce: torrent.annonce }, function (err, buf) {
      if (err) return reject(err)
      const tor = parseTorrent(buf)
      if (torrent.infoHash !== tor.infoHash) {
        console.log(arr[0])
        console.log(torrent.infoHash, tor.infoHash)
      }
      resolve()
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

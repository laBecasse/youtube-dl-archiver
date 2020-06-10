const fs = require('fs')
const createTorrent = require('create-torrent')
const WebTorrent = require('webtorrent-hybrid')
const client = new WebTorrent()
const config = require('../../config')

let trackers = [config.webtorrent.trackers]

global.WEBTORRENT_ANNOUNCE = null

function seed (path) {
  return new Promise((resolve, reject) => {
    client.seed(path, { announceList: trackers }, function (torrent) {
      resolve(torrent)
    })
  })
}

function download (torrentId, dirPath) {
  return new Promise((resolve, reject) => {
    const client = new WebTorrent()
    const options = {
      path: dirPath
    }
    client.add(torrentId, options, torrent => {
      const paths = torrent.files.map(f => f.path)
      torrent.on('done', () => {
        // client.destroy(err => {
        //   if (err) return reject(err)
        resolve(paths)
        // })
      })
      torrent.on('error', err => {
        reject(err)
      })
    })
    client.on('error', err => {
      reject(err)
    })
  })
}

function create (path, torrentFile) {
  return new Promise((resolve, reject) => {
    createTorrent(path, { announceList: trackers }, function (err, tor) {
      if (err) return reject(err)
      // return the buffer of the torrent file
      fs.writeFile(torrentFile, tor, (err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  })
}

module.exports = {
  'seed': seed,
  'create': create,
  'download': download
}

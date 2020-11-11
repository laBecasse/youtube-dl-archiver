const fs = require('fs')
const createTorrent = require('create-torrent')
const parseTorrent = require('parse-torrent')
const WebTorrent = require('webtorrent-hybrid')
const client = new WebTorrent()
const config = require('../../config')

let trackers = [config.webtorrent.trackers]

global.WEBTORRENT_ANNOUNCE = null

function seed (path, torrentPath) {
  return new Promise((resolve, reject) => {
    const opts = { }
    if (torrentPath) {
      const torrent = parseTorrent(fs.readFileSync(torrentPath))
      opts.announce = torrent.announce
    }

    client.seed(path, opts, function (torrent) {
      // console.log('seeding ' + torrent.name + ' with trackers ' + torrent.announce)
      // torrent.on('error', console.log)
      // torrent.on('warning', console.log)
      // torrent.on('ready', console.log)
      // torrent.on('noPeers', console.log)
      // torrent.on('wire', () => console.log('wire on ' + path))
      resolve(torrent)
    })
  })
}

function download (torrentPath, dirPath) {
  return new Promise((resolve, reject) => {

    const torrent = parseTorrent(fs.readFileSync(torrentPath))

    // if the torrent has already been added
    if (client.get(torrent)) {
      if (client.get(torrent).done) {
        // unstable state re download the files
        client.get(torrent).destroy(() => doDownload(torrent))
      } else {
        // downloading
        const error = new Error('torrent already added')
        return reject(error)
      }
    } else {
      doDownload(torrent)
    }

    function doDownload (t) {
      const options = {
        path: dirPath
      }
      client.add(t, options, torrent => {
        const paths = torrent.files.map(f => f.path)
        torrent.on('wire', () => console.log('wire on ' + torrentPath))
        torrent.on('done', () => {
          resolve(paths)
        })
        torrent.on('error', err => {
          reject(err)
        })
      })
      client.on('error', err => {
        reject(err)
      })
    }
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

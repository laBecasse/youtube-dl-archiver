const WebTorrent = require('webtorrent-hybrid')
const client = new WebTorrent()

let trackers = process.env.WEBTORRENT_TRACKERS

function seed(path) {
  return new Promise((resolve, reject) => {
    client.seed(path, { announce: trackers },
                function (torrent) {
                  console.log('Client is seeding ' + torrent.magnetURI)
                  console.log('Client is seeding:', torrent.infoHash)
                  console.log('Peer id: ', client.peerId)
                  resolve(torrent);
                })
  })
}

module.exports = {
  'seed': seed
}

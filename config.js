const dotenv = require('dotenv')
const path = require('path')

dotenv.config()

const afterUpdateModules = (process.env.AFTER_UPDATE) ? process.env.AFTER_UPDATE.split(' ').map(m => require(m)) : []
const afterUpdate = function (medias) {
  return Promise.all(afterUpdateModules.map(f => f(medias)))
    .then(() => medias)
}

module.exports = {
  port: process.env.PORT,
  host: process.env.HOST,
  youtubedlBin: process.env.YOUTUBE_DL_BIN,
  archivesDir: (path.isAbsolute(process.env.ARCHIVES_DIR)) ? process.env.ARCHIVES_DIR : path.join(__dirname, process.env.ARCHIVES_DIR),
  archivesTmpDir: (path.isAbsolute(process.env.ARCHIVES_TMP_DIR)) ? process.env.ARCHIVES_TMP_DIR : path.join(__dirname, process.env.ARCHIVES_TMP_DIR),
  subtitleLangs: process.env.SUBTITLE_LANGS.split(' '),
  mongo: {
    host: process.env.MONGO_HOST,
    db: process.env.MONGO_DB,
    collections: {
      links: process.env.MONGO_LINKS_COL,
      cache: process.env.MONGO_CACHE_COL,
      tags: process.env.MONGO_TAGS_VIEW
    }
  },
  webtorrent: {
    enabled: process.env.WEBTORRENT_ENABLE,
    trackers: process.env.WEBTORRENT_TRACKERS.split(' ')
  },
  afterUpdate: afterUpdate
}

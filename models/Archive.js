const fs = require('fs')
const path = require('path')
const config = require('../config')
const WebTorrent = require('../libs/webtorrent')
const ARCHIVES_DIR = config.archivesDir

class Archive {
  // every path is relative
  constructor (filesPath) {
    // relative directory path
    this.dirpath = path.dirname(filesPath[0])
    // media file path
    const mediaPaths = filesPath.filter(_testMedia)
    this.mediaPath = (mediaPaths.length !== 0) ? mediaPaths[0] : null

    this.infoPath = filesPath.filter(_testInfo)[0]

    this.filesPath = filesPath

    this.thumbnailsPath = filesPath
      .filter(_testTumbnails)

    this.subtitlesPath = filesPath
      .filter(_testSubtitles)

    const torrentPaths = filesPath.filter(_testTorrent)
    if (torrentPaths.length !== 0) {
      this.torrentPath = torrentPaths[0]
    }
  }

  remove () {
    const absDirPath = Archive.absolute(this.dirpath)
    for (let filePath of this.filesPath) {
      console.log('delete file ' + filePath)
      fs.unlinkSync(Archive.absolute(filePath))
    }
    console.log('delete directory ' + this.dirpath)
    fs.rmdirSync(absDirPath)
  }

  createTorrent () {
    if (!this.mediaPath) return Promise.reject(new Error('torrent creation require media to be downloaded.'))
    
    const torrentPath = this.mediaPath.substr(0, this.mediaPath.lastIndexOf('.')) + '.torrent'
    const absTorrentPath = Archive.absolute(torrentPath)
    const creation = WebTorrent.create(Archive.absolute(this.mediaPath), absTorrentPath)
    return creation.then(() => {
      this.filesPath.push(absTorrentPath)
      this.torrentPath = torrentPath
      return this
    })

  }

  isMediaDownloaded () {
    return this.mediaPath !== null
  }
  
  static relative (p) {
    return path.relative(ARCHIVES_DIR, p)
  }

  static absolute (p) {
    return path.join(ARCHIVES_DIR, p)
  }

  // factory
  // absFiles : absolute files path of the archive
  static create (absFilesPath) {
    if (absFilesPath.length === 0) {
      throw new Error('an archive can not be empty')
    }
    
    const filesPath = absFilesPath.map(Archive.relative)
    return new Archive(filesPath)
  }

  static load (media) {
    const absDirPath = Archive.absolute(media.archive_dir)
    return new Promise((resolve, reject) => {
      fs.readdir(absDirPath, (err, files) => {
        if (err) return reject(err)
        const absFilesPath = files.map(file => path.join(absDirPath, file))
        const archive = Archive.create(absFilesPath)
        resolve(archive)
      })
    })
  }
}

function testExt (exts) {
  return (file) => exts.includes(path.extname(file).toLowerCase())
}

const _testMedia = testExt(['.mp4', '.webm', '.mp3', '.m4a', '.ogg'])

const _testTumbnails = testExt(['.png', '.jpeg', '.jpg', '.webp'])

const _testSubtitles = testExt(['.vtt'])

const _testTorrent = testExt(['.torrent'])

const _testInfo = testExt(['.json'])

module.exports = Archive

const fs = require('fs')
const path = require('path')
const config = require('../config')
const WebTorrent = require('../libs/webtorrent')
const ARCHIVES_DIR = config.archivesDir

class Archive {
  // every path is relative
  constructor (mediaPath, filesPath) {
    // relative directory path
    this.dirpath = path.dirname(mediaPath)
    // media file path
    this.mediaPath = mediaPath

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
    const torrentPath = this.mediaPath.substr(0, this.mediaPath.lastIndexOf('.')) + '.torrent'
    const absTorrentPath = Archive.absolute(torrentPath)
    const creation = WebTorrent.create(Archive.absolute(this.mediaPath), absTorrentPath)
    return creation.then(() => {
      this.filesPath.push(absTorrentPath)
      this.torrentPath = torrentPath
      return this
    })
  }

  static relative (p) {
    return path.relative(ARCHIVES_DIR, p)
  }

  static absolute (p) {
    return path.join(ARCHIVES_DIR, p)
  }

  // factory
  // absFiles : absolute files path of the archive
  // mediaPath : absolute media path of the archive
  static create (absMediaPath, absFilesPath) {
    const filesPath = absFilesPath.map(Archive.relative)
    const mediaPath = Archive.relative(absMediaPath)
    return new Archive(mediaPath, filesPath)
  }

  // dirPath : relative archive path
  static load (mediaPath) {
    const absDirPath = path.dirname(Archive.absolute(mediaPath))
    const absMediaPath = Archive.absolute(mediaPath)
    return new Promise((resolve, reject) => {
      fs.readdir(absDirPath, (err, files) => {
        if (err) return reject(err)
        const absFilesPath = files.map(file => path.join(absDirPath, file))
        const archive = Archive.create(absMediaPath, absFilesPath)
        resolve(archive)
      })
    })
  }
}

function testExt (exts) {
  return (file) => exts.includes(path.extname(file).toLowerCase())
}

const _testTumbnails = testExt(['.png', '.jpeg', '.jpg'])

const _testSubtitles = testExt(['.vtt'])

const _testTorrent = testExt(['.torrent'])

module.exports = Archive

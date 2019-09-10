const path = require('path')
const fs = require('fs')
const https = require('https')
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const mkdirp = require('mkdirp')
const srt2vtt = require('srt-to-vtt')
const axios = require('axios')
const downloadTorrent = require('../webtorrent/index.js').download
const config = require('../../config')

const tempDownloadDir = config.archivesTmpDir
const youtubeDl = config.youtubedlBin
const langs = config.subtitleLangs

function downloadMedia (infoPath, dlDirPath) {
  const outputValue = dlDirPath + '/%(title)s.%(ext)s'
  const cmdFormat = youtubeDl + ' -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4/best" --output "%s" --load-info-json "%s"'
  const cmdLine = util.format(cmdFormat, outputValue, infoPath)

  return new Promise((resolve, reject) => {
    fs.readFile(infoPath, (err, data) => {
      if (err) return reject(err)
      const info = JSON.parse(data)
      // tmp directory for download
      info._dirname = dlDirPath
      // title used in basename for metadata files
      info._basename = removeExt(info._filename)
      return resolve(info)
    })
  })
    .then(info => {
      if (info.extractor !== 'PeerTube') {
        console.log('ydl execution: "' + cmdLine + '"')
        return exec(cmdLine, { maxBuffer: Infinity })
          .then(() => info)
      } else {
        const base = info.url.split('/static/')[0]
        const id = info.id
        const url = base + '/api/v1/videos/' + id
        return axios.get(url).then(res => res.data)
          .then(video => {
            // choose resolution (expected 720p)
            const resolution = (video.files.length > 0) ? 1 : 0
            const file = video.files[resolution]
            const torrentURL = file.torrentUrl
            console.log('Webtorrent download of ' + torrentURL)

            const downloadTorrentFile = new Promise((resolve, reject) => {
              const torrentPath = path.join(dlDirPath, info.title + '.torrent')
              const file = fs.createWriteStream(torrentPath)
              https.get(torrentURL, function (response) {
                response.pipe(file)

                file.on('finish', () => resolve(torrentPath))
                file.on('error', error => reject(error))
              })
            })

            return downloadTorrentFile
              .then(torrentPath => downloadTorrent(torrentPath, dlDirPath))
              .then(paths => {
                console.log('paths in dowloader ' + paths)
                info._filename = paths[0]
                return info
              })
          })
      }
    })
}

function downloadMetaData (url, dlDirPath) {
  const outputValue = dlDirPath + '/%(title)s.%(ext)s'
  const subLangValue = langs.join(',')
  const cmdFormat = youtubeDl + ' --ignore-errors --skip-download --write-sub --sub-lang %s --write-thumbnail --write-info-json --output "%s" %s'
  const cmdLine = util.format(cmdFormat, subLangValue, outputValue, url)
  return exec(cmdLine)
    .catch(e => {
      // if any thing have been downloaded
      // it can append for playlist
      if (!fs.existsSync(dlDirPath)) {
        console.log('metadata download of ' + url + ' failed with ' + e)
        throw e
      }
    })
    .then(() => {
      // WARNING goes into sterr :/
      // if (data.stderr !== '') return Promise.reject(data.stderr)
      return new Promise((resolve, reject) => {
        fs.readdir(dlDirPath, (err, files) => {
          if (err) return reject(err)
          const infoFiles = files.filter(infoFile => {
            return path.extname(infoFile).toLowerCase() === '.json'
          })
          resolve(infoFiles.map(infoFile => dlDirPath + '/' + infoFile))
        })
      })
    })
}

function download (url) {
  const downloadDirName = Math.random().toString(36).substring(7)
  const downloadDirPath = path.join(tempDownloadDir, downloadDirName)

  return downloadMetaData(url, downloadDirPath)
    .then(infoPaths => {
      let promise = Promise.resolve()
      let infos = []
      for (let infoPath of infoPaths) {
        promise = promise.then(() => downloadMedia(infoPath, downloadDirPath))
          .then(info => infos.push(info))
          .catch(e => console.log('download of ' + url + ' failed with error ' + e))
      }

      return promise.then(() => infos)
    })
}

/*
 * move all temporary files related to info object
 * into a new directory
 */
function move (info, absDirPath) {
  const basename = info._basename
  const downloadDirPath = info._dirname

  return new Promise((resolve, reject) => {
    fs.readdir(downloadDirPath, (err, files) => {
      if (err) return reject(err)
      files = files.filter(file => {
        const fileBasename = removeExt(file)
        return fileBasename === basename
      })

      // add media file in case of peertube extractor
      if (info.extractor === 'PeerTube' &&
          !files.includes(info._filename)) {
        files.push(info._filename)
      }

      // promises of file renaming
      const promises = files.map(file => {
        return new Promise((resolve, reject) => {
          const oldFile = path.join(downloadDirPath, file)
          const ext = path.extname(file)

          // for files without .srt extensions
          if (ext !== '.srt') {
            const newFile = path.join(absDirPath, file)
            mkdirp(path.dirname(newFile), function (err) {
              if (err) return reject(err)

              fs.rename(oldFile, newFile, function (err) {
                if (err) return reject(err)
                return resolve(newFile)
              })
            })
          } else {
            // we translate .srt files to .vtt files
            const newFileName = path.basename(file, path.extname(file)) + '.vtt'
            const newFile = path.join(absDirPath, newFileName)
            mkdirp(path.dirname(newFile), function (err) {
              if (err) return reject(err)
              fs.createReadStream(oldFile)
                .pipe(srt2vtt())
                .pipe(fs.createWriteStream(newFile))
              return resolve(newFile)
            })
          }
        })
      })

      return resolve(Promise.all(promises))
    })
  })
}

function removeExt (file) {
  // remove the first extension like .json, .srt
  let fileBasename = path.basename(file, path.extname(file))
  const otherExt = langs.slice()
  otherExt.push('info')
  // remove other extensions
  for (let ext of otherExt) {
    fileBasename = path.basename(fileBasename, '.' + ext)
  }
  return fileBasename
}

module.exports = {
  'download': download,
  'move': move
}

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
const formatDl = 'bestvideo[vcodec^=avc1][height<=360]+bestaudio[ext=m4a]/bestvideo[vcodec^=avc1][height<=720]+bestaudio/bestvideo+bestaudio/best[height<=480]/best'
const langs = config.subtitleLangs

const queryPatterns = {
  youtube: '"ytsearch5:%s"',
  googlevideo: '"gvsearch5:%s"',
  soundcloud: '"scsearch5:%s"'
}

/*
 * download the media related to info
 * @returns {Promise} Promise represented the info of the media
 *                    where the media file name has been set
 */
function downloadMedia (info) {
  const dlDirPath = info._dirname
  const outputValue = dlDirPath + '/%(title)s.%(ext)s'
  const cmdFormat = youtubeDl + ' -f "%s" --output "%s" --load-info-json "%s"'
  const cmdLine = util.format(cmdFormat, formatDl, outputValue, info._selfPath)

  if (!info._torrent_file) {
    console.log('ydl execution: "' + cmdLine + '"')
    return exec(cmdLine, { maxBuffer: Infinity })
      .then(() => {
        const mediaFileName = path.basename(info._filename)
        info._fileNames.push(mediaFileName)
        return info
      })
  } else {
    const torrentFileName = info._torrent_file
    const torrentPath = path.join(dlDirPath, torrentFileName)
    console.log('downloading files by torrent ' + torrentPath)
    return downloadTorrent(torrentPath, dlDirPath)
      .then(paths => {
        console.log('downloaded files by torrent in ' + paths)
        info._filename = paths[0]
        const mediaFileName = path.basename(info._filename)
        info._fileNames.push(mediaFileName)

        return info
      })
  }
}

function downloadTorrentFile (info) {
  if (info.extractor === 'PeerTube') {
    const dlDirPath = info._dirname
    const base = info.url.split('/static/')[0]
    const id = info.id
    const url = base + '/api/v1/videos/' + id

    return axios.get(url).then(res => res.data)
      .then(video => {
        // choose resolution (expected 360p)
        const resolutionPreference = ['360p', '480p', '720p']
        const filePreference = resolutionPreference
              .map(res => video.files.filter(file => file.resolution.label === res)[0])
              .filter(file => file)
        const file = filePreference[0] || video.files[0]
        const torrentURL = file.torrentUrl

        return new Promise((resolve, reject) => {
          const torrentFileName = info.title.replace('/', '') + '.torrent'
          const torrentPath = path.join(dlDirPath, torrentFileName)

          const file = fs.createWriteStream(torrentPath)
          console.log('torrent downloading ' + torrentURL)
          https.get(torrentURL, function (response) {
            response.pipe(file)
            file.on('finish', () => {
              info._torrent_file = torrentFileName
              info._fileNames.push(torrentFileName)
              console.log('torrent downloaded ' + torrentURL)
              resolve(info)
            })
            file.on('error', error => reject(error))
          })
        })
      })
  } else {
    return Promise.resolve(info)
  }
}

/*
 * Load an info file from info file and the files downloaded
 * with it.
 * @returns {Promise} Promise object represents
 *                    the info object
 */
function loadInfo (dlDirPath, infoFileName, fileNames) {
  const infoPath = path.join(dlDirPath, infoFileName)

  return createInfo(infoPath)
    .then(info => {
      // related file are files downloaded with the info
      // concerning the same media
      const relatedFileNames = fileNames.filter(file => {
        return removeExt(file) === info._basename
      })
      info._fileNames = info._fileNames.concat(relatedFileNames)

      return info
    })
}

function createInfo (infoPath, torrentPath) {
  return new Promise((resolve, reject) => {
    fs.readFile(infoPath, (err, data) => {
      if (err) return reject(err)
      const info = JSON.parse(data)
      // tmp directory for download
      info._dirname = path.dirname(infoPath)
      // title used in basename for metadata files
      info._basename = removeExt(info._filename)
      // path of the info file
      info._selfPath = infoPath

      if (torrentPath) {
        info._torrent_file = path.basename(torrentPath)
      }

      info._original_format = {
        'url': info.url,
        'ext': info.ext
      }

      info._fileNames = []

      return resolve(info)
    })
  })
}

/*
 * Create a temporary directory path
 * @returns {string}
 */
function createTempDirectoryPath () {
  const downloadDirName = Math.random().toString(36).substring(7)
  return path.join(tempDownloadDir, downloadDirName)
}

function buildSearchQuery (query, platform) {
  if (queryPatterns[platform]) {
    return util.format(queryPatterns[platform], query)
  } else {
    return null
  }
}

function downloadMetadataFromSearch (query, platform) {
  let q = buildSearchQuery(query, platform)
  if (q) {
    return downloadMetadata(q)
  } else {
    const error = new Error('unsupported platform')
    return Promise.reject(error)
  }
}

/*
 * Download metadata file(s) from an URL into a directory
 * @returns {Promise} Promise representing the list of info objects
 */
function downloadMetadata (url) {
  const dlDirPath = createTempDirectoryPath()
  const outputValue = dlDirPath + '/%(title)s.%(ext)s'
  const subLangValue = langs.join(',')
  const cmdFormat = youtubeDl + ' -f "%s" --ignore-errors --skip-download --write-sub --sub-lang %s --write-thumbnail --write-info-json --output "%s" "%s"'
  const cmdLine = util.format(cmdFormat, 'best[tbr<=500]/best/bestvideo+bestaudio', subLangValue, outputValue, url)
  return exec(cmdLine)
    .catch(e => {
      // if any thing have been downloaded
      // it can append for playlist
      if (!fs.existsSync(dlDirPath)) {
        console.log('metadata download of ' + url + ' failed with ' + e)
        throw e
      }
    })
    .then(res => {
      // WARNING goes into sterr :/
      // if (data.stderr !== '') return Promise.reject(data.stderr)
      return new Promise((resolve, reject) => {
        fs.readdir(dlDirPath, (err, files) => {
          if (err) return reject(new Error(err.message))
          const infoFiles = files.filter(file => {
            return path.extname(file).toLowerCase() === '.json'
          })

          let promises = infoFiles.map(infoFile => {
            return loadInfo(dlDirPath, infoFile, files)
              .then(info => downloadTorrentFile(info))
          })

          resolve(Promise.all(promises))
        })
      })
    })
}

/*
 * move all temporary files related to info object
 * into a new directory
 * @returns {array} list of the files path
 */
function move (info, absDirPath) {
  console.log('moving ' + info.title)
  const downloadDirPath = info._dirname

  return new Promise((resolve, reject) => {
    // promises of file renaming
    const promises = info._fileNames.map(file => {
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
  downloadMetadata: downloadMetadata,
  downloadMetadataFromSearch: downloadMetadataFromSearch,
  downloadMedia: downloadMedia,
  createInfo: createInfo,
  move: move
}

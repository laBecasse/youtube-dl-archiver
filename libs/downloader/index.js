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
const formatDl = "bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4/best"
const langs = config.subtitleLangs

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
    return downloadTorrent(torrentPath, dlDirPath)
      .then(paths => {
        console.log('paths in dowloader ' + paths)
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
        // choose resolution (expected 720p)
        const file = video.files.filter(file => {file.label === "720p"})[0] || video.files[0]
        const torrentURL = file.torrentUrl

        return new Promise((resolve, reject) => {
          const torrentFileName = info.title.replace('/', '') + '.torrent'
          const torrentPath = path.join(dlDirPath, torrentFileName)

          const file = fs.createWriteStream(torrentPath)
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
  return new Promise((resolve, reject) => {
    const infoPath = path.join(dlDirPath, infoFileName)
    fs.readFile(infoPath, (err, data) => {
      if (err) return reject(err)
      const info = JSON.parse(data)
      // tmp directory for download
      info._dirname = dlDirPath
      // title used in basename for metadata files
      info._basename = removeExt(info._filename)
      // path of the info file
      info._selfPath = infoPath
      // related file are files downloaded with the info
      // concerning the same media
      const relatedFileNames = fileNames.filter(file => {
        return removeExt(file) === info.title
      })
      info._fileNames=relatedFileNames
      return resolve(info)
    })
  })
}

/* 
 * Create a temporary directory path
 * @returns {string} 
 */
function createTempDirectoryPath() {
  const downloadDirName = Math.random().toString(36).substring(7)
  return path.join(tempDownloadDir, downloadDirName)
}

/*
 * Download metadata file(s) from an URL into a directory
 * @returns {Promise} Promise representing the list of info objects
 */
function downloadMetadata (url) {
  const dlDirPath = createTempDirectoryPath()
  const outputValue = dlDirPath + '/%(title)s.%(ext)s'
  const subLangValue = langs.join(',')
  const cmdFormat = youtubeDl + ' -f "%s" --ignore-errors --skip-download --write-sub --sub-lang %s --write-thumbnail --write-info-json --output "%s" %s'
  const cmdLine = util.format(cmdFormat, formatDl, subLangValue, outputValue, url)
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
          console.log(files)
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
  console.log('moving '+ info.title)
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
  'downloadMetadata': downloadMetadata,
  'downloadMedia': downloadMedia,
  'move': move
}

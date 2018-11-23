const path = require('path')
const fs = require('fs')
const youtubedl = require('youtube-dl')
const mkdirp = require('mkdirp')

module.exports.info = function (url) {
  console.log('info: ' + url)

  return new Promise((resolve, reject) => {
    let info
    let nextEmitted = false
    // for maxBuffer detail : https://github.com/przemyslawpluta/node-youtube-dl/issues/128
    // best format is sometime badly selected,
    // especially on Youtube 137+140 seems to be the best 
    let video = youtubedl(url, ['--format=best'], {cwd: __dirname, maxBuffer: Infinity})

    video
      .on('error', function (err) {
        console.log('error: ' + url)
        err.name = 'InfoError'
        reject(err)
      })
      .on('next', function (i) {
        if (!nextEmitted) {
          nextEmitted = true
          i.push(info)
          resolve(i)
        }
      })

    // Will be called when the download starts.
      .on('info', function (i) {
        info = i
        setTimeout(() => {
          video.emit('end')
          video.emit('next', [])
        }, 5)
      })
  })
}

module.exports.download = function (info, filepath) {
  return new Promise((resolve, reject) => {
    const dirpath = path.dirname(filepath)

    mkdirp(dirpath, function (err) {
      if (err) return reject(err)

      let video = youtubedl(info)

      video
        .on('error', function (err) {
          return reject(err)
        })
        .on('end', function () {
          return resolve()
        })

      if (!fs.existsSync(filepath)) {
        console.log('down: ' + info.webpage_url)
        video
          .pipe(fs.createWriteStream(filepath, {flags: 'a'}))
      } else {
        const err = new Error('Media is already downloaded')
        err.name = 'eexist'
        return reject(err)
      }
    })
  })
}

module.exports.downThumb = function (info, filepath) {
  return new Promise((resolve, reject) => {
    const url = info.webpage_url
    const dirpath = path.dirname(filepath)
    const options = {
      // Downloads all the available subtitles.
      all: false,
      // The directory to save the downloaded files in.
      cwd: dirpath
    }

    youtubedl.getThumbs(url, options, (err, files) => {
      if (err) return reject(err)
      const absfilepaths = files.map(file => path.join(dirpath, file))
      resolve(absfilepaths)
    })
  })
}

module.exports.downSubs = function (info, filepath) {
  return new Promise((resolve, reject) => {
    const url = info.webpage_url
    const dirpath = path.dirname(filepath)
    const options = {
      // Write automatic subtitle file (youtube only)
      auto: false,
      // Downloads all the available subtitles.
      all: false,
      // Languages of subtitles to download, separated by commas.
      lang: 'en,fr',
      // The directory to save the downloaded files in.
      cwd: dirpath
    }

    youtubedl.getSubs(url, options, (err, files) => {
      if (err) return reject(err)
      const absfilepaths = files.map(file => path.join(dirpath, file))
      resolve(absfilepaths)
    })
  })
}

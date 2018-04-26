const path = require('path')
const fs = require('fs')
const youtubedl = require('youtube-dl')
const mkdirp = require('mkdirp')

const ROOT = process.env.ROOT

module.exports = function (url) {
  this.URL = url
  let video

  this.getInfo = function () {
    console.log('info: ' + this.URL)

    return new Promise((resolve, reject) => {
      // for maxBuffer detail : https://github.com/przemyslawpluta/node-youtube-dl/issues/128
      video = youtubedl(url, ['--format=best'], {cwd: __dirname, maxBuffer: Infinity})
        .on('error', function (err) {
          console.log('error: ' + url)
          reject(err)
        })

      // Will be called when the download starts.
        .on('info', function (info) {
          resolve(info)
        })
    })
  }

  this.pipe = function (filepath) {
    console.log('down: ' + this.URL)

    return new Promise((resolve, reject) => {
      const absdirpath = path.join(ROOT, path.dirname(filepath))
      mkdirp(absdirpath, function (err) {
        if (err) throw err

        const absfilepath = path.join(ROOT, filepath)

        if (!fs.existsSync(absfilepath)) {
          video.pipe(fs.createWriteStream(absfilepath, {flags: 'a'}))
        } else {
          console.log(filepath + ' already exists.')

          reject(new Error('EEXIST'))
        }

        video.on('end', function () {
          resolve()
        })
      })
    })
  }

  this.exists = function (filepath) {
    return new Promise((resolve, reject) => {
      const absfilepath = path.join(ROOT, filepath)
      fs.access(absfilepath, (err) => {
        if (!err) {
          resolve(true)
        } else {
          resolve(false)
        }
      })
    })
  }
}

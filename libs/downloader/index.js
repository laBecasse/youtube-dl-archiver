const path = require('path')
const fs = require('fs')
const youtubedl = require('youtube-dl')
const mkdirp = require('mkdirp')

const ROOT = process.env.ROOT

module.exports.info = function (url) {
  console.log('info: ' + url)


  return new Promise((resolve, reject) => {
    let info
    let nextEmitted = false
    // for maxBuffer detail : https://github.com/przemyslawpluta/node-youtube-dl/issues/128
    let video = youtubedl(url, ['--format=best'], {cwd: __dirname, maxBuffer: Infinity})

    video
      .on('error', function (err) {
        console.log('error: ' + url)
        reject(err)
      })
      .on('next', function (i) {
        console.log('next')
        if (!nextEmitted) {
          nextEmitted = true
          i.push(info)
          resolve(i)
        }
      })


    // Will be called when the download starts.
      .on('info', function (i) {
        console.log('info')
        info = i
        setTimeout(() => {
          video.emit('end')
          video.emit('next', [])
        }, 5)
      })
      .on('end', () => console.log('end'))
  })
}

module.exports.download = function (info, filepath) {
  console.log('down: ' + info.webpage_url)

  return new Promise((resolve, reject) => {
    const dirpath = path.dirname(filepath)

    mkdirp(dirpath, function (err) {
      if (err) throw err

      let video = youtubedl(info)

      video
        .on('error', function (err) {
          console.log(err)
          reject(err)
        })
        .on('end', function () {
          resolve()
        })

      if (!fs.existsSync(filepath)) {
        video
          .pipe(fs.createWriteStream(filepath, {flags: 'a'}))
      } else {
        video.emit('end')
        console.log(filepath + ' already exists.')
        reject(new Error('EEXIST'))
      }
    })
  })
}

//   this.exists = function (filepath) {
//     return new Promise((resolve, reject) => {
//       const absfilepath = path.join(ROOT, filepath)
//       fs.access(absfilepath, (err) => {
//         if (!err) {
//           resolve(true)
//         } else {
//           resolve(false)
//         }
//       })
//     })
// }

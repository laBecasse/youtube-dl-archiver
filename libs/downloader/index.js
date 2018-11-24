const path = require('path')
const fs = require('fs')
const youtubedl = require('youtube-dl')
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const mkdirp = require('mkdirp')

module.exports.info = function (url) {
  console.log('info: ' + url)

  return new Promise((resolve, reject) => {
    exec('youtube-dl --dump-json -i ' + url, {maxBuffer: Infinity})
      .then((data) => {
        if (data.stderr !== '') return Promise.reject(data.stderr)

        const jsonString = data.stdout.split('\n')
        // remove the last empty string
        jsonString.pop()
        const objects = []

        for (let str of jsonString) {
          objects.push(JSON.parse(str))
        }

        // there is just one 
        if ()

        return resolve(objects)
      })
      .catch(reject)
  })
}

module.exports.download = function (info, filepath) {
  return new Promise((resolve, reject) => {
    const dirpath = path.dirname(filepath)

    mkdirp(dirpath, function (err) {
      if (err) return reject(err)
      console.log(info)
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

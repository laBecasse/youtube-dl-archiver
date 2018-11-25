const path = require('path')
const fs = require('fs')
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const mkdirp = require('mkdirp')

const tempDownloadDir = '/home/mburon/dev/buron.coffee/youtube-dl-archiver/archives/tmp'
const langs = 'fr,en'

function createCmdLine (url, langs, dlDirPath) {
  const outputValue = dlDirPath + '/%(title)s.%(ext)s'
  const subLangValue = langs
  const cmdFormat = 'youtube-dl -f "137+140/best" --write-sub --sub-lang %s --write-thumbnail --write-info-json --output "%s" %s'
  const cmdLine = util.format(cmdFormat, subLangValue, outputValue, url)

  return cmdLine
}

function download (url) {
  const downloadDirName = Math.random().toString(36).substring(7)
  const downloadDirPath = path.join(tempDownloadDir, downloadDirName)
  const cmdLine = createCmdLine(url, langs, downloadDirPath)
  console.log(cmdLine)
  return exec(cmdLine, { maxBuffer: Infinity })
    .then((data) => {
      // WARNING goes into sterr :/
      // if (data.stderr !== '') return Promise.reject(data.stderr)
      return new Promise((resolve, reject) => {
        fs.readdir(downloadDirPath, (err, files) => {
          if (err) return reject(err)
          files = files.filter(file => {
            return path.extname(file).toLowerCase() === '.json'
          })

          const promises = files.map(file => {
            return new Promise((resolve, reject) => {
              const filePath = path.join(downloadDirPath, file)
              fs.readFile(filePath, (err, data) => {
                if (err) return reject(err)

                const info = JSON.parse(data)

                info._dirname = downloadDirPath
                return resolve(info)
              })
            })
          })
          return resolve(Promise.all(promises))
        })
      })
    })
}

function move (info, absDirPath) {
  const basename = path.basename(info._filename)
  const downloadDirPath = info._dirname

  return new Promise((resolve, reject) => {
    fs.readdir(downloadDirPath, (err, files) => {
      if (err) return Promise.reject(err)
      files = files.filter(file => {
        return path.basename(file) === basename
      })

      const promises = files.map(file => {
        return new Promise((resolve, reject) => {
          console.log(file)
          const oldFile = path.join(downloadDirPath, file)
          const newFile = path.join(absDirPath, file)
          console.log(absDirPath)
          mkdirp(path, function (err) {
            if (err) return reject(err)
            fs.rename(oldFile, newFile, err => {
              (err) ? reject(err) : resolve(newFile)
            })
          })
        })
      })

      return Promise.all(promises)
    })
  })
}

module.exports = {
  'download': download,
  'move': move
}

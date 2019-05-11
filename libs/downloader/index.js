const path = require('path')
const fs = require('fs')
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const mkdirp = require('mkdirp')

const tempDownloadDir = process.env.ARCHIVES_TMP_DIR
const youtubeDl = process.env.YOUTUBE_DL_BIN
const langs = ['fr', 'en']

function createCmdLine (url, langs, dlDirPath) {
  const outputValue = dlDirPath + '/%(title)s.%(ext)s'
  const subLangValue = langs.join(',')
  const cmdFormat = youtubeDl + ' -f "137+140/bestvideo+bestaudio/best" --write-sub --sub-lang %s --write-thumbnail --write-info-json --output "%s" %s'
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

/*
 * move all temporary files related to info object
 * into a new directory
 */
function move (info, absDirPath) {
  const basename = removeExt(info._filename)
  const downloadDirPath = info._dirname

  return new Promise((resolve, reject) => {
    fs.readdir(downloadDirPath, (err, files) => {
      if (err) return reject(err)
      console.log(files)
      files = files.filter(file => {
        const fileBasename = removeExt(file)
        return fileBasename === basename
      })
      console.log(files)
      const promises = files.map(file => {
        return new Promise((resolve, reject) => {
          const oldFile = path.join(downloadDirPath, file)
          const newFile = path.join(absDirPath, file)

          mkdirp(path.dirname(newFile), function (err) {
            if (err) return reject(err)
            fs.rename(oldFile, newFile, function (err) {
              if (err) return reject(err)
              return resolve(newFile)
            })
          })
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

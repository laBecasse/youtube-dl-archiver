const path = require('path')
const config = require('../config')
const ARCHIVES_DIR = config.archivesDir

let getRelPath = function (info) {
  const filename = path.basename(info._filename)
  const extractor = info.extractor
  const id = (extractor === 'generic') ? info.url.replace(/\//g, '_') : info.id
  const dirpath = path.join(extractor, id)
  const filepath = path.join(dirpath, filename)

  return filepath
}

module.exports.getRelPath = getRelPath

module.exports.getAbsPath = function (info) {
  return path.join(ARCHIVES_DIR, getRelPath(info))
}

module.exports.getAbsDirPath = function (info) {
  return path.dirname(path.join(ARCHIVES_DIR, getRelPath(info)))
}

module.exports.relative = function (p) {
  return path.relative(ARCHIVES_DIR, p)
}

module.exports.absolute = function (p) {
  return path.join(ARCHIVES_DIR, p)
}


const Path = require('path')

const ARCHIVES_DIR = process.env.ARCHIVES_DIR

let getRelPath = function (info) {
  const filename = info._filename
  const extractor = info.extractor
  const id = (extractor === 'generic') ? info.url.replace(/\//g, '_') : info.id
  const dirpath = Path.join(extractor, id)
  const filepath = Path.join(dirpath, filename)

  return filepath
}

module.exports.getRelPath = getRelPath

module.exports.getAbsPath = function (info) {
  return Path.join(ARCHIVES_DIR, getRelPath(info))
}

module.exports.relative = function (path) {
  return Path.relative(ARCHIVES_DIR, path)
}

module.exports.absolute = function (path) {
  return Path.join(ARCHIVES_DIR, path)
}

const path = require('path')

const ARCHIVES_DIR = process.env.ARCHIVES_DIR

let relative = function (info) {
  const filename = info._filename
  const extractor = info.extractor
  const id = (extractor === 'generic') ? info.url.replace(/\//g, '_') : info.id
  const dirpath = path.join(extractor, id)
  const filepath = path.join(dirpath, filename)

  return filepath
}

module.exports.relative = relative

module.exports.absolute = function (info) {
  return path.join(ARCHIVES_DIR, relative(info))
}

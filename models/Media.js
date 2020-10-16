const config = require('../config')
const HOST = config.host
const LANGS = config.subtitleLangs

const UnarchivedMedia = require('./UnarchivedMedia')

let encodeURIPath = function (path) {
  return path.split('/').map(encodeURIComponent).join('/')
}

let testSub = function (lang) {
  return fileName => {
    console.log('fileName: ' + fileName)
    const re = new RegExp('.' + lang + '.')
    return re.test(fileName)
  }
}

class Media extends UnarchivedMedia {
  constructor (obj) {
    super(obj)

    this.archived = true

    this._id = obj._id
    this.creation_date = obj.creation_date
    this.file_path = obj.file_path
    this.thumbnails = obj.thumbnails || []
    this.subtitles = obj.subtitles
    this.torrent_path = obj.torrent_path
    this.archive_dir = obj.archive_dir
  }

  getThumbnailJSON () {
    if (this.thumbnails.length > 0) {
      return { url: HOST + '/archives/' + encodeURIPath(this.thumbnails[0]) }
    } else {
      return undefined
    }
  }

  getSubtitlesJSON () {
    let subtitlesArray
    if (this.subtitles) {
      subtitlesArray = this.subtitles.reduce((res, sub) => {
        const filePath = sub.file_path
        res.push({
          url: HOST + '/archives/' + encodeURIPath(filePath),
          lang: sub.lang
        })
        return res
      }, [])
    }
    return subtitlesArray
  }

  toAPIJSON () {
    const json = super.toAPIJSON()
    json.id = json._id
    json.subtitles = this.getSubtitlesJSON()
    json.thumbnail = this.getThumbnailJSON()
    json.file_url = this.getFileUrl()
    if (this.torrent_path) {
      json.torrent_url = Media._urlFromPath(this.torrent_path)
    }

    return json
  }

  getFileUrl () {
    return (this.file_path) ? Media._urlFromPath(this.file_path) : null
  }

  static _urlFromPath (path) {
    return HOST + '/archives/' + encodeURIPath(path)
  }

  static create (url, info, archive) {
    const creationDate = new Date().toISOString()

    const obj = {
      url: url,
      creation_date: creationDate
    }

    this.setArchiveProps(obj, archive)
    return new Media(Object.assign(super.create(info), obj))
  }

  static updateArchive (media, archive) {
    const updatedMedia = new Media(media)
    updatedMedia.creation_date = media.creation_date
    this.setArchiveProps(updatedMedia, archive)
    return updatedMedia
  }

  static setArchiveProps (obj, archive) {
    let subtitlesArray = LANGS.reduce((res, lang) => {
      const filePath = archive.subtitlesPath.find(testSub(lang))
      if (filePath) {
        res.push({
          file_path: filePath,
          lang: lang
        })
      }
      return res
    }, [])

    obj.file_path = archive.mediaPath
    obj.torrent_path = archive.torrentPath
    obj.thumbnails = archive.thumbnailsPath
    obj.subtitles = subtitlesArray
    obj.archive_dir = archive.dirpath
  }
}

module.exports = Media

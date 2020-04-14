const Mime = require('mime')
const path = require('path')
const config = require('../config')
const HOST = config.host
const LANGS = config.subtitleLangs

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

class Media {
  constructor (obj) {
    this._id = obj._id
    this.url = obj.url
    this.media_url = obj.media_url
    this.original_file = obj.original_file
    this.ext = obj.ext
    this.mime = obj.mime
    this.title = obj.title
    this.description = obj.description
    this.downloadedTags = obj.downloadedTags
    this.tags = (obj.tags) ? obj.tags : []
    this.uploader = obj.uploader
    this.creator = obj.creator
    this.channel_id = obj.channel_id
    this.channel_url = obj.channel_url
    this.creation_date = obj.creation_date
    this.upload_date = obj.upload_date
    this.file_path = obj.file_path
    this.thumbnails = obj.thumbnails
    this.subtitles = obj.subtitles
    this.torrent_path = obj.torrent_path
    // if archive directory is not set, then media path is set (back compatibility)
    this.archive_dir = (obj.archive_dir) ? obj.archive_dir : path.dirname(this.file_path)
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
    const json = JSON.parse(JSON.stringify(this))
    json.id = json._id
    json.subtitles = this.getSubtitlesJSON()
    json.thumbnail = this.getThumbnailJSON()
    if (this.file_path) {
      json.file_url = Media._urlFromPath(this.file_path)
    }
    if (this.torrent_path) {
      json.torrent_url = Media._urlFromPath(this.torrent_path)
    }

    return json
  }

  static _urlFromPath (path) {
    return HOST + '/archives/' + encodeURIPath(path)
  }

  static create (url, info, archive) {
    // create the media url following the extractor
    const test = ['youtube', 'dailymotion', 'soundcloud', 'vimeo'].includes(info.extractor)
    const mediaUrl = (test) ? info.webpage_url : info.ulr

    let originalFile = {
      url: info.url,
      ext: info.ext,
      mime: Mime.lookup(info.ext)
    }

    const creationDate = new Date().toISOString()

    const obj = {
      url: url,
      media_url: mediaUrl,
      ext: info.ext,
      mime: Mime.lookup(info.ext),
      original_file: originalFile,
      title: info.title,
      description: info.description,
      tags: [],
      downloadedTags: info.tags,
      uploader: info.uploader,
      creator: info.creator,
      channel_id: info.channel_id,
      channel_url: info.channel_url,
      creation_date: creationDate,
      upload_date: info.upload_date
    }

    this.setArchiveProps(obj, archive)

    return new Media(obj)
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

  // static createFromDocument (document) {
  //   return Media.createFromInfo(document.media_url,
  //                               document.url,
  //                               document.file_path,
  //                               document.thumbnails,
  //                               document.subtitles,
  //                               document.info,
  //                               document._id)
  // }

  // static createFromInfo(mediaUrl, url, filepath, thumbnails, subtitles, info, id) {
  //   const date = new Date()
  //   const obj = {
  //     '_id': id,
  //     'url': url,
  //     'media_url': mediaUrl,
  //     'file_path': filepath,
  //     'thumbnails': thumbnails,
  //     'subtitles': subtitles,
  //     'info': info,
  //     'creation_date': date.toISOString()
  //   }

  //   return Media.createFromObject(obj)
  // }

  // static createFromObject(obj) {
  //   let subtitlesArray
  //   if (obj.subtitles) {
  //     subtitlesArray = LANGS.reduce((res, lang) => {
  //       const filePath = obj.subtitles.find(testSub(lang))
  //       if (filePath) {
  //         res.push({
  //           file_path: filePath,
  //           lang: lang
  //         })
  //       }
  //       return res
  //     }, [])
  //   }

  //   return new Media({
  //     _id: obj._id,
  //     url: obj.url,
  //     media_url: obj.media_url,
  //     ext: obj.info.ext,
  //     mime: Mime.lookup(obj.info.ext),
  //     title: obj.info.title,
  //     description: obj.info.description,
  //     tags: obj.info.tags,
  //     uploader: obj.info.uploader,
  //     creator: obj.info.creator,
  //     channel_id: obj.info.channel_id,
  //     channel_url: obj.info.channel_url,
  //     creation_date: obj.creation_date,
  //     upload_date: obj.info.upload_date,
  //     file_url: HOST + '/archives/' + encodeURIPath(obj.file_path),
  //     file_path: obj.file_path,
  //     thumbnails: obj.thumbnails,
  //     subtitles: subtitlesArray,
  //   })
  // }
}
module.exports = Media

const Mime = require('mime')
const path = require('path')
const config = require('../config')
const filePath = require('../models/FilePath')

const HOST = config.host
const LANGS = config.subtitleLangs

let encodeURIPath = function(path) {
  return path.split('/').map(encodeURIComponent).join('/')
}

let testSub = function (lang) {
  return fileName => {
    const re = new RegExp('.' + lang + '.')
    return re.test(fileName)
  }
}

class Media {
  constructor(obj) {
    this.id = obj._id
    this.url = obj.url
    this.media_url = obj.media_url
    this.ext = obj.ext
    this.mime = obj.mime
    this.title =  obj.title
    this.description = obj.description
    this.tags = obj.tags
    this.uploader = obj.uploader
    this.creator = obj.creator
    this.channel_id = obj.channel_id
    this.channel_url = obj.channel_url
    this.creation_date = obj.creation_date
    this.upload_date = obj.upload_date
    this.file_path = obj.file_path
    this.thumbnails = obj.thumbnails
    this.subtitles = obj.subtitles
  }

  getThumbnailJSON() {
    if (this.thumbnails.length > 0) {
      
      return {url: HOST + '/archives/' + encodeURIPath(this.thumbnails[0])}
    } else {
      return undefined
    }
  }

  getSubtitlesJSON() {
    let subtitlesArray
    if (this.subtitles) {
      subtitlesArray = LANGS.reduce((res, lang) => {
        const filePath = this.subtitles.find(testSub(lang))
        if (filePath) {
          res.push({
            url: HOST + '/archives/' + encodeURIPath(filePath),
            file_path: filePath,
            lang: lang
          })
        }
        return res
      }, [])
    }

    return subtitlesArray
  }

  toAPIJSON() {
    const json = JSON.parse(JSON.stringify(this))
    json.subtitles = this.getSubtitlesJSON()
    json.thumbnail = this.getThumbnailJSON()
    json.file_url = HOST + '/archives/' + encodeURIPath(this.file_path)

    return json
  }
  
  static createFromDocument(document) {
    return Media.createFromInfo(document.media_url,
                                document.url,
                                document.file_path,
                                document.thumbnails,
                                document.subtitles,
                                document.info,
                                document._id)
  }

  static create(url, info, archive) {
    const test = ['youtube', 'dailymotion', 'soundcloud', 'vimeo'].includes(info.extractor)
    const mediaId = (test) ? info.webpage_url : info.ulr

    return Media.createFromInfo(mediaId, url,
                                archive.mediaPath,
                                archive.thumbnailsPath,
                                archive.subtitlesPath, info, id)
  }

  static createFromInfo(mediaUrl, url, filepath, thumbnails, subtitles, info, id) {
    const date = new Date()
    
    const obj = {
      '_id': id,
      'url': url,
      'media_url': mediaUrl,
      'file_path': filepath,
      'thumbnails': thumbnails,
      'subtitles': subtitles,
      'info': info,
      'creation_date': date.toISOString()
    }

    return Media.createFromObject(obj)
  }

  static createFromObject(obj) {
    let subtitlesArray
    if (obj.subtitles) {
      subtitlesArray = LANGS.reduce((res, lang) => {
        const filePath = obj.subtitles.find(testSub(lang))
        if (filePath) {
          res.push({
            file_path: filePath,
            lang: lang
          })
        }
        return res
      }, [])
    }

    return new Media({
      _id: obj._id,
      url: obj.url,
      media_url: obj.media_url,
      ext: obj.info.ext,
      mime: Mime.lookup(obj.info.ext),
      title: obj.info.title,
      description: obj.info.description,
      tags: obj.info.tags,
      uploader: obj.info.uploader,
      creator: obj.info.creator,
      channel_id: obj.info.channel_id,
      channel_url: obj.info.channel_url,
      creation_date: obj.creation_date,
      upload_date: obj.info.upload_date,
      file_url: HOST + '/archives/' + encodeURIPath(obj.file_path),
      file_path: obj.file_path,
      thumbnails: obj.thumbnails,
      subtitles: subtitlesArray
    })
  }
}
module.exports = Media

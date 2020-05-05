const Mime = require('mime')
const config = require('../config')
const HOST = config.host
const LANGS = config.subtitleLangs

class UnarchivedMedia {
  constructor (obj) {
    // the URL from which we found the media
    this.url = obj.url
    // the URL of the media page, maybe different from url (e.g. iframe)
    this.media_url = obj.media_url
    // the object describing of the media file
    this.original_file = obj.original_file
    // extension of the media
    this.ext = obj.ext
    // mime type of the media
    this.mime = obj.mime
    // title of the media
    this.title = obj.title
    // description of the media
    this.description = obj.description
    // downloaded tags array
    this.downloadedTags = obj.downloadedTags
    // array of tags, added manually
    this.tags = (obj.tags) ? obj.tags : []
    // uploader name
    this.uploader = obj.uploader
    // creator name
    this.creator = obj.creator
    // channel identifier
    this.channel_id = obj.channel_id
    // channel URL
    this.channel_url = obj.channel_url
    // upload date of the media in the source (remotely)
    this.upload_date = obj.upload_date
    // original thumbnails URL
    this.originalThumbnails = obj.originalThumbnails
  }

  toAPIJSON () {
    const json = Object.assign({}, this)
    json.thumbnail = this.getThumbnailJSON()
    return json
  }

  getThumbnailJSON () {
    if (this.originalThumbnails.length > 0) {
      return { url: this.originalThumbnails[0] }
    } else {
      return undefined
    }
  }

  static create (info) {
    // create the media url following the extractor
    const test = ['youtube', 'dailymotion', 'soundcloud', 'vimeo'].includes(info.extractor)
    const mediaUrl = (test) ? info.webpage_url : info.url

    let originalFile = {
      url: info.url,
      ext: info.ext,
      mime: Mime.lookup(info.ext)
    }

    const obj = {
      media_url: mediaUrl,
      ext: info.ext,
      mime: Mime.lookup(info.ext),
      original_file: (info.url) ? originalFile : undefined,
      title: info.title,
      description: info.description,
      tags: [],
      downloadedTags: info.tags,
      uploader: info.uploader,
      creator: info.creator,
      channel_id: info.channel_id,
      channel_url: info.channel_url,
      upload_date: info.upload_date,
      originalThumbnails: info.thumbnails.map(t => t.url)
    }

    return new UnarchivedMedia(obj)
  }
}

module.exports = UnarchivedMedia

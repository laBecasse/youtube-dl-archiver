const url = require('url')
const util = require('util')
const axios = require('axios')

const config = require('../../config')
const BASE = config.invidiousURL

module.exports = {
  downloadMetadataFromSearch: function(query) {

    const path = '/api/v1/search'
    const link = url.resolve(BASE, path)
    const params = {
      q: query,
      type: 'video'
    }
    
    return axios.get(link, {params: params})
      .then(res => {
        return res.data
      })
      .then(videos => videos.map(createInfo))
  }
}

function createInfo(video) {
  return {
    webpage_url: 'https://www.youtube.com/watch?v=' + video.videoId,
    extractor: 'youtube',
    id: video.videoId,
    title: video.title,
    ext: 'mp4',
    uploader: video.author,
    description: video.description,
    thumbnails: video.videoThumbnails.filter(t => t.quality === 'medium')
  }
}

const axios = require('axios')
const UnarchivedMedia = require('../../models/UnarchivedMedia')

const BASE = require('../../config').sepiasearchURL
const API = axios.create({
  baseURL: BASE,
  timeout: 1000
})

module.exports = {
  searchMetadataMedias: function(query) {
    const url = BASE + '/api/v1/search/videos'
    const config = {
      params: {
        search: query
      }
    }

    let call = API.get(url, config)
        .then(res => res.data)
        .then(answers => {
          return answers.data.map(ans => {
            const media = new UnarchivedMedia({
              media_url: ans.url
            })

            media.setUrl(ans.url)
            media.setTitle(ans.name)
            media.setDescription(ans.description)
            // upload date is xxx ago for query ...
            media.setUploadDate(ans.publishedAt)

            media.addOriginalThumbnailUrl(ans.thumbnailUrl)

            media.setUploader(ans.account.name)
            media.setChannelUrl(ans.channel.url)

            return media
          })
        })
    return call
  }
}

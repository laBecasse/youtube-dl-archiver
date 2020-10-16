const ytt = require('ytt')
const UnarchivedMedia = require('../../models/UnarchivedMedia')

module.exports = {
  searchMetadataMedias: function(query, limit) {
    return ytt.query(query, {filter: 'video', max: limit})
      .then(answers => {
        return answers.items.map(ans => {
          const url = 'https://www.youtube.com/watch?v=' + ans.id
          const media = new UnarchivedMedia({
            media_url: url
          })

          media.setUrl(url)
          media.setTitle(ans.title)
          media.setDescription(ans.description)
          // upload date is xxx ago for query ...
          //media.setUploadDate(ans.stats.date)
          for (let thumb of ans.thumbnails.reverse()) {
            if (thumb.width < 720) {
              media.addOriginalThumbnailUrl(thumb.url)
            }
          }
          media.setUploader(ans.author.title)
          return media
        })
      })
  }
}

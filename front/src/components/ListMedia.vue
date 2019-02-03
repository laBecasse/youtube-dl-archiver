<template>
<section class="section is-medium">
  <div v-if="medias.length === 0" class="loading">Pas de résultat</div>
  <div id="list" class="container">
    <div v-for="media in medias" class="is-6">
      <Media :media="media" :expanded="!(!watch_id)" v-if="!watch_id || media.id === watch_id"></Media>
    </div>
  </div>
</section>
</template>

<script>
import Media from './Media.vue'

export default {
  name: 'ListMedia',
  components: {
    Media
  },
  data() {
    return{
      medias: [],
      query: '',
      watch_id: undefined
    }
  },
  created: function()
  {
    this.updateQuery();
  },
  watch: {
    // call again the method if the route changes
    '$route': 'updateQuery',
    'query': 'updateMedias'
  },
  methods: {
    updateQuery () {
      const base = this.$root.$data.API_URL
      let uri
      this.watch_id = undefined
      
      if (this.$route.name === 'SearchMedia' &&
          this.$route.query.text) {
        uri = base + this.getSearchPath()
        
      } else if (this.$route.name === 'WatchMedia' &&
                 this.$route.params.id) {
        this.watch_id = this.$route.params.id
        if (this.medias.some(m => m.id === this.watch_id)) {
          uri = this.query
        } else {
          uri = base + this.getMediaPath()
        }
      } else {
        uri = base + '/medias?limit=10'
      }
      this.query = uri
    },
    getSearchPath () {
      return '/search?text=' + this.$route.query.text
    },
    getMediaPath () {
      return '/medias/' + this.$route.params.id
    },
    fetchMedias () {
      this.axios.get(this.query)
        .then((response) => {
          const medias = (response.data.length !== undefined) ? response.data : [response.data]
          
          this.medias = this.medias.concat(formatMedia(medias))
        })
        .catch(console.error)
    },
    updateMedias () {
      this.medias = []
      this.fetchMedias()
    }
  }
}

/*
 * Format media functions
 */

const SHORT_DESCRIPTION_LENGTH = 200

function formatMedia (medias) {

  for(let media of medias) {
    addMediaType(media)
    addShortDecription(media)
    addFormatedUploadDate(media)
  }

  return medias
}

function addShortDecription (media) {
  const description = media.description

  if (description !== null) {
    media.short_description = description.substring(0, SHORT_DESCRIPTION_LENGTH)
    if (media.description.length > SHORT_DESCRIPTION_LENGTH) {
      media.short_description += '...'
    }
  }
}

function addMediaType (media) {
  const reV = new RegExp('video')
  const reI = new RegExp('image')
  const reA = new RegExp('audio')
  media.type = 'other'
  if (reV.test(media.mime)) {
    media.type = 'video'
  }
  if (reI.test(media.mime)) {
    media.type = 'image'
  }
  if (reA.test(media.mime)) {
    media.type = 'audio'
  }
}

function addFormatedUploadDate (media) {
  if (media.upload_date !== null) {
    const date = parseUploadDate(media)
    media.formated_creation_date = new Intl.DateTimeFormat().format(date)
  }
}

function parseUploadDate (media) {
  const dateString = media.upload_date
  const year = dateString.substring(0, 4)
  const month = dateString.substring(4, 6)
  const day = dateString.substring(6, 8)

  return new Date(year, month, day)
}

</script>

<style>
#app {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
}
</style>

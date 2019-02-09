<template>
<div id="list" class="container">
  <span v-if="medias.length === 0" class="loading">Pas de résultat</span>
  <div v-for="media in medias" :key="media.id" class="is-6">
    <Media :media="media" :expanded="!(!watch_id)" v-if="!watch_id || media.id === watch_id"></Media>
  </div>
</div>
</template>

<script>
import Media from './Media.vue'

// the list of medias is defined by the api query
// the list is refreshed each time the query change
// watch_id defines the id of only media displayed


export default {
  name: 'ListMedia',
  components: {
    Media
  },
  computed: {
    medias () {
      return this.$store.state.medias
    }
  },
  data() {
    return{
      query: '',
      watch_id: undefined,
      bottom: false,
      offset: 0,
      step: 10,
      isDownloading: false
    }
  },
  created: function()
  {
    this.updateQuery();
    this.$store.commit("emptyMedias")
    window.addEventListener('scroll', () => {
      this.bottom = this.bottomVisible() && !(this.watch_id)
    })
  },
  watch: {
    // call again the method if the route changes
    '$route': 'updateQuery',
    'query': 'refreshMedias',
    bottom(bottom) {
      if (bottom) {
        this.offset = this.$store.state.medias.length
        this.addMediasToList()
      }
    }
  },
  methods: {
    updateQuery () {
      const base = this.$root.$data.API_URL
      let query
      this.watch_id = undefined
      
      if (this.$route.name === 'SearchMedia' &&
          (this.$route.query.text ||
           this.$route.query.uploader)) {
        query = this.getSearchQuery()
        
      } else if (this.$route.name === 'WatchMedia' &&
                 this.$route.params.id) {
        this.watch_id = this.$route.params.id
        if (this.medias.some(m => m.id === this.watch_id)) {
          // we don't change the query
          // if the watched media is in the current list
          query = this.query
        } else {
          query = this.getMediaQuery()
        }
      } else {
        query = this.getAllMediasQuery()
      }
      this.query = query
    },
    getSearchQuery () {
      if (this.$route.query.text
          && this.$route.query.updater) {
        return '/search?text=' + this.$route.query.text
          + '&uploader=' + this.$route.query.uploader
      } else if (this.$route.query.text) {
        return '/search?text=' + this.$route.query.text
      } else {
        return '/search?uploader=' + this.$route.query.uploader
      }
    },
    getMediaQuery () {
      return '/medias/' + this.$route.params.id
    },
    getAllMediasQuery() {
      return '/medias'
    },
    getURIFromQuery (path) {
      const base = this.$root.$data.API_URL
      if (this.$route.name === 'WatchMedia') {
        return base + path
      } else if (this.$route.name === 'SearchMedia') {
        return base + path + '&limit='+this.step+'&offset='+this.offset
      } else {
        return base + path + '?limit='+this.step+'&offset='+this.offset
      }
    },
    fetchMedias (query) {
      console.log(query)
      if(!this.isDownloading) {
        this.isDownloading = true
        this.axios.get(query)
          .then((response) => {
            const medias = (response.data.length !== undefined) ?
                  response.data : [response.data]
            console.log(medias)
            this.$store.commit('appendMedias', medias)
            this.isDownloading = false
          })
          .catch((e) => {
            this.isDownloading = false
            console.error(e)
          })
      }
    },
    refreshMedias () {
      this.$store.commit('emptyMedias')
      this.offset = 0
      this.addMediasToList()
    },
    addMediasToList () {
      const uri = this.getURIFromQuery(this.query)
      this.fetchMedias(uri)
    },
    bottomVisible() {
      const scrollY = window.scrollY
      const visible = document.documentElement.clientHeight
      const pageHeight = document.documentElement.scrollHeight
      const bottomOfPage = visible + scrollY >= pageHeight
      return bottomOfPage || pageHeight < visible
    }
  }
}

</script>

<style>
</style>

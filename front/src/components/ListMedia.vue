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
import { mapActions, mapGetters } from 'vuex'

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
      this.bottom = this.bottomIsClose() && !(this.watch_id)
    })
  },
  watch: {
    // call again the method if the route changes
    '$route': 'updateQuery',
    'query': 'refreshMedias',
    bottom(bottom) {
      if (bottom) {
        this.getMoreMedias()
      }
    }
  },
  methods: {
    ...mapActions(['getMoreMedias', 'getOneMedias', 'getMediasList', 'searchText', 'searchUploader']),
    ...mapGetters(['contains']),
    updateQuery () {
      if (this.$route.name === 'SearchMedia' &&
          (this.$route.query.text ||
           this.$route.query.uploader)) {
        
        this.watch_id = undefined
        
        if (this.$route.query.text) {
          const text = this.$route.query.text
          this.searchText(text)
        } else {
          const uploader = this.$route.query.uploader
          this.searchUploader(uploader)
        }
      } else if (this.$route.name === 'WatchMedia' &&
                 this.$route.params.id) {
        const id = this.$route.params.id
        this.watch_id = id
        if (!this.contains(id))
          this.getOneMedias(id)
      } else {
        if (!this.watch_id) {
          console.log('list')
          this.getMediasList()
        }
        this.watch_id = undefined
      }
    },
    bottomIsClose() {
      const margin = 300
      const scrollY = window.scrollY
      const visible = document.documentElement.clientHeight
      const pageHeight = document.documentElement.scrollHeight
      const bottomOfPage = visible + scrollY >= pageHeight - margin
      return bottomOfPage || pageHeight < visible
    }
  }
}

</script>

<style>
</style>

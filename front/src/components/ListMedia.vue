<template>
<section class="section is-medium">
  <div v-if="medias.length === 0" class="loading">Pas de résultat</div>
  <div id="list" class="container">
    <div v-for="media in medias" :key="media.id" class="is-6">
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
      step: 10
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
    'query': 'updateMedias',
    'offset': 'updateQuery',
    bottom(bottom) {
      if (bottom) {
        this.offset = this.$store.state.medias.length + this.step
      }
    }
  },
  methods: {
    updateQuery () {
      const base = this.$root.$data.API_URL
      let uri
      this.watch_id = undefined
      
      if (this.$route.name === 'SearchMedia' &&
          this.$route.query.text) {
        this.$store.commit('emptyMedias')
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
        uri = base + '/medias?limit='+this.step+'&offset='+this.offset
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
      console.log(this.query)
      this.axios.get(this.query)
        .then((response) => {
          const medias = (response.data.length !== undefined) ? response.data : [response.data]
          this.$store.commit('appendMedias', medias)
          
        })
        .catch(console.error)
    },
    updateMedias () {
      this.fetchMedias()
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
#app {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
}
</style>

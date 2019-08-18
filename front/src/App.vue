<template>
<div id="app">
  <nav class="navbar" role="navigation" aria-label="main navigation">
    <div class="navbar-brand">
      <div class="columns is-mobile is-vcentered is-multiline is-centered mobile-nav-columns">
        <div class="column is-narrow">
          <router-link :to="{name: 'ListMedia'}" class="title" id="logo">
            <img src="/logo.svg" class="logo-img">
          </router-link>
        </div>
        <div id="search" class="column is-half">
          <form v-on:submit.prevent="search" action="/search" method="get">
            <div class="field has-addons">
              <div class="control">
                <input id="search-text" class="input" type="text" value="" name="text" placeholder="rechercher"/>
              </div>
              <div class="control">
                <button v-if="!(this.$route.name === 'SearchMedia' && this.$route.query.text)" class="button is-info"><SearchIcon/></button>
                <router-link :to="{name: 'ListMedia'}" v-if="this.$route.name === 'SearchMedia' && this.$route.query.text" class="button" v-on:click.prevent="lastAdded">❌</router-link>
              </div>
            </div>
          </form>
        </div>
        
        <div class="column is-narrow">
          <a role="button" class="navbar-burger burger" aria-label="menu" aria-expanded="false" data-target="navbarBasicExample">
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
          </a>
        </div>
      </div>
    </div>
    
    <div id="navbarBasicExample" class="navbar-menu">
      <div class="navbar-start">
        <div class="navbar-item has-dropdown is-hoverable">
          <div class="vbar-dropdown">
          </div>
        </div>
      </div>
      
      <div class="navbar-end">
        <div id="post-media" class="navbar-item">
          <form v-on:submit.prevent="onSubmit" action="/medias" method="post">
            <div class="field has-addons">
              <div class="control">
                <input id="post-media-url" class="input" type="text" value="" name="url" placeholder="ajouter une vidéo"/>
              </div>
              <div class="control" v-bind:class="{'is-loading': isDownloading}">
                <label for="post-media-url" class="button is-info">+</label>
                <!-- <button class="button is-info" >+</button> -->
              </div>
            </div>
          </form>
        </div>
        
        <div class="navbar-item">
          <form action="/update" method="get">
            <input id="update" class="button" type="submit" value="MAJ"/>
          </form>
        </div>

      </div>
    </div>
  </nav>
  <nav role="navigation" aria-label="main navigation">
    
    <div class="level is-mobile">
    </div>
    
  </nav>
  <section class="section is-medium">
    <div class="level" v-if="this.$route.name === 'SearchMedia'">
      <h3 class="level-item title" v-if="this.$route.query.uploader">{{this.$route.query.uploader}}</h3>
    </div>
    <router-view></router-view>
  </section>
</div>
</template>

<script>
  import SearchIcon from 'vue-ionicons/dist/md-search.vue'
export default {
  components: {
    SearchIcon
  },
  data () {
    return {
      'bottom': false,
      'API_URL': process.env.VUE_APP_API_URL,
      'offset': 0,
      'step': 10,
      'isDownloading': false,
      'offline': !navigator.onLine
    }
  },
  mounted () {
    window.addEventListener('online',  () => {
      this.offline = false
    })
    window.addEventListener('offline', () => {
      this.offline = true
    })
  },
  methods: {
    search () {
      let text = document.getElementById('search-text').value
      this.$router.push({path: '/search', query : {text: text}})
    },
    onSubmit (event) {
      let url = document.getElementById('post-media-url').value
      let params = new URLSearchParams()
      
      params.append('url', url)
      
      this.isDownloading = true
      this.axios.post(this.API_URL + "/medias", params)
        .then(res => {
          console.log(res.data)
          const medias = res.data;
          this.$store.commit('prependMedias', medias)
          this.isDownloading = false
        })
        .catch(err => console.error(err))
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
    margin-top: .5em;
}

.mobile-nav-columns{
    width: 100%;
}
</style>

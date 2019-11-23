<template>
<div id="app" v-bind:class="{'has-background-dark': darkMode}">
  <nav class="navbar is-fixed-top" role="navigation" aria-label="main navigation">
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
              <div class="control">
                <input type="checkbox" id="withdownload" name="withdownload" class="hidden" value="" checked/>
                <label for="withdownload" class="button has-text-grey withdownload"><DownloadIcon/></label>
              </div>
              <div class="control" v-bind:class="{'is-loading': isUploading}">
                <label for="post-media-url-submit" class="button is-info" v-bind:class="{'is-danger': uploadFailed}">></label>
                <input type="submit" id="post-media-url-submit" class="hidden"/>
              </div>
            </div>
          </form>
        </div>
        
        <div class="navbar-item">
          <a :href="this.API_URL + '/update'" id="update" class="button" type="submit">MAJ</a>
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
import DownloadIcon from 'vue-ionicons/dist/md-download.vue'
import SearchIcon from 'vue-ionicons/dist/md-search.vue'

import { mapActions, mapGetters } from 'vuex'
export default {
  components: {
    SearchIcon,
    DownloadIcon
  },
  computed: {
    darkMode() {
      return this.$store.state.settings.darkMode
    }
  },
  data () {
    return {
      'bottom': false,
      'API_URL': process.env.VUE_APP_API_URL,
      'offset': 0,
      'step': 10,
      'isUploading': false,
      'uploadFailed': false,
      'offline': !navigator.onLine
    }
  },
watch: {
darkMode () {
if (this.darkMode) {
  document.body.classList.add('has-background-dark')
} else {
  document.body.classList.remove('has-background-dark')
}
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
    ...mapActions(['uploadURL']),
    search () {
      let text = document.getElementById('search-text').value
      this.$router.push({path: '/search', query : {text: text}})
    },
    onSubmit (event) {
      const url = document.getElementById('post-media-url').value
      const withDownload = document.getElementById('withdownload').checked
      this.isUploading = true
      this.uploadFailed = false
      return this.uploadURL({url: url, withDownload: withDownload})
        .then(() => {this.isUploading = false})
        .catch(err => {
          console.error(err)
          this.uploadFailed = true
          this.isUploading = false
        })
    }
  }
}
</script>

<style>
html, body {
  height: 100%;
}

#app {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    height: 100%;
}

.mobile-nav-columns{
    width: 100%;
}

#withdownload:checked ~ .withdownload {
    background-color:black;
    color: white !important;
    border-color: black;
}
</style>

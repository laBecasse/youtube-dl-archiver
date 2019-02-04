<template>
<div id="app">
  <nav role="navigation" aria-label="main navigation">
    
    <div class="level is-mobile">
      <div class="level-left">
      </div>
      <div class="level-right">
        <div id="post-media" class="level-item">
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
        
        <div class="level-item">
          <form action="/update" method="get">
            <input id="update" class="button" type="submit" value="MAJ"/>
          </form>
        </div>
      </div>
      
    </div>
    <div class="level">
      <div id="search" class="level-item">
        <form v-on:submit.prevent="search" action="/search" method="get">
          <div class="field has-addons">
            <div class="control">
              <input id="search-text" class="input" type="text" value="" name="text" placeholder="rechercher"/>
            </div>
            <div class="control">
              <input v-bind:class="{hidden: this.$route.name === 'SearchMedia' }" class="button is-info" type="submit" value="Go">
              <router-link :to="{name: 'ListMedia'}" v-if="this.$route.name === 'SearchMedia'" class="button" v-on:click.prevent="lastAdded">❌</router-link>
            </div>
          </div>
        </form>
      </div>
    </div>
  </nav>
  <router-view></router-view>
</div>
</template>

<script>
export default {
  data () {
    return {
      'bottom': false,
      'API_URL': process.env.VUE_APP_API_URL,
      'offset': 0,
      'step': 10,
      'isDownloading': false,
    }
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
    margin-top: 10px;
}
</style>

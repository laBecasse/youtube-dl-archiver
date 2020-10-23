<template>
    <div id="app" class="" v-bind:class="{'has-background-dark': darkMode}">
        <notification
            :options.sync="this.notificationOpt"></notification>
        <nav class="navbar" role="navigation" aria-label="main navigation">
            <div class="navbar-brand">
                <div class="nav-columns">
                    <div class="nav-column logo">
                        <router-link :to="{name: 'ListMedia'}" class="title" id="logo">
                            <img src="/logo.svg" class="logo-img">
                        </router-link>
                    </div>
                    <div id="search" class="nav-column search">
                        <form v-on:submit.prevent="search" action="/search" method="get" >
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
                    <div class="nav-column">
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
                
                <div class="navbar-dropdown">
                    <LeftPanel/>
                </div>
            </div>
        </nav>
        <nav role="navigation" aria-label="main navigation">
            <div class="level is-mobile">
            </div>
        </nav>
        <section id="section" class="columns is-desktop">
            <div class="column is-hidden-mobile is-hidden-tablet-only">
                <LeftPanel/>
            </div>
            <div class="column is-three-quarters-desktop" id="scrolled">
                <div class="level" v-if="this.$route.name === 'SearchMedia'">
                    <h3 class="level-item title" v-if="this.$route.query.uploader">{{this.$route.query.uploader}}</h3>
                </div>
                <router-view></router-view>
            </div>
        </section>
        <datalist id="all-tag-list" >
            <option :value="tag._id" v-for="tag in allTags" />
        </datalist>
    </div>
</template>

<script>
 import SearchIcon from 'vue-ionicons/dist/md-search.vue'
 import Notification from './components/Notification'
 import LeftPanel from './components/LeftPanel.vue'

 export default {
     components: {
         SearchIcon,
         Notification,
         LeftPanel
     },
     computed: {
         darkMode() {
             return this.$store.state.settings.darkMode
         }
     },
     data () {
         return {
             'API_URL': process.env.VUE_APP_API_URL,
             'offline': !navigator.onLine,
             'notificationOpt': {
             },
             allTags: []
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
     created () {
         this.$store.dispatch('getAllTags')
             .then(tags => {
                 this.allTags = tags
                 this.$store.commit('setTags', tags)
             })
     },
     mounted () {
         window.addEventListener('online',  () => {
             this.showInfo("Tu es ligne, bienvenue sur les internets")
             this.offline = false
         })
         window.addEventListener('offline', () => {
             this.offline = true
             this.showInfo("Tu es hors ligne ! <br/> Les seuls médias visibles sont ceux que tu as déjà vu")
         })
     },
     methods: {
         search () {
             let text = document.getElementById('search-text').value
             this.$router.push({path: '/search', query : {text: text}})
         },
         showInfo(content) {
             this.notificationOpt = {
                 autoClose: true,
                 backgroundColor: '#769FCD',
                 content: content,
                 countdownBar: true,
                 barColor: '#415F77'
             }
         },
         showWarning(content) {
             this.notificationOpt = {
                 autoClose: false,
                 backgroundColor: '#fbff7c',
                 textColor: '#92253f',
                 content: content
             }
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
     /* width: 100%; */
 }

 #section {
     margin: 0 .5em;
 }

 .navbar-brand {
     padding-top: .2em;
     width: 100%;
 }

 .nav-columns {
     display: flex;
     width: 100%;
     justify-content: space-between;
     align-items: center;
 }
 .navar-brand .column {
     /* padding-left: 6em; */
 }

 .nav-column.search {
     flex-basis: 30em;
     flex-grow: 1;
     display: flex;
     justify-content: center;
 }

 .logo {
     flex-basis: 8em;
     padding-left: .5em;
 }
</style>

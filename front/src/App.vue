<template>
    <div id="app" class="" v-bind:class="{'has-background-dark': darkMode}">
        <Notification/>
        <nav class="navbar" role="navigation" aria-label="main navigation">
            <div class="navbar-brand">
                <div class="nav-columns">
                    <div class="nav-column logo">
                        <router-link :to="{name: 'ListMedia'}" class="title" id="logo">
                            <img src="/logo.svg" class="logo-img">
                        </router-link>
                    </div>
                    <div id="search" class="nav-column search">
                        <SearchForm />
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
            <option :value="tag._id" v-for="tag in allTags" v-bind:key="tag._id" />
        </datalist>
    </div>
</template>

<script>
 import {mapGetters} from 'vuex'
 import Notification from './components/Notification'
 import LeftPanel from './components/LeftPanel.vue'
 import SearchForm from './components/SearchForm.vue'
 import Parameters from './lib/Parameters.js'
 import YMPD from './lib/YMPD.js'

 export default {
     components: {
         Notification,
         LeftPanel,
         SearchForm
     },
     data () {
         return {
             'API_URL': process.env.VUE_APP_API_URL,
             'offline': false,
             allTags: [],
             ympdClient: null,
             darkMode: false
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
         // gather all tags
         this.$store.dispatch('getAllTags')
             .then(tags => {
                 this.allTags = tags
                 this.$store.commit('setTags', tags)
             })
         // initialize the ympd client
         const ympdUrl = this.getParameters().get('YMPD_URL')
         this.initYmpd(ympdUrl)
         this.getParameters().setEventListenerOnKey('YMPD_URL', this.initYmpd)
         // darkMode event
         this.getParameters().setEventListenerOnKey('darkMode', v => {this.darkMode = v})
     },
     methods: {
         ...mapGetters(['getParameters']),
         initYmpd(url) {

             // disable ympd
             if (url === '')  {
                 this.ympdClient = undefined
                 return Promise.resolve()
             }
             
             if (url) {
                 const ympdClient = new YMPD(url)
                 return ympdClient.connect()
                            .then(() => {
                                this.ympdClient = ympdClient
                            })
                            .catch(e => {
                                this.showWarning('Ympd url "' + url + '" is invalid.')
                                throw e
                            })
             } else {
                 return Promise.resolve() 
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

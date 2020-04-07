<template>
    <div>
        <!-- list controllers -->
        
        <div class="field is-grouped">
            <p class="control" >
                <a class="button is-danger" v-on:click="deleteAll">
                    Supprimer tout
                </a>
            </p>
            <p class="control">
                <a class="button has-background-black has-text-white" v-on:click="downloadAll">
                    Télécharger tout
                </a>
            </p>
            <p class="control" >
                <a class="button is-primary" v-on:click="playAll">
                    Lire tout
                </a>
            </p>
        </div>
        
        <!-- lecture controlers -->
        <div class="field is-grouped" v-if="this.playing_id">
            <p class="control" >
                <a class="button" v-on:click="playPrevious">
                    Précédent
                </a>
            </p>
            <p class="control">
                <a class="button disabled" v-on:click="playNext">
                    Suivante
                </a>
            </p>
        </div>

        <div id="list" class="container">
            <div class="pull-to-refresh-material2__control">
                <svg class="pull-to-refresh-material2__icon" fill="#4285f4" width="24" height="24" viewBox="0 0 24 24">
                    <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                    <path d="M0 0h24v24H0z" fill="none" />
                </svg>

                <svg class="pull-to-refresh-material2__spinner" width="24" height="24" viewBox="25 25 50 50">
                    <circle class="pull-to-refresh-material2__path pull-to-refresh-material2__path--colorful" cx="50" cy="50" r="20" fill="none" stroke-width="4" stroke-miterlimit="10" />
                </svg>
            </div>
            
            <span v-if="medias.length === 0" class="loading">Pas de résultat</span>
            <div v-if="isSortedByCreationDate" v-for="(medias, day, index) in mediasByDay">
                <h4 class="creation_date">{{dateFormater.format(new Date(day))}}</h4>
                <div v-for="media in medias" :key="media.id" class="is-6">
                    <Media :mediaId="media.id" :mediaObj="media" :ref="media.id"></Media>
                </div>
            </div>
            <div v-if="!isSortedByCreationDate" v-for="media in this.medias" :key="media.id" class="is-6">
                <Media :mediaId="media.id" :mediaObj="media" :ref="media.id"></Media>
            </div>
        </div>
    </div>
</template>

<script>
 import Media from './Media.vue'
 import {mapGetters} from 'vuex'

 import pullToRefresh from 'mobile-pull-to-refresh'
 // Material 2
 import ptrAnimatesMaterial2 from 'mobile-pull-to-refresh/dist/styles/material2/animates'
 import 'mobile-pull-to-refresh/dist/styles/material2/style.css'

 export default {
     name: 'ListMedia',
     components: {
         Media
     },
     computed: {
         medias () {
             return this.$store.state.medias
         },
         mediasByDay() {
             return this.$store.state.medias.reduce((r, m) => {
                 const d = new Date(m.creation_date)
                 const ye = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(d)
                 const mo = new Intl.DateTimeFormat('en', { month: '2-digit' }).format(d)
                 const da = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(d)
                 const date = `${ye}-${mo}-${da}`
                 if (r[date]) {
                     r[date].push(m)
                 } else {
                     r[date] = [m]
                 }
                 return r
             }, {})
         },
         isSortedByCreationDate() {
             return this.$store.state.sortedByCreationDate
         }
     },
     data() {
         return{
             dateFormater: new Intl.DateTimeFormat('default',{ year: 'numeric', month: 'long', day: 'numeric'}),
             playing_id: undefined,
             autoplay: true,
             bottom: false,
             isDownloading: false
         }
     },
     mounted: function()
     {
         this.updateQuery()
         this.$store.commit("emptyMedias")
         window.addEventListener('scroll', () => {
             this.bottom = this.bottomIsClose()
         })

         // initialization of pull to refresh
         const store = this.$store
         pullToRefresh({
             container: document.querySelector('#list'),
             animates: ptrAnimatesMaterial2,
             refresh() {
                 return store.dispatch('refreshMedias')
             }
         })

         this.$on('playEnded', (v) => alert(v))

     },
     watch: {
         // call again the method if the route changes
         '$route': 'updateRoute',
         'playing_id': function() {
             this.playCurrent()
         },
         bottom(bottom) {
             if (bottom) {
                 this.$store.dispatch('getMore')
             }
         }
     },

     methods: {
         ...mapGetters(['first', 'before', 'after','contains']),
         /* control handlers */
         deleteAll () {
             const payload = {
                 'action': 'delete'
             }
             this.$store.dispatch('applyOnAll', payload)
         },
         downloadAll () {
             const payload = {
                 'action': 'download'
             }
             this.$store.dispatch('applyOnAll', payload)
         },
         playAll () {
             const id = this.first().id
             this.playOneId(id)
         },
         playNext () {
             let next = this.after()(this.playing_id)
             if (next) {
                 this.playOneId(next.id)
             } else {
                 this.$store.dispatch('getMore')
                     .then(() => {
                         next = this.after()(this.playing_id)
                         if (next) this.playOneId(next.id)
                     })
             }
         },
         playPrevious () {
             const previous = this.before()(this.playing_id)
             if(previous) {
                 this.playOneId(previous.id)
             }
         },
         /* play states */
         playCurrent () {
             if (this.playing_id) {
                 const mediaChild = this.$refs[this.playing_id][0]
                 mediaChild.play()
                 mediaChild.$on('playEnded', () => {
                     if (this.autoplay) {
                         this.playNext()
                     } else {
                         this.playing_id = undefined
                     }
                 })
             }
         },
         playOneId (id) {
             // stop current playing
             if (this.playing_id && this.playing_id !== id) {
                 this.stopOneId(this.playing_id)
             }

             this.playing_id = id
         },
         stopOneId (id) {
             this.$refs[id][0].reloadMedia()
         },
         /* routes handlers */
         updateRoute() {
             this.updateQuery()
                 .then(() => this.playCurrent())
         },
         updateQuery () {
             if (this.$route.name === 'SearchMedia' &&
                 (this.$route.query.text ||
                  this.$route.query.uploader)) {

                 this.playing_id = undefined
                 if (this.$route.query.text) {
                     const text = this.$route.query.text
                     const payload = {
                         queryName: 'searchText',
                         input: text
                     }
                     return this.$store.dispatch('query', payload)
                 } else {
                     const uploader = this.$route.query.uploader
                     const payload = {
                         queryName: 'searchUploader',
                         input: uploader
                     }
                     return this.$store.dispatch('query', payload)
                 }
             } else if (this.$route.name === 'WatchMedia' &&
                        this.$route.params.id) {
                 const id = this.$route.params.id
                 if (!this.contains(id))
                     return this.$store.dispatch('getOneMedia', id)

             } else {
                 this.playing_id = undefined
                 const payload = {
                     queryName: 'find',
                     input: ''
                 }
                 return this.$store.dispatch('query', payload)
             }
             return Promise.resolve()
         },
         bottomIsClose() {
             const margin = 1000
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

 .creation_date:before, .creation_date:after {
     display: inline-block;
     width: 15%;
     content: "";
     margin: 0 0.5em;
     vertical-align: middle;
     border-bottom: .13em solid black;
 }
 
 .creation_date {
     margin: 1em 0;
 }
</style>


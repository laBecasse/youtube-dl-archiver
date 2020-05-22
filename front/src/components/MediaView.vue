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
            <p class="control" style="display: none">
                <a class="button is-primary" v-on:click="playAll">
                    Lire tout
                </a>
            </p>
        </div>
        
        <!-- lecture controlers -->
        <div class="field is-grouped" v-if="false && this.playing_id">
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
            <MediaList :medias="medias" :isSortedByCreationDate="params.isSortedByCreationDate"/>
        </div>
    </div>
</template>

<script>
 import MediaList from './MediaList.vue'
 import {mapGetters} from 'vuex'

 import pullToRefresh from 'mobile-pull-to-refresh'
 // Material 2
 import ptrAnimatesMaterial2 from 'mobile-pull-to-refresh/dist/styles/material2/animates'
 import 'mobile-pull-to-refresh/dist/styles/material2/style.css'

 export default {
     name: 'MediaView',
     components: {
         MediaList
     },
     props: ['params'],
     computed: {
         step () {
             return this.$store.state.step
         },
         medias() {
             return this.$store.getters.getViewMedias(this.params)
         }
     },
     data() {
         return{
             playing_id: undefined,
             autoplay: true,
             bottom: false,
             isDownloading: false,
             isLocked: false,
             offset: 0
         }
     },
     created() {
         this.$store.commit('registerView', this.params)
     },


     mounted: function()
     {
         this.$store.dispatch('getMore', this.params)
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
         'playing_id': function() {
             this.playCurrent()
         },
         'params': function() {
             this.$store.commit('registerView', this.params)
             if (this.medias.length === 0) {
                 this.$store.dispatch('getMore', this.params)
             }
         },
         bottom(bottom) {
             if (bottom) {
                 this.$store.dispatch('getMore', this.params)
             }
         }
     },

     methods: {
         ...mapGetters(['first', 'before', 'after','contains']),
         /* control handlers */
         deleteAll () {
             const payload = {
                 action: 'delete',
                 params: this.params
             }
             this.$store.dispatch('applyOnAll', payload)
         },
         downloadAll () {
             const payload = {
                 action: 'downloadMedia',
                 params: this.params
             }
             this.$store.dispatch('applyOnAll', payload)
         },
         playAll () {
             const id = this.first().id
             this.playOneId(id)
         },
         playNext () {
             let currentIndex = this.medias.indexOf(this.playing_id)
             let next = (currentIndex != -1) ? this.medias.get(currentIndex + 1) : null
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


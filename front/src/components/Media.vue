<template>
    <div class="card media-card">
        <section v-if="media" class="is-gapless" v-bind:class="{'columns': !expanded}">
            <article v-if="this.deleteConfirmation" class="confirmation message is-medium is-danger">
                <div class="message-header">
                    <p>Confirmation</p>
                </div>
                <div class="message-body" >
                    <div class="columns is-vcentered">
                        <div class="column is-full">
                            <p>Êtes-vous sûr de vouloir supprimer ?</p>
                            <div class="columns is-centered">
                                <div class="column">
                                    <a class="button" v-on:click="toggleDeleteConfirmation">
                                        Annuler
                                    </a>
                                </div>
                                <div class="column">
                                    <a class="button is-danger" v-on:click="deleteThis">
                                        Supprimer
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </article>
            <article v-if="media && this.downloadChoose" class="confirmation message is-medium is-info">
                <div class="message-header">
                    <p>Télécharger</p>
                </div>
                <div class="message-body" >
                    <div class="columns is-centered">
                        <div class="column">
                            <a class="button" v-on:click="toggleDownloadChoose">
                                Annuler
                            </a>
                        </div>
                        <div class="column">
                            <div class="columns">
                                <div class="column">
                                    <p v-if="media && media.file_path && !offlineMediaURL" class="field">
                                        <a class="button is-info" v-on:click="createOfflineMedia" >
                                            Rendre le média hors ligne
                                        </a>
                                    </p>
                                    <p v-if="offlineMediaURL" class="field">
                                        <a class="button is-danger" v-on:click="removeOfflineMedia">
                                            Supprimer le média hors ligne
                                        </a>
                                    </p>
                                    <p v-if="!media.file_path" class="field">
                                        <a class="button is-info" v-on:click="download">
                                            Télécharger sur le serveur
                                        </a>
                                    </p>
                                </div>
                                <div class="column">
                                    <p class="field">
                                        <a :href="fileUrl" class="button is-info" title="Télécharger" download>Télécharger</a>
                                    </p>
                                    <p v-if="media.torrent_url" class="field">
                                        <a :href="media.torrent_url" class="button is-info" title="Télécharger" download>Télécharger Torrent</a>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </article>
            <div v-if="media" class="media-column-video" v-bind:class="{'column': !expanded}">
                <div class="card-image">
                    <video v-if="media.type === 'video'" controls :poster="(media.thumbnail) ? media.thumbnail.url: undefined" preload="none" class="image">
                        <source v-if="fileUrl" :src="offlineMediaURL || fileUrl" :type="media.mime"/>
                        <source v-if="!fileUrl && media.original_file" :src="media.original_file.url" :type="media.original_file.mime"/>
                        <track v-for="sub in media.subtitles" :key="sub.url"
                               :src="sub.url"
                               :label="sub.lang"
                               kind="subtitles" :srclang="sub.lang"/>
                        <p>Your browser does not support the video element.</p>
                    </video>
                    <audio v-if="media.type === 'audio'" controls preload="none">
                        <source v-if="!media.torrent_url" :src="offlineMediaURL || fileUrl" :type="media.mime">
                        <source v-if="media.original_file" :src="media.original_file.url" :type="media.original_file.mime"/>
                        <p>Your browser does not support the audio element.</p>
                    </audio>
                    <img v-if="media.type === 'image'"
                         :src="fileUrl||media.original_file.url"/>
                    <a v-if="media.type === 'other'"
                       :href="fileUrl||media.original_file.url">media</a>
                </div>
            </div>
            <div class="is-primary" v-bind:class="{'column': !expanded}">
                <div class="card-header">
                    <h4 class="card-header-title is-2">
                        <router-link :to="{name: 'WatchMedia', params: {id: media.id}}" class="has-text-dark">{{media.title}}</router-link>
                    </h4>
                </div>
                <div class="card-content">
                    <p class="media-meta">
                        <router-link :to="{name: 'Uploader', params: {uploader: media.uploader}}" class="has-text-dark">
                            <span v-if="media.creator">{{media.creator}}</span>
                            <span v-if="!media.creator && media.uploader">{{media.uploader}}</span>
                        </router-link>
                        -
                        <span>{{media.formated_creation_date}}</span>
                    </p>
                    <Tags v-if="media.tags" :tags="media.tags" :removingEnabled="expanded" :limited="!expanded" @removeTag="removeTag"/>
                    <TagForm @addTag="addTag"/>
                    <p v-if="media.description && !expanded" v-html="media.short_description" class="description">
                    </p>
                    <p v-if="media.description && expanded" v-html="media.htmlDescription" class="description">
                    </p>
                    <a v-bind:href="media.url">lien original</a>
                </div>
            </div>
        </section>
        <footer v-if="media" class="card-footer">
            <!-- <a :href="fileUrl" class="card-footer-item" download>Download</a> -->
            <!-- <a class="card-footer-item"><span class="button"><span class="delete has-text-danger"></span> Delete</span></a> -->
            <a class="card-footer-item" v-bind:class="{'has-background-info': offlineMediaURL, 'has-text-white': offlineMediaURL, 'has-background-black': fileUrl, 'has-text-white': fileUrl}" title="Télécharger" v-on:click="toggleDownloadChoose"><DownloadIcon/></a>
            <a class="card-footer-item has-text-danger" v-on:click="toggleDeleteConfirmation" title="Supprimer"><TrashIcon/></a>
        </footer>
        <script v-html="jsonld" type="application/ld+json">
        </script>
    </div>
</template>

<script>
 import { mapActions, mapMutations,  mapGetters } from 'vuex'
 import DownloadIcon from 'vue-ionicons/dist/md-download.vue'
 import TrashIcon from 'vue-ionicons/dist/md-trash.vue'
 import TagForm from './TagForm.vue'
 import Tags from './Tags.vue'

 export default {
     name: 'Media',
     props: ['mediaObj', 'mediaId', 'expanded'],
     components: {
         DownloadIcon,
         TrashIcon,
         Tags,
         TagForm
     },
     computed: {
         fileUrl () {
             return (this.media) ? this.media.file_url : null
         }
     },
     data () {
         /* const jsonld = {
          *   "@context": "https://schema.org/",
          *   "@type":"VideoObject",
          *   "name": this.media.title,
          *   "description": this.media.description,
          *   "thumbnailUrl": (this.media.thumbnail) ? this.media.thumbnail.url: null,
          *   "uploadDate": this.media.upload_date,
          *   "contentUrl": this.media.url
          * }
          *  */
         return {
             deleteConfirmation: false,
             downloadChoose: false,
             offlineMediaURL: null,
             isTorrentSet: false,
             jsonld: {},
             media: null,
             mediaPromise: null,
             isInitialized: false
         }
     },
     created () {
         const t = this
         if (!t.mediaObj) {
             
             t.mediaPromise = t.$store.dispatch('getOneMedia', t.mediaId).then(media => {
                 t.media = formatMedia(media)

             })
         } else {
             t.media = formatMedia(t.mediaObj)
         }
     },
     updated () {
         // if the media is loading or finished 
         if (!this.isInitialized && this.mediaPromise) {
             this.mediaPromise
                 .then(() => {
                     this.init()
                     this.mediaPromise = null
                 })
         }
     },
     mounted () {
         if (!this.isInitialized && this.media) {
             this.init()
         }
     },
     watch: {
         offlineMediaURL: 'reloadMedia',
         'fileUrl': 'reloadMedia'
     },
     methods: {
         ...mapGetters(['getMagnet']),
         ...mapMutations(['setMagnetOfId']),
         ...mapActions(['makeOfflineMedia', 'getOfflineMediaURL', 'deleteOfflineMedia', 'downloadMedia']),
         toggleDeleteConfirmation () {
             this.deleteConfirmation = !this.deleteConfirmation
         },
         /* getters */
         getMediaElt () {
             const mediaElt = (this.media.type === 'video') ? this.$el.querySelector('.card-image video') : this.$el.querySelector('.card-image audio')
             return mediaElt
         },
         /* control handlers */
         deleteThis () {
             return this.$store.dispatch('delete', {id: this.media.id})
         },
         toggleDownloadChoose() {
             this.downloadChoose = !this.downloadChoose
         },
         createOfflineMedia () {
             const id = this.media.id
             this.makeOfflineMedia(id)
                            .then(() => this.setOfflineMediaURL())
                            .catch(e => {
                                if (e.status !== 404) {
                                    this.$root.showWarning('Une erreur est survenue à la mise hors-ligne de la vidéo:<br/>: '+e)
                                }
                            })

         },
         removeOfflineMedia () {
             const id = this.media.id
             this.deleteOfflineMedia(id)
                            .then(() => {
                                this.offlineMediaURL = null
                                this.downloadChoose = false
                            })
                            .catch(e => {
                                this.$root.showWarning('Une erreur est survenue à la suppression de la vidéo hors-ligne :<br/>: '+e)
                            })

         },
         setOfflineMediaURL () {
             const id = this.media.id
             return this.getOfflineMediaURL(id)
                        .then(url => {
                            this.offlineMediaURL = url
                            this.downloadChoose = false
                            return url
                        })
                        .catch(e => {
                            if (e.status !== 404) throw e
                        })
         },
         download () {
             const id = this.media.id
             return this.downloadMedia({id: id})
                        .then(() => {this.downloadChoose = false})
         },
         /* play states */
         play () {
             const mediaElt = this.getMediaElt()
             mediaElt.play()
         },
         reloadMedia () {
             if (this.isInitialized) {
                 // reload the media when changing the source URL
                 this.getMediaElt().load()
             }
         },
         init() {

             const media = this.media
             const t = this
             if (media.torrent_url) {
                 
                 var client = this.$store.state.webtorrentClient
                 
                 const mediaElt = this.getMediaElt()
                 
                 const playhandler = function() {
                     
                     // if the actual media is not yet served using webtorrent
                     if (!t.isTorrentSet) {
                         mediaElt.pause()
                     } else {
                         // if the webtorrent is set/rendered
                         return;
                     }
                     // try to get the torrent of the media 
                     const torrent = client.get(t.getMagnet()(media.id))
                     if (!torrent) {
                         // download the torrent
                         client.add(media.torrent_url, function(torrent) {
                             // attach a web seed to it
                             const url = media.file_url
                             torrent.addWebSeed(url)
                             // the torrent of the actual media is downloading
                             // for this session
                             t.setMagnetOfId({
                                 id: media.id,
                                 magnet: torrent.magnetURI
                             })
                             
                             // play as torrent
                             torrent.files.forEach(function (file) {
                                 file.renderTo(mediaElt)
                                 mediaElt.play()
                             })
                         })
                     } else {
                         // play as torrent
                         torrent.files.forEach(function (file) {
                             file.renderTo(mediaElt)
                             mediaElt.play()
                         })
                     }
                     
                     // the actual media is served using webtorrent
                     t.isTorrentSet = true
                 }
                 mediaElt.addEventListener('play', playhandler)

             }
             const mediaElt = this.getMediaElt()
             if (mediaElt) {
                 const listener = () => {
                     this.$emit('playEnded')
                 }
                 mediaElt.addEventListener('ended', listener)
                 
                 mediaElt.addEventListener('play', () => {
                     if (this.$parent.playOneId)
                         this.$parent.playOneId(this.media.id)
                 })
                 // offline state initialization
                 this.setOfflineMediaURL()
                 /* torrentInit() */
             }
             this.isInitialized = true
         },
         removeTag (tag) {
             const mediaId = this.media.id
             console.log('remove tag' , tag, 'from', mediaId)
             this.$store.dispatch('removeTagFromMedia', { mediaId: mediaId, tag: tag})
         },
         addTag (tag) {
             const mediaId = this.media.id
             this.$store.dispatch('addTagToMedia', { mediaId: mediaId, tag: tag})
         }
     }
 }

 /*
  * Format media functions
  */

 const SHORT_DESCRIPTION_LENGTH = 200

 function formatMedia (media) {
     addMediaType(media)
     addShortDescription(media)
     addFormatedUploadDate(media)
     addHTMLDescription(media)
     return media
 }

 function urlify(text) {
     var urlRegex = /(https?:\/\/[^\s]+)/g;
     return text.replace(urlRegex, function(url) {
         return '<a href="' + url + '">' + url + '</a>';
     })
 }

 function htmlEscape(text) {
     return text
         .replace(/&/g, '&amp;')
         .replace(/</g, '&lt;')
         .replace(/"/g, '&quot;')
         .replace(/'/g, '&#039;')
 }

 function addHTMLDescription (media) {
     if (media.description) {
         let htmlDescription = htmlEscape(media.description)
         htmlDescription = urlify(htmlDescription)
         htmlDescription = htmlDescription.replace(/\r\n?|\n/g, "<br>")
         media.htmlDescription = htmlDescription
     }
 }

 function addShortDescription (media) {
     const description = media.description
     
     if (description) {
         let shortDescription = description.split('\n\n')[0]
         shortDescription = shortDescription.substring(0, SHORT_DESCRIPTION_LENGTH)
         shortDescription = urlify(shortDescription)
         shortDescription = shortDescription.replace(/\r\n?|\n/g, "<br>")
         
         if (media.description.length > SHORT_DESCRIPTION_LENGTH) {
             shortDescription += '...'
         }
         media.short_description = shortDescription
     }
 }

 function addMediaType (media) {
     const reV = new RegExp('video')
     const reI = new RegExp('image')
     const reA = new RegExp('audio')
     media.type = 'other'
     if (reV.test(media.mime)) {
         media.type = 'video'
     }
     if (reI.test(media.mime)) {
         media.type = 'image'
     }
     if (reA.test(media.mime)) {
         media.type = 'audio'
     }
 }

 function addFormatedUploadDate (media) {
     if (media.upload_date) {
         const date = parseUploadDate(media)
         media.formated_creation_date = new Intl.DateTimeFormat().format(date)
     }
 }

 function parseUploadDate (media) {
     const dateString = media.upload_date
     const year = dateString.substring(0, 4)
     const month = parseInt(dateString.substring(4, 6))
     const day = dateString.substring(6, 8)
     
     return new Date(year, month - 1, day)
 }
</script>

<style>
 .media-card a:hover {
     text-decoration: underline;
 }

 .media-card section{
     position: relative;
     margin-bottom: 0 !important;
 }

 .media-card .description{
     text-align: left;
 }

 .confirmation {
     background-color: white;
     position: absolute;
     width: 100%;
     height: 100%;
     z-index: 2;
 }

 .is-vertical-center {
     display: flex;
     align-items: center;
 }
</style>

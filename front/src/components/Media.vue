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
                                        <a :href="media.file_url" class="button is-info" title="Télécharger" download>Télécharger</a>
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
                <slot name="player">
                    <MediaPlayer v-if="expanded && media.archived" :media="media" :offlineMediaURL="offlineMediaURL"/>
                    <MediaThumbnail v-else="" :media="media" :offlineMediaURL="offlineMediaURL" :isDownloading="isDownloading"/>
                </slot>
            </div>
            <div class="is-primary" v-bind:class="{'column': !expanded}">
                <MediaDescription :media="media" :expanded="expanded" />
            </div>
        </section>
        <slot name="footer" v-bind:media="media">
            <footer v-if="media && media.archived" class="card-footer">
                <a class="card-footer-item" v-bind:class="{'has-background-info': offlineMediaURL, 'has-text-white': offlineMediaURL, 'has-background-black': media.file_url, 'has-text-white': media.file_url, 'is-blinking': isDownloading}" title="Télécharger" v-on:click="toggleDownloadChoose"><DownloadIcon /></a>
                <RadioButton :media="media"/>
                <a class="card-footer-item has-text-danger" v-on:click="toggleDeleteConfirmation" title="Supprimer"><TrashIcon/></a>
            </footer>
        </slot>
        <script v-html="jsonld" type="application/ld+json">
        </script>
    </div>
</template>

<script>
 import { mapActions } from 'vuex'
 import DownloadIcon from 'vue-ionicons/dist/md-download.vue'
 import TrashIcon from 'vue-ionicons/dist/md-trash.vue'
 import MediaDescription from './MediaDescription.vue'
 import MediaPlayer from './MediaPlayer.vue'
 import MediaThumbnail from './MediaThumbnail.vue'
 import RadioButton from './RadioButton.vue'

 export default {
     name: 'Media',
     props: {
         mediaObj: {
             type: Object,
             required: false
         },
         mediaId: {
             type: String,
             required: false
         },
         expanded: {
             type: Boolean,
             required: false,
             default: false
         }
     },
     components: {
         DownloadIcon,
         TrashIcon,
         MediaDescription,
         MediaPlayer,
         MediaThumbnail,
         RadioButton
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
             isInitialized: false,
             isDownloading: false
         }
     },
     created () {
         const t = this
         if (!t.mediaObj) {
             t.mediaPromise = t.$store.dispatch('getOneMedia', t.mediaId).then(media => {
                 t.media = media
                 this.setOfflineMediaURL()
             })
         } else {
             t.media = t.mediaObj
             this.setOfflineMediaURL()
         }

         function uploadNotArchived() {
             if (!t.media.archived && t.expanded) {
                 const mediaUrl = t.media.media_url

                 const oldPath = t.$route.path
                 t.isDownloading = true
                 t.$store.dispatch('uploadURL', {url: mediaUrl, withDownload: true})
                  .then(medias => {
                      t.isDownloading = false
                      t.media = medias[0]
                      if (oldPath === t.$route.path) {
                          t.$router.replace({name: 'WatchMedia', params : {id: medias[0].id}})
                      }
                  })
                  .catch(e => {
                      this.$store.commit('showWarning', 'error : \n' + JSON.stringify(e))
                  })
             }
         }

         if (t.media) {
             uploadNotArchived()
         } else if (t.mediaPromise) {
             t.mediaPromise.then(uploadNotArchived)
         }
     },
     methods: {
         ...mapActions(['makeOfflineMedia', 'getOfflineMediaURL', 'deleteOfflineMedia', 'downloadMedia']),
         toggleDeleteConfirmation () {
             this.deleteConfirmation = !this.deleteConfirmation
         },
         getMediaType () {
             const reV = new RegExp('video')
             const reI = new RegExp('image')
             const reA = new RegExp('audio')

             if (reV.test(this.media.mime)) {
                 return 'video'
             }
             if (reI.test(this.media.mime)) {
                 return 'image'
             }
             if (reA.test(this.media.mime)) {
                 return 'audio'
             }
             return 'other'
         },
         /* control handlers */
         deleteThis () {
             const t = this
             return this.$store.dispatch('delete', {id: this.media.id})
                        .then(() => {
                            if (t.expanded) {
                                t.$router.go(-1)
                            }
                        })
         },
         toggleDownloadChoose() {
             this.downloadChoose = !this.downloadChoose
         },
         createOfflineMedia () {
             const id = this.media.id
             this.isDownloading = true
             this.downloadChoose = false
             this.makeOfflineMedia(id)
                 .then(() => this.setOfflineMediaURL())
                 .then(() => {this.isDownloading = false})
                 .catch(e => {
                                if (e.status !== 404) {
                                    this.$store.commit('showWarning', 'Une erreur est survenue à la mise hors-ligne de la vidéo:<br/>: '+e)
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
                                this.$store.commit('showWarning','Une erreur est survenue à la suppression de la vidéo hors-ligne :<br/>: '+e)
                            })

         },
         setOfflineMediaURL () {
             const id = this.media.id
             return this.getOfflineMediaURL(id)
                        .then(url => {
                            this.offlineMediaURL = url
                            return url
                        })
                        .catch(e => {
                            if (e.status !== 404) throw e
                        })
         },
         download () {
             const id = this.media.id
             this.isDownloading = true
             this.downloadChoose = false
             return this.downloadMedia({id: id})
                        .then(() => {this.isDownloading = false})
         },
         /* play states */
         reloadMedia () {
             if (this.isInitialized) {
                 // reload the media when changing the source URL
                 this.getMediaElt().load()
             }
         }
     }
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

 video, audio, img {
     max-width: 100%;
     margin: auto;
 }

 audio {
     width: 100%;
 }
</style>

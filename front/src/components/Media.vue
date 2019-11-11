<template>
<div class="card media-card">
  <section class="is-gapless" v-bind:class="{'columns': !expanded}">
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
                <a class="button is-danger" v-on:click="deleteMedia">
                  Supprimer
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
    <article v-if="this.downloadChoose" class="confirmation message is-medium is-info">
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
                <p v-if="media.file_path && !offlineMediaURL" class="field">
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
    <div class="media-column-video" v-bind:class="{'column': !expanded}">
      <div class="card-image">
        <video v-if="media.type === 'video'" controls :poster="(media.thumbnail) ? media.thumbnail.url: undefined" preload="none" class="image">
          <source v-if="media.file_url" :src="offlineMediaURL || media.file_url" :type="media.mime"/>
          <source v-if="media.original_file" :src="media.original_file.url" :type="media.original_file.mime"/>
          <track v-for="sub in media.subtitles"
                 :src="sub.url"
                 :label="sub.lang"
                 kind="subtitles" :srclang="sub.lang">
            <p>Your browser does not support the video element.</p>
        </video>
        <audio v-if="media.type === 'audio'" controls preload="none">
          <source v-if="!media.torrent_url" :src="offlineMediaURL || media.file_url" :type="media.mime">
            <source v-if="media.original_file" :src="media.original_file.url" :type="media.original_file.mime"/>
            <p>Your browser does not support the audio element.</p>
        </audio>
        <img v-if="media.type === 'image'"
             :src="media.file_url||media.original_file.url"/>
        <a v-if="media.type === 'other'"
           :href="media.file_url||media.original_file.url">media</a>
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
          <router-link :to="{name: 'SearchMedia', query: {uploader: media.uploader}}" class="has-text-dark">
            <span v-if="media.creator">{{media.creator}}</span>
            <span v-if="!media.creator && media.uploader">{{media.uploader}}</span>
          </router-link>
          -
          <span>{{media.formated_creation_date}}</span>
        </p>
        <p v-if="media.description && !expanded" v-html="media.short_description" class="description">
        </p>
        <p v-if="media.description && expanded" v-html="media.htmlDescription" class="description">
        </p>
        <a v-bind:href="media.url">lien original</a>
      </div>
    </div>
  </section>
  <footer class="card-footer">
    <!-- <a :href="media.file_url" class="card-footer-item" download>Download</a> -->
    <!-- <a class="card-footer-item"><span class="button"><span class="delete has-text-danger"></span> Delete</span></a> -->
    <a class="card-footer-item" v-bind:class="{'has-background-info': offlineMediaURL, 'has-text-white': offlineMediaURL, 'has-background-black': media.file_url, 'has-text-white': media.file_url}" title="Télécharger" v-on:click="toggleDownloadChoose"><DownloadIcon/></a>
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

export default {
  name: 'Media',
  props: ['media', 'expanded'],
  components: {
    DownloadIcon,
    TrashIcon
  },
  data () {
    const jsonld = {
      "@context": "https://schema.org/",
      "@type":"VideoObject",
      "name": this.media.title,
      "description": this.media.description,
      "thumbnailUrl": (this.media.thumbnail) ? this.media.thumbnail.url: null,
      "uploadDate": this.media.upload_date,
      "contentUrl": this.media.url
    }
    
    return {
      deleteConfirmation: false,
      downloadChoose: false,
      offlineMediaURL: null,
      isTorrentSet: false,
      jsonld: jsonld
    }
  },
  mounted () {
    this.setOfflineMediaURL()
    
    //function mediaTorrent() {
    const media = this.media
    const t = this
    if (media.torrent_url) {
      
      var client = this.$store.state.webtorrentClient
      
      const mediaElt = (media.type === 'video') ? this.$el.querySelector('.card-image video') : this.$el.querySelector('.card-image audio')
      
      const playhandler = function(event) {
        
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
              id: media._id,
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
  },
  watch: {
    offlineMediaURL: 'reloadMedia'
  },
  methods: {
    ...mapGetters(['getMagnet']),
    ...mapMutations(['setMagnetOfId']),
    ...mapActions(['makeOfflineMedia', 'getOfflineMediaURL', 'deleteOfflineMedia', 'downloadMedia']),
    toggleDeleteConfirmation () {
      this.deleteConfirmation = !this.deleteConfirmation
    },
    deleteMedia () {
      const base = this.$root.$data.API_URL
      const query = base + '/medias/' + this.media.id
      console.log(query)
      this.axios.delete(query)
        .then((response) => {
          this.$store.commit('removeMedia', this.media.id)
        })
        .catch((e) => {
          console.error(e)
        })
    },
    toggleDownloadChoose() {
      this.downloadChoose = !this.downloadChoose
    },
    createOfflineMedia () {
      const id = this.media._id
      this.makeOfflineMedia(id)
        .then(() => this.setOfflineMediaURL())
    },
    removeOfflineMedia () {
      const id = this.media._id
      this.deleteOfflineMedia(id)
        .then(() => {
          this.offlineMediaURL = null
          this.downloadChoose = false
        })
    },
    setOfflineMediaURL () {
      const id = this.media._id
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
      const id = this.media._id
      return this.downloadMedia(id)
    },
    reloadMedia () {
      // reload the media when changing the source URL
      const mediaElt = (this.media.type === 'video') ? this.$el.querySelector('.card-image video') : this.$el.querySelector('.card-image audio')
      mediaElt.load()
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
</style>

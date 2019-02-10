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
    <div class="media-column-video" v-bind:class="{'column': !expanded}">
      <div class="card-image">
        <video v-if="media.type === 'video'" controls :poster="(media.thumbnail) ? media.thumbnail.url: undefined" preload="none" class="image">
          <source :src="media.file_url" :type="media.mime"/>
          <track v-for="sub in media.subtitles"
                 :src="sub.url"
                 :label="sub.lang"
                 kind="subtitles" :srclang="sub.lang">
        </video>
        <audio v-if="media.type === 'audio'" controls> <!-- preload="none"> -->
          <source :src="media.file_url" :type="media.mime">
            <p>Your browser does not support the audio element.</p>
        </audio>
        <img v-if="media.type === 'image'"
             :src="media.file_url"/>
        <a v-if="media.type === 'other'"
           :href="media.file_url">media</a>
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
        <p v-if="media.description && !expanded">
          {{media.short_description}}
        </p>
        <p v-if="media.description && expanded">
          {{media.description}}
        </p>
        <a v-bind:href="media.url">lien original</a>
      </div>
    </div>
  </section>
  <footer class="card-footer">
    <!-- <a :href="media.file_url" class="card-footer-item" download>Download</a> -->
    <!-- <a class="card-footer-item"><span class="button"><span class="delete has-text-danger"></span> Delete</span></a> -->
    <a :href="media.file_url" class="card-footer-item" title="Télécharger" download><ion-icon name="download"></ion-icon></a>
    <a class="card-footer-item has-text-danger" v-on:click="toggleDeleteConfirmation" title="Supprimer"><ion-icon name="trash"></ion-icon></a>
  </footer>
</div>
</template>

<script>
export default {
    name: 'Media',
    props: ['media', 'expanded'],
    data () {
        return {
            deleteConfirmation: false
        }
    },
    methods: {
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

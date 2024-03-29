<template>
    <div class="is-primary" >
        <div class="card-header">
            <h4 v-if="media.id" class="card-header-title is-2">
                <router-link :to="{name: 'WatchMedia', params: {id: media.id}}" class="has-text-dark">{{media.title}}</router-link>
            </h4>
            <h4 v-else class="card-header-title is-2">{{media.title}}</h4>
        </div>
        <div class="card-content">
            <p class="media-meta">
                <router-link :to="{name: 'Uploader', params: {uploader: media.uploader}}" class="has-text-dark">
                    <span v-if="media.creator">{{media.creator}}</span>
                    <span v-if="!media.creator && media.uploader">{{media.uploader}}</span>
                </router-link>
                -
                <span>{{uploadDate}}</span>
            </p>
            <Tags v-if="media.tags" :tags="media.tags" :removingEnabled="expanded" :limited="!expanded" @removeTag="removeTag"/>
            <TagForm v-if="media.archived" @addTag="addTag"/>
            <p v-if="media.description" v-html="description" class="description"></p>
            <p v-if="expanded && descriptionShortening">
              <button v-on:click="toggleDescription" v-if="fullDescription">show less</button>
              <button v-on:click="toggleDescription" v-else>show more</button>
            </p>
            <p class="original-link">
              <a  v-bind:href="media.url">lien original</a>
            </p>
        </div>
        <WebmentionComponent v-if="media.id && expanded" :id="media.id" :url="media.url" />
    </div>
</template>

<script>
 import TagForm from './TagForm.vue'
 import Tags from './Tags.vue'
 import WebmentionComponent from './WebmentionComponent.vue'

 export default {
     name: 'MediaDescription',
     props: ['media', 'expanded'],
     components: {
         Tags,
         TagForm,
         WebmentionComponent
     },
     computed: {
       description() {
         if (this.fullDescription)
           return  getHTMLDescription(this.media)
         else
           return getShortDescription(this.media)
         },
         uploadDate() {
             return getFormatedUploadDate(this.media)
         }
     },
     data () {
         return {
           fullDescription: false,
           descriptionShortening: this.media.description && this.media.description.length > SHORT_DESCRIPTION_LENGTH
       }  
     },
     methods: {
         removeTag (tag) {
             const mediaId = this.media.id
             this.$store.dispatch('removeTagFromMedia', { mediaId: mediaId, tag: tag})
         },
         addTag (tag) {
             const mediaId = this.media.id
             this.$store.dispatch('addTagToMedia', { mediaId: mediaId, tag: tag})
         },
       toggleDescription() {
         this.fullDescription = !this.fullDescription
       }
     }
 }

 /*
  * Format media functions
  */

 const SHORT_DESCRIPTION_LENGTH = 200

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

 function getHTMLDescription (media) {
     if (media.description) {
         let htmlDescription = htmlEscape(media.description)
         htmlDescription = urlify(htmlDescription)
         htmlDescription = htmlDescription.replace(/\r\n?|\n/g, "<br>")
         return htmlDescription
     }
 }

 function getShortDescription (media) {
     const description = media.description
     if (description) {
         let shortDescription = description.split('\n\n')[0]
         shortDescription = shortDescription.substring(0, SHORT_DESCRIPTION_LENGTH)
         shortDescription = urlify(shortDescription)
         shortDescription = shortDescription.replace(/\r\n?|\n/g, "<br>")
         
         if (media.description.length > SHORT_DESCRIPTION_LENGTH) {
             shortDescription += '...'
         }
         return shortDescription
     }
 }

 function getFormatedUploadDate (media) {
     if (media.upload_date) {
         const date = parseUploadDate(media)
         return new Intl.DateTimeFormat().format(date)
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
  .description {
      text-overflow: ellipsis;
      overflow: hidden;
  }

  .original-link {
      margin-top: 2em;
  }
</style>

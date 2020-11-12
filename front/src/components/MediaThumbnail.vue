<template>
    <router-link :to="{name: 'WatchMedia', params: {id: media.id}}">
        <div class="card-image thumbnail-wrapper">
            <img v-if="media.thumbnail && media.thumbnail.url" :src="media.thumbnail.url" :alt="media.title" v-bind:class="{'is-blinking': isDownloading}"/>
        </div>
    </router-link>
</template>

<script>
 import { mapGetters } from 'vuex'

 export default {
     name: 'MediaPlayer',
     props: ['media', 'offlineMediaURL', 'isDownloading'],
     components: {
     },
     data () {
         return {
             mediaType: this.getMediaType()
         }
     },
     methods: {
         ...mapGetters(['getMagnet']),
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
         }
     }
 }
</script>

<style>
 .thumbnail-wrapper {
     background-color: black;
 }
 </style>

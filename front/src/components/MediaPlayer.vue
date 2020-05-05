<template>
    <div class="card-image">
        <video v-if="getMediaType() === 'video' && (media.original_file || media.file_url)" controls :poster="(media.thumbnail) ? media.thumbnail.url: undefined" preload="metadata" class="image">
            <source v-if="media.file_url" :src="offlineMediaURL || media.file_url" :type="media.mime"/>
            <source v-if="!media.file_url && media.original_file" :src="media.original_file.url" :type="media.original_file.mime"/>
            <track v-for="sub in media.subtitles" :key="sub.url"
                   :src="sub.url"
                   :label="sub.lang"
                   kind="subtitles" :srclang="sub.lang"/>
            <p>Your browser does not support the video element.</p>
        </video>
        <audio v-else-if="getMediaType() === 'audio'" controls preload="none">
            <source v-if="!media.torrent_url" :src="offlineMediaURL || media.file_url" :type="media.mime">
            <source v-if="media.original_file" :src="media.original_file.url" :type="media.original_file.mime"/>
            <p>Your browser does not support the audio element.</p>
        </audio>
        <img v-else-if="getMediaType() === 'image'"
             :src="media.file_url||media.original_file.url"/>
        <a v-else-if="getMediaType() === 'other'"
           :href="media.file_url||media.original_file.url">media</a>
        <img v-else-if="media.thumbnail"
             :src="media.thumbnail.url"/>
    </div>
</template>

<script>
 import { mapActions, mapMutations,  mapGetters } from 'vuex'

 export default {
     name: 'MediaPlayer',
     props: ['media', 'offlineMediaURL'],
     components: {
     },
     data () {
         return {
             mediaType: this.getMediaType()
         }
     },
     mounted () {
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
     },
     watch: {
         offlineMediaURL: 'reloadMedia',
         'media.file_url': 'reloadMedia'
     },
     methods: {
         ...mapGetters(['getMagnet']),
         ...mapMutations(['setMagnetOfId']),
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
         getMediaElt () {
             const mediaElt = (this.getMediaType() === 'video') ? this.$el.querySelector('.card-image video') : this.$el.querySelector('.card-image audio')
             return mediaElt
         },
         reloadMedia () {
             if (this.isInitialized) {
                 // reload the media when changing the source URL
                 this.getMediaElt().load()
             }
         }
     }
 }
</script>

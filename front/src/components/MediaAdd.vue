<template>
    <Media :mediaObj="mediaObj" :expanded="false">
        <template v-slot:footer="props">
            <footer v-if="props.media" class="card-footer">
                <a class="card-footer-item button" title="Ajouter" v-on:click="add" v-bind:class="{'is-loading': isUploading, 'is-info': !uploaded, 'is-success': uploaded}">
                    <AddIcon v-if="!isUploading && !uploaded"/>
                </a>
            </footer>
        </template>
    </Media>
</template>

<script>
 import Media from './Media.vue'
 import AddIcon from 'vue-ionicons/dist/md-add.vue'

 export default {
     name: 'MediaAdd',
     components: {
         Media,
         AddIcon
     },
     props: {
         mediaObj: {
             type: Object,
             required: false
         }
     },
     data () {
         return {
             isUploading: false,
             uploadFailed: false,
             uploaded: false
         }
     },
     methods: {
         add () {
             if (!this.uploaded) {
                 this.isUploading = true
                 return this.$store.dispatch('uploadURL', {url: this.mediaObj.media_url, withDownload: false})
                            .then(() => {
                                this.isUploading = false
                                this.uploaded = true
                            })
                            .catch(() => {
                                this.uploadFailed = true
                                this.isUploading = false
                            })
             }
         }
     }
 }
</script>

<template>
    <form v-on:submit.prevent="onSubmit" action="/medias" method="post">
        <div class="field has-addons">
            <div class="control">
                <input :id="'post-media-url' + this.id" class="input" type="text" value="" name="url" placeholder="URL"/>
            </div>
            <div class="control">
                <input type="checkbox" :id="'withdownload' + this.id" name="withdownload" class="hidden" value="" checked/>
                <label :for="'withdownload' + this.id" class="button has-text-grey withdownload" title="Activer le téléchargement des médias"><DownloadIcon/></label>
            </div>
            <div class="control" v-bind:class="{'is-loading': isUploading}">
                <label :for="'post-media-url-submit' + this.id" class="button is-info" v-bind:class="{'is-danger': uploadFailed}">></label>
                <input type="submit" :id="'post-media-url-submit' + this.id" class="hidden"/>
            </div>
        </div>
    </form>
</template>


<script>
 import DownloadIcon from 'vue-ionicons/dist/md-download.vue'
 export default {
     components: {
         DownloadIcon
     },
     data () {
         return {
             'isUploading': false,
             'uploadFailed': false,
             id: Math.floor(100000 * Math.random())
         }
     },
     methods: {
         onSubmit () {
             if(this.$root.offline) {
                 return this.$root.showWarning('Tu ne peux pas ajouter de média en étant hors ligne')
             }
             
             const url = this.$el.querySelector('#post-media-url' + this.id).value
             const withDownload = this.$el.querySelector('#withdownload'+ this.id).checked
             this.isUploading = true
             this.uploadFailed = false
             return this.$store.dispatch('uploadURL', {url: url, withDownload: withDownload})
                        .then(() => {this.isUploading = false})
                        .catch(err => {
                            this.uploadFailed = true
                            this.isUploading = false
                            this.$root.showWarning('Error on upload: \n ' + JSON.stringify(err))
                        })
         }
     }
 }
</script>

<style>
 [name=withdownload]:checked ~ .withdownload {
     background-color:black;
     color: white !important;
     border-color: black;
 }
</style>

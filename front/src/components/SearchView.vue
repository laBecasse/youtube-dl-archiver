<template>
    <div>
        <div class="tabs is-centered">
            <ul>
                <li v-bind:class="{'is-active': !params.platform}" class="is-disabled">
                    <router-link :to="{name: 'SearchMedia', query: {text: params.input}}">
                        <span class="icon is-small"><img src="/logo.svg" ></span>
                        <span>Archives</span>
                    </router-link>
                </li>
                <li v-bind:class="{'is-active': params.platform === 'youtube'}">
                    <router-link :to="{name: 'SearchMedia', query: {text: params.input, platform: 'youtube'}}">
                        <span class="icon is-small"><YoutubeIcon /></span>
                        <span>Youtube</span>
                    </router-link>
                </li>
                <li v-bind:class="{'is-active': params.platform === 'sepiasearch'}">
                    <router-link :to="{name: 'SearchMedia', query: {text: params.input, platform: 'sepiasearch'}}">
                        <span class="icon is-small"><PeertubeIcon/></span>
                        <span>Peertube</span>
                    </router-link>
                </li>
                <li v-bind:class="{'is-active': params.platform === 'soundcloud'}">
                    <router-link :to="{name: 'SearchMedia', query: {text: params.input, platform: 'soundcloud'}}">
                        <span class="icon is-small"><SoundcloudIcon/></span>
                        <span>Souncloud</span>
                    </router-link>
                </li>
            </ul>
        </div>
        <MediaView :params="params" :afterGetMore="switchToYTWhenEmpty"/>
    </div>
</template>

<script>
 import MediaView from './MediaView.vue'
 import YoutubeIcon from 'vue-ionicons/dist/logo-youtube.vue'
 import SoundcloudIcon from './icons/logo-soundcloud.vue'
 import PeertubeIcon from './icons/logo-peertube.vue'

 export default {
     name: 'SearchView',
     components: {
         MediaView,
         YoutubeIcon,
         SoundcloudIcon,
         PeertubeIcon
     },
     props: ['params', 'afterGetMore'],
     methods: {
         switchToYTWhenEmpty () {
             // in case the search is empty on the archive
             // continue the search on YT
             if (!this.params.platform &&
                 this.$store.getters.getViewMedias(this.params).length == 0) {
                 const query = {
                     text: this.params.input,
                     platform: 'youtube'
                 }
                 this.$router.replace({path: '/search', query : query})
             }
         }
     }
 }
</script>

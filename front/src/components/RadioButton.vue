<template>
    <a v-if="client && media.file_url" class="card-footer-item button is-white" v-bind:class="{'is-loading': isAdding}" title="Ajouter à la radio" v-on:click="addToRadio">
        <RadioIcon v-bind:class="{'has-text-success': recentlyAdded}"/>
    </a>
</template>

<script>
 import RadioIcon from 'vue-ionicons/dist/md-radio.vue'

 export default {
     name: 'Media',
     props: ['media'],
     components: {
         RadioIcon
     },
     data () {
         return {
             isAdding: false,
             recentlyAdded: false,
             client: this.$root.ympdClient
         }
     },
     methods: {
         addToRadio() {
             this.isAdding = true
             this.add().then(()=> {
                 this.isAdding = false
                 this.recentlyAdded = true
                 setTimeout(()=> {
                     this.recentlyAdded = false
                 }, 1000)
             })
         },
         add() {
             return this.client.add(this.media.file_url)
         }
     }
 }
</script>

<style>
</style>

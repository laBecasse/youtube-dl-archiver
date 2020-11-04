<template>
    <form v-on:submit.prevent="search" action="/search" method="get" >
        <div class="field has-addons">
            <div class="control">
                <input id="search-text" class="input" type="text" value="" name="text" placeholder="rechercher"/>
            </div>
            <div class="control">
                <button v-if="!(this.$route.name === 'SearchMedia' && this.$route.query.text)" class="button is-info"><SearchIcon/></button>
                <router-link :to="{name: 'ListMedia'}" v-if="this.$route.name === 'SearchMedia' && this.$route.query.text" class="button" v-on:click.prevent="lastAdded">❌</router-link>
            </div>
        </div>
    </form>
</template>

<script>
 import SearchIcon from 'vue-ionicons/dist/md-search.vue'
 
 export default {
     name: 'SearchForm',
     props: [],
     components: {
         SearchIcon
     },
     data () {
         return {
         }
     },
     methods: {
         search () {
             let text = document.getElementById('search-text').value
             this.$router.push({path: '/search', query : {text: text}})
         }
     }
 }
</script>

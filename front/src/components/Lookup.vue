<template>
    <div>
        <h2 class="is-3 title">Importation</h2>
        <form v-on:submit.prevent="search">
            <div class="field has-addons">
                <p class="control">
                    <span class="select">
                        <select name="platform">
                            <option>invidious</option>
                            <option>youtube</option>
                            <option>googlevideo</option>
                            <option>soundcloud</option>
                        </select>
                    </span>
                </p>
                <div class="control">
                    <input id="search-text" class="input" type="text" value="" name="query" placeholder="rechercher"/>
                </div>
                <div class="control">
                    <button class="button" v-on:click.prevent="search"><SearchIcon/></button>
                </div>
            </div>
        </form>
        <div>
            <span v-if="searching">Recherche en cours</span>
            <span v-else-if="medias.length === 0" class="loading">Pas de résultat</span>
            <div v-else v-for="media in this.medias" class="is-6">
                <MediaAdd :mediaObj="media" />
            </div>
        </div>
    </div>
</template>
<script>
 import MediaAdd from './MediaAdd.vue'
 import SearchIcon from 'vue-ionicons/dist/md-search.vue'

 export default {
     name: 'Lookup',
     components: {
         MediaAdd,
         SearchIcon
     },
     props: ['query', 'platform'],
     data() {
         return {
             medias: [],
             searching: false,

         }
     },
     computed: {

     },
     created() {
         if (this.query && this.platform) {
             this.searchingFor(this.query, this.platform)
         }
     },
     methods: {
         search() {
             const query = this.$el.querySelector('input[name=query]').value
             const platform = this.$el.querySelector('select[name=platform]').value
             return this.searchingFor(query, platform)
         },
         searchingFor(query, platform) {
             this.searching = true
             this.$store.dispatch('lookup', {
                 query: query,
                 platform: platform
             }).then(medias => {
                 this.searching = false
                 this.medias = medias
             })
         }
     }
 }
</script>

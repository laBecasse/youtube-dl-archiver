<template>
    <div>
        <h1 class="is-2 title">{{tags.length}} Tags</h1>
        <div class="field is-grouped is-grouped-multiline">
            <div class="control" v-for="tag in tags" :key="tag._id">
                <div class="tags has-addons" >
                    <router-link class="tag is-link is-small"
                                 :to="{name: 'MediaTag', params: {tag: tag._id}}"
                                 :style="{ fontSize: getFontSize(tag) + 'em' }"
                                 :title="tag.mediaCount + ' medias'">
                        {{tag._id}}
                    </router-link>
                </div>
            </div>
        </div>
    </div>
</template>

<script>

 export default {
     name: 'AllTags',
     props: [],
     data () {
         return {
             tags: []
         }
     },
     computed: {
         maxFontSize() {
             return Math.max(...this.tags.map(t => t.mediaCount))
         }
     },
     created () {
         this.$store.dispatch('getAllTags')
             .then(tags => {
                 this.tags = tags.sort((a,b) => a._id > b._id)
             })
     },
     methods: {
         getFontSize(tag) {
             return .7 + 3 * Math.log(tag.mediaCount) / Math.log(this.maxFontSize)
         }
     }
 }
</script>

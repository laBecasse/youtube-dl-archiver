<template>
    <Tags :tags="tags" :limited="false" :enabledRemoving="false" />
</template>

<script>
 import Tags from './Tags.vue'

 export default {
     name: 'AllTags',
     props: [],
     components: {Tags},
     data () {
         return {
             tags: []
         }
     },
     created () {
         this.$store.dispatch('getAllTags')
             .then(tags => {
                 this.tags = tags.map(tag => tag._id)
             })
     }
 }
</script>

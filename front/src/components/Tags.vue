<template>
    <div class="field is-grouped is-grouped-multiline">
        <div class="control" v-for="tag in tags.slice(0, limit)">
            <div class="tags has-addons">
                <router-link class="tag is-link is-small" :to="{name: 'MediaTag', params: {tag: tag}}">{{tag}}</router-link>
                <a v-on:click="removeTag"
                   v-if="removingEnabled"
                   :data-tag="tag"
                   class="tag is-delete"></a>
            </div>
        </div>
    </div>

</template>

<script>
 export default {
     name: 'Tags',
     props: ['tags', 'removingEnabled', 'limited'],
     data () {
         console.log(this.tags, this.removingEnabled)
         return {
             limit: (this.limited) ? 5 : 10000,
         }
     },
     methods: {
         removeTag (e) {
             const tag = e.target.getAttribute('data-tag')
             this.$emit('removeTag', tag)
         }
     }
 }
</script>

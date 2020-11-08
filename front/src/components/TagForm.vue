<template>
    <form v-on:submit.prevent="addTag">
        <div class="field has-addons">
            <div class="control">
                <input class="input is-small" type="text" name="tag" placeholder="nouveau tag" list="all-tag-list"/>
            </div>
            <div class="control">
                <button class="button is-link is-small" type="submit">
                    <AddIcon/>
                </button>
            </div>
        </div>
    </form>
</template>

<script>
 import AddIcon from 'vue-ionicons/dist/md-add.vue'

 export default {
     name: 'TagForm',
     props: [],
     components: {
         AddIcon
     },
     data () {
         return {
             allTags: this.$root.allTags
         }
     },
     methods: {
         addTag() {
             const input = this.$el.querySelector('input[name=tag]')
             for (let tag of input.value.split(/[, ]/)) {
                 this.$emit('addTag', tag)
             }
             input.value = ''
         }
     }
 }
</script>

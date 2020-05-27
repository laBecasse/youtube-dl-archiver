<template>
    <form v-on:submit.prevent="addTag">
        <div class="field has-addons">
            <div class="control">
                <input class="input is-small" type="text" name="tag" placeholder="nouveau tag" list="all-tag-list"/>
            </div>
            <div class="control">
                <a class="button is-link is-small">
                    <AddIcon/>
                </a>
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
     console.log(this.$root.allTags)
       return {
         allTags: this.$root.allTags
       }
     },
     methods: {
         addTag(e) {
             const input = this.$el.querySelector('input[name=tag]')
             for (let tag of input.value.split(/[, ]/)) {
                 this.$emit('addTag', tag)
             }
             input.value = ''
         }
     }
 }
</script>

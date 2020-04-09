<template>
    <form v-on:submit.prevent="addTag">
        <div class="field has-addons">
            <div class="control">
                <input class="input is-small" type="text" name="tag" id="addTag" placeholder="nouveau tag" />
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
         return {}
     },
     methods: {
         addTag(e) {
             const value = this.$el.querySelector('#addTag').value
             console.log(value)
             this.$emit('addTag', value)
         }
     }
 }
</script>

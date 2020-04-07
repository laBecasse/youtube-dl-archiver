<template>
    <div class="tags" >
        <router-link class="tag is-link is-small" v-for="tag in tags" :to="{name: 'MediaTag', params: {tag: tag}}">{{tag}}</router-link>
    </div>
</template>

<script>
 export default {
     name: 'Tags',
     props: ['tags'],
     data () {
         return {
         }
   }
 }
</script>

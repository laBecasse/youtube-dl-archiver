<template>
    <div class="tags" >
        <a class="tag is-link is-small" v-for="tag in tags">
            {{tag}}
        </a>
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

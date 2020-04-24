<template>
    <div>
        <span v-if="medias.length === 0" class="loading">Pas de résultat</span>
        <div v-else-if="isSortedByCreationDate" v-for="(medias, day, index) in mediasByDay">
            <h4 class="creation_date">{{dateFormater.format(new Date(day))}}</h4>
            <div v-for="media in medias" :key="media.id" class="is-6">
                <Media :mediaId="media.id" :mediaObj="media" :ref="media.id" :expanded="false"></Media>
            </div>
        </div>
        <div v-else-if="!isSortedByCreationDate" v-for="media in this.medias" :key="media.id" class="is-6">
            <Media :mediaId="media.id" :mediaObj="media" :ref="media.id" :expanded="false" />
        </div>
    </div>
</template>

<script>
 import Media from './Media.vue'

 export default {
     name: 'MediaList',
     components: {
         Media
     },
     props: ['medias', 'isSortedByCreationDate'],
     computed: {
         mediasByDay() {
             return this.medias.reduce((r, m) => {
                 const d = new Date(m.creation_date)
                 const ye = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(d)
                 const mo = new Intl.DateTimeFormat('en', { month: '2-digit' }).format(d)
                 const da = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(d)
                 const date = `${ye}-${mo}-${da}`
                 if (r[date]) {
                     r[date].push(m)
                 } else {
                     r[date] = [m]
                 }
                 return r
             }, {})
         }
     },
     data() {
         return{
             dateFormater: new Intl.DateTimeFormat('default',{ year: 'numeric', month: 'long', day: 'numeric'})
         }
     }
 }
</script>

<template>
    <div>
        <p>
            <h4 class="title is-4">Offline medias</h4>
            <span>{{details}}</span>
            <progress class="progress is-primary" :value="usage" :max="quota">{{details}}</progress>
        </p>
        <MediaList :medias="medias" :isSortedByCreationDate="false" />
    </div>
</template>

<script>
 import { mapActions } from 'vuex'
 import MediaList from './MediaList.vue'

 export default {
     name: 'SearchView',
     components: {
         MediaList
     },
     data() {
         return {
             medias: [],
             details: '',
             usage: 0,
             quota: 0
         }
     },
     created () {
         this.getAllOfflineMedias()
             .then(medias => {
                 this.medias = medias
             })

         console.log('qsdffs')
         if ('storage' in navigator && 'estimate' in navigator.storage) {
             navigator.storage.estimate()
                      .then(obj  => {
                          const usage = obj.usage
                          const quota = obj.quota
                          const percentUsed = Math.round(usage / quota * 100);
                          const usageInMib = Math.round(usage / (1024 * 1024));
                          const quotaInMib = Math.round(quota / (1024 * 1024));
                          const details = `${usageInMib} out of ${quotaInMib} MB used (${percentUsed}%)`;

                          // This assumes there's a <span id="storageEstimate"> or similar on the page.
                          this.details = details
                          this.usage = usage
                          this.quota = quota
                      })
         }
     },
     methods: {
         ...mapActions(['getAllOfflineMedias'])
     }
 }
</script>

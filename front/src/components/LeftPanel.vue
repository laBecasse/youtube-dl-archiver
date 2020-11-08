<template>
<div class="panel">
  <div class="panel-block">
    <div class="field">
      <label>Add a media</label>
      <UploadForm/>
    </div>
  </div>
  <div class="panel-block">
    <Tags v-if="tags" :tags="tags.map(t=>t._id)" :removingEnabled="false" :limited="false" />
  </div>
  <div class="panel-block">
    <router-link class="button is-link is-outlined is-fullwidth"
                 :to="{name: 'AllTags', params: {}}">
      All tags
    </router-link>
  </div>
  <!-- <a :href="this.API_URL + '/update'" id="update" class="button" type="submit">MAJ</a> -->
  <div class="panel-block">
      <router-link class="button is-link is-outlined is-fullwidth"
                   :to="{name: 'Lookup', params: {}}">
          Import medias
      </router-link>
  </div>
  <div class="panel-block">
      <router-link class="button is-link is-outlined is-fullwidth"
                   :to="{name: 'Settings', params: {}}">
          Settings
      </router-link>
  </div>

</div>
</template>

<script>
import Tags from './Tags.vue'
import UploadForm from './UploadForm.vue'
import { mapGetters } from 'vuex'

export default {
  components: {
    Tags,
    UploadForm
  },
  data () {
    return {
      tagsLength: 20
    }
  },
  computed: {
    tags() {
      return this.getTags().map(t => t).sort((a,b) => b.mediaCount > a.mediaCount)
        .slice(0, this.tagsLength)
    }
  },
  methods: {
    ...mapGetters(['getTags']),
  }
}
</script>

<style>
  .panel-block div {
  max-width: 100%;
  }
</style>

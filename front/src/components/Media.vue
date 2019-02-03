<template>
<div class="card media-card">
  <div class="is-gapless" v-bind:class="{'columns': !expanded}">
    <div class="column media-column-video">
      <div class="card-image">
        <video v-if="media.type === 'video'" controls :poster="(media.thumbnail) ? media.thumbnail.url: undefined" preload="none" class="image">
          <source :src="media.file_url" :type="media.mime"/>
          <track v-for="sub in media.subtitles"
                 :src="sub.url"
                 :label="sub.lang"
                 kind="subtitles" :srclang="sub.lang">
        </video>
        <audio v-if="media.type === 'audio'" controls preload="none">
          <source :src="media.file_url" :type="media.mime"/>
          Your browser does not support the audio element.
        </audio> 
        <img v-if="media.type === 'image'"
             :src="media.file_url">
        <a v-if="media.type === 'other'"
           :href="media.file_url">media</a>
      </div>
    </div>
    <div class="column is-primary">
      <div class="card-header">
        <router-link :to="{name: 'WatchMedia', params: {id: media.id}}">
          <h4 class="card-header-title is-2">{{media.title}}</h4>
        </router-link>
      </div>
      <div class="card-content">
        <p class="media-meta">
          <span v-if="media.creator">{{media.creator}} -</span>
          <span v-if="!media.creator && media.uploader">{{media.uploader}} -</span>
          <span>{{media.formated_creation_date}}</span>
        </p>
        <p v-if="media.description && !expanded">
          {{media.short_description}}
        </p>
        <p v-if="media.description && expanded">
          {{media.description}}
        </p>
        <a v-bind:href="media.url">lien original</a>
      </div>
    </div>
  </div>
</div>  
</template>

<script>
export default {
  name: 'Media',
  props: ['media', 'expanded']
}
</script>


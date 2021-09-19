<template>
<div class="webmention-post">
  <h3>Replies and mentions</h3>
  <p>You can send a <a href="https://indieweb.org/Webmention">webmention</a>:</p>
  <ol>
    <li>If you have the URL of a page mentioning this one: 
  <form method="post" :action="webmention_url">
    <input name="target" :value="abs_input_uri" type="hidden">
    <input class="url" name="source" type="url" placeholder="url">
    <input class="submit" value="Send Webmention" type="submit">
  </form>
    </li>
    <li>Otherwise, write your comment on <a :href="micropub_url">a dedicated service</a>.</li>
    </ol>
    <iframe :src="webmention_url" loading="lazy" scrolling="auto">
    </iframe>
</div>
</template>

<script>
export default {
  name: 'WebmentionComponent',
  props: ['id', 'url'],
  computed: {
    abs_input_uri() {
      return process.env.VUE_APP_HOST + '/medias/' + this.id
    },
    webmention_url() {
      return process.env.VUE_APP_WEBMENTION_URL + '?url=' + this.abs_input_uri + ',' + this.url
    },
    micropub_url() {
      return process.env.VUE_APP_MICROPUB_URL + this.abs_input_uri
    }
  }
}
</script>


<style>
 .webmention-post {
 text-align: left;
 padding: 1.5rem;
 }
h3 {
    font-weight: bold;
    font-size: 1.2em;
    margin-bottom: 1em;
}
.webmention-post iframe {
    width: 100%;
    min-height: 30em;
}

ol {
    margin-left: 2em;
    margin-bottom: 2em;
    list-style: initial;
  
}
li {
    line-height: 2;
}
</style>

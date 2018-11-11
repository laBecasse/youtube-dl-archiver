const DEFAULT = {
  'medias': [],
  'bottom': false,
  'query': '/medias',
  'offset': 0,
  'step': 10,
  'isSearching': false,
  'isDownloading': false
}

var app = new Vue({
  el: '#app',
  data () {
    return JSON.parse(JSON.stringify(DEFAULT))
  },
  methods: {
    bottomVisible () {
      const scrollY = window.scrollY
      const visible = document.documentElement.clientHeight
      const pageHeight = document.documentElement.scrollHeight
      const bottomOfPage = visible + scrollY >= pageHeight
      return bottomOfPage || pageHeight < visible
    },
    updateList () {
      axios.get(this.query, {
        params: {
          limit: this.step,
          offset: this.offset
        }
      })
        .then(response => {
          let data = response.data

          data.forEach(media => {
            const reV = new RegExp('video')
            const reI = new RegExp('image')
            const reA = new RegExp('audio')
            media.type = 'other'
            if (reV.test(media.mime)) {
              media.type = 'video'
            }
            if (reI.test(media.mime)) {
              media.type = 'image'
            }
            if (reA.test(media.mime)) {
              media.type = 'audio'
            }
            this.medias.push(media)
          })
          this.offset += this.step
        })
        .catch(err => console.error(err))
    },
    search: function(event) {
      this.reset()
      let text = document.getElementById('search-text').value
      this.isSearching = true
      this.query = '/search?text=' + encodeURI(text)

      console.log(this.query)
      this.updateList()
    },
    lastAdded: function(event) {
      this.reset()
      this.updateList()
    },
    onSubmit (event) {
      let url = document.getElementById("post-media-url").value
      let params = new URLSearchParams();

      params.append('url', url)
      this.isDownloading = true;
      axios.post('/medias', params)
        .then(res => {
          this.reset()
          this.updateList()
        })
        .catch(err => console.error(err))
    },
    reset: function() {
      this.isSearching = DEFAULT.isSearching
      this.query = DEFAULT.query
      this.medias = []
      this.offset = DEFAULT.offset
      this.step = DEFAULT.step
      this.isDownloading = false
    }
  },
  watch: {
    bottom (bottom) {
      if (bottom) {
        this.updateList()
      }
    }
  },
  created () {
    window.addEventListener('scroll', () => {
      this.bottom = this.bottomVisible()
    })
    this.updateList()
  }
})

var app = new Vue({
  el: '#app',
  data () {
    return {
      medias: [],
      bottom: false,
      offset: 0,
      step: 5
    }
  },
  methods: {
    bottomVisible () {
      const scrollY = window.scrollY
      const visible = document.documentElement.clientHeight
      const pageHeight = document.documentElement.scrollHeight
      const bottomOfPage = visible + scrollY >= pageHeight
      return bottomOfPage || pageHeight < visible
    },
    addMedias () {
      axios.get('http://localhost:8000/medias', {
        params: {
          limit: this.step,
          offset: this.offset
        }
      })
        .then(response => {
          console.log(response)
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
            console.log(media.type)
            this.medias.push(media)
          })
          this.offset += this.step
          if (this.bottomVisible()) {
            this.addMedias()
          }
        })
        .catch(err => console.error(err))
    }
  },
  watch: {
    bottom (bottom) {
      if (bottom) {
        this.addMedias()
      }
    }
  },
  created () {
    window.addEventListener('scroll', () => {
      this.bottom = this.bottomVisible()
    })
    this.addMedias()
  }
})

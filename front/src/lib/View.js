import Vue from 'vue';

export default class View {
  constructor(params, medias) {
    this.hash = View.getHashFromParams(params)
    this.params = params
    this.mediaIds = []
    this.medias = medias
    this.locked = false
  }

  insertMedias(list) {
      for(let m of list) {
        // insert at right position from the bottom
        let i = this.mediaIds.length
        // for text search disable insertion
        // THERE IS STILL A PROBLEM OF DUPLICATED FOR TEXT SEARCH !!!
        // 2 QUERIES ARE EXECUTED IN PARALLEL 
        while(i > 0 &&
              this.params.isSortedByCreationDate &&
              //              !state.query.startsWith('/search?text=') &&
              this.medias[this.mediaIds[i - 1]].creation_date <= m.creation_date &&
              this.mediaIds[i - 1] !== m.id) {
          i--
        }

        if (i === 0 || this.mediaIds[i - 1] !== m.id)
          this.mediaIds.splice(i, 0, m.id)
      }
  }

  getMedias() {
    return this.mediaIds.map(id => this.medias[id])
  }

  empty() {
    this.mediaIds = []
  }

  getSize() {
    return this.mediaIds.length
  }
  
  getHash() {
    return this.hash
  }

  toggleLock() {
    this.locked = !this.locked
  }

  isLocked() {
    return this.locked
  }

  delete(id) {
    this.mediaIds = this.mediaIds.filter(i => i !== id)
  }

  static getHashFromParams(params) {
    return JSON.stringify(params)
  }
}

export default class View {
  constructor(params) {
    this.hash = View.getHashFromParams(params)
    this.params = params
    this.medias = []
    this.locked = false
  }

  insertMedias(list) {
      for(let m of list) {
        // insert at right position from the bottom
        let i = this.medias.length
        // for text search disable insertion
        // THERE IS STILL A PROBLEM OF DUPLICATED FOR TEXT SEARCH !!!
        // 2 QUERIES ARE EXECUTED IN PARALLEL 
        while(i > 0 &&
              this.params.isSortedByCreationDate &&
              //              !state.query.startsWith('/search?text=') &&
              this.medias[i - 1].creation_date <= m.creation_date &&
              this.medias[i - 1]._id !== m._id) {
          i--
        }

        if (i === 0 || this.medias[i - 1]._id !== m._id)
          this.medias.splice(i, 0, m)
      }
  }

  empty() {
    this.medias = []
  }

  getSize() {
    return this.medias.length
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
    this.medias = this.medias.filter(m => m.id !== id)
  }
  
  static getHashFromParams(params) {
    return JSON.stringify(params)
  }
}

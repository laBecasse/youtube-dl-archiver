const fs = require('fs')
const STATES = {}

class State {
  constructor(id) {
    this.id = id
    this.downloading = true
    this.downloadedPath = undefined
    this.temporaryPath = undefined
    this.size = 0
  }

  setSize (size) {
    if (!isNaN(size)) {
      this.size = parseInt(size)
    }
  }

  getSize () {
    return this.size
  }
  
  setDownloadedPath (path) {
    this.downloadedPath = path
  }

  setTemporaryPath (path) {
    this.temporaryPath = path
  }

  endsDownload() {
    this.downloading = false
    this.size = fs.statSync(this.downloadedPath).size
  }

  isDownloading() {
    return this.downloading
  }
  
  getCurrentPath() {
    if (this.downloading) {
      return this.temporaryPath
    } else {
      return this.downloadedPath
    }
  }
}

function register(state) {
  STATES[state.id] = state
}

module.exports = {
  create: function (id) {
    const state = new State(id)
    register(state)
    return state
  },
  get: function (id) {
    return STATES[id]
  }
}

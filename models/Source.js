const config = require('../config')
const HOST = config.host


class Source {
  constructor (type, url) {
    this.type = type
    this.file_url = url
  }

  static createTmpSource(id) {
    return new Source('tmp', HOST + '/api/tmp-media/' + id)
  }
}

module.exports = Source

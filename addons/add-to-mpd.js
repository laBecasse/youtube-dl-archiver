const COMMAND = 'mpc  --host=192.168.1.71 -p 6600 add "%s"'

const util = require('util')
const exec = util.promisify(require('child_process').exec)

module.exports = function (medias) {
  let p = Promise.resolve()

  if (medias.length < 20) {
    for (let media of medias) {
      if (media.getFileUrl()) {
        let url = media.getFileUrl()
        let cmd = util.format(COMMAND, url)
        console.log("exec " + cmd)
        p = p.then(exec(cmd, { maxBuffer: Infinity }))
      }
    }
  }

  return p
}

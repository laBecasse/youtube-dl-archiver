const config = require('./config.json')
let wrappers = {}

Object.keys(config).forEach((name) => {
  wrappers[name] = require('./' + name)
})

module.exports.getLinks = function () {
  return new Promise((resolve, reject) => {
    connections().then(() => {
      let promises = []

      for (let name in wrappers) {
        promises.push(wrappers[name].getLinks())
      }

      Promise.all(promises)
        .then(values => {
          let links = []

          for (let i = 0; i < values.length; i++) {
            for (let j = 0; j < values[i].length; j++) {
              links.push(values[i][j])
            }
          }
          resolve(links)
        })
        .catch(reject)
    })
  })
}

let connections = function () {
  let promises = []
  for (let name in wrappers) {
    const { url, credits } = config[name]
    promises.push(wrappers[name].connection(url, credits))
  }

  return Promise.all(promises)
}

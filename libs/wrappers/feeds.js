const Parser = require('rss-parser')
const feeds = require('./config.json').feeds

module.exports.connection = function(url,credits){
  return;
};

module.exports.getLinks = function(){
  const parser = new Parser()
  const promises = feeds.map(url => parser.parseURL(url)
                             .then(feed => feed.items.map(i => i.link)))

  return Promise.all(promises).then(linkLists => {
    return linkLists.reduce((res, l) => {
      res = res.concat(l)
      return res
    }, [])
  })
}

const Wallabag = require('wallabag-api');
let account;

module.exports.connection = function(url,credits){
  const {clientId, clientSecret } = credits;
  const {username, password } = credits;

  wbAccount = new Wallabag.WallabagApi({
    url : url,
    clientId : clientId,
    clientSecret : clientSecret
  });
  
  return wbAccount.getApplicationToken(username, password);
};

module.exports.getLinks = function(){
  return new Promise((resolve, reject) => {
    wbAccount.getArticles({perPage:1000,tags:[]})
      .then(function(obj){

	const ytLinks = [];
	const articles = obj._embedded.items;
	
	for(var k =0; k < articles.length; k++){
	  let url = articles[k].url;
	  
	  if(url.match('https:\/\/www.youtube.com\/watch')){
	    url = url.replace('?url=','')
	      .replace('&url=','')
	      .replace('?format=xml','')
	      .replace('http://www.youtube.com/oembed','');
	  }
	  
	  ytLinks.push(url);	  
	}
	
	resolve(ytLinks);
      })
      .catch(reject);

  });
};


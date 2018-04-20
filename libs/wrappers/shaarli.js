const Client = require('shaarli-client');
const params = {
  "limit": 'all',
  "visibility": "all"
};
let account;

module.exports.connection = function(url,credits){
  const {secret} = credits;

  account = new Client(url,secret);
  
  return;
};

module.exports.getLinks = function(){
  return new Promise((resolve, reject) => {

    account.getLinks(params,(err,docs) => {
      if (err) return reject(err);
      
      let links = [];
      for(let k=0; k< docs.length ; k++){
	links.push(docs[k].url)
      }
      resolve(links);
    });
    
  });
}


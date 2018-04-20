const path       = require('path');
const Downloader = require('../libs/downloader');

const ARCHIVES_DIR = './archives/';

module.exports = function(collection){
  
  let create = function(url, info, filepath){

    return new Promise((resolve,reject) =>{
      const item = {
	"url": url,
	"filepath": filepath,
	"info": info
      };

      collection.insert(item, (err,res) =>{
	if(err) return reject(err);
	resolve(res);
      })

    })    
  };

  // we always use this function on url that
  // are not in the database
  let dl = function(url){

    return new Promise((resolve,reject) => {
      let download = new Downloader(url);

      download.info.then((info) => {	

	const uploader = info.uploader_id;
	const filename = info._filename;
	const extractor = info.extractor
	const dirpath = (uploader)? path.join(ARCHIVES_DIR + extractor, uploader) : ARCHIVES_DIR + extractor;
	const filepath = path.join(dirpath,filename);


	download.pipe(dirpath, filepath)
	  .then(() => {
	    create(url,info,filepath)
	      .then(resolve)
	      .catch(reject)
		})
	  .catch((err) =>{
	    if(err.message == 'EEXIST'){
	      create(url,info,filepath)
		.then(resolve)
		.catch(reject)
	     }else{
	       reject(err);
	     }
	  })
        })
	.catch(reject)
    })

  }

  return {
    findOrDl : function(url){
      return new Promise((resolve,reject) => {
	collection.findOne({url: url}, function(err, item){
	  if(err) return reject(err);

	  if(item){
	    resolve(item);
	  }else{
	    dl(url)
	      .then(resolve)
	      .catch(reject)
		}
	})
      })    
    }
  }

}

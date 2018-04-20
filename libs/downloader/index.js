const path = require('path');
const fs   = require('fs');
const youtubedl = require('youtube-dl');
const mkdirp = require('mkdirp');

const ROOT = __dirname +'/../../';

module.exports = function(url){
  this.URL = url;
  this.info = {};
  let video;

  console.log('info: '+ url);
  
  this.info = new Promise((resolve,reject) => {

      video = youtubedl(url, ['--format=best'])
	.on('error', function(err) {
	  console.log('error on the link '+url+'\n'+err);
	  reject(err);
	})
    
    // Will be called when the download starts.
	.on('info', function(info) {
	  resolve(info);
	})

    })

  this.pipe = function(dirpath, filepath){

    return new Promise((resolve,reject) => {
      mkdirp(dirpath,function(err){
	if (err) throw err;

	const absfilepath = path.join(ROOT,filepath);
	
	if(!fs.existsSync(absfilepath)){
	  video.pipe(fs.createWriteStream(absfilepath,{ flags: 'a'}));
	}else{
	  console.log(filepath+" already exists.");
	  reject(new Error("EEXIST"));
	}

	video.on('end',function(){
	  resolve();
	});

      })
    })
    
  }
}

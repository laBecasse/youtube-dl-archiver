const path = require('path');
const fs   = require('fs');
const youtubedl = require('youtube-dl');
const mkdirp = require('mkdirp');

const ROOT = process.env.ROOT;

module.exports = function(url){
  this.URL = url;
  let video;
  
  this.getInfo = function () {
    console.log('info: '+ this.URL);
    return new Promise((resolve,reject) => {
      video = youtubedl(url, ['--format=best'])
	.on('error', function(err) {
	  console.log('error: '+url);
	  reject(err);
	})
    
    // Will be called when the download starts.
	.on('info', function(info) {
	  resolve(info);
	})
    })
  }
  this.pipe = function(dirpath,filepath){
    console.log('down: '+this.URL);
    return new Promise((resolve,reject) => {
      
      const absdirpath = path.join(ROOT, dirpath);
   
      mkdirp(absdirpath,function(err){
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

  this.exists = function(filepath){
    return new Promise((resolve,reject) => {
      	const absfilepath = path.join(ROOT,filepath);
      fs.access(absfilepath, (err) =>{
	if(!err){
	  resolve(true);
	}else{
	  resolve(false);
	}
      })
    })
  }
  
}

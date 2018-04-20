const wrapper    = require('../libs/wrappers');

module.exports = function(app, collection) {

  const Media = require('../models/Media.js');

  app.get('/update', (req, res) => {
    
    wrapper.getLinks()
      .then(links => {
	let promises = [];
	links.forEach(link => {
	  promises.push(Media(collection)
			.findOrDl(link)
			.catch(console.log("err")))
	})

	// Promise.all(promises)
	//   .then(medias => {
	//     console.log('ok');
	//     res.send(medias);
	//   })
	//   .catch(err =>{
	//     res.send(err);
	//   })
      })
  
  })
};

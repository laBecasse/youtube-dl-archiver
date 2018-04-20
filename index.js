const express        = require('express');
const bodyParser     = require('body-parser');
const Db             = require('tingodb')().Db;

const app            = express();
const db             = new Db('./archives/db',{});
const collection     = db.collection("test");

const port = 8000;

app.use(bodyParser.urlencoded({ extended: true }));

require('./routes')(app, collection);

app.listen(port, () => {
  console.log('We are live on http://localhost:'+port);
});

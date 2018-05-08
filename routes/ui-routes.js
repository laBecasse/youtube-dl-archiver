module.exports = function (app) {
  app.get('/', (req, res) => {
    const PORT = process.env.PORT
    const HOST = process.env.HOST
    const ADDRESS = HOST + ':' + PORT

    res.render('index', {address: ADDRESS})
  })
}

const Media = require('../models/Media.js')
const FilePath = require('../models/FilePath.js')

const fs = require('fs')

module.exports = function (router, links) {
    const media = Media(links)

    let handleJson = function (promises, req, res) {
        promises.then(object => {
            if (object) {
                res.json(object)
            } else {
                res.status(404)
                res.json({ message: 'not found' })
            }
        })
            .catch(handleError(res))
    }

    let handleError = function (res) {
        return err => {
            console.error(err.stack)
            res.status(500)
                .json({ error: 'server error' })
        }
    }

    let deleteFolderRecursive = function(path) {
        if (fs.existsSync(path)) {
            fs.readdirSync(path).forEach(function(file, index){
                var curPath = path + "/" + file
                if (fs.lstatSync(curPath).isDirectory()) {
                    deleteFolderRecursive(curPath)
                } else {
                    console.log("delete file " + curPath)
                    fs.unlinkSync(curPath)
                }
            })
            console.log("delete directory " + path)
            fs.rmdirSync(path);
        }
    }
    
    router.delete('/medias/:id', (req, res) => {
        const dbId = req.params.id
        handleJson(media.removeById(dbId)
                   .then(obj => {
                       // if one media have been removed
                       if (obj) {
                           const directory = FilePath.getAbsDirPath(obj.info)
                           deleteFolderRecursive(directory)
                       }
                       return obj
                   }), req, res)
    })
}

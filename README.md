# Youtube-dl Archiver

Youtube-dl Archiver is a web tools which archives medias (video, audio). The aim is to have a tools that enables to archive, organize and share medias from the web. We can think of it as [Wallabag](https://wallabag.org/) for medias.

Disclaimer: the project is currently in building stage. 

## Current Functionalities

In back-end:
1. download using [youtube-dl](http://ytdl-org.github.io/youtube-dl/)
2. download of the metadata only, with the possibility to download later
3. support of audio and video with thumbnail and subtitles
4. support of webtorrent download from peertube instance

In front-end:
1. support of webtorrent in the browser
2. Progressive Web Application with offline support for media list
3. Support of media download in browser (experimental)
    

## Configuration 

### Installation

It requires mongoDB, sorry for that.

Clone the repository:
```sh
git clone https://github.com/laBecasse/youtube-dl-archiver.git
cd youtube-dl-archiver
# download youtube-dl locally
npm run update
# install dependencies of back-end
npm i
```
Look at `.env.source` to known what are the environment variables and run the server:
```sh 
node index.js
```
In another terminal, go to `front/` and execute:
```sh
npm i
npm run build
```

Open http://localhost:8000/ and have fun :)

### Wrappers: retrieve medias from Wallabag, Shaarli and RSS Feed
1. Fill the `./libs/wrappers/config.json.source` with your credits and service urls and delete unnecessary services.
2. Rename `./libs/wrappers/config.json.source` to `./libs/wrappers/config.json`.
3. open the following link to launch the archiving: http://localhost:8000/update

## Youtube-dl update

Youtube-dl is regularly updated so you need to update it often. To update it, execute the following line:

```bash 
npm run update
```
## Credits

- [WebTorrent](https://webtorrent.io/) <3
- [Bulma](https://bulma.io/) for css
- [Vue.js](https://vuejs.org/) for making the front-end easier
- [vue-yummy-notie](https://github.com/Yuyz0112/vue-notie) for simple notification component

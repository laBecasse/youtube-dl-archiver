# Youtube-dl Archiver

Youtebe-dl Archiver is an api server which archives videos from bookmarked links (on shaarli or wallabag) using the youtube-dl program.

## Configuration 

1. Fill the `./libs/wrappers/config.json.source` with your credits and service urls and delete unnecessary services.
2. Rename `./libs/wrappers/config.json.source` to `./libs/wrappers/config.json`.
5. install `ffmpeg`
4. install dependencies with `npm i;npm run update`
5. run the server with `node index.js`
6. open the following link to launch the archiving: http://localhost:8000/update

## Youtube-dl update

Youtube-dl is regularly updated so you need to update it often. To update it execute the following line:

```bash 
npm run update
```

## TODO

- support of webtorrent
- check how failed download are handled 
- add limit and offset for search route in api

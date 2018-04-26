# Youtube-dl Archiver

Youtebe-dl Archiver is an api server which archives videos from bookmarked links (on shaarli or wallabag) using the youtube-dl program.

## Configuration 

1. Fill the `./libs/wrappers/config.json.source` with your credits and service urls and delete unnecessary services.
2. Rename `./libs/wrappers/config.json.source` to `./libs/wrappers/config.json`.
3. Create database files:
```
mkdir -p ./archives/db
touch ./archives/db/links
touch ./archives/db/cache
```
4. install dependencies with `npm i`
5. run the server with `node index.js`
6. open the following link to launch the archiving: http://localhost:8000/update


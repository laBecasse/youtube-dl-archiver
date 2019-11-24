import axios from 'axios'
import promiseTimeout from './timeout-promise'

import PouchDB from 'pouchdb'
import PouchDBFind from 'pouchdb-find'

PouchDB.plugin(PouchDBFind)

// database of medias
const db = new PouchDB("medias")
db.createIndex({
  index: {fields: [{creation_date:'desc'}]}
})

const queries = {
  find: {
    api: () => '/medias',
    selector: () => new Object(),
    sort: [{'creation_date': 'desc'}]
  },
  searchText: {
    api: text => '/search?text=' + encodeURI(text),
    selector: text => {
      return {$and: [{$or: [{title: {$regex: RegExp(text, 'i')}},
                            {description: {$regex: RegExp(text, 'i')}}]},
                     {creation_date :{$gt: null}}]}
    },
    sort: [{'creation_date': 'desc'}]
  },
  searchUploader: {
    api: uploader => '/search?uploader=' + uploader,
    selector: uploader => {
      return {$and: [{uploader: {$eq:uploader}}, {creation_date :{$gt: null}}]}
    },
    sort: [{'creation_date': 'desc'}]
  },
  searchTag: {
    api: tag => '/tags/' + encodeURI(tag),
    selector: tag => {
      return {tags: {$in: [tag]}}
    },
    sort: null
  }
}

/* offline database querying */
function queryStoredMedias(queryName, input, limit, offset) {

  const selector = queries[queryName].selector(input)
  const sort = queries[queryName].sort

  return db.find({
    selector: selector,
    sort: sort,
    limit: limit,
    skip: offset
  })
    .then(res => res.docs)
}

function queryOneOffline(id) {
  return db.get(id)
    .catch(e => {
      if (e.status == 404) {
        return null
      }
    })
}

function updateOrCreateOffline(medias) {
  return Promise.all(medias.map(m => {
    return db.get(m._id)
      .then(doc => {
        m._rev = doc._rev
        return db.put(m)
      })
      .catch(e => {
        if(e.status === 404) {
          return db.put(m)
        }
      })
  }))
}

/* API querying */

function queryMedias(base, queryName, input, limit, offset) {
  const query = queries[queryName].api(input)

  let fullQuery
  if (query.includes('?')) {
    fullQuery = base + query + '&limit=' + limit + '&offset='+ offset
  } else {
    fullQuery =  base + query + '?limit=' + limit + '&offset='+ offset
  }

  return axios.get(fullQuery)
    .then(response => {
      return response.data
    })
}

function queryOne(base, id) {
  return axios.get(base + '/medias/' + id)
    .then(res => res.data)
}


/* Cache and offline support */

// timeout in ms
const TIMEOUT = 500

function buildTimeoutSwitch(apiQuery, offlineQuery) {
  // wait before switch to offline db
  return promiseTimeout.build(TIMEOUT, apiQuery)
    .catch(e => {
      // if there is timeout or any error fail back to offline db
      return offlineQuery
        .then(medias => {
          // if there is no answer from offline db
          // after timeout, then fail back to api call
          if (promiseTimeout.isTimeoutError(e)
              && (medias == null
                  || (Array.isArray(medias)
                      && medias.length == 0))) {
            return apiQuery
          } else {
            return medias
          }
        })
    })

}

function queryWithOffline(base, queryName) {
  return (input, limit, offset) => {
    const apiQuery = queryMedias(base, queryName, input, limit, offset)
          .then(medias => {
            updateOrCreateOffline(medias)
            return medias
          })
    const offlineQuery = queryStoredMedias(queryName, input, limit, offset)
    return buildTimeoutSwitch(apiQuery, offlineQuery)
  }
}

export default class {
  constructor (base) {
    this.base = base
    for (let queryName in queries) {
      this[queryName] = queryWithOffline(base, queryName)
    }
  }

  getOne(id) {
    const apiQuery = queryOne(this.base, id)
          .then(media => {
            if (media)
              updateOrCreateOffline([media])
            return media
          })
    const offlineQuery = queryOneOffline(id)
    return buildTimeoutSwitch(apiQuery, offlineQuery)
  }

  uploadURL(url, withDownload) {
    const params = new URLSearchParams()
    params.append('url', url)
    params.append('withdownload', withDownload)

    return axios.post(this.base + '/medias', params)
      .then(res => {
        const medias = res.data
        updateOrCreateOffline(medias)
        return medias
      })
  }

  download(id) {
    return axios.put(this.base + '/medias/download/' + id)
      .then(res => {
        const media = res.data
        updateOrCreateOffline([media])
        return media
      })

  }

  delete(id) {
    const query = this.base + '/medias/' + id
    return axios.delete(query)
      .then(() => {
        // remove the id offline too
      })
  }
}

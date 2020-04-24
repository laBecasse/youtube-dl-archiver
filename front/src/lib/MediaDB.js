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
    sort: null
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
  },
  getAllTags: {
    api: () => '/tags',
    selector: () => ({}),
    post: medias => {
      return Object.values(medias.reduce((res, m) => {
        for (let tag of m.tags) {
          if (res[tag]) {
            res[tag].mediaCount++
          } else {
            res[tag] = {
              _id: tag,
              mediaCount: 1
            }
          }
          return res
        }
      }, {}))
    },
    sort: null
  }
}

/* offline database querying */
function queryStoredMedias(queryName, input, limit, offset) {

  const selector = queries[queryName].selector(input)
  const sort = queries[queryName].sort
  const post = queries[queryName].post

  return db.find({
    selector: selector,
    sort: sort,
    limit: limit,
    skip: offset
  })
    .then(res => {
      if (post) {
        return post(res.docs)
      }
      return res.docs
    })
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
    return db.get(m.id)
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

function deleteOffline(id) {
  return db.get(id)
    .then(m => {
      return db.remove(m)
    })
    .catch(e => {
      if (e.status === 404) {
        console.log(media, ' was not in the offline, so not deleted')
      }
    })
  
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
      console.log('API query fails')

      // if there is timeout or any error fail back to offline db
      return offlineQuery
        .then(medias => {
          // if there is no answer from offline db
          // after timeout, then fail back to api call
          if (promiseTimeout.isTimeoutError(e)
              && (medias == null
                  || (Array.isArray(medias)
                      && medias.length == 0))) {
            console.log('continue with API query')
            return apiQuery
          } else {
            console.log('continue with offline query')
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

  isSortedByCreationDate(queryName) {
    return queries[queryName].sort !== null
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
    const data = {
      url: url,
      withdownload: withDownload
    }
    return axios.post(this.base + '/medias', data)
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
        return deleteOffline(id)
      })
  }

  renameTag(tag, newTag) {
    const data = {
      tag: tag
    }

    const query = this.base + '/tags/' + tag

    return axios.put(query, data)
  }

  addTagToMedia(mediaId, tag) {
    const query = this.base + '/medias/' + mediaId + '/tags/' + tag
    return axios.put(query).then(res => {
      const media = res.data
      updateOrCreateOffline([media])
      return media
    })
  }

  removeTagFromMedia(mediaId, tag) {
    const query = this.base + '/medias/' + mediaId + '/tags/' + tag
    return axios.delete(query).then(res => {
      const media = res.data
      updateOrCreateOffline([media])
      return media
    })
  }

  lookup(query, platform) {
    const url = this.base + '/lookup/'
    return axios.get(url, {
      params: {
        query: query,
        platform: platform
      }
    })
      .then(res => {
        const medias = res.data
        return medias
      })
    
  }
}

import Vue from 'vue';

import VueRouter from 'vue-router';
Vue.use(VueRouter);

import Vuex from 'vuex';
Vue.use(Vuex)

import VueAxios from 'vue-axios';
import axios from 'axios';
Vue.use(VueAxios, axios);

import App from './App.vue';
import ListMedia from './components/ListMedia.vue'
import Settings from './components/Settings.vue'

import WebTorrent from 'webtorrent'

import PouchDB from 'pouchdb'
import PouchDBFind from 'pouchdb-find'
PouchDB.plugin(PouchDBFind)

import promiseTimeout from './lib/timeout-promise';

const routes = [
  {
    name: 'ListMedia',
    path: '/',
    component: ListMedia
  },
  {
    name: 'SearchMedia',
    path: '/search',
    component: ListMedia
  },
  {
    name: 'WatchMedia',
    path: '/medias/:id',
    component: ListMedia
  },
  {
    name: 'Settings',
    path: '/settings',
    component: Settings
  }
]

// database of medias
const db = new PouchDB("medias")
db.createIndex({
  index: {fields: [{creation_date:'desc'}]}
})

// database of offline medias
const offlineMedias = new PouchDB("offline_medias")
const ATTACHMENT_ID = 'media'

const store = new Vuex.Store({
  state: {
    medias: [],
    isLocked: false,
    offset: 0,
    step: 10,
    query: "",
    selector: {},
    sort: {},
    isSingle: false,
    webtorrentClient: new WebTorrent(),
    magnetPerId: {},
    settings: {}
  },
  getters: {
    first (state) {
      return state.medias[0]
    },
    before: (state) => (id) => {
      const index = state.medias.findIndex(m => (m.id == id))
      return state.medias[index - 1]
    },
    after: (state) => (id) => {
      const index = state.medias.findIndex(m => (m.id == id))
      console.log(index)
      return state.medias[index + 1]
    },
    contains (state, id) {
      return state.medias.some(m => m.id === id)
    },
    getMagnet: (state) => (id) =>  {
      return state.magnetPerId[id]
    }
  },
  mutations: {
    emptyMedias (state) {
      state.medias = []
      state.offset = 0
    },
    //deprecated
    insertMediasAtTop (state, list) {
      const newMedias = state.medias.slice()
      for(let m of list) {
        // insert at right position from the top
        let i = 0
        while(i < newMedias.length &&
              newMedias[i].creation_date >= m.creation_date) {
          i++
        }
        if (i === 0 || newMedias[i - 1]._id !== m._id)
          newMedias.splice(i, 0, formatMedia(m))
      }
      state.medias = newMedias
    },
    insertMedias (state, list) {
      const newMedias = state.medias.slice()
      for(let m of list) {
        // insert at right position from the bottom
        let i = newMedias.length
        // for text search disable insertion
        // THERE IS STILL A PROBLEM OF DUPLICATED FOR TEXT SEARCH !!!
        // 2 QUERIES ARE EXECUTED IN PARALLEL 
        console.log(state.query, state.query.startsWith('/search?text='))
        while(i > 0 &&
              !state.query.startsWith('/search?text=') &&
              newMedias[i - 1].creation_date < m.creation_date) {
          i--
        }
        if (i === 0 || newMedias[i - 1]._id !== m._id)
          newMedias.splice(i, 0, formatMedia(m))
      }
      state.medias = newMedias
    },
    removeMedia (state, id) {
      const index = state.medias.findIndex((m) => m.id === id)
      state.medias.splice(index, 1)
    },
    setSingle(state, value) {

      // when the single is switched to false
      // we empty the medias first
      if (state.isSingle && !value) {
        state.medias = []
      }
      state.isSingle = value
    },
    // set the api query
    setQuery(state, query) {
      state.query = query
    },
    // set the 
    setPouchDBQuery(state, payload) {
      state.selector = payload.selector
      state.sort = payload.sort || {}
    },
    refreshOffset(state) {
      state.offset = state.medias.length
    },
    lock(state) {
      state.isLocked = true
    },
    unlock(state) {
      state.isLocked = false
    },
    setMagnetOfId(state, payload) {
      state.magnetPerId[payload.id] = payload.magnet
    },
    setSettings(state, settings) {
      state.settings = settings
    }
  },
  actions: {
    applyOnAll(context, payload) {
      const medias = context.state.medias
      const action = payload.action
      let promises = []

      for(let m of medias) {
        payload.id = m._id
        promises.push(context.dispatch(action, payload))
      }

      return Promise.all(promises)
    },
    changesQuery(context, query) {
      const oldQuery = context.state.query
      context.commit("setQuery", query)
      return oldQuery !== query
    },
    queryStoredMedias(context) {
      const step = context.state.step
      const offset = context.state.offset
      const selector = context.state.selector
      const sort = context.state.sort
      return db.find({
        selector: selector,
        limit: step,
        sort: [{'creation_date': 'desc'}],
        skip: offset
      })
        .then(results => {
          const medias = results.docs
          context.commit('setSingle', false)
          context.commit('insertMedias', medias)
          context.commit('unlock')
          return medias
        })
        .then(() => context.commit('refreshOffset'))
    },
    queryOneStoredMedia(context, id) {
      return db.get(id)
    },
    queryMedias(context, payload) {
      const base = process.env.VUE_APP_API_URL
      const limit = (payload) ? payload.limit : context.state.step
      const offset = (payload) ? payload.offset : context.state.offset
      const query = context.state.query

      let fullQuery
      if (query.includes('?')) {
        fullQuery = base + query + '&limit=' + limit + '&offset='+ offset
      } else {
        fullQuery =  base + query + '?limit=' + limit + '&offset='+ offset
      }

      if (!context.state.isLocked) {
        context.commit('lock')
        console.time('query')
        const promise =  axios.get(fullQuery)
              .then(response => {
                const medias = response.data
                context.commit('setSingle', false)
                context.commit('insertMedias', medias)
                context.commit('unlock')
                console.timeEnd('query')
                return medias
              })

        return promiseTimeout(500, promise)
          .then(medias => context.dispatch('storeMedias', medias))
          .then(() => context.commit('refreshOffset'))
          .catch(e => {console.log(e); return context.dispatch('queryStoredMedias')})
      }

    },
    storeMedias(context, medias) {
      Promise.all(medias.map(m => {
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
        // db.put(m)
        //   .catch(e => {
        //     if (e.name !== 'conflict') {
        //       throw e
        //     } else {
        
        //     }
        
        //   })
      }))
    },
    getMoreMedias (context) {
      return context.dispatch('queryMedias')
    },
    refreshMedias (context) {
      console.log("refresh")
      return context.dispatch('queryMedias', {limit: context.state.medias.length, offset: 0})
    },
    getOneMedias (context, id) {
      const base = process.env.VUE_APP_API_URL
      
      if(context.state.medias.length === 0) {
        const promise = axios.get(base + '/medias/' + id)
              .then(response => {
                const media = response.data
                context.commit('insertMedias', [media])
                context.commit('setSingle', true)
              })
        return promiseTimeout(500, promise)
      }
    },
    getMediasList (context) {
      return context.dispatch('changesQuery', '/medias')
        .then(changed => {
          if (changed) {
            context.commit('emptyMedias')
            context.commit('setPouchDBQuery',
                           {'selector': {},
                            'sort': {'creation_date': -1}})
            return context.dispatch('queryMedias')
          }
        })
    },
    searchText (context, text, refresh) {
      if (text[0] === '#') {
        return context.dispatch('searchTag', text.substring(1, text.length))
      }
      
      return context.dispatch('changesQuery', '/search?text=' + text)
        .then(changed => {
          if (changed) {
            context.commit('emptyMedias')
            context.commit('setPouchDBQuery',
                           {'selector': {$and: [{$or: [{title: {$regex: RegExp(text, 'i')}},
                                                       {description: {$regex: RegExp(text, 'i')}}]},
                                                {creation_date :{$gt: null}}]},
                            'sort': {'creation_date': -1}})
            return context.dispatch('queryMedias')
          }
        })
    },
    searchUploader (context, uploader) {
      return context.dispatch('changesQuery', '/search?uploader=' + uploader)
        .then(changed => {
          if (changed){
            context.commit('emptyMedias')
            context.commit('setPouchDBQuery',
                           {'selector': {$and: [{uploader: {$eq:uploader}}, {creation_date :{$gt: null}}]},
                            'sort': {'creation_date': -1}})

            return context.dispatch('queryMedias')
          }
        })
    },
    searchTag (context, tag) {
      return context.dispatch('changesQuery', '/tags/' + tag)
        .then(changed => {
          if (changed){
            context.commit('emptyMedias')
            context.commit('setPouchDBQuery', {'selector': {tags: {$in: [tag]}}})

            return context.dispatch('queryMedias')
          }
        })
    },
    uploadURL(context, payload) {
      const {url, withDownload} = payload
      const base = process.env.VUE_APP_API_URL
      const params = new URLSearchParams()
      params.append('url', url)
      params.append('withdownload', withDownload)

      return axios.post(base + "/medias", params)
        .then(res => {
          const medias = res.data
          return context.dispatch('storeMedias', medias)
        })
        .then(() => context.dispatch('refreshMedias'))
    },
    deleteMedia (context, payload) {
      const base = process.env.VUE_APP_API_URL
      const id = payload.id
      const query = base + '/medias/' + id
      console.log(query)
      return axios.delete(query)
        .then((response) => {
          context.commit('removeMedia', id)
        })
        .catch((e) => {
          console.error(e)
        })
    },
    downloadMedia(context, payload) {
      const id = payload.id
      const base = process.env.VUE_APP_API_URL
      return axios.put(base + '/medias/download/' + id)
        .then(res => {
          const media = res.data
          context.commit('removeMedia', media._id)
          context.commit('insertMedias', [media])
          return context.dispatch('storeMedias', [media])
        })
    },
    makeOfflineMedia(context, id) {
      return context.dispatch("queryOneStoredMedia",id)
        .then(media => {
          return fetch(media.file_url)
            .then(res => res.blob())
            .then(attachment => {
              const type = media.mime
              return offlineMedias.get(id)
                .then(m => offlineMedias.putAttachment(id, ATTACHMENT_ID, m._rev, attachment, type))
                .catch(() => offlineMedias.putAttachment(id, ATTACHMENT_ID, attachment, type))

            })
        })
    },
    deleteOfflineMedia(context, id) {
      return offlineMedias.get(id)
        .then(m => offlineMedias.removeAttachment(m._id, ATTACHMENT_ID, m._rev))
        .then(() => offlineMedias.viewCleanup())
        .then(() => offlineMedias.compact())
    },
    getOfflineMediaURL(context, id) {
      return offlineMedias.getAttachment(id, ATTACHMENT_ID)
        .then(blob => URL.createObjectURL(blob))
    },
    removeOfflineMediaURL(context, id) {
      
    }
  }
})

const router = new VueRouter({ mode: 'history', routes: routes});
new Vue(Vue.util.extend({ router, store }, App)).$mount('#app');

/*
 * Format media functions
 */

const SHORT_DESCRIPTION_LENGTH = 200

function formatMedia (media) {
  addMediaType(media)
  addShortDescription(media)
  addFormatedUploadDate(media)
  addHTMLDescription(media)
  return media
}

function urlify(text) {
  var urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, function(url) {
    return '<a href="' + url + '">' + url + '</a>';
  })
}

function htmlEscape(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function addHTMLDescription (media) {
  if (media.description) {
    let htmlDescription = htmlEscape(media.description)
    htmlDescription = urlify(htmlDescription)
    htmlDescription = htmlDescription.replace(/\r\n?|\n/g, "<br>")
    media.htmlDescription = htmlDescription
  }
}

function addShortDescription (media) {
  const description = media.description
  
  if (description) {
    let shortDescription = description.split('\n\n')[0]
    shortDescription = shortDescription.substring(0, SHORT_DESCRIPTION_LENGTH)
    shortDescription = urlify(shortDescription)
    shortDescription = shortDescription.replace(/\r\n?|\n/g, "<br>")
    
    if (media.description.length > SHORT_DESCRIPTION_LENGTH) {
      shortDescription += '...'
    }
    media.short_description = shortDescription
  }
}

function addMediaType (media) {
  const reV = new RegExp('video')
  const reI = new RegExp('image')
  const reA = new RegExp('audio')
  media.type = 'other'
  if (reV.test(media.mime)) {
    media.type = 'video'
  }
  if (reI.test(media.mime)) {
    media.type = 'image'
  }
  if (reA.test(media.mime)) {
    media.type = 'audio'
  }
}

function addFormatedUploadDate (media) {
  if (media.upload_date) {
    const date = parseUploadDate(media)
    media.formated_creation_date = new Intl.DateTimeFormat().format(date)
  }
}

function parseUploadDate (media) {
  const dateString = media.upload_date
  const year = dateString.substring(0, 4)
  const month = parseInt(dateString.substring(4, 6))
  const day = dateString.substring(6, 8)
  
  return new Date(year, month - 1, day)
}

/*
 * Nav burger 
 */

document.addEventListener('DOMContentLoaded', () => {

  // Get all "navbar-burger" elements
  const $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);

  // Check if there are any navbar burgers
  if ($navbarBurgers.length > 0) {

    // Add a click event on each of them
    $navbarBurgers.forEach( el => {
      el.addEventListener('click', () => {

        // Get the target from the "data-target" attribute
        const target = el.dataset.target;
        const $target = document.getElementById(target);

        // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
        el.classList.toggle('is-active');
        $target.classList.toggle('is-active');

      });
    });
  }

});

/*
 * Ionicons
 */

require('vue-ionicons/ionicons.css')

/*
 * Service Worker
 */

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js")
    .then(function(registration) {
      console.log("Service Worker registered with scope:", registration.scope)
    }).catch(function(err) {
      console.log("Service worker registration failed:", err)
    })
}

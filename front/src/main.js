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

import PouchDB from 'pouchdb'
import PouchDBFind from 'pouchdb-find'
PouchDB.plugin(PouchDBFind)

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
    isSingle: false
  },
  getters: {
    contains (state, id) {
      return state.medias.some(m => m.id === id)
    }
  },
  mutations: {
    emptyMedias (state) {
      state.medias = []
      state.offset = 0
    },
    prependMedias (state, list) {
      for(let m of list) {
        state.medias.unshift(formatMedia(m))
      }
    },
    appendMedias (state, list) {
      for(let m of list) {
        state.medias.push(formatMedia(m))
      }
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
    // set the db selector
    setSelector(state, selector) {
      state.selector = selector
    },
    incrementOffset(state, incr) {
      state.offset += incr
    },
    lock(state) {
      state.isLocked = true
    },
    unlock(state) {
      state.isLocked = false
    }
  },
  actions: {
    changesQuery(context, query) {
      const oldQuery = context.state.query
      context.commit("setQuery", query)
      return oldQuery !== query
    },
    queryStoredMedias(context) {
      const step = context.state.step
      const offset = context.state.offset
      const selector = context.state.selector

      return db.find({
        selector: selector,
        limit: step,
        sort: [{'creation_date': 'desc'}],
        skip: offset
      })
        .then(results => {
          const medias = results.docs
          context.commit('setSingle', false)
          context.commit('appendMedias', medias)
          context.commit('unlock')
          return medias
        })
        .then(medias => context.commit('incrementOffset', medias.length))
    },
    queryOneStoredMedia(context, id) {
      return db.get(id)
    },
    queryMedias(context) {
      const base = process.env.VUE_APP_API_URL
      const step = context.state.step
      const offset = context.state.offset
      const query = context.state.query
      
      let fullQuery
      if (query.includes('?')) {
        fullQuery = base + query + '&limit=' + step + '&offset='+ offset
      } else {
        fullQuery =  base + query + '?limit=' + step + '&offset='+ offset
      }

      if (!context.state.isLocked) {
        context.commit('lock')
        return axios.get(fullQuery)
          .then(response => {
            const medias = response.data
            context.commit('setSingle', false)
            context.commit('appendMedias', medias)
            context.commit('unlock')
            return medias
          })
          .then(medias => {
            return Promise.all(medias.map(m => db.put(m)
                                          .catch(e => {
                                            if (e.name !== 'conflict') {
                                              throw e
                                            }
                                          })))
          })
          .then(medias => context.commit('incrementOffset', medias.length))
          .catch(e => context.dispatch('queryStoredMedias'))
      }

    },
    getMoreMedias (context, query) {
      return context.dispatch('queryMedias')
    },
    getOneMedias (context, id) {
      const base = process.env.VUE_APP_API_URL
      
      if(context.state.medias.length === 0) {
        return axios.get(base + '/medias/' + id)
          .then(response => {
            const media = response.data
            context.commit('appendMedias', [media])
            context.commit('setSingle', true)
          })
      }
    },
    getMediasList (context) {
      return context.dispatch('changesQuery', '/medias')
        .then(changed => {
          if (changed) {
            context.commit('emptyMedias')
            context.commit('setSelector', {})
            return context.dispatch('queryMedias')
          }
        })
    },
    searchText (context, text) {
      return context.dispatch('changesQuery', '/search?text=' + text)
        .then(changed => {
          if (changed) {
            context.commit('emptyMedias')
            context.commit('setSelector', {$and: [{$or: [{title: {$regex: RegExp(text, 'i')}},
                                                         {description: {$regex: RegExp(text, 'i')}}]},
                                                  {creation_date :{$gt: null}}]})
            return context.dispatch('queryMedias')
          }
        })
    },
    searchUploader (context, uploader) {
      return context.dispatch('changesQuery', '/search?uploader=' + uploader)
        .then(changed => {
          if (changed){
            context.commit('emptyMedias')
            context.commit('setSelector', {$and: [{uploader: {$eq:uploader}}, {creation_date :{$gt: null}}]})
            return context.dispatch('queryMedias')
          }
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
    let shortDescription = description.substring(0, SHORT_DESCRIPTION_LENGTH)
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

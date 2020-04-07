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
import Media from './components/Media.vue'
import Settings from './components/Settings.vue'

import WebTorrent from 'webtorrent'

import PouchDB from 'pouchdb'
import PouchDBFind from 'pouchdb-find'
PouchDB.plugin(PouchDBFind)

import MediaDB from './lib/MediaDB'
const mediaDB = new MediaDB(process.env.VUE_APP_API_URL)

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
    component: Media,
    props: (route) => ({
      expanded: true,
      mediaId: route.params.id
    })
  },
  {
    name: 'Settings',
    path: '/settings',
    component: Settings
  }
]

// database of offline medias
let offlineMedias = new PouchDB("offline_medias")
const ATTACHMENT_ID = 'media'

const store = new Vuex.Store({
  state: {
    sortedByCreationDate: true,
    medias: [],
    isLocked: false,
    offset: 0,
    step: 10,
    queryName: 'find',
    input: '',
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
    insertMedias (state, list) {
      const newMedias = state.medias.slice()
      for(let m of list) {
        // insert at right position from the bottom
        let i = newMedias.length
        // for text search disable insertion
        // THERE IS STILL A PROBLEM OF DUPLICATED FOR TEXT SEARCH !!!
        // 2 QUERIES ARE EXECUTED IN PARALLEL 
        while(i > 0 &&
              state.isSortedByCreationDate &&
              //              !state.query.startsWith('/search?text=') &&
              newMedias[i - 1].creation_date <= m.creation_date &&
              newMedias[i - 1]._id !== m._id) {
          i--
        }

        if (i === 0 || newMedias[i - 1]._id !== m._id)
          newMedias.splice(i, 0, formatMedia(m))
      }
      state.medias = newMedias
      state.offset = state.medias.length
    },
    remove (state, id) {
      const index = state.medias.findIndex((m) => m.id === id)
      state.medias.splice(index, 1)
      state.offset = state.medias.length
    },
    setSingle(state, value) {

      // when the single is switched to false
      // we empty the medias first
      if (state.isSingle && !value) {
        state.medias = []
      }
      state.isSingle = value
    },
    // set the query name
    setQueryName(state, name) {
      state.queryName = name
      state.sortedByCreationDate = mediaDB.isSortedByCreationDate(name)
    },
    setInput(state, input) {
      state.input = input
    },
    setOffset(state, offset) {
      state.offset = offset
    },
    setMagnetOfId(state, payload) {
      state.magnetPerId[payload.id] = payload.magnet
    },
    toggleLock(state) {
      state.isLocked = !state.isLocked
      console.log('lock ' + state.isLocked)
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
    query (context, payload) {
      const queryName = payload.queryName
      const input = payload.input

      context.commit('setQueryName', queryName)
      context.commit('setInput', input)
      context.commit('emptyMedias')
      return context.dispatch('getMore')
    },
    getMore(context, payload) {
      const queryName = context.state.queryName
      const input = context.state.input
      const limit = context.state.step
      const offset = context.state.offset
      if (!context.state.isLocked) {
        console.log(queryName, input, limit, offset)
        context.commit('toggleLock')
      return mediaDB[queryName](input, limit, offset)
          .then(medias => {
            console.log(medias)
          context.commit('setSingle', false)
          context.commit('insertMedias', medias)
          context.commit('toggleLock')
          return medias
          }).catch(e => {
            console.log(e)
            context.commit('toggleLock')
            throw e
          })
      }
    },
    refreshMedias (context) {
      context.commit('setOffset', 0)
      return context.dispatch('getMore')
    },
    getOneMedia (context, id) {
      return mediaDB.getOne(id)
        .then(media => {
          const a = (media) ? [media] : []
          //context.commit('insertMedias', a)
          context.commit('setSingle', true)
          return formatMedia(media)
        })
    },
    uploadURL(context, payload) {
      const {url, withDownload} = payload
      return mediaDB.uploadURL(url, withDownload)
        .then(() => context.dispatch('refreshMedias'))
    },
    delete (context, payload) {
      const id = payload.id
      return mediaDB.delete(id)
        .then(() => {
          context.commit('remove', id)
        })
        .catch(e => {
          console.error(e)
        })
    },
    downloadMedia(context, payload) {
      const id = payload.id
      mediaDB
        .download(id)
        .then(media => {
          context.commit('remove', media._id)
          context.commit('insertMedias', [media])
          return [media]
        })
    },
    makeOfflineMedia(context, id) {
      return mediaDB.getOne(id)
        .then(media => {
          return fetch(media.file_url)
            .then(res => res.blob())
            .then(attachment => {
              const type = media.mime
              return offlineMedias.get(id)
                .then(m => offlineMedias.putAttachment(id, ATTACHMENT_ID, m._rev, attachment, type))
                .catch(() => offlineMedias.putAttachment(id, ATTACHMENT_ID, attachment, type))
                .catch(e => {
                  console.log(e)
                  if (e.reason === 'QuotaExceededError') {
                    // when there is a quota excess the data is in an unstable state (ACID :'( )
                    // so we need to reopen the database
                    return offlineMedias.close().then(() => {
                      offlineMedias = new PouchDB('offline_medias')
                    }).then(() => {
                      throw e
                    })
                  } else {
                    throw e
                  }
                })
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

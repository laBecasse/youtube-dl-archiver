import Vue from 'vue';

import VueRouter from 'vue-router';
Vue.use(VueRouter);

import Vuex from 'vuex';
Vue.use(Vuex)

import VueAxios from 'vue-axios';
import axios from 'axios';
Vue.use(VueAxios, axios);

import App from './App.vue';
import MediaView from './components/MediaView.vue'
import Lookup from './components/Lookup.vue'
import Media from './components/Media.vue'
import AllTags from './components/AllTags.vue'
import Settings from './components/Settings.vue'

import WebTorrent from 'webtorrent'

import PouchDB from 'pouchdb'
import PouchDBFind from 'pouchdb-find'
PouchDB.plugin(PouchDBFind)

import MediaDB from './lib/MediaDB'
const mediaDB = new MediaDB(process.env.VUE_APP_API_URL)
import View from './lib/View'


const routes = [
  {
    name: 'ListMedia',
    path: '/',
    component: MediaView,
    props: route => {
      return {
        'params': {
          queryName: 'find',
          input: {},
          isSortedByCreationDate: true,
          to: route.query.to
        }
      }
    }
  },
  {
    name: 'SearchMedia',
    path: '/search',
    component: MediaView,
    props: (route) => {
      return {
        params: {
          queryName: 'searchText',
          input: route.query.text,
          isSortedByCreationDate: false
        }
      }
    }
  },
  {
    name: 'Uploader',
    path: '/uploader/:uploader',
    component: MediaView,
    props: (route) => {
      return {
        params: {
          queryName: 'searchUploader',
          input: route.params.uploader,
          isSortedByCreationDate: false
        }
      }
    }
  },
  {
    name: 'MediaTag',
    path: '/tag/:tag',
    component: MediaView,
    props: (route) => {
      return {
        params: {
          queryName: 'searchTag',
          input: route.params.tag,
          isSortedByCreationDate: true,
          to: route.query.to
        }
      }
    }
  },
  {
    name: 'AllTags',
    path: '/tags',
    component: AllTags
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
    name: 'Lookup',
    path: '/lookup',
    component: Lookup,
    props: (route) => ({
      query: route.query.query,
      platform: route.query.platform
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
    medias: {},
    isLocked: false,
    offset: 0,
    step: 10,
    queryName: 'find',
    input: '',
    isSingle: false,
    webtorrentClient: new WebTorrent(),
    magnetPerId: {},
    settings: {},
    views: {},
    tags: []
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
    getView(state) {
      return (params) => {
        return state.views[View.getHashFromParams(params)]
      }
    },
    getViews: (state) => () => {
      return Object.values(state.views)
    },
    getViewMedias(state) {
      return (params) => {
        return state.views[View.getHashFromParams(params)].getMedias()
      }
    },
    getMagnet: (state) => (id) =>  {
      return state.magnetPerId[id]
    },
    getTags(state) {
      return state.tags
    }
  },
  mutations: {
    registerView(state, params) {
      const key = View.getHashFromParams(params)
      if (!state.views[key]) {
        const view = new View(params, state.medias)
        Vue.set(state.views, view.getHash(), view)
      }
    },
    delete (state, id) {
      for (let key in state.views) {
        state.views[key].delete(id)
      }
      delete state.medias[id]
    },
    registerMedias(state, medias) {
      for(let media of medias) {
        if (media.id in state.medias) {
          for(let key in media) {
            Vue.set(state.medias[media.id], key, media[key])
          }
        } else {
          Vue.set(state.medias, media.id, media)
        }
      }
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
    },
    setSettings(state, settings) {
      state.settings = settings
    },
    setTags(state, tags) {
      state.tags = tags
    }
  },
  actions: {
    applyOnAll(context, payload) {
      const view = context.getters.getView(payload.params)
      const action = payload.action
      let promises = []

      for(let m of view.getMedias()) {
        promises.push(context.dispatch(action, m))
      }

      return Promise.all(promises)
    },
    getMore(context, params) {
      const view = context.getters.getView(params)

      const payload = {}
      payload.params = params
      payload.offset = (params.isSortedByCreationDate) ? 0 : view.getSize()
      payload.limit = context.state.step
      if (params.isSortedByCreationDate &&
          view.getSize()) {
        payload.to = view.getMedias()[view.getSize() - 1].creation_date
      } else if (params.isSortedByCreationDate &&
                 !view.getSize() &&
                 params.to)  {
        payload.to = params.to
      }

      return context.dispatch('fillView', payload)
    },
    fillView(context, payload) {
      const limit = payload.limit
      const offset = payload.offset
      const to = payload.to
      const params = payload.params
      const view = context.getters.getView(params)
      const queryName = params.queryName
      const input = params.input

      if (!view.isLocked()) {
        view.toggleLock()
        return mediaDB[queryName](input, limit, offset, to)
          .then(medias => {
            context.commit('registerMedias', medias)
            view.insertMedias(medias)
            view.toggleLock()
            return medias
          }).catch(e => {
            view.toggleLock()
            throw e
          })
      }

    },
    refreshMedias (context) {
      return Promise.all(context.getters.getViews().map(v => {
        const payload = {}
        payload.params = v.params
        payload.limit = v.getSize()
        payload.offset = 0
        return context.dispatch('fillView', payload)
      }))
    },
    getOneMedia (context, id) {
      if (context.state.medias[id]) {
        return context.state.medias[id]
      } else {
        return mediaDB.getOne(id)
          .then(media => {
            const a = (media) ? [media] : []
            context.commit('registerMedias', a)
            context.commit('setSingle', true)
            return context.state.medias[id]
          })
      }
    },
    uploadURL(context, payload) {
      const {url, withDownload} = payload
      return mediaDB.uploadURL(url, withDownload)
        .then(medias => {
          return context.dispatch('refreshMedias')
            .then(() => medias)
        })
    },
    delete (context, media) {
      mediaDB.delete(media.id).then(() => {
        return context.commit('delete', media.id)
      })
    },
    downloadMedia(context, payload) {
      const id = payload.id
      mediaDB
        .download(id)
        .then(media => {
          context.commit('registerMedias', [media])
          return [media]
        })
    },
    getAllTags(context) {
      return mediaDB.getAllTags(context)
    },
    addTagToMedia(context, payload) {
      const mediaId = payload.mediaId
      const tag = payload.tag
      return mediaDB
        .addTagToMedia(mediaId, tag)
        .then(media => {
          context.commit('registerMedias', [media])
          return media
        })
    },
    removeTagFromMedia(context, payload) {
      const mediaId = payload.mediaId
      const tag = payload.tag
      return mediaDB
        .removeTagFromMedia(mediaId, tag)
        .then(media => {
          context.commit('registerMedias', [media])
          return media
        })
    },
    renameTag(context, payload) {
      const tag = payload.tag
      const newTag = payload.newTag
      return mediaDB
        .renameTag(tag, newTag)
    },
    lookup(context, payload) {
      const query = payload.query
      const platform = payload.platform
      return mediaDB.lookup(query, platform)
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
        .then(m => offlineMedias.removeAttachment(m.id, ATTACHMENT_ID, m._rev))
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

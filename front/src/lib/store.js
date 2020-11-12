import Vue from 'vue';
import WebTorrent from 'webtorrent'

import MediaDB from './MediaDB'
const mediaDB = new MediaDB(process.env.VUE_APP_API_URL)
import View from './View'

import Parameters from './Parameters'
const parameters = new Parameters()
parameters.setDefaultFromEnv()


const store = {
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
    views: {},
    tags: [],
    parameters: parameters,
    notifications: {}
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
    },
    getParameters(state) {
      return state.parameters
    },
    getNotifications(state) {
      return state.notifications
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
    registerParameters(state, parameters) {
      Vue.set(state, 'parameters', parameters)
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
    setTags(state, tags) {
      state.tags = tags
    },
    showInfo(state, content) {
      state.notifications = {
        type: 'info',
        content: content
      }
    },
    showWarning(state, content) {
      state.notifications = {
        type: 'warning',
        content: content
      }
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
      const platform = params.platform

      if (!view.isLocked()) {
        view.toggleLock()
        return mediaDB[queryName](input, limit, offset, to, platform)
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
          context.commit('registerMedias', medias)
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
    }
  }
}

export default store

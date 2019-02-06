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

const store = new Vuex.Store({
  state: {
    medias: []
  },
  mutations: {
    emptyMedias (state) {
      state.medias = []
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
  addShortDecription(media)
  addFormatedUploadDate(media)
  return media
}

function addShortDecription (media) {
  const description = media.description
  
  if (description) {
    media.short_description = description.substring(0, SHORT_DESCRIPTION_LENGTH)
    if (media.description.length > SHORT_DESCRIPTION_LENGTH) {
      media.short_description += '...'
    }
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
  const month = dateString.substring(4, 6)
  const day = dateString.substring(6, 8)
  
  return new Date(year, month, day)
}

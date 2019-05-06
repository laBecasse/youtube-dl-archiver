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
    },
    removeMedia (state, id) {
      const index = state.medias.findIndex((m) => m.id === id)
      console.log(index)
      state.medias.splice(index, 1)
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
  
  if (description != null) {
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

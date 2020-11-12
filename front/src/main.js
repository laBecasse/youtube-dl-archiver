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
import SearchView from './components/SearchView.vue'
import Lookup from './components/Lookup.vue'
import Media from './components/Media.vue'
import AllTags from './components/AllTags.vue'
import Settings from './components/Settings.vue'

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
    component: SearchView,
    props: (route) => {
      return {
        params: {
          queryName: 'searchText',
          input: route.query.text,
          platform: route.query.platform,
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

import globalStore from './lib/store'
import offlineStore from './lib/offlineStore'

const store = new Vuex.Store({
  modules: {
    global: globalStore,
    offline: offlineStore
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

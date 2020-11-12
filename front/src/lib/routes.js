import MediaView from '../components/MediaView.vue'
import SearchView from '../components/SearchView.vue'
import Lookup from '../components/Lookup.vue'
import Media from '../components/Media.vue'
import AllTags from '../components/AllTags.vue'
import Settings from '../components/Settings.vue'
import OfflineMedia from '../components/OfflineMedia.vue'

export default [
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
    name: 'OfflineMedia',
    path: '/offline',
    component: OfflineMedia
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

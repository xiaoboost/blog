import Vue from 'vue';
import Router from 'vue-router';

import IndexBody from '../components/IndexBody';
import IndexList from '../components/IndexList';
import ArchiveBody from '../components/ArchiveBody';
import ArchiveList from '../components/ArchiveList';

Vue.use(Router);

export default new Router({
  mode: 'history',
  routes: [
    {   path: '/index/', name: 'index', components: IndexBody,
      children: [
        { path: ':page(\\d+)', name: 'indexList', components: IndexList },
        { path: '0', alias: '' }
      ]
    },
    //{   path: '/index/:page(\\d+)', name: 'index', components: IndexBody },
    //{ path: '/:archive/', name: 'archive', components: archive },
    //{ path: '/:archive/:key', components: archive },
    //{ path: '/:archive/:key/:page', components: archive },
    //{ path: '/index/0', alias: '/' }
  ]
});

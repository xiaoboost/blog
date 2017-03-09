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
    { path: '/index', alias: '/', name: 'index', component: IndexBody,
      children: [
        { path: ':page(\\d+)', name: 'indexList', component: IndexList },
        { path: '0', alias: '' }
      ]
    },
    { path: '/:archive', name: 'archive', component: ArchiveBody,
      children: [
        { path: ':key/:page(\\d+)', name: 'archiveList', component: ArchiveList },
        { path: ':key/0', alias: ':key' },
        { path: '$first', alias: '' }
      ]
    }
  ]
});

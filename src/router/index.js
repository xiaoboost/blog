import Vue from 'vue';
import Router from 'vue-router';

import IndexAside from '../components/IndexAside';
import IndexList from '../components/IndexList';
import ArchiveAside from '../components/ArchiveAside';
import ArchiveList from '../components/ArchiveList';

Vue.use(Router);

const index = { left: IndexList, right: IndexAside },
  archive = { left: ArchiveAside, right: ArchiveList };

export default new Router({
  mode: 'history',
  routes: [
    { path: '/index/:page(\\d+)', name: 'index', components: index },
    { path: '/:archive/', name: 'archive', components: archive },
    { path: '/:archive/:key', components: archive },
    { path: '/:archive/:key/:page', components: archive },
    { path: '/index/0', alias: '/' }
  ]
});

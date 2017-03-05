import Vue from 'vue';
import Router from 'vue-router';

import IndexAside from '../components/IndexAside';
import IndexList from '../components/IndexList';

Vue.use(Router);

export default new Router({
  mode: 'history',
  routes: [
    { path: '/', redirect: '/index/0' },
    { path: '/index/:page(\\d+)', alias: '/', name: 'index', components: { left: IndexList, right: IndexAside } }
  ]
});

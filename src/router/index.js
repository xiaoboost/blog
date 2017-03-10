import Vue from 'vue';
import Router from 'vue-router';

import IndexBody from '../components/IndexBody';
import IndexList from '../components/IndexList';
import ArchiveBody from '../components/ArchiveBody';
import ArchiveList from '../components/ArchiveList';
import PostBody from '../components/PostBody';

Vue.use(Router);

export default new Router({
  mode: 'history',
  routes: [
    // 主页
    { path: '/index', alias: '/', name: 'index', component: IndexBody,
      children: [
        { path: ':page(page\\d+)', name: 'indexList', component: IndexList },
        { path: 'page0', alias: '' }
      ]
    },
    // 文章页面
    { path: '/post/:name', name: 'post', component: PostBody },
    // 归档页面
    { path: '/:archive', name: 'archive', component: ArchiveBody,
      children: [
        { path: ':key/:page(page\\d+)', name: 'archiveList', component: ArchiveList },
        { path: ':key/page0', alias: ':key' },
        { path: '$first', alias: '' }
      ]
    }
  ]
});

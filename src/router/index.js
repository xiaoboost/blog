import Vue from 'vue';
import Router from 'vue-router';

import IndexBody from '../views/IndexBody';
import IndexList from '../views/IndexList';
import ArchiveBody from '../views/ArchiveBody';
import ArchiveList from '../views/ArchiveList';
import PostBody from '../views/PostBody';

Vue.use(Router);

export default new Router({
    mode: 'hash',  // history
    routes: [
        // 主页
        { path: '/index', alias: '/', name: 'index', component: IndexBody,
            children: [
                { path: ':page(page\\d+)', name: 'indexList', component: IndexList },
                { path: 'page0', alias: '' },
            ],
        },
        // 文章页面
        { path: '/post/:name', name: 'post', component: PostBody },
        // 归档页面
        { path: '/:archive', name: 'archive', component: ArchiveBody,
            children: [
                { path: ':key/:page(page\\d+)', name: 'archiveList', component: ArchiveList },
                { path: ':key/page0', alias: ':key' },
                { path: '$first', alias: '' },
            ],
        },
    ],
});

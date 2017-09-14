import Vue from 'vue';
import App from './App';
import router from './router';

import './css/main';

const app = new Vue({
    el: '#app',
    router,
    template: '<App ref="main"/>',
    components: { App }
});

// 全局导航 loading 图标控制
router.beforeEach((to, from, next) => {
    app.$refs.main.loading = true;
    next();
});

router.afterEach((route) => {
    app.$refs.main.loading = false;
});

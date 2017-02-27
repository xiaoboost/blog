import Vue from 'vue';
import App from './App';
import router from './router';
import vuex from './vuex';

new Vue({
    el: '#app',
    router,
    vuex,
    template: '<App/>',
    components: { App }
});

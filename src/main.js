import Vue from 'vue';
import App from './App';
import router from './router';
import store from './vuex';

// 标准路径格式转换
Vue.prototype.joinPath = function(...args) {
  args[0] = String(args[0]).search(/(\/|\\|\.\/|\.\\)/)
    ? '/' + args[0]
    : args[0];

  return args.join('/')
    .replace(/\\/g, '/')
    .replace(/\/+/g, '/');
};

new Vue({
  el: '#app',
  router,
  store,
  template: '<App/>',
  components: { App }
});

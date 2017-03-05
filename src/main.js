import Vue from 'vue';
import App from './App';
import router from './router';

//get方法的缓存
const getData = {};
//get方法
Vue.prototype.$ajax = function(...urls) {
  return Promise.all(urls.map((url) => new Promise((res, rej) => {
    //链接数据已经存在
    if (getData[url]) {
      setTimeout(() => res(getData[url]));
      return (true);
    }

    const oAjax = new XMLHttpRequest();
    oAjax.open('GET', url, true);
    oAjax.send();
    oAjax.onreadystatechange = function() {
      if (oAjax.readyState === 4) {
        if (oAjax.status === 200) {
          //转换为DOM并缓存
          getData[url] = JSON.parse(oAjax.responseText);
          res(getData[url]);
        } else {
          rej();
        }
      }
    };
  })));
};

new Vue({
  el: '#app',
  router,
  template: '<App/>',
  components: { App }
});

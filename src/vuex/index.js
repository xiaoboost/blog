import Vue from 'vue';
import Vuex from 'vuex';
import config from '../../config/site.js';

Vue.use(Vuex);

const state = {
  root: config.root,
  prefix: config.prefix,
  site: {
    title: config.title,
    subtitle: config.subtitle,
    description: config.description,
    headerLinks: config.second_dir,
    friendLinks: config.friend_link
  }
};

export default new Vuex.Store({
  state
});

<template>
  <ul id="main" class="archives-list">
    <li v-for="post in posts">
      <router-link :to="`/post/${post.path}`">
        <time>{{post.date.join("-")}}</time>
        <span>{{post.title}}</span>
      </router-link>
    </li>
  </ul>
</template>

<script>
import { ajax } from '../util';

// 异步获取列表
function getKey(archive, key) {
  return key !== '$first'
    ? Promise.resolve(key)
    : ajax(`/api/${archive}/aside`)
        .then((list) => Promise.resolve(list[0].key));
}

export default {
  data() {
    return {
      posts: []
    };
  },
  beforeRouteEnter(to, from, next) {
    const { archive, key, page } = to.params;
    getKey(archive, key)
      .then(($key) => ajax(`/api/${archive}/${$key}/page${page}`))
      .then((posts) => next((vm) => vm.posts = posts));
  },
  watch: {
    $route() {
      const { archive, key, page } = this.$route.params;
      getKey(archive, key)
        .then(($key) => ajax(`/api/${archive}/${$key}/page${page}`))
        .then((posts) => this.posts = posts);
    }
  }
};
</script>

<style lang="stylus">
@import '../css/variable'

ul#main.archives-list
  float right
  list-style none
  padding 0
  margin 2em 100px 0 0
  width 800px
  li
    background #fafafa
    margin-bottom 0.125em
    margin-right 5px
    width 100%
    box-shadow 0 0 3px color-gray
    a
      display block
      border-left 0.5em solid #ccc
      transition border-left 0.45s
      padding 0.5em
      font-size 0.9em
      &:hover
        border-left 0.5em solid color-theme
      time
        color color-font
        display block
        margin 0.5em 5em 0.5em 2em
        font-size 1.2em
        float left
      span
        color color-theme
        line-height 2
        font-size 1.5em
</style>

<template>
  <ul id="main" class="archives-list">
    <li v-for="post in posts">
      <router-link :to="`/api${post.path}`">
        <time>{{post.date.join("-")}}</time>
        <span>{{post.title}}</span>
      </router-link>
    </li>
    <list-nav v-if="prev || next"
              :prev="prev" :next="next">
    </list-nav>
  </ul>
</template>

<script>
import { ajax } from '@/util';
import listNav from '@/components/ListNav';

// 获取页面数据
function getPage(params) {
    const { archive, key, page } = params,
        ans = (key !== '$first')
            ? Promise.resolve(key)
            : ajax(`/api/${archive}/aside`)
            .then((list) => Promise.resolve(list[0].key));

    return ans
        .then(($key) => ajax(`/api/${archive}/${$key}/${page}`));
}

export default {
    data() {
        return {
            posts: [],
            prev: '',
            next: ''
        };
    },
    beforeRouteEnter(to, from, next) {
        getPage(to.params)
            .then((page) => next((vm) => Object.assign(vm, page)));
    },
    watch: {
        $route() {
            getPage(this.$route.params)
                .then((page) => Object.assign(this, page));
        }
    },
    components: {
        'list-nav': listNav
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

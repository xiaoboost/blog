<template>
  <transition-group name="fade-list" tag="ul" id="main" class="archives-list">
    <li v-for="post in posts" :key="post.path" class="fade-list-item">
      <router-link :to="post.path">
        <time>{{post.date.join("-")}}</time>
        <span>{{post.title}}</span>
      </router-link>
    </li>
    <list-nav v-if="prev || next"
              :prev="prev" :next="next">
    </list-nav>
  </transition-group>
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

<style lang="stylus" scoped>
@import '../css/variable'

// 动画设置
.fade-list-item
  transition all .5s ease
.fade-list-enter
  opacity 0
  transform translateX(-30px)
.fade-list-leave-active
  opacity 0
  width 800px
  position absolute
  transform translateX(30px)

ul#main
  float right
  list-style none
  padding 0
  margin 2em 100px 0 0
  width 800px
  li
    background #fafafa
    display block
    margin-bottom 3px
    box-shadow 0 0 5px color-gray
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

// 列表屏幕匹配
ul#main
  @media medium
    display block
    float none
    width width-archives
    margin auto !important
    margin-top 2em !important
  @media mini
    width 100%
    border none
    > li > a
      border none
      &:hover
        border none
  @media phone
    > li > a time
      margin 0.5em 1em
</style>

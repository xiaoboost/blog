<template>
  <ul class="post-list" id="main">
    <li v-for="post in posts">
      <header>
        <router-link :to="post.path">{{post.title}}</router-link>
        <time>{{post.date.join('-')}}</time>
      </header>
      <article>
        <span v-for="text in post.excerpt">{{text}}</span>
      </article>
      <post-footer :category="post.category" :tags="post.tag"></post-footer>
    </li>
    <list-nav v-if="prev || next"
              :prev="prev" :next="next">
    </list-nav>
  </ul>
</template>

<script>
import { ajax } from '../util';
import listNav from './ListNav';
import postFooter from './partial/PostFooter';

export default {
    data() {
        return {
            posts: [],
            prev: '',
            next: ''
        };
    },
    beforeRouteEnter(to, from, next) {
        const page = to.params.page || 'page0';
        ajax(`/api/index/${page}`)
            .then((page) => next((vm) => Object.assign(vm, page)));
    },
    watch: {
        $route() {
            const page = this.$route.params.page || 'page0';
            ajax(`/api/index/${page}`)
                .then((page) => Object.assign(this, page));
        }
    },
    components: {
        'list-nav': listNav,
        'post-footer': postFooter
    }
};
</script>

<style lang="stylus">
@import '../css/variable'
#main
  font-size 1em
  @media medium
    margin-left calc((100% - 950px) / 2) !important
  @media mini
    margin-left 0 !important
    width 100% !important
  @media phone
    font-size 0.9em

ul#main.post-list
  width width-post
  margin 2em 0 0 0
  padding 0
  list-style none
  float left
  //transition margin-left 300ms linear
  > li
    background color-post
    margin-bottom 0.5em
    box-shadow 0.5px 0 3px #888
    border-left 6px solid #bbb
    transition border-left 400ms
    @media mini
      border none
    &:hover
      border-left 6px solid color-theme
      @media mini
        border none
    header
      padding 0.5em 0
      a
        font-smoothing()
        font-size 180%
        padding 0.3em 1em
        word-wrap break-word
        word-break normal
        color color-theme
        transition color 300ms ease-out
        cursor pointer
        &:hover
          color color-orange
        @media mini
          padding-left .5em
      time
        margin 0.5em 1em
        float right
    article
      padding 1em 4%
      color color-black
      font-size 100%
      border-top 1px solid color-border
      span
        display block
        text-indent 2em
</style>

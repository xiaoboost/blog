<template>
  <article id="container">
    <router-view></router-view>
    <aside>
      <div>
        <div class="categories-list">
          <p>分类</p>
          <ul>
            <li v-for="cate in categories">
              <router-link :to="`/categories/${cate.key}`">
                {{cate.key}}<sup>{{cate.total}}</sup>
              </router-link>
            </li>
          </ul>
        </div>
        <div class="tags-list">
          <p>标签</p>
          <ul>
            <li v-for="tag in tags">
              <router-link :to="`/tags/${tag.key}`">
                {{tag.key}}<sup>{{tag.total}}</sup>
              </router-link>
            </li>
          </ul>
        </div>
        <div class="links-list">
          <p>链接</p>
          <ul>
            <li v-for="(url, text) in links">
              <a :href="url" target="_blank">{{text}}</a>
            </li>
          </ul>
        </div>
      </div>
    </aside>
  </article>
</template>

<script>
import { ajax } from '../util';
import config from '../../config/site';

export default {
  data() {
    return {
      tags: [],
      categories: [],
      links: config.friend_link,
    };
  },
  beforeRouteEnter(to, from, next) {
    ajax([
      '/api/tags/aside',
      '/api/categories/aside'
    ]).then(([tags, cates]) => next((vm) => {
      vm.tags = tags;
      vm.categories = cates;
    }));
  }
};
</script>

<style lang="stylus" scoped>
@import '../css/variable'

//主界面的侧边栏
#container aside
  font-size 100%
  margin 2em 5px 0 0
  box-shadow 0 0 3px #888
  float right
  width 300px
  position relative
  overflow hidden
  @media medium
    display none
  @media mini
    display none
  > div
    background color-post
    padding 1em
    box-shadow 0 0 3px #888
    &.fixed
      width calc(300px - 2em)
      position fixed
      top 40px
    > div
      overflow auto
      margin 1em 0 0 0
      float none
      width 100%
      > p
        font-size 1.1em
        color #2ca6cb
        padding 0 0 0.3125em 0
        border-bottom 0.1875em solid #ccc
  ul
    list-style none
  //分类列表
  .categories-list
    margin 0
    li
      border-bottom 1px solid color-gray
      a
        display block
        padding 0.5em 5%
        &:hover
          color color-theme
  //标签列表
  .tags-list ul
    padding-top 0.5em
    li
      display inline-block
      margin 0.4em 0
      a
        margin 0.3125em
        padding 0.125em 0.3125em
        background lighten(color-gray, 30%)
        &:hover
          color color-theme
          background lighten(color-gray, 50%)
  //链接列表
  .links-list ul
    padding 0.5em 0 0 0
    a
      font-size 1em
      line-height line-height
      display block
      padding 0 3%
      &:hover
        color color-theme
        transition color .25s
</style>

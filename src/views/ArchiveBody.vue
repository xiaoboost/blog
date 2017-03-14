<template>
  <article id="container">
    <router-view></router-view>
    <aside :class="archive">
      <p>{{$t(archive)}}</P>
      <ul>
        <li v-for="item in collection">
          <router-link :to="`/${archive}/${item.key}`">
            {{item.key}}<sup>{{item.total}}</sup>
          </router-link>
        </li>
      </ul>
    </aside>
  </article>
</template>

<script>
import { ajax } from '@/util';

export default {
    data() {
        return {
            collection: []
        };
    },
    computed: {
        archive() {
            return this.$route.params.archive;
        }
    },
    beforeRouteEnter(to, from, next) {
        const archive = to.params.archive;
        ajax(`/api/${archive}/aside`)
            .then((collection) => next((vm) => vm.collection = collection));
    },
    watch: {
        $route() {
            ajax(`/api/${this.archive}/aside`)
                .then((collection) => this.collection = collection);
        }
    }
};
</script>

<style lang="stylus" scoped>
@import '../css/variable'

#container > aside
  margin 2em 0 0 50px
  width 250px
  float left
  padding 1em
  background #fafafa
  border-left 0.5em solid #ccc
  color color-theme
  font-size 1em
  box-shadow 0 0 3px color-gray
  > p
    font-size 1.2em
  > ul
    list-style none
    padding 0
    a
      font-size 100%
      display block
      transition color 0.2s
      margin 0.4em 0 0 1.5em
    a.current
      color color-orange

#container > aside.tags > ul
  padding-left 1.5em
  li
    display inline-block
    margin 0
  a
    font-size 100%
    margin .3125em
    padding .125em .3125em
    background lighten(color-gray, 30%)
  a.current
    background lighten(color-gray, 50%)

// 文章列表的分辨率匹配也在这里
#container aside,
#container ul.archives-list
  @media medium
    display block
    float none
    margin-left calc((100% - 800px) / 2) !important
  @media mini
    margin-left 0 !important
    width 100% !important

@media medium
  #container aside
    width 760px
    > ul > li
      display inline-block
      margin 0
  #container ul.archives-list
    width 800px

@media mini
  #container aside
    border none
  #container ul.archives-list > li > a
    border none

@media phone
  ul#main.archives-list li a time
    margin-left 1em
    margin-right 1em
</style>

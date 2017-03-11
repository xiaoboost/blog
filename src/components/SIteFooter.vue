<template>
  <footer>
    <span>Powered by </span>
    <a href="/">Xiao</a>
    <span> © 2014 - 2016</span>
    <div id="goto-up" v-show="show"
         v-followscroll="{bias: 500, callback: showGoto}">
    </div>
  </footer>
</template>

<script>
import followscroll from '../directives/followscroll';

export default {
  name: 'SiteFooter',
  directives: { followscroll },
  data() {
    return {
      show: false
    };
  },
  methods: {
    showGoto(show) {
      this.show = show;
    }
  }
};
</script>

<style lang="stylus" scoped>
@import '../css/variable'

footer
  font-family font-title-family
  font-size 100%
  font-weight bold
  margin 3em 0 1em 0
  text-align center
  width 100%
  color color-font
  text-align center
  flex 0 0 auto
  a
    color color-black
    transition color 200ms ease-out
    &:hover
      color color-orange

footer > div#goto-up
  position fixed
  bottom 2em
  right 2em
  height 3.5em
  width 3.5em
  border-radius 50%
  color #FFFFFF
  box-shadow 0px 2px 3px rgba(0, 0, 0, 0.5)
  background #E53935
  transition opacity 300ms linear
  &:hover
    box-shadow 0px 3px 5px rgba(0, 0, 0, 0.5)
    cursor pointer
  &:before
    font-family font-icon-family
    content "\f102"
    font-size 230%
  @media phone
    bottom 1.6em
    right 1.6em
    height 2.8em
    width 2.8em
    &:before
      font-size 180%
</style>

<template>
  <div id="app">
    <site-header></site-header>
    <article id="container">
      <router-view name="left"></router-view>
      <router-view name="right"></router-view>
    </article>
    <site-footer></site-footer>
  </div>
</template>

<script>
import SiteHeader from './components/SiteHeader.vue';
import SiteFooter from './components/SiteFooter.vue';

export default {
  name: 'app',
  components: {
    SiteHeader,
    SiteFooter
  }
};
</script>

<style lang="stylus">
@import './css/variable'
@import './css/font'
@import './css/public'

body, html
  height 100%

#app
  font-smoothing()
  color color-font
  font-size font-size
  font-family font-default
  background color-background
  line-height line-height
  height 100%
  width 100%
  display flex
  flex-direction column
  > header,
  > footer
    flex 0 0 auto
  > article
    flex 1 0 auto

article#container
  margin auto
  width width-main
  overflow hidden
  @media medium
    width 100%
    margin 0
</style>

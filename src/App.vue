<template>
  <div id="app">
    <img src="./assets/logo.png">
    <router-view></router-view>
  </div>
</template>

<script>
export default {
    name: 'app'
};
</script>

<style lang="stylus">
@import './css/variable'
@import './css/font'
@import './css/public'

#app
  font-family font-default
  font-smoothing()
  text-align center
  color #2c3e50
  margin-top 60px
</style>

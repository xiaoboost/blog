<template>
  <nav v-if="prev || next">
    <router-link v-if="next" :to="next" class="next"> « Next</router-link>
    <router-link v-if="prev" :to="prev" class="prev"> » Prev</router-link>
  </nav>
</template>

<script>
export default {
  props: {
    prev: {
      type: String,
      default: ''
    },
    next: {
      type: String,
      default: ''
    }
  }
};
</script>

<style lang="stylus" scoped>
@import '../css/variable'

nav
  background #fafafa
  text-align center
  overflow hidden
  a, span
    display inline-block
    padding 0.5em 1em
  span
    cursor default
  a
    transition color 300ms ease-out, background-color 300ms ease-out
    &:hover
      background-color color-gray
      color color-orange
  .current,.prev,.next
    color color-theme
  .prev
    float right
  .next
    float left
</style>

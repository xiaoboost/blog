<template>
  <footer class="post-footer">
    <span>
      <router-link :to="`/categories/${category}`">{{category}}</router-link>
    </span>
    <span>
      <router-link v-for="tag in tags" :key="tag" :to="`/tags/${tag}`">
        {{tag}}
      </router-link>
    </span>
  </footer>
</template>

<script>
export default {
    props: {
        category: {
            type: String,
            default: ''
        },
        tags: {
            type: Array,
            default: () => []
        }
    }
};
</script>

<style lang="stylus" scoped>
@import '../css/variable'

footer.post-footer
  margin 0
  padding 0 4%
  line-height 2.5em
  border-top 1px solid color-border
  span
    color #d6d6d6
    margin-right 2em
    &:before
      font-family "FontAwesome"
      color #999
      margin-right 0.2em
      font-smoothing()
  span:nth-child(1)
    &:before
      content "\f07b"
    a
      margin 0 0.3em
  span:nth-child(2)
    &:before
      content "\f02c"
    a
      padding 0 0.3em
      margin 0.3em
      background #e6e6e6
</style>

<template>
  <ol :class="tocClass">
    <li v-for="(node, i) in tocTree" :class="`toc-item toc-level-${node.level}`">
      <a class="toc-link" :href="`#${node.bolt}`">
        <span class="toc-number">{{`${num}${i+1}.`}}</span>
        <span class="toc-text">{{node.tocTitle}}</span>
      </a>
      <post-toc v-if="!!node.child" :tocTree="node.child"
                :num="`${num}${i+1}.`" tocClass="toc-child">
      </post-toc>
    </li>
  </ol>
</template>

<script>
export default {
    name: 'post-toc',
    props: {
        tocTree: {
            type: Array,
            default: []
        },
        num: {
            type: String,
            default: ''
        },
        tocClass: {
            validator(value) {
                return (['toc', 'toc-child'].indexOf(value) !== -1);
            },
            type: String,
            default: 'toc'
        }
    }
};
</script>

<style lang="stylus" scoped>
  @import '../../css/variable'

  ol
    list-style none
  ol.toc
    a
      padding 0.3em 0
      border-bottom 1px solid color-gray
      transition color 200ms ease-out, border-bottom 200ms ease-out
      &:hover
        color color-theme
        border-bottom 1px solid color-orange
    li,ol
      margin 0.5em 0
      transition all 300ms ease-out
    .toc-level-2,
    .toc-level-3,
    .toc-level-4,
    .toc-level-5,
    .toc-level-6
      padding-left 1em
    .toc-child
      display none
    .toc-current > a
      color color-theme
      border-bottom 1px solid color-theme
    .toc-child-vision > .toc-child
        display block
</style>

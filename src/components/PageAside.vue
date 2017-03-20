<template>
  <aside>
    <div v-followscroll="{bias: 95, callback: fixAside}"
         :class="{ 'fixed': fixed }">
      <slot></slot>
    </div>
  </aside>
</template>

<script>
import followscroll from '@/directives/followscroll';

export default {
    name: 'PageAside',
    directives: { followscroll },
    data() {
        return {
            fixed: false
        };
    },
    methods: {
        fixAside(fix) {
            this.fixed = fix;
        }
    }
};

</script>

<style lang="stylus" scoped>
@import '../css/variable'

//侧边栏公共属性
aside
  font-size 100%
  margin 2em 5px 0 0
  box-shadow 0 0 3px #888
  float right
  width 300px
  position relative
  overflow hidden
  @media medium
    display none
  > div
    background color-post
    padding 1em
    box-shadow 0 0 3px #888
    &.fixed
      width calc(300px - 2em)
      position fixed
      top 40px
</style>

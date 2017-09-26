<template>
<aside>
    <div
        :class="{ 'fixed': fixed }"
        v-followscroll="{bias: 95, callback: fixAside}">
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
            fixed: false,
        };
    },
    methods: {
        fixAside(fix) {
            this.fixed = fix;
        },
    },
};

</script>

<style lang="stylus" scoped>
@import '../css/variable'

asideWidth = 300px
asidePadding = 15px

//侧边栏公共属性
aside
    font-size 100%
    margin 30px 5px 0 0
    box-shadow 0 0 3px #888
    float right
    width asideWidth
    position relative
    overflow hidden
    @media medium
        display none
    > div
        background color-post
        padding asidePadding
        box-shadow 0 0 3px #888
        &.fixed
            width asideWidth - asidePadding * 2
            position fixed
            top 40px
</style>

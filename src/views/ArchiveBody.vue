<template>
<article id="container">
    <aside :class="archive">
        <p>{{$t(archive)}}</P>
        <ul>
            <li v-for="(item, i) in collection" :key="i">
                <router-link :to="`/${archive}/${item.key}`">
                    {{item.key}}<sup>{{item.total}}</sup>
                </router-link>
            </li>
        </ul>
    </aside>
    <router-view></router-view>
</article>
</template>

<script>
import { ajax } from '@/libraries/util';

export default {
    data() {
        return {
            collection: [],
            archive: '',
        };
    },
    async beforeRouteEnter(to, from, next) {
        const archive = to.params.archive;
        const collection = await ajax(`/api/${archive}/aside`);

        next((vm) => {
            vm.collection = collection;
            vm.archive = archive;
            document.title = `DC | ${vm.$t(archive)}`;
        });
    },
    async beforeRouteUpdate(to, from, next) {
        const archive = to.params.archive;
        const collection = await ajax(`/api/${archive}/aside`);

        this.collection = collection;
        this.archive = archive;
        document.title = `DC | ${this.$t(archive)}`;
        next();
    },
};
</script>

<style lang="stylus" scoped>
@import '../css/variable'

#container > aside
    margin 30px 0 0 50px
    box-sizing border-box
    width 280px
    float left
    padding 1em
    background #fafafa
    border-left 0.2em solid color-theme
    color color-theme
    font-size 1rem
    box-shadow 0 0 3px color-gray
    @media mini
        font-size 0.9rem
    > p
        font-size 1.2em
    > ul
        list-style none
        padding 0
        a
            display block
            transition color 0.2s
            margin 0.4em 0 0 1.5em
        a.router-link-active
            color color-orange

#container > aside.tags > ul
    padding-left 1em
    li
        display inline-block
        margin 0
    a
        font-size 100%
        margin .3125em
        padding .125em .3125em
        background lighten(color-gray, 30%)
    a.router-link-active
        background lighten(color-gray, 50%)

// 左侧边栏屏幕匹配
#container aside
    @media medium
        display block
        float none
        width width-archives
        margin auto
        margin-top 2em
        > ul > li
            display inline-block
            margin 0
    @media mini
        margin 0
        width 100%
        border none
        box-shadow 0 2px 4px color-gray
</style>

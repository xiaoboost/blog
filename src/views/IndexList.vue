<template>
<ul class="post-list" id="main">
    <li v-for="post in posts" :key="post.path">
        <header>
            <router-link :to="post.path">{{post.title}}</router-link>
            <time>{{post.date.join('-')}}</time>
        </header>
        <article>
            <span v-for="(text, i) in post.excerpt" :key="i">{{text}}</span>
        </article>
        <post-footer :category="post.category" :tags="post.tag"></post-footer>
    </li>
    <list-nav
        v-if="prev || next"
        :prev="prev" :next="next">
    </list-nav>
</ul>
</template>

<script>
import { ajax } from '@/libraries/util';
import listNav from '@/components/ListNav';
import postFooter from '@/components/PostFooter';

export default {
    data() {
        return {
            posts: [],
            prev: '',
            next: '',
        };
    },
    beforeRouteEnter(to, from, next) {
        const page = to.params.page || 'page0';
        ajax(`/api/index/${page}`)
            .then((page) => next((vm) => Object.assign(vm, page)));
    },
    beforeRouteUpdate(to, from, next) {
        ajax(`/api/index/${to.params.page}`)
            .then((page) => Object.assign(this, page))
            .then(() => next());
    },
    components: {
        'list-nav': listNav,
        'post-footer': postFooter,
    },
};
</script>

<style lang="stylus">
@import '../css/variable'
#main
    font-size 1rem
    @media medium
        margin-left calc((100% - 950px) / 2) !important
    @media mini
        margin 1em 0 0 0 !important
        width 100% !important
    @media phone
        font-size 0.9rem

ul#main.post-list
    width width-post
    margin 30px 0 0 0
    padding 0
    list-style none
    float left
    //transition margin-left 300ms linear
    > li
        background color-post
        margin-bottom 0.5em
        box-shadow 0.5px 0 3px #888
        border-left 6px solid #bbb
        transition border-left 400ms
        @media mini
            border none
        &:hover
            border-left 6px solid color-theme
            @media mini
                border none
        header
            padding 0.5em 0
            display flex
            justify-content space-between
            a
                font-smoothing()
                font-size 1.5em
                margin 0 0 0 1em
                word-wrap break-word
                word-break normal
                color color-theme
                display inline-block
                transition color 300ms ease-out
                cursor pointer
                &:hover
                    color color-orange
                @media mini
                    margin 0 0 0 1em
            time
                margin .3rem 1rem .3rem .3rem
                font-size 1em
        article
            padding .5em 2.5em
            color color-black
            border-top 1px solid color-border
            @media mini
                padding .5em 1em
            span
                display block
                text-indent 2em
</style>

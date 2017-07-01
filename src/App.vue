<template>
<div id="app">
    <site-header></site-header>
    <router-view></router-view>
    <site-footer></site-footer>
    <loading :vision="loading"></loading>
</div>
</template>

<script>
import Loading from '@/components/Loading';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

export default {
    name: 'app',
    components: {
        Loading,
        SiteHeader,
        SiteFooter
    },
    data() {
        return {
            loading: false
        };
    }
};
</script>

<style lang="stylus">
@import './css/variable'
@import './css/font'
@import './css/public'
@import './css/post'

body, html
    height 100%
    background #ddd

#app
    font-smoothing()
    color color-font
    font-size 16px
    line-height 1.5
    font-family font-content
    text-shadow silver 0px 0px 1px
    background color-background
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

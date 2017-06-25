<template>
<header>
    <div>
        <div class="header-logo">
            <router-link to="/" class="header-logo"><img src="/img/logo.png"></router-link>
        </div>
        <div class="header-desc">
            <h1><router-link to="/">{{title}}</router-link></h1>
            <h2>
                <span>{{subtitle}}</span>
                <span class="header-links">
                    <router-link v-for="(href, text) in headerLinks"
                                                :to="href" :key="text">{{text}}</router-link>
                </span>
            </h2>
        </div>
    </div>
</header>
</template>

<script>
import config from '@config/site';

export default {
    name: 'SiteHeader',
    data() {
        return {
            title: config.title,
            subtitle: config.subtitle,

            headerLinks: {
                '时间': '/time/',
                '分类': '/categories/',
                '标签': '/tags/',
                // '关于': '/archives/about/'
            }
        };
    },
    mounted() {
        document.title = this.title;
    }
};
</script>

<style lang="stylus" scoped>
@import '../css/variable'

header
    box-shadow 2px 4px 5px hsla(0,1%,1%,.2)
    background color-theme
    color color-white
    width 100%
    margin 0
    padding 0
    position relative
    overflow hidden
    user-select none
    > div
        width width-main
        margin 0 auto
        display flex
        @media medium
            width 90%
            margin 0 auto

header a
    color color-white

div.header-logo img
    width 5.5em
    padding-top .5em
    @media phone
        width 3.85em
        padding-top .3em

div.header-desc
    flex-grow 1
    padding .1em 0 0 1em
    font-size 1em
    @media phone
        font-size 0.7em
    > h1
        font-family font-title-family
        font-size 2.8em
        font-weight normal
        font-smoothing()
    > h2
        margin 0
        font-size 1em
        font-weight normal
        font-smoothing()
    .header-links
        float right
        > a
            padding 0.2em 1.5em
            &:hover,
            &.router-link-active
                color color-font-nav
        @media mini
            > a:last-child
                padding-right: 0
        
/*
// 搜索框样式，暂存
form.search
    padding 0.1em 0 0 1em
    input
        -webkit-appearance textfield
        font-size 0.87em
        line-height line-height+0.2
        border 2px solid color-white
        color color-white
        background transparent
        border-radius 30px
        padding-left 0.5em
        width 8em
        transition .5s width
        &:focus
            width 15em
    label
        display none
// 搜索框提示字体设置
::-moz-placeholder,
:-ms-input-placeholder,
::-webkit-input-placeholder
    font-family font-content
    color color-white
    padding 2px 0 0 4px
*/
</styles>

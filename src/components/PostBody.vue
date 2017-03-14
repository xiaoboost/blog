<template>
  <article id="container">
    <div class="post" id="main">
      <header>
        <p>{{title}}</p>
        <p>发表于：{{date.join('-')}}</p>
      </header>
      <article class="post-content" v-html="content"></article>
      <post-footer :category="category" :tags="tag"></post-footer>
      <nav v-if="next || prev">
        <router-link class="next" v-if="next" :to="next.path">
          <p>下一篇：</p>
          <p>{{next.title}}</p>
        </router-link>
        <router-link class="prev" v-if="prev" :to="prev.path">
          <p>上一篇：</p>
          <p>{{prev.title}}</p>
        </router-link>
      </nav>
    </div>
    <page-aside>
      <p class="toc-title">文章目录</p>
      <post-toc :tocTree="toc"></post-toc>
    </page-aside>
  </article>
</template>

<script>
import { ajax } from '../util';
import postToc from './partial/PostToc';
import pageAside from './partial/PageAside';
import postFooter from './partial/PostFooter';

export default {
    data() {
        return {
            title: '',
            date: [],
            content: '',
            toc: [],
            category: '',
            tag: [],
            next: false,
            prev: false
        };
    },
    beforeRouteEnter(to, from, next) {
        ajax(`/api/post/${to.params.name}`)
            .then((page) => next((vm) => Object.assign(vm, page)));
    },
    watch: {
        $route() {
            ajax(`/api/post/${this.$route.params.name}`)
                .then((page) => Object.assign(this, page));
        }
    },
    components: {
        'page-aside': pageAside,
        'post-toc': postToc,
        'post-footer': postFooter
    }
};
</script>

<style lang="stylus">
  @import '../css/variable'

  //目录标题样式
  p.toc-title
    color #000
    margin-bottom .5em
    padding-bottom .5em
    border-bottom 2px solid #ccc

  //正文样式设定，这里和主页面文章列表有部分共用
  #main.post
    width width-post
    background color-post
    box-shadow 0 0 3px #888
    margin 2em 0 3px 3px
    float left
    transition margin 0.5s ease-out
    line-height 1.8
    &.post-center
      margin-left 175px
    > header
      border-bottom 1px solid color-border
      > p:nth-child(1)
        font-smoothing()
        color color-theme
        font-size 200%
        word-wrap break-word
        word-break normal
        border-left 5px solid color-theme
        padding 0.3em 1em
        line-height 1.5
      > p:nth-child(2)
        margin-right 1em
        padding .3em
        font-size .9em
        text-align right
        &:before
          font-smoothing()
          font-size 110%
          content "\f017"
          font-family font-icon-family
          margin 0 0.5em

  //文章底部导航栏
  #main.post > nav
    padding 1em
    font-size 120%
    overflow hidden
    a:hover
      color color-theme
    a.next
      float left
      padding-left 2em
      > p:nth-child(1)
        text-align left
        &:before
          font-smoothing()
          content "\f053"
          font-family font-icon-family
          position absolute
          transform translate(-1.5em, 1em)
    a.prev
      float right
      padding-right 2em
      > p:nth-child(1)
        text-align right
        &:after
          font-smoothing()
          content "\f054"
          font-family font-icon-family
          position absolute
          transform translate(0.5em, 1em)

  //文章正文样式
  #main.post .post-content
    padding 1.5em 4%
    font-size 1.15em
    color #555
    p, blockquote, ul, ol, dl, table
      margin 0.8em 0
    //分段
    p
      line-height line-height + 0.2
      @media phone
        line-height line-height - 0.1
      > span
        display block
        //每段的前置空格
        text-indent 2em
        //行内公式
        span.katex
          display inline
          > span
            display none
          > span.katex-html
            display inherit
        //块级公式
        span.katex-display
          margin 0.5em 0
        //整行元素不需要前置空格
        &.space
          text-indent 0
        //图片，块级元素，居中
        img.img-block
          max-width 100%
          display block
          margin 0 auto
        //图片标题，块级元素，居中
        span.img-title
          color color-black
          font-size 0.8em
          text-align center
          display block
          margin 0.4em 0 0.5em
    //单行内的强调
    code
      color color-code
      background-color lighten(color-code, 50)
      border-radius 10%
      font-family font-mono
      padding 0 5px
      margin 0 2px
      font-size 0.9em
      white-space nowrap
    //分隔符
    hr
      height 4px
      padding 0
      margin 16px 0
      background-color #ddd
      border 0 none
      overflow hidden
      box-sizing content-box
      border-bottom 1px solid #ddd
    //链接
    a
      color color-theme
    //标题
    h1,h2,h3,h3,h4,h5,h6
      color color-black
      position relative
      margin 1em 0 0.3em 0
      font-weight bold
      line-height 1.4
    h1
      padding 0 0 .3em 0
      font-size 2.25em
      border-bottom 4px solid color-gray
    h2
      border-bottom 2px solid color-gray
      font-size 1.75em
      padding 0 0 .3em 0
    h3
      font-size 1.5em
    h4
      font-size 1.25em
    h5, h6
      font-size 1em
    //列表
    ul,ol
      padding-left 1.5em
    ol p,
    li p,
    ul p
      margin 0
      span
        text-indent 0
    li ol
      margin 0
    blockquote
      padding 10px 20px
      border-left 0.3em solid color-theme
      margin 1em 0
      line-height 1.5
      font-size 90%
      background #f2f2f2
      color #888
    //表格
    table, th, td
      border 1px solid lighten(color-gray,30%)
      border-collapse collapse
    table
      width 100%
      overflow-x auto
      th
        font-weight bold
        padding 0.2em 0.8em
      td
        padding 0.4em 0.8em
      tr
        border-radius 0
      tbody tr:nth-child(2n),
      thead tr
        background lighten(color-gray,75%)

  //文章本体、列表、引用 首元素没有顶部空格，底部元素没有底部空格
  #main.post .post-content,
  #main.post .post-content blockquote
    > :first-child
      margin-top 0
    > :last-child
      margin-bottom 0

  //自定义类
  .post .post-content
    .note,.warning,.translator
      padding 10px 20px
      margin 1em 0
      line-height line-height
      font-size 90%
      background #f2f2f2
      color #888
      &:before
        display block
        position absolute
        width 1.6em
        height 1.6em
        border-radius 50%
        font-size 0.8em
        color #fff
        text-align center
        transform translateX(-2.4em)
    .note
      border-left .3em solid #6c6
      &:before
        background-color #6c6
        font-family font-icon-family
        content "\f0e5"
    .warning
      border-left .3em solid #f66
      &:before
        background-color #f66
        font-family font-icon-family
        content "\f12a"
    .translator
      border-left .3em solid #d8d800
      &:before
        background-color #d8d800
        content "译"
    //译注的上标
    sup.label
      background-color #d8d800
      padding 0
      top -0.6em

  //文章中鼠标选中文字的颜色
  #container
    ::selection
      background lighten(#0080ff, 70%)
      text-shadow none
    .post-content pre code ul li
      ::selection
        color #c0c5ce
        text-shadow none

  //代码高亮部分
  #main.post article.post-content pre
    text-shadow none
    padding 0em 0 0 0.5em
    background-color #2b303b
    position relative
    font-size 0.9em
    margin 0.8em 0
    @media phone
      font-size 0.8em
    ul
      padding 0
      margin 0
      list-style-type none
      &.gutter
        float left
        padding-right .5em
        > li
          text-align right
          color #5a5a5a
      &.code
        overflow-x auto
        > li:after
          content "　"
    li
      padding 0
      margin 0
      display block
      width 100%
    code
      margin 0
      padding 0
      overflow-wrap normal
      white-space inherit
      color color-pre
      background-color #2b303b
      display block
    &:before
      position absolute
      right 0
      padding 0.2em 0.5em
      font-size .8em
      color #8a8a8a
      font-family font-mono
      text-shadow none
      content 'CODE'
    &.javascript:before
      content 'JavaScript'
    &.c:before
      content 'C'
    &.cpp:before
      content 'C++'
    &.python:before
      content 'python'
    &.bash:before
      content 'BASH'
    &.html:before
      content 'HTML'

  pre code span
    color #c0c5ce
    &.hljs-tag
      color #c0c5ce
      .hljs-name
        color #B55B5F
      .hljs-attr
        color #D08770
    &.hljs-string
      color #a3be8c
    &.hljs-keyword
      color #b48ead
    &.hljs-built_in
      color #EBCB8B
    &.hljs-comment
      color #65737e
    &.hljs-type
      color #4271ae
    &.hljs-literal,
    &.hljs-number
      color #d08770
    &.hljs-attribute
      color #f5871f
    &.hljs-attribute-value
      color #3e999f
    &.hljs-declaration
      color #f5871f
    &.hljs-variable-name
      color #c82829
    &.hljs-function-name
      color #4271ae
    &.hljs-punctuation
      color #4d4d4c
</style>

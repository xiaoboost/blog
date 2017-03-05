<template>
  <header>
    <div>
      <div id="logo-img">
        <a href="/"><img src="/api/img/logo.png"></a>
      </div>
      <div id="logo-text">
        <h1><a href="/">{{title}}</a></h1>
        <h2>{{subtitle}}</h2>
      </div>
      <ul>
        <li v-for="(href, text) in headerLinks">
          <a :href="href">{{text}}</a>
        </li>
      </ul>
    </div>
  </header>
</template>

<script>
import config from '../../config/site';

export default {
  name: 'SiteHeader',
  data() {
    return {
      title: config.title,
      subtitle: config.subtitle,

      headerLinks: {
        '主页': '/',
        '归档': '/archives/',
        '分类': '/categories/',
        '标签': '/tags/',
        '关于': '/archives/about/'
      }
    };
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
  @media phone
    padding-bottom 1em
  > div
    width width-main
    margin 0 auto
    @media medium
      width 90%
      margin 0 auto
  a
    display block
    color color-white

div#logo-img
  float left
  transform translateY(1em)
  width 5.5em
  @media phone
    width 3.85em
    transform translateY(0.7em)
  img
    width 5.5em
    @media phone
      width 3.85em
div#logo-text
  float left
  width calc(100% - 6em)
  font-size 1em
  margin-left 0.5em
  transform translateY(0.7em)
  @media phone
    font-size 0.7em
  > h1
    width 86%
    margin 0
    font-family font-title-family
    line-height line-height
    font-size 2.8em
    font-weight normal
    font-smoothing()
  > h2
    margin 0
    font-size 1.1em
    font-weight normal

header ul
  float right
  width auto
  max-height none
  font-size 1em
  transition max-height 1s ease-out
  list-style none
  transform translateY(-0.5em)
  @media phone
    font-size .7em
    transform translateY(1em)
    //在手机端，搜索框不显示
    > li:last-child
      display none
  > li
    float left
    > a
      padding 0.2em 1.5em
      &:hover
        color color-font-nav
    > form.search
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

/*搜索框提示字体设置*/
::-moz-placeholder,
:-ms-input-placeholder,
::-webkit-input-placeholder
  font-family font-default
  color color-white
  padding 2px 0 0 4px
</styles>

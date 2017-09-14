<template>
<article id="container">
    <router-view></router-view>
    <page-aside>
        <div class="categories-list">
            <p>分类</p>
            <ul>
                <li v-for="cate in categories" :key="cate.key">
                    <router-link :to="`/categories/${cate.key}`">
                        {{cate.key}}<sup>{{cate.total}}</sup>
                    </router-link>
                </li>
            </ul>
        </div>
        <div class="tags-list">
            <p>标签</p>
            <ul>
                <li v-for="tag in tags" :key="tag.key">
                    <router-link :to="`/tags/${tag.key}`">
                        {{tag.key}}<sup>{{tag.total}}</sup>
                    </router-link>
                </li>
            </ul>
        </div>
        <div class="links-list">
            <p>链接</p>
            <ul>
                <li v-for="(url, text) in links" :key="url">
                    <a :href="url" target="_blank">{{text}}</a>
                </li>
            </ul>
        </div>
    </page-aside>
</article>
</template>

<script>
import { ajax } from '@/libraries/util';
import config from '@config/site';
import pageAside from '@/components/PageAside';

export default {
    data() {
        return {
            tags: [],
            categories: [],
            links: config.friend_link,
        };
    },
    beforeRouteEnter(to, from, next) {
        ajax([
            '/api/tags/aside',
            '/api/categories/aside'
        ]).then(([tags, cates]) => next((vm) => {
            vm.tags = tags;
            vm.categories = cates;
        }));
        // 网站主标题
        document.title = config.title;
    },
    components: {
        'page-aside': pageAside
    }
};
</script>

<style lang="stylus" scoped>
@import '../css/variable'

div.categories-list,
div.tags-list,
div.links-list
    overflow hidden
    margin 12px 0 0 0
    float none
    width 100%
    > p
        font-size 18px
        color #2ca6cb
        padding 0 0 4px 0
        border-bottom 3px solid #ccc
    > ul
        list-style none

//分类列表
div.categories-list
    margin 0
    li
        border-bottom 1px solid color-gray
        a
            display block
            padding 4px 8px
            &:hover
                color color-theme
//标签列表
.tags-list ul
    padding 6px 0 0 0
    li
        display inline-block
        margin 3px 0
        a
            margin 4px
            padding 2px 4px
            background lighten(color-gray, 30%)
            &:hover
                color color-theme
                background lighten(color-gray, 50%)
//链接列表
.links-list ul
    padding 6px 0 0 0
    a
        display block
        padding 0 8px
        &:hover
            color color-theme
            transition color .25s
</style>

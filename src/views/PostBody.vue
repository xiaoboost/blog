<template>
<article id="container">
    <div :class="['post', {'post-center': !toc}]" id="main">
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
    <page-aside v-if="!!toc">
        <p class="toc-title">文章目录</p>
        <post-toc ref="toc" :tocTree="toc"></post-toc>
    </page-aside>
</article>
</template>

<script>
import { ajax } from '@/util';
import postToc from '@/components/PostToc';
import pageAside from '@/components/PageAside';
import postFooter from '@/components/PostFooter';

const doc = document;
// 计算dom到网页顶端的距离
function offsetDocTop(dom) {
    let ans = 0;
    for (let i = dom; i !== doc.body; i = i.offsetParent) {
        ans += i.offsetTop;
    }
    return ans;
}

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
            prev: false,

            tocNav: '',
        };
    },
    beforeRouteEnter(to, from, next) {
        ajax(`/api/post/${to.params.name}`).then((page) => next((vm) => {
            Object.assign(vm, page);
            doc.title = vm.$t(vm.title);
            vm.addPropToc(vm.toc);
        }));
    },
    beforeRouteUpdate(to, from, next) {
        ajax(`/api/post/${to.params.name}`).then((page) => {
            Object.assign(this, page);
            doc.title = this.$t(this.title);
            this.addPropToc(this.toc);
            next();
        });
    },
    methods: {
        pageNav() {
            const viewTop = doc.documentElement.scrollTop,
                navL = this.tocNav;

            this.tocNav = function search(toc) {
                for (let i = toc.length - 1; i >= 0; i--) {
                    // 缓存绑定的DOM对象
                    toc[i].el = doc.getElementById(toc[i].bolt);
                    const offsetTop = offsetDocTop(toc[i].el) - 30;
                    // 如果当前元素在视窗上方
                    if (offsetTop < viewTop) {
                        const childBolt = toc[i].child && search(toc[i].child);
                        if (childBolt) {
                            return (childBolt);
                        } else {
                            return (toc[i].bolt);
                        }
                    }
                }
                return ('');
            }(this.toc);

            // 目录导航发生改变
            if (navL !== this.tocNav) {
                this.$refs.toc.captureToc(this.tocNav);
            }
        },
        addPropToc(toc) {
            toc.forEach((item) => {
                this.$set(item, 'current', false);
                this.$set(item, 'showChild', false);

                if (item.child && item.child.length) {
                    this.addPropToc(item.child);
                }
            });
        },
    },
    mounted() {
        doc.addEventListener('scroll', this.pageNav);
    },
    beforeDestroy() {
        doc.removeEventListener('scroll', this.pageNav);
    },
    components: {
        'post-toc': postToc,
        'page-aside': pageAside,
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
    margin 30px 0 3px 3px
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
            font-size 1.8em
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
</style>

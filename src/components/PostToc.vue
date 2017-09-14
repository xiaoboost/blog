<template>
<ol :class="tocClass">
    <li
        v-for="(node, i) in tocTree"
        :bolt="node.bolt" :key="i"
        :class="['toc-item', `toc-level-${level}`, { 'toc-current': node.current }]">
        <a class="toc-link" v-scrollto="{speed: 60, target: `#${node.bolt}`}">
            <span class="toc-number">{{`${number}${i+1}.`}}</span>
            <span class="toc-text">{{node.tocTitle}}</span>
        </a>
        <template v-if="node.child && node.child.length">
            <transition
                name="height"
                @enter="enter"
                @leave="leave"
                @after-enter="clear"
                @after-leave="clear">
                <post-toc
                    v-show="node.showChild"
                    :tocTree="node.child"
                    :ref="`childToc-${i}`"
                    :number="`${number}${i+1}.`"
                    :level="level + 1" tocClass="toc-child">
                </post-toc>
            </transition>
        </template>
    </li>
</ol>
</template>

<script>
import scrollto from '@/directives/scrollto';
import { ajax, clone, delay } from '@/libraries/util';

export default {
    name: 'post-toc',
    directives: { scrollto },
    props: {
        tocTree: {
            type: Array,
            default: () => []
        },
        number: {
            type: String,
            default: ''
        },
        level: {
            type: Number,
            default: 1
        },
        tocClass: {
            validator: (value) => (['toc', 'toc-child'].includes(value)),
            type: String,
            default: 'toc'
        },
        nav: {
            type: String,
            default: ''
        }
    },
    methods: {
        captureToc(target) {
            this.tocTree.forEach((node, i) => {
                node.current = false;
                node.showChild = false;

                if (target === node.bolt) {
                    // 捕获到目标，开始冒泡
                    this.bubbleToc({
                        target,
                        currentTarget: target
                    });
                } else if (node.child && node.child.length) {
                    // 继续向下捕获
                    this.$refs[`childToc-${i}`][0].captureToc(target);
                }
            });
        },
        bubbleToc({ target, currentTarget }) {
            this.tocTree.forEach((node) => {
                if (currentTarget === node.bolt) {
                    node.current = true;
                    node.showChild = (target !== currentTarget);

                    if (node.parent) {
                        // 事件冒泡
                        this.$parent.bubbleToc({
                            target,
                            currentTarget: node.parent
                        });
                    }
                }
            });
        },
        enter(el, done) {
            el.style.display = 'block';
            // 获取更新后的计算高度
            const height = el.clientHeight;
            // 初始高度为 0px
            el.style.height = '0px';

            delay(() => el.style.height = `${height}px`)
                .then(() => delay(done, 200));
        },
        leave(el, done) {
            el.style.height = `${el.clientHeight}px`;

            delay(() => el.style.height = '0px')
                .then(() => delay(done, 200));
        },
        clear(el) {
            el.style.height = '';
        }
    }
};
</script>

<style lang="stylus" scoped>
@import '../css/variable'

ol
    list-style none
ol.toc
    a
        padding 0
        display inline-block
        border-bottom 1px solid color-gray
        transition color 200ms ease-out, border-bottom 200ms ease-out
        &:hover
            color color-theme
            border-bottom 1px solid color-orange !important
    li, ol
        padding 0.1em 0
        box-sizing border-box
        transition all 200ms ease-out
    li.toc-item
        overflow hidden
        white-space nowrap
        text-overflow ellipsis
    .toc-level-2,
    .toc-level-3,
    .toc-level-4,
    .toc-level-5,
    .toc-level-6
        padding-left 1em
    .toc-child
        padding 0
        overflow hidden
    .toc-current > a
        color color-theme
        border-bottom 1px solid color-theme
</style>

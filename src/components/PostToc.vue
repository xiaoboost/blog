<template>
  <ol :class="tocClass">
    <li v-for="(node, i) in tocTree" :class="`toc-item toc-level-${level}`" :toc="node.bolt">
      <a class="toc-link" v-scrollto="{speed: 60, target: `#${node.bolt}`}">
        <span class="toc-number">{{`${number}${i+1}.`}}</span>
        <span class="toc-text">{{node.tocTitle}}</span>
      </a>
      <post-toc v-if="!!node.child" :tocTree="node.child" :nav="nav"
                :number="`${number}${i+1}.`" :level="level + 1" tocClass="toc-child">
      </post-toc>
    </li>
  </ol>
</template>

<script>
import scrollto from '@/directives/scrollto';
import { ajax, cloneArr } from '@/util';

export default {
    name: 'post-toc',
    directives: { scrollto },
    props: {
        tocTree: {
            type: Array,
            default: []
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
            validator(value) {
                return (['toc', 'toc-child'].indexOf(value) !== -1);
            },
            type: String,
            default: 'toc'
        },
        nav: {
            type: String,
            default: ''
        }
    },
    computed: {
        cacheTree() {
            return cloneArr(this.tocTree);
        }
    },
    methods: {
        positioning(e) {
            for (let i = 0; i < this.cacheTree.length; i++) {
                const node = this.cacheTree[i];
                if (!node.el) {
                    node.el = document.querySelector(`[toc="${node.bolt}"]`);
                }
                const el = node.el;
                el.classList.remove('toc-current', 'toc-child-vision');
                if (e.currentTarget === node.bolt) {
                    if (node.parent) {
                        // 事件冒泡
                        this.$parent.positioning({
                            target: e.target,
                            currentTarget: node.parent
                        });
                    }
                    el.classList.add('toc-current');
                    if (e.target !== e.currentTarget) {
                        el.classList.add('toc-child-vision');
                    }
                }
            }
        }
    },
    watch: {
        nav() {
            this.positioning({
                target: this.nav,
                currentTarget: this.nav
            });
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
      padding 0.3em 0
      border-bottom 1px solid color-gray
      transition color 200ms ease-out, border-bottom 200ms ease-out
      &:hover
        color color-theme
        border-bottom 1px solid color-orange
    li,ol
      margin 0.5em 0
      transition all 300ms ease-out
    .toc-level-2,
    .toc-level-3,
    .toc-level-4,
    .toc-level-5,
    .toc-level-6
      padding-left 1em
    .toc-child
      display none
    .toc-current > a
      color color-theme
      border-bottom 1px solid color-theme
    .toc-child-vision > .toc-child
        display block
</style>

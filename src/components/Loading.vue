<template>
<transition name="loading-fade">
    <div v-show="vision" class="loading">
        <i></i>
    </div>
</transition>
</template>

<script>
export default {
    name: 'Loading',
    props: {
        vision: {
            type: Boolean,
            default: false,
        },
    },
};
</script>

<style lang="stylus">
@import '../css/variable'

div.loading
    position fixed
    right 25px
    top 25px
    i
        display block
        font-size 24px
        margin-bottom 15px
        color color-orange
        text-shadow color-white 0 0 8px
        font-family font-icon-family
        font-style normal
        font-weight 400
        animation rotating 1s linear infinite
        &::before
            content "\f1ce"

.loading-fade-enter-active,
.loading-fade-leave-active
    transition all .3s ease
    transform scale(1)

.loading-fade-enter,
.loading-fade-leave-to
    opacity 0
    transform scale(1.2)

@keyframes rotating
    0%
        transform rotate(0deg)
    100%
        transform rotate(1turn)
</styles>

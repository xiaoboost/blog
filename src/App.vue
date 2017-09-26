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
        SiteFooter,
    },
    data() {
        return {
            loading: false,
        };
    },
};
</script>

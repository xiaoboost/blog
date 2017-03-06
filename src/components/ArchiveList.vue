<template>
  <ul id="#main" class="archives-list">
    <li v-for="post in posts">
      <router-link :to="'/post/' + post.path">
        <time>{{post.date.join("-")}}</time>
        <span>{{post.title}}</span>
      </router-link>
    </li>
  </ul>
</template>

<script>
import { ajax } from '../util';

export default {
  data() {
    return {
      posts: []
    };
  },
  computed: {
    params() {
      return this.$route.params;
    }
  },
  beforeRouteEnter(to, from, next) {
    const { archive, key } = to.params;
    const page = to.params.page
      ? 'page' + '0' : 'page0';
    ajax('/api/' + [archive, key, page].join('/'))
      .then((posts) => next((vm) => vm.posts = posts));
  },
  watch: {
    $route() {
      this.params.page = this.params.page || '0';
      const { archive, key, page } = this.params;
      ajax('/api/' + [archive, key, page].join('/'))
        .then((posts) => this.posts = posts);
    }
  }
};
</script>

<style lang="stylus">

</style>

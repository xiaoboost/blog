<template>
  <aside>
    <p>{{$t(archive)}}</P>
    <ul>
      <li v-for="item in collection">
        <router-link :to="'/' + archive + '/' + item.key">
          {{item.key}}<sup>{{item.total}}</sup>
        </router-link>
      </li>
    </ul>
  </aside>
</template>

<script>
import { ajax } from '../util';

export default {
  data() {
    return {
      collection: []
    };
  },
  computed: {
    archive() {
      return this.$route.params.archive;
    }
  },
  beforeRouteEnter(to, from, next) {
    const archive = to.params.archive;
    ajax('/api/' + archive + '/aside')
      .then((collection) => next((vm) => vm.collection = collection));
  },
  watch: {
    $route() {
      ajax('/api/' + this.archive + '/aside')
        .then((collection) => this.collection = collection);
    }
  }
};
</script>

<style lang="stylus">

</style>

<template>
  <ul class="post-list" id="main">
  </ul>
</template>

<script>
export default {
  data() {
    return {
      post: []
    };
  },
  beforeRouteEnter(to, from, next) {
    next();
  },
};
</script>

<style lang="stylus">

</style>

import Vue from 'vue';
const body = document.body;

export default {
  bind(el, binding, vnode) {
    // 非法参数，直接返回
    if (!binding.expression) return (false);
    // 指令输入的参数
    const {bias, callback} = binding.value;
    // 绑定scroll事件回调
    el.__vueFollowScroll__ = () => callback(body.scrollTop > bias);
    document.addEventListener('scroll', el.__vueFollowScroll__);
  },
  unbind(el) {
    document.removeEventListener('scroll', el.__vueFollowScroll__);
    delete el.__vueFollowScroll__;
  }
};

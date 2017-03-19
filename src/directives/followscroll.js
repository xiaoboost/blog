/*
 * 指定DOM是否超过界线
 * @param
 *   bias 界线，即距离网页顶端的距离
 *   callback 回调函数，当“是否超过界线”的状态改变时触发
 */
const body = document.body;

export default {
    bind(el, binding, vnode) {
        // 非法参数，直接返回
        if (!binding.expression) return (false);
        // 指令输入的参数
        const { bias, callback } = binding.value;
        // 保存当前状态，默认为false
        let status = false;
        // 绑定scroll事件回调
        el.__vueFollowScroll__ = function() {
            // 只有当状态发生改变时才会触发回调
            if ((body.scrollTop > bias) !== status) {
                status = (body.scrollTop > bias);
                callback(status);
            }
        };
        document.addEventListener('scroll', el.__vueFollowScroll__);
        // 绑定之后马上运行一次事件
        el.__vueFollowScroll__();
    },
    unbind(el) {
        document.removeEventListener('scroll', el.__vueFollowScroll__);
        delete el.__vueFollowScroll__;
    }
};

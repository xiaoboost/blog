/*
 * 指定DOM是否超过界线
 * @param
 *   bias 界线，即距离网页顶端的距离
 *   callback 回调函数，当“是否超过界线”的状态改变时触发
 */

// 全局回调函数缓存
const cache = new Map();

export default {
    bind(el, binding) {
        // 非法参数，直接返回
        if (!binding.expression) return (false);
        // 指令输入的参数
        const { bias, callback } = binding.value;
        // 保存当前状态，默认为false
        let status = false;
        // 绑定scroll事件回调
        function followScroll() {
            // 只有当状态发生改变时才会触发回调
            const offsetTop = document.documentElement.scrollTop;
            if ((offsetTop > bias) !== status) {
                status = (offsetTop > bias);
                callback(status);
            }
        }
        document.addEventListener('scroll', followScroll);
        cache.set(el, followScroll);
        // 绑定之后马上运行一次事件
        followScroll();
    },
    unbind(el) {
        if (!cache.has(el)) { return; }

        el.removeEventListener('click', cache.get(el));
        cache.delete(el);
    },
};

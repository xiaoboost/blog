/*
 * 点击绑定指令的元素之后滚动到指定位置
 * @param
 *   speed 滚动速度，范围为 1 ~ 100，
 *   target 目标位置，可以是距离顶端距离或选择器
 *          选择器只会匹配第一个元素，如果元素不存在，那么放弃滚动
 */
const body = document.body;

export default {
    bind(el, binding, vnode) {
        // 非法参数，直接返回
        if (!binding.expression) return (false);
        // 指令输入的参数
        let { speed, target } = binding.value;
        // 数据处理
        if (speed > 99) {
            speed = 99;
        } else if (speed < 1) {
            speed = 1;
        }
        speed = 100 - speed;
        target = target ? target : -1;
        // 事件回调
        el.__vueScrollTo__ = function() {
            if (!target) {
                // 目标不存在，跳出回调
                return (false);
            } else if (typeof target === 'string') {
                // 如果是选择器，那么缓存目标DOM
                target = document.querySelector(target);
            }

            // 求目标距离顶端的距离
            const targetOffset = (typeof target === 'number')
                    ? target
                    : target.offsetTop,
                offset = (body.scrollTop - targetOffset) / speed,
                // 当前页面总高度
                pageHeight = body.scrollHeight;

            // 每隔10ms滚动页面
            const timer = setInterval(() => {
                // 滚动屏幕
                body.scrollTop -= offset;
                // 当前屏幕底部
                const scrollBottom = body.clientHeight + body.scrollTop;
                // 超过目标，则取消定时器
                if ((offset > 0 && body.scrollTop <= targetOffset + 1) ||
                    ((offset < 0 && body.scrollTop >= targetOffset - 1)) ||
                    (pageHeight - scrollBottom <= 1)) {
                    clearInterval(timer);
                    body.scrollTop = targetOffset;
                }
            }, 10);
        };
        el.addEventListener('click', el.__vueScrollTo__);
    },
    unbind(el) {
        el.removeEventListener('click', el.__vueScrollTo__);
        delete el.__vueScrollTo__;
    }
};

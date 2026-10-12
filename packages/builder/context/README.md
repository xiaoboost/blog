# @blog/context

博客上下文变量

`@blog/context/runtime` 的 `useRenderOnce(run)` 在首次渲染时同步执行回调并返回结果，同一 Hook 实例的后续渲染复用结果，包括返回 `undefined` 的情况。用于当前同步、不挂起的 SSR 构建登记；预渲染和正式渲染各自执行一次，不自动判断 `isPreBuild`。回调不能调用 Hook，不支持 Effect 的清理机制，也不保证重新挂载、挂起或渲染重试后不再次执行。

```tsx
useRenderOnce(() => store.addAction(props));
const index = useRenderOnce(() => store.beginSection());
```

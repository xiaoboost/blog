# @blog/mdx-chart

提供一个 SVG 画布 `Chart`，原样导出 `@visx/shape`、`@visx/axis`、`@visx/scale`、`@visx/group`、`@visx/grid`、`@visx/curve` 的 API 和类型。

```tsx
import { Chart, LinePath } from '@blog/mdx-chart';

const points = [{ x: 20, y: 150 }, { x: 150, y: 40 }, { x: 280, y: 100 }];

export function Example() {
  return (
    <Chart width={300} height={200} role="img" aria-label="折线图">
      <LinePath
        data={points}
        x={d => d.x}
        y={d => d.y}
        stroke="currentColor"
        strokeWidth={2}
        fill="none"
      />
    </Chart>
  );
}
```

`width`、`height` 是绘图尺寸，并生成默认 `viewBox`。默认样式为 `maxWidth: '100%'`、`height: 'auto'`，在窄容器中等比例缩小。可覆盖 `viewBox` 和 `style`，其余 SVG 属性原样传入。数据、比例尺、布局、样式和图层顺序均由使用者控制；渐变、裁剪等 SVG ID 由使用者保证在同一页面内唯一。

在 MDX 中直接使用图表组件，博客现有的 React 服务端渲染会把完整 SVG 写入 HTML。本包没有客户端脚本入口。独立导出图片时，可在构建端用 `renderToStaticMarkup(<Example />)` 得到 SVG 字符串并保存为 `.svg` 文件。

这里支持同步生成 SVG 的 visx 用法。浏览器事件不会随静态 SVG 保留；依赖容器测量、挂载后数据注册或文字测宽的功能（例如 `ParentSize`、`XYChart` 的部分组件、文本自动缩放）不能仅通过这个画布获得完整静态输出。

完整折线图样例在 `packages/posts/dev/charts`，开发模式页面路径为 `/__dev/charts/`。

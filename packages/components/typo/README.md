# @blog/mdx-typo

排版相关组件合集，用于 MDX 文章中增强文本表现力。

## 组件

### Subtitle（副标题）

独立成行的块级元素，用于标题下方的出处、说明等辅助信息。前置一条 CSS 绘制的细线作为视觉引导。默认使用正文字体、辅助色、14px 字号，视觉层级介于标题与正文之间。

```tsx
import { Subtitle } from '@blog/mdx-typo';

<Subtitle>出自《xxx》第 x 章</Subtitle>
```

**Props**

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `children` | `React.ReactNode` | — | 副标题内容 |
| `showDash` | `boolean` | `true` | 是否显示前置装饰线 |

### TextGloss（文字夹注）

行内文本标注，点击主体文本后展开详细说明。常用于为文章中的术语、人名等提供补充信息。

```tsx
import { TextGloss } from '@blog/mdx-typo';

<TextGloss description="补充说明">被标注的文本</TextGloss>
```

**Props**

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `children` | `React.ReactNode` | — | 主体文本 |
| `description` | `React.ReactNode` | — | 点击后展开的详细文本 |
| `className` | `string` | — | 自定义类名 |
| `styles` | `React.CSSProperties` | — | 自定义行内样式 |
| `showSeparator` | `boolean` | `true` | 右侧是否显示分割短线 |

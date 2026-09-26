# @blog/mdx-typo

排版相关组件合集，用于 MDX 文章中增强文本表现力。

## 组件

### AuthorNote（旁注）

用于作者暂时离开正文话题时的简短补充、联想或设想。采用 14px 淡色文字，左右收窄，左上和右下各有一条开放角线；不显示标题或背景色，自动适配深浅色主题。

```mdx
import { AuthorNote } from '@blog/mdx-typo';

<AuthorNote>
  说到这里，我倒有个演出上的设想……
</AuthorNote>
```

`children` 接收 MDX 段落、强调和链接等内容。段落不使用首行缩进，多段之间保留小段距。作品原文引用继续使用引用块，正文的主要论述也无需放进旁注。

### DefinitionList / Definition（名称与说明列表）

适用于术语约定、概念解释和人物介绍。默认采用紧凑排版：名称在左、解释在右，以细横线分隔。空间不足时解释自动换行到名称下方；手机上始终上下排列。颜色沿用主题 token，自动适配深浅色。

在 MDX 中直接写解释文本，用空行分隔段落；正文可以随 JSX 层级正常缩进，无需顶格书写。强调、链接、行内代码等由 MDX 编译，无需手写 `<p>`，组件也不需要对文本逐行 `trim()`。

```mdx
import { DefinitionList, Definition } from '@blog/mdx-typo';

## 术语约定

<DefinitionList>
  <Definition term="插件">
    声明自己需要什么、提供什么，以及怎样加载。
  </Definition>
  <Definition term="副作用" alias="Side effect">
    对共享环境的修改，例如注册监听、提供服务。
  </Definition>
  <Definition term="撤销函数" alias="Disposer">
    由执行操作的代码交出，用于撤回对应的修改。

    例如：调用 `unsubscribe()` 移除监听，释放**不再需要的资源**。
  </Definition>
</DefinitionList>
```

章节标题写在组件外，由文章原有的标题与目录系统处理。

**DefinitionList Props**

| 参数 | 类型 | 说明 |
|---|---|---|
| `children` | `React.ReactNode` | 必填，使用 `Definition` 组成的条目 |

**Definition Props**

| 参数 | 类型 | 说明 |
|---|---|---|
| `term` | `React.ReactNode` | 必填，名称；支持文本或行内元素 |
| `alias` | `string` | 可选，英文名或别名 |
| `children` | `React.ReactNode` | 必填，解释内容；支持 MDX 段落、链接、行内代码等 |

组件只负责布局和样式，不重新解析字符串。解释段落不使用正文的首行缩进，多段解释之间保留小段距。

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

主体使用可聚焦的行内元素，长句可以与前后正文连续折行；支持点击、Enter 和空格切换。收起的说明不占空间，展开的说明也可自然换行，不限制为单行或固定宽度。主体和说明应使用文本或行内元素。

底线在悬停或键盘聚焦时渐变为实线；说明按文字实际宽度从左到右展开，后面的正文随之移动，长说明继续自然折行。收起时反向缩回，结束后不留占位。系统启用减少动态效果时直接切换。

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

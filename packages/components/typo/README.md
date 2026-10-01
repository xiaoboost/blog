# @blog/mdx-typo

排版相关组件合集，用于 MDX 文章中增强文本表现力。

## 组件

### ArticleIntro / BookInfo（文章导读与作品介绍）

`ArticleIntro` 放在正文开始之前。默认显示“开始之前”和一段导读；传入 `aside` 后采用左右分栏，手机上改为上下排列。沿用正文卡片的留白、文字色和细分隔线，不增加外框。

技术文章直接书写 Markdown：

```mdx
import { ArticleIntro } from '@blog/mdx-typo';

<ArticleIntro>
  插件可以动态装卸之后，系统怎样在变化中保持正确？
  关键在于**依赖与生命周期**怎样配合，以及这些约定成立的条件。
</ArticleIntro>
```

也可以复用文章顶部 frontmatter 中的 `description`，只维护一份文本。MDX 正文通过 `props.post` 读取当前文章数据，不需要导入或定义 `props`：

```mdx
---
title: 万物皆插件，然后呢？
create: 2026/09/14
description: 插件可以动态装卸之后，系统怎样在变化中保持正确？关键在于依赖与生命周期怎样配合，以及这些约定成立的条件。
---

import { ArticleIntro } from '@blog/mdx-typo';

<ArticleIntro>
  {props.post.description}
</ArticleIntro>
```

`props.post` 是当前文章的数据，也包含 `title`、`tags` 等字段。复用时请显式填写 frontmatter 的 `description`；它会同时用于导读、文章列表和页面元信息。插入的 description 按纯文本显示，字符串中的 Markdown 不会再次解析；需要段落、强调或链接时，可以继续在 `ArticleIntro` 内独立书写 MDX。两种写法由文章自行选择，组件不自动绑定 description。

读后感可搭配 `BookInfo`，同样可以引用 description。其他内容也可以通过 `aside` 传入自己的 React 组件：

```mdx
import { ArticleIntro, BookInfo } from '@blog/mdx-typo';

<ArticleIntro
  label="总体评价"
  aside={
    <BookInfo
      title="道祖是克苏鲁"
      meta={['已完结']}
      author={{
        name: '板斧战士',
        href: 'https://my.qidian.com/author/429979121/',
      }}
      link={{
        context: '阅读原文',
        href: 'https://www.qidian.com/book/1028489518/',
      }}
    />
  }
>
  {props.post.description}
</ArticleIntro>
```

**ArticleIntro Props**

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `label` | `string` | `开始之前` | 导读小标题，空字符串隐藏 |
| `aside` | `React.ReactNode` | — | 可选左栏；省略时导读通栏 |
| `children` | `React.ReactNode` | — | 必填，导读正文，支持 MDX 段落、强调和链接 |

**BookInfo Props**

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `label` | `string` | `这次读的是` | 介绍小标题，空字符串隐藏 |
| `title` | `string` | — | 必填，静态作品名，不自动添加书名号 |
| `subtitle` | `string` | — | 可选的正式副标题，紧随作品名；空白字符串不显示，长文本自然换行 |
| `meta` | `string[]` | — | 紧随作品名的简短资料，多项用中点分隔；空项忽略 |
| `author` | `{ name: string; href?: string; role?: string }` | — | 作者对象；仅名称可链接，`role` 默认“著”，空字符串省略中点与后缀 |
| `details` | `React.ReactNode` | — | 可选的补充说明，通常省略 |
| `link` | `{ context: string; href: string }` | — | 底部作品入口；`context` 是显示文案，统一附右上箭头 |

展示顺序为小标题、作品名与副标题、资料、作者、补充说明、作品入口，相邻组间距统一为 8px。作品名与副标题组成一组，内部间距为 4px。资料建议保持一行，例如 `meta={['已完结']}`；游戏可使用 `label="这次玩的是"`、`author={{ name: '制作方', role: '开发' }}` 和 `meta={['PC']}`。组件不默认生成状态、评分或阅读进度。

作品名使用 24px 衬线字体并保持静态。副标题使用 16px 正文字体和主文字色，与 13px 的作者及其他资料区分，例如 `title="春秋大义" subtitle="中国传统语境下的皇权与学术"`，长副标题完整显示，不截断。作者链接和底部入口沿用站内普通链接的颜色及悬停变色，不添加下划线；保留键盘聚焦轮廓，减少动态效果模式下直接切换。右上箭头复用 `@blog/icons` 的 `ArrowUpRight`。`subtitle`、`meta`、作者名称、角色词和入口文案是纯文本；`details` 可以传 JSX，但字符串中的 Markdown 不会再次解析。

标题字体通过 `@blog/styles` 的只读对象 `PrimaryTitleFont`、`SecondaryTitleFont` 共享，每个对象包含 `fontFamily` 与 `fontWeight`，具体字体资源由模板注册。书名使用 `SecondaryTitleFont`，通过 `@blog/context/runtime` 的通用 `useFontText(SecondaryTitleFont.fontFamily, title)` 在预渲染阶段收集文字，复用文章的字体子集；组件无需解析 MDX 源码或单独生成字体文件。其他组件可用同一接口收集已由模板注册的页面字体文字。

### Comment（旁注）

用于作者暂时离开正文话题时的简短补充、联想或设想。采用 14px 淡色文字，左右收窄，左上和右下各有一条开放角线；不显示标题或背景色，自动适配深浅色主题。

```mdx
import { Comment } from '@blog/mdx-typo';

<Comment>
  说到这里，我倒有个演出上的设想……
</Comment>
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

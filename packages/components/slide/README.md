# @blog/mdx-slide

博客 PPT 的布局、动画声明与预构建数据收集组件。动画编排在构建时解析；当前尚未接入播放执行。

## 页面公共留白

`PageLayout` 放在 `Section` 内，提供上下 60px、左右 100px 的公共留白，宽高为 100%。它不规定内部的排列、间距或对齐，也不负责页码和切页。

```tsx
<Section title="页面标题">
  <PageLayout>
    <Flex direction="column" height="100%" gap={0}>
      {/* 当前页面的内容 */}
    </Flex>
  </PageLayout>
</Section>
```

需要不同留白时可以写 `padding={0}`、`padding="80px 120px"` 或 `padding={{ horizontal: 120 }}`；只指定一个方向时，另一方向保留默认留白。也支持 `className`、`style`、`id`、`data-*` 和 `aria-*`，`style` 最后覆盖。

## 标题前的短标签

`Eyebrow` 用于大标题上方的章节名或提示文字，输出普通段落，不占用标题层级。
默认使用正文黑体、24px 字号、`.12em` 字距和次级文字颜色，下方间距为 16px，默认间距统一定义在 CSS 中。

```tsx
import { Eyebrow } from '@blog/mdx-slide';

<Eyebrow>先看规模</Eyebrow>
<h2>六个专楼的一年</h2>

// 封面需要更宽的间距；0 表示不留间距。
<Eyebrow marginBottom={36}>Stage1st 二游观察</Eyebrow>
```

支持 `className`、`style`、`id`、`data-*` 和 `aria-*`；`style` 可以覆盖默认间距。
字体和颜色样式随 Slide 公共资源加载，无需在每篇文章的 JSS 中重复声明。

## 编排规则

```text
Slide
  Section
    Player
      Step                       进场触发
        Animate / 效果组件        默认同时开始
        Sequence / Parallel
        Wait
      Step                       下一次点击或键盘前进触发
        ...
```

| 组件 | 含义 | 完成时间 |
| --- | --- | --- |
| `Player` | 按声明顺序保存本页的触发步骤 | 不把多个 Step 拼成自动连续时间轴 |
| `Step` | 一次触发内的编排，直接子项默认并行 | 所有子项最晚的结束时间 |
| `Sequence` | 子项依次执行 | 所有子项占用时间之和 |
| `Parallel` | 子项默认同时开始，允许子分组用 `at` 指定位置 | 所有子项最晚的结束时间 |
| `Animate` / 效果组件 | 描述目标、样式和动作时间 | 动作 delay + duration |
| `Wait` | 只占用指定时长，不产生动作 | 自己的 duration |

`Sequence`、`Parallel` 可以任意嵌套，也可以包含动作和 `Wait`。`Step` 必须直接属于 `Player`，不能嵌入编排分组。这里的“直接”指编排关系：Fragment、Provider、普通自定义组件和循环不会额外形成编排层级。

首个 `Step` 对应进场，后续 `Step` 对应用户前进，不需要 `trigger="enter"`。这是数据的触发约定，实际点击和播放行为留给后续播放器。每个 Step 都有独立的时间原点。

允许空的 `Step`，保留它的触发位置。开头的 `<Step />` 表示进场时先保持静态，第一次前进才进入下一步。空的 `Sequence` / `Parallel` 时长是 0；空 `Player` 则是声明错误。

## 重叠开始，后面继续顺序播放

```tsx
import {
  Player, Step, Sequence, FadeIn, MoveIn, Pulse,
} from '@blog/mdx-slide';

<Player>
  <Step>
    <Sequence id="a">
      <FadeIn target="image-a" transition={{ duration: 800 }} />
    </Sequence>

    <Sequence at={{ ref: 'a', edge: 'end', offset: -150 }}>
      <FadeIn target="image-b" transition={{ duration: 300 }} />
      <MoveIn target="caption" transition={{ duration: 400 }} />
      <Pulse target="conclusion" transition={{ duration: 200 }} />
    </Sequence>
  </Step>

  <Step>
    {/* 用户下一次前进时，从这个 Step 的 0 开始 */}
    <FadeIn target="next" />
  </Step>
</Player>
```

第一步的结果：

| 目标 | 开始时间 | 结束时间 |
| --- | ---: | ---: |
| image-a | 0ms | 800ms |
| image-b | 650ms | 950ms |
| caption | 950ms | 1350ms |
| conclusion | 1350ms | 1550ms |

整个 Step 持续 1550ms。后面三个动作由一个 `Sequence` 管理，所以只需给这一串的起点写一次 `at`。

## at 的范围

```ts
type Position = number | {
  ref: string;
  edge: 'start' | 'end';
  offset?: number;
};
```

- 只有 `Sequence` / `Parallel` 接受 `at`；它们的直接编排父容器必须是 `Step` 或 `Parallel`。
- `at={200}` 表示相对直接父容器的起点，延后 200ms 开始整个分组。
- 引用只查找同一个父容器里**先声明的分组**。`id` 是编排分组名，与动作的 `target`、DOM id 无关。
- `edge: 'start'` 指分组实际起点；`edge: 'end'` 指整个分组实际终点，包含嵌套分组、动作 delay 和末尾 Wait。
- `offset` 默认 0，可以为负数，但算出的起点不能早于父容器的 0。不会自动截断到 0。
- 未写 `at` 的并行子项始终从父容器的 0 开始，不跟随上一个子项的位置。
- `Sequence` 的直接子项禁止写 `at`。要错开多个起点，在 `Step` 或 `Parallel` 内组织多个分组。
- 所有分组都计入父容器时长，包括写了 `at` 的分组、纯等待分组和空分组。
- 分组 id 仅在同一父容器中唯一；不同分组、Step、Section 中可重用。前向、自身、跨层、跨 Step 引用都会报错，因此不会形成引用循环。

例如外层从 Step 的 500ms 开始，内层的 `at={200}` 对应 Step 的 700ms：

```tsx
<Step>
  <Parallel at={500}>
    <Sequence at={200}>
      <FadeIn target="a" />
      <FadeIn target="b" />
    </Sequence>
  </Parallel>
</Step>
```

## 默认时间、delay 和 Wait

所有时间都用毫秒数字，允许 0 和小数，禁止负时长、NaN、Infinity。默认 `duration: 300`、`delay: 0`、`easing: 'ease-out'`。

`transition` 按字段逐层继承：动作 → 最近分组 → 外层分组 → Step → Player → 默认值。`undefined` 表示继承，`0` 明确覆盖。分组的 `transition.duration` 是后代动作的默认时长，不是分组总时长。

现有 `transition.delay` 保留为**每个动作开始前的等待**。分组上的 `transition.delay` 同样是动作默认值，会作用到各个后代动作，并不等于整组只等一次。整组延后开始用 `at`；顺序编排中的停顿用 `Wait`：

```tsx
<Step>
  <Sequence at={200}>
    <FadeIn target="a" transition={{ duration: 300, delay: 50 }} />
    <Wait duration={100} />
    <FadeIn target="b" transition={{ duration: 400 }} />
  </Sequence>
</Step>
```

这个例子中：A 在 250ms 开始、550ms 结束；等 100ms；B 在 650ms 开始、1050ms 结束。`Wait` 不继承 transition。放在 `Parallel` 或 `Step` 下的 Wait 与兄弟并行，只可能延长总时长，不会推迟其他兄弟。

## 收集与输出数据

继续使用 Slide 内部的一个收集器，分两步处理：

1. 预构建 SSR 按真实渲染顺序登记节点。进入 Step / Sequence / Parallel 时入栈，私有 `ScopeEnd` 在子树之后出栈，得到按声明顺序保存的编排树。作者的 Hook、自定义组件、条件渲染和循环照常工作，无需遍历或猜测 React children。
2. Slide 完成时逐 Step 解析树：继承默认值，计算局部起止点，验证引用，再换算成相对 Step 的动作开始时间。任何错误都会阻止发布整份配置。

这个收集过程用于同步、无 Suspense 的预构建 SSR；不支持在动画声明子树中使用 Suspense 或异步渲染。正式渲染跳过 Player 子树，不再次收集，也不会把编排组件输出成 DOM。

输出仍然是 `SlideConfig.sections[].steps[]`，每个 Step 现在带总时长，每个动作带明确起点：

```ts
interface StepConfig {
  duration: number;
  actions: ActionConfig[];
}

interface ActionConfig {
  target: string;
  start: number;
  keyframes: readonly AnimationState[];
  transition: { duration: number; easing: string };
  before?: AnimationState;
  after?: AnimationState;
}
```

`start` 已包含所有父级偏移和动作 delay，输出的 transition **不再含 delay**。后续消费配置只需以 Step 的触发时刻为原点，在 `start` 处启动动作；`before` 对应动作实际开始前，`after` 对应动作结束后。

动作按声明顺序保存，不按开始时间重排。运行端必须读取每个动作的 `start`；数组相邻不表示依次执行。声明顺序可用来保持同时发生的事件顺序稳定，但这里不定义同目标、同属性重叠时的覆盖规则。

分组、引用、Wait 不写入最终 JSON，它们的时间已经折算进 `start` 和 Step 的 `duration`。即使没有动作，末尾等待和空步骤也能保留。步骤之间不合并成整页时间轴，因为下一次用户触发的时间在构建时未知。

目前的校验负责编排结构、分组引用和时间数值；不解析 HTML 绑定 target，不分析 CSS 是否可插值，也不处理重叠样式冲突。播放器推进、回退、打断和样式恢复不在本轮范围。

## 验证

```sh
pnpm --filter @blog/mdx-slide test
pnpm --filter @blog/mdx-slide type-check
pnpm --filter @blog/mdx-slide lint
```

测试覆盖串并行嵌套、局部时间、重叠引用、默认值恢复、空步骤和等待、SSR 封装与重渲染、数据复制、异常后重新收集、非法数值与溢出，以及构建插件写出的完整 JSON。`animation.types.tsx` 额外通过 TypeScript 检查公开 API 的约束。

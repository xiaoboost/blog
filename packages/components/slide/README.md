# @blog/mdx-slide

博客 PPT 的构建期组件。当前实现 Slide、Section、六个布局组件，以及 Player / Step / Animate 和常用效果的配置收集。没有接入生成器主流程、资源上报、全局配置或浏览器播放，也没有实现网页卡片和播放器控件。

本次按要求只编写代码和测试，未执行安装、构建、类型检查、lint 或测试。API 背景见 [组件设计文档](../../../docs/slides-components.md)。

## 作者用法

入口 index.mdx 组合页面，逻辑画布固定为 2560 × 1440，Slide 不提供宽高参数。Section.id 可选，内部按渲染顺序从 0 编号，展示页码从 1 开始。

```mdx
import { Slide, Section } from '@blog/mdx-slide';
import Cover from './pages/01-cover';
import Overview from './pages/02-overview';

<Slide>
  <Section title="开场"><Cover /></Section>
  <Section title="整体结构"><Overview /></Section>
</Slide>
```

页面 TSX 用 Box、Center、Flex、Grid、Place、Background 排版。Box 的 margin / padding 接受统一值或 `{ horizontal, vertical }`；radius 表示圆角；border 对象提供 thickness、color、pattern；shadow 表示阴影。style 最后覆盖组件的默认值和 props。

```tsx
import { Box, Flex, Player, Step, FadeIn, FadeOut } from '@blog/mdx-slide';

const targets = { diagram: 'overview-diagram' } as const;

export default function Overview() {
  return (
    <>
      <Flex width="100%" height="100%" padding={80}>
        <Box flex="fixed" width={480}><h1>整体结构</h1></Box>
        <Box flex="fill" radius={24} border={{ thickness: 2 }}>
          <div id={targets.diagram} style={{ opacity: 0, visibility: 'hidden' }}>关系图</div>
        </Box>
      </Flex>
      <Player transition={{ duration: 400 }}>
        <Step><FadeIn target={targets.diagram} /></Step>
        <Step><FadeOut target={targets.diagram} /></Step>
      </Player>
    </>
  );
}
```

Box.flex：content 按内容占位并允许收缩；fill 分配剩余空间；fixed 不参与伸缩；正整数按份数分配。Place 默认 x / y 均为 0，用 width / height 为 100% 表达整层。Grid 的整数列 / 行使用 `minmax(0, 1fr)` 等分；CSS 轨道字符串可描述不同比例。

公共样式入口为 `@blog/mdx-slide/script`，未来由 slides 模板合入。Slide 直接使用博客公共 token：TextPrimary 设置文字，BgSecondary 设置卡片背景，Box 的默认边框使用 BorderPrimary。配色跟随整站，不提供独立主题参数或额外的 slide 颜色变量。外部缩放、字体和整体播放器 UI 仍由模板负责。

`src/layout/index.jss.ts` 只保留组件的固定基础样式：box-sizing、Flex / Grid 的 display、整页铺满、绝对定位、背景图片和遮罩的结构等。方向、对齐、伸缩模式、边框、overflow、图片适配及尺寸等由 props 决定的值继续写入行内 style，不为每个选项建立 class。所有值在 SSR 构建时确定；布局不额外生成 data-* 标记，也不新增 CSS 变量传参。作者的 style 最后合并，仍能覆盖组件规则。布局 JSS 与 Slide JSS 均由公共样式入口导入。

每个组件在 JSX 中使用 `@xiao-ai/utils` 的 `stringifyClass` 合并 class，并按组件样式 → Box 属性转换结果 → 作者 style 的顺序合并行内样式。`layout/style.ts` 的 `extractBoxProps` 只分离 DOM 属性并转换 Box 样式属性，不负责最终 class 或 style 合成。

页面自己的 JSS 同样直接引用公共 token，写法与现有排版组件一致：

```ts
import { createStyles, TextSecondary, AccentPrimary } from '@blog/styles/compile';

export default createStyles({
  caption: { color: TextSecondary },
  emphasis: { color: AccentPrimary },
});
```

## 预渲染收集接口

Slide 调用 useSlideProvider Hook 创建本份 PPT 的页面数组、范围栈和登记函数，只提供一个 SlideContext.Provider。没有 Collector 类。Section、Player、Step、Animate 共用这份状态；作者无需额外添加 Provider。Slide 组件自身只负责容器和样式。

构建端使用已有 page 驱动一次同步预渲染，沿用博客 RenderContext 中的 page 和 isPreBuild，不再额外包一层桥接 Provider：

```tsx
import { collectSlide } from '@blog/mdx-slide/collect';

const { html, config } = collectSlide(page, () => page.render({
  page,
  site,
  dev,
  isPreBuild: true,
}));
// 主流程接通后，再由生成器汇总、生成配置资源并登记引用。
```

每轮 SSR 都由 Slide 创建独立的页面数组和栈。beginSection / beginPlayer / beginStep 将对应配置压栈，addAction 把动作加入栈顶 Step，end 将范围出栈，getConfig 把已登记的数据转换为发布配置。transition 在登记时按层级合并。同页第二个 Player、嵌套范围或范围外动作报错。

Section / Player / Step 将私有 ScopeEnd 放在 children 后面，分别写作 `<ScopeEnd scope="section" />`、`<ScopeEnd scope="player" />`、`<ScopeEnd scope="step" />`。ScopeEnd 内部读取 Context 并调用 end(scope)，不再传入回调。React 正常展开 Fragment、数组、条件分支和带 Hook 的本地封装，再关闭对应范围。ScopeEnd 和叶子动作都返回 null，不产生 HTML。这里的结束是同步 SSR 中后续组件的执行，不是 effect 或浏览器生命周期。正式渲染使用 isPreBuild: false，Player 返回 null，不再展开或收集动画子树，也不自行输出 script 标签。

Slide 函数返回时，后代还未渲染完，不能立即取得最终配置。collectSlide 按 page 临时接收 Slide 的登记函数，等完整 HTML 返回后调用 getConfig；成功或失败都在 finally 中清除该页的登记。同一页不能重入收集，不同页的入口互不影响。HTML 直接返回，不传入配置转换函数，也不使用 parse5。当前只收集组件上报的数据，不扫描 DOM 目标、重复 id、跨页绑定或页面结构，也不额外分析动作的样式冲突。目标 id 的组织仍由作者负责，播放阶段的绑定另行接入。内部 Context 不是公开集成接口；不调用 page.addAsset / addScript，也不生成文件或挂浏览器全局。

render 回调必须同步返回完整 HTML，并通过现有 RenderContext 提供同一个 page 与 isPreBuild: true。此接口尚未接入生成器；流式渲染、异步组件和 Suspense 挂起不在当前收集范围内。

配置中的每个 Section 包含自己的 steps；无 Player 时 steps 为空。时间按字段合并：动作 > Step > Player > 默认值（300ms、0ms、ease-out），undefined 继承，0 覆盖。from 可省略。before / after 是效果封装生成的内部离散状态：FadeIn 在开始前恢复可见，FadeOut 在结束后隐藏；这些字段不是新增作者 props。

以下情况抛出异常，由未来主流程转换为构建失败：

- Section 没有 Slide、嵌套 Slide / Section、整篇存在多个 Slide。
- Player 没有 Section、同页多个 Player、嵌套 Player。
- Step 没有 Player、嵌套 Step、动作没有 Step、空 Player / Step。
- target 字符串无效。
- 非法数值、空终点、未知状态 / transition 字段；这些由声明组件检查，不属于栈的职责。

CSS 字符串当前检查类型及非空；不模拟浏览器的 CSS 解析。浏览器合法性、动画执行、回退、跨页恢复、打印和无脚本展示留到播放流程接入时处理。MoveIn / ScaleIn 当前已提供配置封装，但不会自动组合目标已有的 transform。

## 单元测试

测试分成三个层次，避免只对照组件代码做大块 HTML 快照：

1. 纯数据规则：字段继承、0 / undefined、非法参数、输入不可变。
2. 小规模真实 SSR：Provider 内的独立配置和栈、完整渲染后转换、只执行一轮渲染、按页隔离与失败清理，以及封装与 Hook 的展开、动作顺序、结束标记出栈、范围外动作报错、重复 Player、正式渲染不重复收集。
3. 少量布局约定：style 覆盖顺序、属性不泄漏、Place 不占 transform、装饰背景、非法份数。

测试文件在 `src/__tests__/`，本次未运行。安装工作区依赖并接好环境后可执行 `pnpm --filter @blog/mdx-slide test`。资源输出、脚本执行顺序和真实浏览器翻页动画，等主流程接通后再加对应的集成测试。

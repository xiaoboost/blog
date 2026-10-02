# @blog/posts

博客文章

## 代码块的类型提示

普通代码块默认只做语法高亮，不启用 LSP（类型提示与错误诊断）。整篇文章需要 LSP 时，在开头的 frontmatter 加上：

```yaml
lsp: true
```

单个代码块可以用语言后面的参数覆盖文章设置：`ts?lsp=true` 开启，`ts?lsp=false` 关闭。优先级为「代码块参数 → 文章 frontmatter → 默认关闭」，显式的 `false` 不会被文章设置覆盖。

此开关适用于 `ts` / `typescript`、`tsx`、`js` / `javascript`、`jsx`，其他语言仍使用普通语法高亮。`platform=browser`、`platform=node` 等参数用 `&` 连接，例如 `ts?lsp=true&platform=browser`。

`showError=false` 只隐藏错误诊断，保留类型提示。提供跨代码块模块的 `visible=false&exportAs=...` 隐藏定义也需要启用 LSP；直接使用 `<TsCodeBlock>` 组件视为显式启用。

## 内部排版样张

在仓库根目录运行 `pnpm run watch`，打开 <http://localhost:5173/__dev/typography/>。
首次运行前先执行 `pnpm run build:prepare`。

样张源码在 `dev/typography/index.mdx`，直接使用正式文章的模板、主题与 MDX 组件。
包含正文与强调、标题层级、引用与旁注、术语与夹注、列表与表格、代码与公式、图片与字体，以及嵌套组合。
可通过页首索引定位示例，用网站右上角的主题按钮检查深浅色，缩窄窗口检查移动端布局。

`package.json` 的 `devMain` 指定开发样张的文件范围；生产模式不会加载这些文件。
样张设为 `public: false`，不会出现在首页、标签或归档中。

# @blog/posts

博客文章

## 内部排版样张

在仓库根目录运行 `pnpm run watch`，打开 <http://localhost:5678/__dev/typography/>。
首次运行前先执行 `pnpm run build:prepare`。

样张源码在 `dev/typography/index.mdx`，直接使用正式文章的模板、主题与 MDX 组件。
包含正文与强调、标题层级、引用与旁注、术语与夹注、列表与表格、代码与公式、图片与字体，以及嵌套组合。
可通过页首索引定位示例，用网站右上角的主题按钮检查深浅色，缩窄窗口检查移动端布局。

`package.json` 的 `devMain` 指定开发样张的文件范围；生产模式不会加载这些文件。
样张设为 `public: false`，不会出现在首页、标签或归档中。

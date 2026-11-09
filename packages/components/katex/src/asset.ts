import { onBuild } from '@blog/context/runtime';

// 过滤掉多余的字体
onBuild(({ hooks }) => {
  hooks.processAssets.tap('katex:filter-fonts', (files) => (
    files.filter(({ path }) => !/(?:^|\/)KaTeX_[^/]+\.(?:ttf|woff)$/.test(path))
  ));
});

import { join } from 'path';
import { expect, describe, it } from '@blog/test-toolkit';
import { build } from 'esbuild';
import { Builder } from '../builder';
import { Bundler } from '../bundler';
import { BridgePlugin } from '../bundler/bridge';
import { Resolver } from '../plugins/resolver';

async function bundleCss(contents: string) {
  const builder = new Builder({ root: join(__dirname, '../..') });
  const bundler = new Bundler(builder);
  Resolver().apply(builder);
  builder.hooks.bundler.call(bundler);

  return build({
    stdin: {
      contents,
      loader: 'css',
      sourcefile: 'index.jss.css',
      resolveDir: builder.root,
    },
    bundle: true,
    write: false,
    logLevel: 'silent',
    plugins: [BridgePlugin(bundler)],
  });
}

describe('Resolver 插件', () => {
  it('CSS 中含小数坐标的 SVG data URL 保持内联，不检查文件后缀', async () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="6" height="3">'
      + '<path d="M0 0.6L1 3"/></svg>';
    const url = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    const result = await bundleCss(`.error { background-image: url("${url}"); }`);

    expect(result.outputFiles).length(1);
    expect(result.outputFiles![0].text).include(url);
  });

  it('外部 URL 不受本地文件后缀限制', async () => {
    const url = 'https://example.com/image.asset';
    const result = await bundleCss(`.image { background-image: url("${url}"); }`);

    expect(result.outputFiles).length(1);
    expect(result.outputFiles![0].text).include(url);
  });

  it('本地文件仍然检查不支持的后缀', async () => {
    let error: any;
    try {
      await bundleCss('.image { background-image: url("./README.md"); }');
    }
    catch (err) {
      error = err;
    }

    expect(error).not.undefined;
    expect(error.errors[0].text).include("未知的文件后缀：'.md'");
  });
});

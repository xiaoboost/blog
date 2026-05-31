import { expect, describe, it } from '@blog/test-toolkit';
import { normalizeOptions } from '../builder/options';

describe('normalizeOptions', () => {
  it('空对象时使用默认值', () => {
    const opt = normalizeOptions({});
    expect(opt.name).eq('Main');
    expect(opt.mode).eq('development');
    expect(opt.hmr).false;
    expect(opt.watch).false;
    expect(opt.write).false;
    expect(opt.publicPath).eq('/');
    expect(opt.terminalColor).true;
    expect(opt.logLevel).eq('Info');
    expect(opt.debug).false;
    expect(opt.typeCheck).true;
    expect(opt.cache).eq('.cache');
    expect(opt.plugins).deep.eq([]);
  });

  it('mode 为 production 时注入正确的环境变量', () => {
    const opt = normalizeOptions({ mode: 'production' });
    expect(opt.mode).eq('production');
    expect(opt.defined['process.env.NODE_ENV']).eq('"production"');
    expect(opt.defined['process.env.HMR']).eq('false');
  });

  it('mode 为 development 时注入正确的环境变量', () => {
    const opt = normalizeOptions({ mode: 'development' });
    expect(opt.defined['process.env.NODE_ENV']).eq('"development"');
  });

  it('hmr 为 true 时注入正确的环境变量', () => {
    const opt = normalizeOptions({ hmr: true });
    expect(opt.defined['process.env.HMR']).eq('true');
  });

  it('自定义 root 和 outDir', () => {
    const opt = normalizeOptions({ root: '/custom/root' });
    expect(opt.root).eq('/custom/root');
    expect(opt.outDir).match(/custom[/\\]root[/\\]dist/);
  });

  it('自定义 publicPath', () => {
    const opt = normalizeOptions({ publicPath: '/blog/' });
    expect(opt.publicPath).eq('/blog/');
  });

  it('用户自定义 defined 合并到默认值', () => {
    const opt = normalizeOptions({ defined: { CUSTOM: '"yes"' } });
    expect(opt.defined.CUSTOM).eq('"yes"');
    // 默认的环境变量仍然存在
    expect(opt.defined['process.env.NODE_ENV']).not.undefined;
    expect(opt.defined['process.env.HMR']).not.undefined;
  });

  it('默认环境变量优先于用户自定义 defined', () => {
    // 用户尝试覆盖 process.env.NODE_ENV 不会生效，因为默认值在展开之后赋值
    const opt = normalizeOptions({
      mode: 'production',
      defined: { 'process.env.NODE_ENV': '"custom"' },
    });
    expect(opt.defined['process.env.NODE_ENV']).eq('"production"');
  });

  it('自定义 entry', () => {
    const opt = normalizeOptions({ entry: '/custom/entry.ts' });
    expect(opt.entry).eq('/custom/entry.ts');
  });

  it('未指定 entry 时自动生成默认 entry 路径', () => {
    const opt = normalizeOptions({});
    expect(opt.entry).match(/builder[\\/]generator[\\/]src[\\/]index.ts$/);
  });
});

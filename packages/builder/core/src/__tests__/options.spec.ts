import { expect, describe, it } from '@blog/test-toolkit';
import { normalizeOptions } from '../builder/options';

describe('normalizeOptions', () => {
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
});

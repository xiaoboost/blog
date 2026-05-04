import { expect, describe, it } from '@blog/test-toolkit';
import { parsePath, isCssImport, createResolver } from '../utils/resolve';

describe('parsePath', () => {
  it('无 query 的路径', () => {
    const result = parsePath('/path/to/file.ts');
    expect(result.original).eq('/path/to/file.ts');
    expect(result.basic).eq('/path/to/file.ts');
    expect(result.rawQuery).undefined;
    expect(result.query).deep.eq({});
  });

  it('带单个 query 参数', () => {
    const result = parsePath('/path/to/file.ts?raw');
    expect(result.basic).eq('/path/to/file.ts');
    expect(result.rawQuery).eq('raw');
    expect(result.query).deep.eq({ raw: true });
  });

  it('带多个 query 参数', () => {
    const result = parsePath('/path/to/file.ts?a=1&b=hello');
    expect(result.basic).eq('/path/to/file.ts');
    expect(result.rawQuery).eq('a=1&b=hello');
    expect(result.query).deep.eq({ a: '1', b: 'hello' });
  });

  it('带空值 query 参数', () => {
    const result = parsePath('file?key');
    expect(result.query).deep.eq({ key: true });
  });

  it('多个 ? 时只取第一个作为分隔符', () => {
    // split('?') = ['/a', 'b', 'c']，rawQuery 拿到的是 'b'
    const result = parsePath('/a?b?c');
    expect(result.basic).eq('/a');
    expect(result.rawQuery).eq('b');
  });
});

describe('isCssImport', () => {
  it('import-rule 是 css 导入', () => {
    expect(isCssImport('import-rule')).true;
  });

  it('url-token 是 css 导入', () => {
    expect(isCssImport('url-token')).true;
  });

  it('其他 kind 不是 css 导入', () => {
    expect(isCssImport('import-statement')).false;
    expect(isCssImport('require-resolve')).false;
    expect(isCssImport('dynamic-import')).false;
  });

  it('undefined 不是 css 导入', () => {
    expect(isCssImport()).false;
  });
});

describe('createResolver', () => {
  it('URL 被标记为 external', () => {
    const resolve = createResolver({ root: '/' });
    const result = resolve('https://example.com/style.css');
    expect(result.external).true;
    expect(result.path).eq('https://example.com/style.css');
  });

  it('node 内置模块被标记为 external', () => {
    const resolve = createResolver({ root: '/' });
    const result = resolve('fs');
    expect(result.external).true;
    expect(result.path).eq('fs');
  });

  it('自定义 external 包列表', () => {
    const resolve = createResolver({ root: '/', external: ['react', 'vue'] });
    expect(resolve('react').external).true;
    expect(resolve('vue').external).true;
    // 不在列表中的普通 npm 包尝试解析会失败，这是预期行为
  });

  it('带 query 的 URL 保留 suffix', () => {
    const resolve = createResolver({ root: '/' });
    const result = resolve('https://example.com/font.woff?raw');
    expect(result.external).true;
    expect(result.suffix).eq('raw');
  });

  it('内置模块正常返回不抛异常', () => {
    const resolve = createResolver({ root: '/' });
    expect(() => resolve('path')).not.throw();
    expect(() => resolve('fs')).not.throw();
    expect(() => resolve('http')).not.throw();
  });
});

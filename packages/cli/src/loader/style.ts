import md5 from 'md5';
import Stylus from 'stylus';
import CleanCss from 'clean-css';

import { join } from 'path';
import { watch } from 'chokidar';

import { BaseLoader } from './base';
import { resolveRoot } from 'src/utils/path';
import { readfiles } from 'src/utils/file-system';
import { templatePath } from 'src/config/project';

/** 全局唯一 style 资源 */
let style: StyleLoader | null;
/** 全局 css 最小化处理器 */
const minify = new CleanCss();

export class StyleLoader extends BaseLoader {
  /** 类型 */
  type = 'style';

  static async Create() {
  if (style) {
    return style;
  }

  style = new StyleLoader();

  style.watch();
  style.output = [{ data: '', path: '' }];
  
  await style._transform();

  return style;
  }

  async transform() {
  const files = await readfiles(templatePath);
  const styles = files.filter((file) => /\.styl$/.test(file));
  const origin = styles.map((file) => `@import '${file}';`).join('\n');

  const stylusOutput = await (new Promise<string>((resolve) => {
    const style = Stylus(origin, {
    paths: [
      resolveRoot('src/template'),
      resolveRoot('node_modules'),
    ],
    });

    style.set('include css', true);

    style.render((err, css) => {
    if (err) {
      this.errors = [err];
    }
    
    resolve(css || '');
    });
  }));

  const data = process.env.NODE_ENV === 'production'
    ? minify.minify(stylusOutput).styles
    : stylusOutput;
  const path = process.env.NODE_ENV === 'production'
    ? `/css/style.${md5(data)}.css`
    : '/css/style.css';

  this.output = [{ data, path }];
  }

  watch() {
  // 开发模式监听
  if (process.env.NODE_ENV === 'development') {
    const watcher = watch(join(templatePath, '**/*.styl'), {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    });

    const update = () => this._transform();

    watcher
    .on('add', update)
    .on('unlink', update)
    .on('change', update);
    
    this.diskWatcher = [watcher];
  }
  }
}

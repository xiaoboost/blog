import * as LayoutModule from '@blog/template-layout';
import * as PostModule from '@blog/template-post';
import * as ViewModule from '@blog/template-view';

import * as KatexModule from '@blog/mdx-katex';
import * as CodeBlockModule from '@blog/mdx-code-block-normal';
import * as CodeBlockTsModule from '@blog/mdx-code-block-typescript';

import { concat } from '@xiao-ai/utils';
import { styleNames, scriptNames } from '@blog/config';
import { AssetData, getNameCreator, normalize } from '@blog/utils';

import md5 from 'md5';
import path from 'path';

const getStyleName = getNameCreator(styleNames);
const getScriptName = getNameCreator(scriptNames);

export interface BaseModule {
  ModuleName: string;
  assets: AssetData[];
}

export class Chunk {
  /** 块名称 */
  name: string;
  /** 包含的模块名称 */
  modules: string[] = [];
  /** 静态文件 */
  assets: AssetData[] = [];

  constructor(name: string, ...modules: BaseModule[]) {
    this.name = name;
    this.assets = concat(modules, (p) => p.assets);
    this.modules = modules.map((p) => p.ModuleName);
    this.mergeAssets();
  }

  get styles() {
    return this.assets.filter((name) => name.path.endsWith('.css')).map(({ path }) => path);
  }

  get scripts() {
    return this.assets.filter((name) => name.path.endsWith('.js')).map(({ path }) => path);
  }

  private mergeAssets() {
    const merge = (ext: string, codeJoin = '', preCode = '') => {
      const assets = this.assets.filter((name) => name.path.endsWith(ext));

      if (assets.length === 0) {
        return;
      }

      const bundledCode = assets.map((asset) => asset.contents.toString('utf-8')).join(codeJoin);
      const newCode = preCode + bundledCode;
      const getName = ext === '.js' ? getScriptName : getStyleName;
      const name = normalize(
        path.format({
          ext: ext,
          name: getName({
            name: this.name,
            hash: md5(newCode),
          }),
        }),
      );

      this.assets = this.assets
        .filter((asset) => !assets.find((p) => p === asset))
        .concat([{ path: name, contents: newCode }]);
    };

    merge('.css', '', '@charset "utf-8";');
    merge('.js', ';', '');
  }

  includes(name: string) {
    return this.modules.includes(name);
  }
}

export const layout = new Chunk('layout', LayoutModule, ViewModule);
export const post = new Chunk('post', PostModule, CodeBlockModule, CodeBlockTsModule);
export const katex = new Chunk('katex', KatexModule);

const chunks = [layout, post, katex];

export { ready } from '@blog/mdx-code-block-typescript';

/** 由模块获取资源引用 */
export function getAssetByName(name: string) {
  const chunk = chunks.find((item) => item.includes(name));
  return chunk
    ? {
        styles: chunk.styles,
        scripts: chunk.scripts,
      }
    : null;
}

export function build() {
  return concat(
    chunks.map((chunk) => chunk.assets),
    (arr) => arr,
  );
}

import * as path from 'path';
import * as fs from 'fs-extra';

import { BaseLoader } from './base';

import { site } from 'src/config/site';

/** 全局唯一 cname 资源 */
let cname: CnameLoader | null;

export class CnameLoader extends BaseLoader {
  /** 创建图片元素 */
  static async Create() {
  if (cname) {
    return cname;
  }

  cname = new CnameLoader();

  await cname._transform();

  return cname;
  }

  async transform() {
  this.output = [{
    data: site.cname,
    path: 'CNAME',
  }];
  }
}

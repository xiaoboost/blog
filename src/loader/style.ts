import less from 'less';

import { BaseItem } from './base';

import * as path from 'path';
import * as fs from 'fs-extra';

// 全局 style 文件
let style: StyleItem;

export class StyleItem extends BaseItem {
    static async Create() {
        if (style) {
            return style;
        }

        // ..
    }
}

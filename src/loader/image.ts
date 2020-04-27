import { BaseLoader } from './base';

import md5 from 'md5';

import * as path from 'path';
import * as fs from 'fs-extra';

export class ImageLoader extends BaseLoader {
    /** 类型 */
    type = 'image';

    /** 创建图片元素 */
    static async Create(from: string) {
        const exist = BaseLoader.FindSource(from);

        if (exist) {
            return exist;
        }

        const image = new ImageLoader();

        try {
            image.from = from;

            await image.read();
            await image._transform();
        }
        catch (e) {
            image.errors = [{
                message: '图片不存在',
            }];
        }

        return image;
    }

    async transform() {
        const from = this.from;
        const origin = this.origin;
        const extname = path.extname(from);
        const md5Str = md5(origin);
        const stat = fs.statSync(from);
        const create = new Date(stat.ctimeMs);
        const year = create.getFullYear();
        const month = String(create.getMonth() + 1).padStart(2, '0');

        this.output = [{
            data: this.origin,
            path: `/image/${year}/${month}/${md5Str}${extname}`,
        }];
    }
}

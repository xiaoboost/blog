import { BaseLoader } from './base';

import md5 from 'md5';

import * as path from 'path';
import * as fs from 'fs-extra';

export class ImageLoader extends BaseLoader {
    /** 创建图片元素 */
    static async Create(from: string) {
        const exist = BaseLoader.FindSource(from);

        if (exist) {
            return exist;
        }

        const image = new ImageLoader(from);

        try {
            image.origin = await fs.readFile(from);
            image.source = image.origin;
    
            await image.setBuildTo();
        }
        catch (e) {
            image.error = '图片不存在'
        }

        return image;
    }

    private async setBuildTo() {
        const extname = path.extname(this.from);
        const md5Str = md5(this.origin);
        const stat = await fs.stat(this.from);
        const year = new Date(stat.ctimeMs).getFullYear();

        this.buildTo = `/images/${year}/${md5Str}${extname}`;
    }
}

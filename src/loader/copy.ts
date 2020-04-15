import * as path from 'path';
import * as fs from 'fs-extra';

import { BaseLoader } from './base';
import { resolveRoot } from 'src/utils/path';
import { readfiles } from 'src/utils/file-system';
import { toMap } from 'src/utils/array';

/** 全局唯一 copy 资源 */
let copy: CopyLoader | null;

export class CopyLoader extends BaseLoader {
    /** 基础路径 */
    base: string[] = [];

    /** 创建图片元素 */
    static async Create(from: string[]) {
        if (copy) {
            return copy;
        }

        copy = new CopyLoader();

        copy.base = from;

        await copy._transform();

        return copy;
    }

    async transform() {
        // 旧数据
        const dataMap = toMap(this.source, ({ path }) => path, ({ data }) => data);
        // 数据列表清空
        this.source = [];

        await Promise.all(this.base.map(async (from) => {
            const files = await readfiles(resolveRoot(from));

            for (let i = 0; i < files.length; i++) {
                const input = files[i];
                const output = path.relative(from, input);
                const oldData = dataMap[output];

                if (oldData) {
                    this.source.push({
                        path: output,
                        data: oldData,
                    });
                }
                else {
                    this.source.push({
                        path: output,
                        data: await fs.readFile(input),
                    });
                }
            }
        }));
    }
}

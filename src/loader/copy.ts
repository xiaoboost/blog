import * as path from 'path';
import * as fs from 'fs-extra';

import { watch } from 'chokidar';

import { BaseLoader } from './base';

import { toMap } from 'src/utils/array';
import { readfiles } from 'src/utils/file-system';

/** 全局唯一 copy 资源 */
let copy: CopyLoader | null;

export class CopyLoader extends BaseLoader {
    /** 类型 */
    type = 'copy';
    /** 基础路径 */
    base: string[] = [];

    /** 创建图片元素 */
    static async Create(from: string[]) {
        if (copy) {
            return copy;
        }

        copy = new CopyLoader();

        copy.base = from;
        copy.watch();

        await copy._transform();

        return copy;
    }

    async transform() {
        // 旧数据
        const dataMap = toMap(this.output, ({ path }) => path, ({ data }) => data);
        // 数据列表清空
        this.output = [];

        await Promise.all(this.base.map(async (from) => {
            const files = await readfiles(from);

            for (let i = 0; i < files.length; i++) {
                const input = files[i];
                const output = path.relative(from, input);
                const oldData = dataMap[output];

                if (oldData) {
                    this.output.push({
                        path: output,
                        data: oldData,
                    });
                }
                else {
                    this.output.push({
                        path: output,
                        data: await fs.readFile(input),
                    });
                }
            }
        }));
    }

    watch() {
        if (process.env.NODE_ENV === 'development') {
            const watcher = watch(this.base, {
                ignored: /(^|[\/\\])\../,
                persistent: true
            });

            const update = () => this._transform();

            watcher
                .on('add', update)
                .on('unlink', update)
                .on('change', (path) => {
                    this.output = this.output.filter((data) => data.path !== path);
                    update();
                });
            
            this.diskWatcher = [watcher];
        }
    }
}

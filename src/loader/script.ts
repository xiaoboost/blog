import md5 from 'md5';

import { BaseLoader } from './base';
import { readfiles } from 'src/utils/file-system';
import { pluginPath } from 'src/config/project';

import { writeFile } from 'fs-extra';
import { minify as uglify } from 'uglify-js';
import { watch as watchFs } from 'chokidar';
import { basename, join, sep } from 'path';

import { build, watch, WatchEventType, RollupError } from 'src/utils/rollup';

/** 全局唯一 script 资源 */
let script: ScriptLoader | null;
/** 临时入口文件 */
const tempEntry = join(pluginPath, '_index.ts');

export class ScriptLoader extends BaseLoader {
    /** 类型 */
    type = 'script';

    static async Create() {
        if (script) {
            return script;
        }

        script = new ScriptLoader();
        script.output = [{ data: '', path: '' }];

        // 写入临时入口文件
        await script.beforeTransform();

        // 非开发模式需要手动启动转换
        if (process.env.NODE_ENV === 'development') {
            script.watch();
        }
        else {
            await script._transform();
        }

        return script;
    }

    async beforeTransform() {
        const files = await readfiles(pluginPath);
        const scripts = files.filter((file) => basename(file) === 'script.ts');
        const origin = scripts.map((file) => `import '${file.replace(/\\/g, `\\${sep}`)}';`).join('\n').trim();

        await writeFile(tempEntry, origin);
    }

    async transform() {
        await this.beforeTransform();

        let data = await build({
            input: tempEntry,
            output: {
                format: 'iife',
            },
        }).catch((err: RollupError) => {
            this.setRollupError(err);
        });

        if (!data) {
            return;
        }

        if (process.env.NODE_ENV === 'production') {
            data = uglify(data).code;
        }

        const path = process.env.NODE_ENV === 'production'
            ? `/js/script.${md5(data)}.js`
            : '/js/script.js';

        this.output = [{ data, path }];
    }

    setRollupError(err: RollupError) {
        this.errors = [{
            message: err.message,
            filename: err.loc?.file,
            location: {
                column: err.loc?.column || -1,
                line: err.loc?.line || -1,
            },
        }];
    }

    watch() {
        if (process.env.NODE_ENV === 'development') {
            const fsWatcher = watchFs(join(pluginPath, '**/script.ts'), {
                ignored: /(^|[\/\\])\../,
                persistent: true,
            });

            const update = () => this.beforeTransform();

            fsWatcher
                .on('add', update)
                .on('unlink', update);

            const rollupOpt = {
                input: tempEntry,
                output: {
                    format: 'iife' as const,
                },
            };
            
            const scriptWatcher = watch(rollupOpt, (result) => {
                if (result.type === WatchEventType.Start) {
                    this.transformStart();
                }
                else if (result.type === WatchEventType.Error) {
                    this.setRollupError(result.error);
                    this.transformEnd();
                }
                else {
                    this.output = [{
                        data: result.code,
                        path: '/js/script.js',
                    }];

                    this.transformEnd();
                }
            });
            
            this.diskWatcher = [fsWatcher, scriptWatcher];
        }
    }
}

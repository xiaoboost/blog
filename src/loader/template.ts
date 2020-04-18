import chalk from 'chalk';

import { BaseLoader } from './base';
import { resolveRoot } from 'src/utils/path';

import { watch } from 'rollup';

import replace from '@rollup/plugin-replace';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import nodeResolve from '@rollup/plugin-node-resolve';

export class TemplateLoader<T> extends BaseLoader {
    /** 模板本体 */
    template!: T;
    /** 不自动转换 */
    readonly autoTransform = false;
    /** 初始化转换开关 */
    private _switch?: () => void;

    static async Create<T>(entry: string) {
        const exist = BaseLoader.FindSource([entry]);

        if (exist) {
            return exist as TemplateLoader<T>;
        }

        const template = new TemplateLoader<T>();

        template.from = resolveRoot(entry);

        // 产品模式直接等于
        if (process.env.NODE_ENV === 'production') {
            template.template = require(template.from).Template;
        }
        else {
            template.watch();
            await (new Promise((resolve) => {
                template._switch = resolve;
            }));
        }

        return template;
    }

    watch() {
        if (!this.from) {
            return;
        }

        const watcher = watch({
            input: this.from,
            external: ['react'],
            plugins: [
                commonjs({
                    exclude: 'src/**',
                    include: 'node_modules/**',
                }),
                typescript({
                    tsconfig: resolveRoot('tsconfig.json'),
                    target: 'esnext',
                    module: 'esnext',
                }),
                replace({
                    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
                }),
                nodeResolve({
                    extensions: ['.tsx', '.ts', '.js', '.json'],
                    mainFields: ['index.tsx', 'index.ts'],
                }),
            ],
            watch: {
                skipWrite: true,
            },
        });

        watcher.on('event', async (event) => {
            if (event.code === 'START') {
                this.transformStart();
            }
            else if (event.code === 'BUNDLE_END') {
                const { result } = event;
                const { output } = await result.generate({
                    format: 'commonjs',
                });
                
                const Modules = (() => {
                    const exports = {};
                    eval(output[0].code);
                    return exports
                })() as any;

                this.template = Modules.Template;

                if (this._switch) {
                    this._switch();
                }

                this.transformEnd();
            }
            else if (event.code === 'ERROR') {
                const err = event.error;

                this.error = chalk.red(
                    `${err.message}\nin ${err.loc?.file}\nat ` +
                    `column ${err.loc?.column} line ${err.loc?.line}`
                );

                this.transformEnd();
            }
        });

        this.fsWatcher = watcher;
    }
}

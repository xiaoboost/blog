import md5 from 'md5';
import chalk from 'chalk';

import { BaseLoader } from './base';
import { resolveRoot } from 'src/utils/path';
import { readfiles } from 'src/utils/file-system';
import { pluginPath } from 'src/config/project';

import { watch } from 'chokidar';
import { rollup } from 'rollup';
import { writeFile } from 'fs-extra';
import { minify as uglify } from 'uglify-js';
import { basename, join, sep, relative } from 'path';

import replace from '@rollup/plugin-replace';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import nodeResolve from '@rollup/plugin-node-resolve';

/** 全局唯一 script 资源 */
let script: ScriptLoader | null;

export class ScriptLoader extends BaseLoader {
    static async Create() {
        if (script) {
            return script;
        }

        script = new ScriptLoader();
        
        await script._transform();

        return script;
    }

    async transform() {
        const tempEntry = join(pluginPath, '_index.ts');
        const files = await readfiles(pluginPath);
        const scripts = files.filter((file) => basename(file) === 'script.ts');
        const origin = scripts.map((file) => `import '${file.replace(/\\/g, `\\${sep}`)}';`).join('\n').trim();

        if (!origin) {
            return;
        }

        await writeFile(tempEntry, origin);

        const bundle = await rollup({
            input: tempEntry,
            plugins: [
                commonjs({
                    exclude: 'src/**',
                    include: 'node_modules/**',
                }),
                typescript({
                    tsconfig: resolveRoot('tsconfig.json'),
                    target: 'es5',
                    module: 'esnext',
                }),
                replace({
                    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
                }),
                nodeResolve({
                    extensions: ['.ts', '.js', '.json'],
                }),
            ],
        }).catch((err) => {
            this.error = chalk.red(
                `${err.message}\nin ${err.loc.file}\nat ` +
                `column ${err.loc.column} line ${err.loc.line}`
            );
        });

        if (!bundle) {
            return;
        }

        const { output } = await bundle.generate({
            format: 'iife',
        });

        let code = output[0].code;

        if (process.env.NODE_ENV === 'production') {
            code = uglify(code).code;
        }

        this.error = '';
        this.source = [{
            data: code,
            path: '',
        }];

        this.setBuildTo();
    }
    
    watch() {
        // 开发模式监听
        if (process.env.NODE_ENV === 'development') {
            const watcher = watch(join(pluginPath, '**/script.ts'), {
                ignored: /(^|[\/\\])\../,
                persistent: true
            });

            watcher
                .on('add', () => this._transform())
                .on('unlink', () => this._transform())
                .on('change', () => this._transform());
            
            this.fsWatcher = watcher;
        }
    }

    setBuildTo() {
        const source = this.source[0];

        if (process.env.NODE_ENV === 'production') {
            source.path = `/js/script.${md5(source.data)}.js`;
        }
        else {
            source.path = '/js/script.js';
        }
    }
}

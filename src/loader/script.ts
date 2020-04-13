import md5 from 'md5';

import { BaseLoader } from './base';
import { resolveRoot } from 'src/utils/path';
import { readfiles } from 'src/utils/file-system';
import { pluginPath } from 'src/config/project';

import { rollup } from 'rollup';
import { basename, join } from 'path';
import { writeFile, remove } from 'fs-extra';
import { minify as uglify } from 'uglify-js';

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

        script = new ScriptLoader('');
        
        if (process.env.NODE_ENV === 'production') {
            await script._transform();
            script.buildTo = `/js/script.${md5(script.source)}.css`;
        }
        else {
            script.watch();
            script.buildTo = '/js/script.css';
        }

        return script;
    }

    async transform() {
        const tempEntry = join(pluginPath, '_index.ts');
        const files = await readfiles(pluginPath);
        const scripts = files.filter((file) => basename(file) === 'script.ts');
        const origin = scripts.map((file) => `import '${file}';`).join('\n').trim();

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
        });

        const { output } = await bundle.generate({
            format: 'iife',
        });

        await remove(tempEntry);

        let code = output[0].code;

        if (process.env.NODE_ENV === 'production') {
            code = uglify(code).code;
        }

        this.source = code;
    }

    watch() {
        // ..
    }
}

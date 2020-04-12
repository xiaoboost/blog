import md5 from 'md5';
import less from 'less';

import { BaseLoader } from './base';
import { resolveRoot } from 'src/utils/path';
import { readfiles } from 'src/utils/file-system';

/** 全局唯一 style 资源 */
let style: StyleLoader | null;

export class StyleLoader extends BaseLoader {
    static async Create() {
        if (style) {
            return style;
        }

        style = new StyleLoader('');
        
        if (process.env.NODE_ENV === 'production') {
            await style.transform();
            style.setBuildTo();
        }
        else {
            style.watch();
            style.setBuildTo();
        }

        return style;
    }

    async transform() {
        const files = await readfiles(resolveRoot('src/template'));
        const styles = files.filter((file) => /\.less$/.test(file));
        const origin = styles.map((file) => `@import '${file}';`).join('\n');

        const result = await less.render(origin, { paths: [resolveRoot('src/template')] })
            .catch((e) => this.setError({
                id: this.id,
                message: e.message,
                position: e.filename,
            }));
        
        if (!result) {
            return;
        }

        this.source = result.css;
    }

    watch() {
        // ..
    }

    setBuildTo() {
        if (process.env.NODE_ENV === 'production') {
            this.buildTo = `/css/style.${md5(this.source)}.css`;
        }
        else {
            this.buildTo = '/css/style.css';
        }
    }
}

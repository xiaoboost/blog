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

        const files = await readfiles(resolveRoot('src/template'));
        const styles = files.filter((file) => /\.less$/.test(file));

        style.origin = styles.map((file) => `@import '${file}';`).join('\n');

        await style.transform();
        await style.setBuildTo();

        return style;
    }

    async transform() {
        return less.render(this.origin as string, {
            paths: [resolveRoot('src/template')],
        })
            .then(({ css }) => this.source = css)
            .catch((e) => this.setError({
                id: this.id,
                message: e.message,
                position: e.filename,
            }));
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

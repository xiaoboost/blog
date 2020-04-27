import { BaseLoader } from './base';
import { resolveRoot } from 'src/utils/path';
import { watch, WatchEventType } from 'src/utils/rollup';

export class TemplateLoader<T> extends BaseLoader {
    /** 类型 */
    type = 'template';
    /** 模板本体 */
    template: T = (() => '') as any;

    static async Create<T>(entry: string) {
        const exist = BaseLoader.FindSource(entry);

        if (exist) {
            return exist as TemplateLoader<T>;
        }

        const template = new TemplateLoader<T>();

        template.from = resolveRoot(entry);
        template.watch();

        // 产品模式直接等于
        if (process.env.NODE_ENV === 'production') {
            template.template = require(template.from).Template;
        }

        return template;
    }

    watch() {
        if (process.env.NODE_ENV === 'development') {
            const rollupOpt = {
                input: this.from,
                external: ['react'],
                output: {
                    format: 'commonjs' as const,
                },
            };
    
            const watcher = watch(rollupOpt, (result) => {
                if (result.type === WatchEventType.Start) {
                    this.transformStart();
                }
                else if (result.type === WatchEventType.Error) {
                    this.errors = [{
                        message: result.error.message,
                        filename: result.error.loc?.file,
                        location: {
                            column: result.error.loc?.column || -1,
                            line: result.error.loc?.line || -1,
                        },
                    }];

                    this.transformEnd();
                }
                else {
                    const Modules = (() => {
                        const exports = {};
                        eval(result.code);
                        return exports
                    })() as any;
    
                    this.template = Modules.Template;
                    this.transformEnd();
                }
            });

            this.diskWatcher = [watcher];
        }
    }
}

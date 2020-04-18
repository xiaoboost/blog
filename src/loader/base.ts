import chalk from 'chalk';

import * as path from 'path';
import * as fs from 'fs-extra';
import * as fms from 'src/utils/memory-fs';

import { buildOutput, devPort } from 'src/config/project';

import { isString } from 'src/utils/assert';
import { isEqual } from 'src/utils/object';
import { deleteVal, exclude } from 'src/utils/array';

/** 文件系统 */
const fileSystem = process.env.NODE_ENV === 'production' ? fs : fms;

/** 资源列表 */
export const sources: BaseLoader[] = [];

/** 全局资源编号 */
let id = 1;

interface WatchData {
    depId: number;
    lastVal: any[];
    notify(): any;
    compute(item: BaseLoader): any;
}

interface Watcher {
    close(): void;
}

export interface DepData {
    dep: BaseLoader;
    compute(item: BaseLoader): any;
}

interface FileData {
    path: string;
    data: Buffer | string;
}

/** 元素类 */
export class BaseLoader {
    /** 当前资源编号 */
    id = id++;
    /** 错误信息 */
    error = '';
    /** 是否正在编译 */
    transformCount = 0;
    /** 文件监听器 */
    fsWatcher?: Watcher;
    /** 默认自动转换 */
    readonly autoTransform: boolean = true;

    /** 元素源代码 */
    origin: FileData[] = [];
    /** 转换之后元素内容 */
    source: FileData[] = [];

    static FindSource(from: string[]) {
        const exist = sources.find(({ origin }) => {
            return from.every((_path, i) => _path === (origin[i] && origin[i].path));
        });

        if (!exist) {
            return null;
        }

        return exist;
    }

    constructor() {
        sources.push(this);

        // 不是产品模式，则需要监听
        if (process.env.NODE_ENV !== 'production') {
            this.watch();
        }
    }

    /** 作为被引用资源的数据 */
    private _observers: WatchData[] = [];
    /** 上一次编译时的引用数据 */
    private _lastDeps: DepData[] = [];
    /** 作为资源时引用的数据 */
    private _deps: DepData[] = [];

    /** 默认监听事件 */
    watch() {}
    /** 默认转换函数 */
    transform() {}

    /** 引用计数 */
    get quoteCount() {
        return this._observers.length;
    }

    /** 源文件路径 */
    get from() {
        if (this.origin.length > 0) {
            return this.origin[0].path;
        }
        else {
            return '';
        }
    }
    set from(val: string) {
        if (this.origin[0]) {
            this.origin[0].path = val;
        }
        else {
            this.origin = [{
                data: '',
                path: val,
            }];
        }
    }

    /** 输出路径 */
    get output() {
        if (this.source.length > 0) {
            return this.source[0].path;
        }
        else {
            return '';
        }
    }
    set output(val: string) {
        if (this.source[0]) {
            this.source[0].path = val;
        }
        else {
            this.source = [{
                data: '',
                path: val,
            }];
        }
    }

    /** 监听某个属性 */
    observe<T extends BaseLoader>(dep: T, compute: (item: T) => any) {
        this._deps.push({ dep, compute });
    }

    /** 取消某元素的引用 */
    unObserve(id: number) {
        this._observers = deleteVal(this._observers, ({ depId }) => depId === id);
    }

    /** 通知元素引用变更 */
    notify() {
        for (const ob of this._observers) {
            const last = ob.lastVal;
            const now = ob.compute(this);

            if (last !== now || !isEqual(last, now)) {
                ob.lastVal = now;
                ob.notify();
            }
        }
    }

    /** 内部真实的转换器 */
    protected async _transform() {
        if (!this.autoTransform) {
            return;
        }

        this.transformCount++;
        
        console.log('\x1Bc');
        console.log(chalk.yellow(' Compile...\n'));

        try {
            await this.transform();

            this.source.forEach((source) => {
                if (path.extname(source.path) === '.html') {
                    if (isString(source.data)) {
                        source.data = `<!DOCTYPE html>${source.data}`;
                    }
                    else {
                        source.data = Buffer.from(`<!DOCTYPE html>${source.data.toString()}`);
                    }
                }
            });
    
            await this.write();
        }
        catch (err) {
            this.error = err.message;
        }

        this.transformCount--;

        this.viewError();
        this.diffSources();
        this.notify();
    }

    /** 转换开始 */
    protected transformStart() {
        this.transformCount++;
        console.log('\x1Bc');
        console.log(chalk.yellow(' Compile...\n'));
    }
    /** 转换结束 */
    protected transformEnd() {
        this.transformCount--;
        this.viewError();
        this.diffSources();
        this.notify();
    }
    /** 错误显示 */
    protected viewError() {
        sources.forEach((item) => {
            if (item.transformCount < 0) {
                item.transformCount = 0;
            }
        });

        setTimeout(() => {
            const errors = sources.map(({ error }) => error).filter((err) => err.length > 0);
            const counts = sources.map((item) => item.transformCount);

            if (errors.length > 0) {
                console.log('\x1Bc');
                errors.forEach((err) => console.log(err + '\n'));
                return;
            }

            if (counts.every((count) => count === 0)) {
                console.log('\x1Bc');

                if (process.env.NODE_ENV === 'production') {
                    console.log(chalk.cyan('Build complete.\n'));
                }
                else {
                    console.log(chalk.blue('Complete.\n') + chalk.green(`Your application is already set at http://localhost:${devPort}/.\n`));
                }

                return;
            }
        }, 100);
    }

    /** 检测引用元素是否变更 */
    protected diffSources() {
        const inDeps = exclude(this._lastDeps, this._deps, ({ dep }) => dep.id);
        const inSource = exclude(this._deps, this._lastDeps, ({ dep }) => dep.id);

        // 解除不再引用的资源
        inSource.forEach(({ dep }) => dep.unObserve(this.id));
        // 绑定新的引用
        inDeps.forEach(({ dep, compute }) => dep._observers.push({
            compute,
            depId: this.id,
            lastVal: compute(this),
            notify: this._transform.bind(this),
        }));

        this._lastDeps = this._deps;
        this._deps = [];
    }

    /** 销毁资源 */
    destroy() {
        // 解除所有监听事件
        this._deps.forEach(({ dep }) => dep.unObserve(this.id));

        // 清空所有数据
        this._deps = [];
        this._lastDeps = [];
        this._observers = [];

        if (this.fsWatcher) {
            this.fsWatcher.close();
            this.fsWatcher = undefined;
        }

        // 从资源列表中删除
        const index = sources.findIndex(({ id }) => id === this.id);

        if (index > -1) {
            sources.splice(index, 1);
        }
    }

    /** 读取文件 */
    async read() {
        await Promise.all(this.origin.map(async (origin) => {
            origin.data = await fs.readFile(origin.path);
        }));
    }
    /** 此资源写入硬盘系统 */
    async write() {
        if (this.source.length === 0) {
            return;
        }

        // 引用计数为 0，不输出
        // if (process.env.NODE_ENV === 'development' && this.quoteCount === 0) {
        //     return;
        // }

        await Promise.all(this.source.map(async (source) => {
            const output = path.join(buildOutput, source.path);
    
            await fileSystem.mkdirp(path.dirname(output));
            await fileSystem.writeFile(output, source.data);
        }));
    }
}

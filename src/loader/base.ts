import * as path from 'path';
import * as fs from 'fs-extra';
import * as fms from '../utils/memory-fs';

import { buildOutput } from 'src/config/project';
import { deleteVal, exclude } from 'src/utils/array';

interface ErrorMessage {
    message: string;
    stacks: string[];
}

/** 文件系统 */
const fileSystem = process.env.NODE_ENV === 'development' ? fms : fs;

/** 资源列表 */
export const sources: BaseItem[] = [];

/** 错误信息 */
export const errors: ErrorMessage[] = [];

/** 全局资源编号 */
let id = 1;

interface WatchData {
    depId: number;
    lastVal: any[];
    keys: string[];
    notify(): any;
}

interface DepData {
    dep: BaseItem;
    keys: string[];
}

/** 元素类 */
export class BaseItem {
    /** 当前资源编号 */
    id = id++;
    /** 该元素在硬盘中的绝对路径 */
    from = '';
    /** 相对于根目录的相对路径 */
    buildTo = '';
    /** 错误信息 */
    errorMessage = ''; 

    /** 元素源代码 */
    origin = Buffer.from('');
    /** 转换之后元素内容 */
    source = Buffer.from('');

    /** 内部真实的转换器 */
    private _transform: () => Promise<void>;

    static FindSource(from: string) {
        const exist = sources.find((image) => image.from === from);

        if (!exist) {
            return null;
        }

        return exist;
    }

    constructor(path: string) {
        this.from = path;
        this._transform = async () => this.diffSources(await this.transform());

        sources.push(this);
    }

    /** 作为被引用资源的数据 */
    private _observers: WatchData[] = [];
    /** 作为资源时引用的数据 */
    private _sources: DepData[] = [];

    /** 引用计数 */
    get quoteCount() {
        return this._observers.length;
    }

    /** 监听某个属性 */
    observe<T extends BaseItem, K extends GetString<keyof T>>(this: T, dep: BaseItem, keys: K[]) {
        this._observers.push({
            depId: dep.id,
            lastVal: [],
            notify: this._transform.bind(this),
            keys,
        });
    }

    /** 取消某元素的引用 */
    unObserve(id: number) {
        this._observers = deleteVal(this._observers, ({ depId }) => depId === id);
    }

    /** 通知元素引用变更 */
    async notify() {
        for (const ob of this._observers) {
            const last = ob.lastVal;
            const now = ob.keys.map((key) => this[key]);

            if (last.some((val, i) => val !== now[i])) {
                ob.lastVal = now;
                await ob.notify();
            }
        }
    }

    /**
     * 数据变换函数
     *  - 派生类全部需要扩写这个函数，在此函数中需要返回引用的数据数组
     */
    transform(): DepData[] {
        this.source = this.origin;
        return [];
    }

    /** 检测引用元素是否变更 */
    private diffSources(deps: DepData[]) {
        const inDeps = exclude(this._sources, deps, ({ dep }) => dep.id);
        const inSource = exclude(deps, this._sources, ({ dep }) => dep.id);

        // 绑定新的引用
        inDeps.forEach(({ dep, keys }) => dep.observe(this, keys as any[]));
        // 解除不再引用的资源
        inSource.forEach(({ dep }) => dep.unObserve(this.id));

        this._sources = deps.slice();
    }

    /** 默认监听函数 */
    watch() {
        // ..
    }

    /** 此资源写入硬盘系统 */
    async write() {
        if (!this.buildTo) {
            this.errorMessage = '未设置输出路径';
            return;
        }

        // 非 html 文件，且引用计数为 0，则不输出
        if (path.extname(this.buildTo) !== '.html' && this.quoteCount === 0) {
            return;
        }

        const output = path.join(buildOutput, this.buildTo);

        await fileSystem.mkdirp(path.dirname(output));
        await fileSystem.writeFile(output, this.source);
    }
}

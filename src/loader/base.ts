import * as path from 'path';
import * as fs from 'fs-extra';
import * as fms from 'src/utils/memory-fs';

import { buildOutput } from 'src/config/project';

import { isEqual } from 'src/utils/object';
import { isArray } from 'src/utils/assert';
import { deleteVal, exclude } from 'src/utils/array';

/** 文件系统 */
const fileSystem = process.env.NODE_ENV === 'development' ? fms : fs;

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

interface DepData {
    dep: BaseLoader;
    compute(item: BaseLoader): any;
}

/** 元素类 */
export class BaseLoader {
    /** 当前资源编号 */
    id = id++;
    /** 该元素在硬盘中的绝对路径 */
    from = '';
    /** 相对于根目录的相对路径 */
    buildTo = '';
    /** 错误信息 */
    error = '';
    /** 是否正在编译 */
    transforming = false; 

    /** 元素源代码 */
    origin: Buffer | string = '';
    /** 转换之后元素内容 */
    source: Buffer | string = '';

    static FindSource(from: string) {
        const exist = sources.find((image) => image.from === from);

        if (!exist) {
            return null;
        }

        return exist;
    }

    constructor(path: string) {
        this.from = path;
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
    observe<T extends BaseLoader>(this: T, id: number, compute: (item: T) => any) {
        this._observers.push({
            compute,
            depId: id,
            lastVal: compute(this),
            notify: this._transform.bind(this),
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
            const now = ob.compute(this);

            if (!isEqual(last, now)) {
                ob.lastVal = now;
                await ob.notify();
            }
        }
    }

    /**
     * 外部数据变换函数
     *  - 派生类全部需要扩写这个函数，可能的话，此函数可以返回引用的数据数组
     */
    transform(): void | DepData[] | Promise<void> | Promise<DepData[]> {
        this.source = this.origin;
    }

    /** 内部真实的转换器 */
    protected async _transform() {
        this.transforming = true;

        const result = await this.transform();

        if (isArray(result)) {
            return this.diffSources(result);
        }

        this.transforming = false;
        this.notify();
    }

    /** 检测引用元素是否变更 */
    protected diffSources(deps: DepData[]) {
        const inDeps = exclude(this._sources, deps, ({ dep }) => dep.id);
        const inSource = exclude(deps, this._sources, ({ dep }) => dep.id);

        // 绑定新的引用
        inDeps.forEach(({ dep, compute }) => dep.observe(this.id, compute));
        // 解除不再引用的资源
        inSource.forEach(({ dep }) => dep.unObserve(this.id));

        this._sources = deps.slice();
    }

    /** 默认监听函数 */
    watch() {
        // ..
    }

    /** 销毁资源 */
    destroy() {
        // ..
    }

    /** 此资源写入硬盘系统 */
    async write() {
        if (!this.buildTo) {
            this.error = '未设置输出路径';
            return;
        }

        // 引用计数为 0，不输出
        if (this.quoteCount === 0) {
            return;
        }

        const output = path.join(buildOutput, this.buildTo);

        await fileSystem.mkdirp(path.dirname(output));
        await fileSystem.writeFile(output, this.source);
    }
}

import * as path from 'path';
import * as fs from 'fs-extra';
import * as fms from '../utils/memory-fs';

import { buildOutput } from 'src/config/project';

/** 文件系统 */
const fileSystem = process.env.NODE_ENV === 'development' ? fms : fs;

/** 资源列表 */
export const sources: BaseItem[] = [];

/** 元素类 */
export class BaseItem {
    /** 该元素在硬盘中的绝对路径 */
    from: string;
    /** 此元素依赖的元素 */
    depends: BaseItem[] = [];
    /** 依赖此元素的元素 */
    children: BaseItem[] = [];
    /** 该元素是否被删除 */
    isDelete = false;

    /** 元素源代码 */
    private _origin?: Buffer;
    /** 转换之后元素内容 */
    private _source?: Buffer;
    /** 相对于根目录的相对路径 */
    private _buildTo = '';

    constructor(path: string) {
        this.from = path;
        sources.push(this);
    }

    get origin() {
        if (this._origin) {
            return Promise.resolve(this._origin);
        }

        return fs.readFile(this.from).then((data) => {
            this._origin = data;
            return data;
        });
    }

    get source() {
        if (this._source) {
            return Promise.resolve(this._source);
        }

        return this.transform().then((data) => {
            this._source = data;
            return data;
        });
    }

    get buildTo() {
        if (this._buildTo.length > 0) {
            return Promise.resolve(this._buildTo);
        }

        return this.setBuildTo().then((data) => {
            this._buildTo = data;
            return data;
        });
    }
    
    /** 转换器 */
    protected async transform() {
        return this.origin;
    }

    /** 设置输出文件路径 */
    protected async setBuildTo() {
        return '';
    }

    /** 此资源被删除 */
    remove() {
        // 标记资源被删除
        this.isDelete = true;
        // 依赖资源移除当前元素
        this.depends.forEach((dep) => {
            dep.children = dep.children.filter((item) => item === this);
        });
        // 此元素离开资源树
        this.depends = [];
    }

    /** 设置引用 */
    setDep(item: BaseItem) {
        this.isDelete = false;
        this.depends.push(item);
        item.children.push(this);
    }

    /** 监听文件变更 */
    watch() {
        // ..
    }

    /** 此资源写入硬盘系统 */
    async write() {
        if (this.isDelete) {
            return;
        }

        const output = await this.buildTo;
        const source = await this.source;
        
        if (!output) {
            throw new Error('未设置输出路径')
        }

        await fileSystem.mkdirp(path.join(buildOutput, path.dirname(output)));
        await fileSystem.writeFile(path.join(buildOutput, output), source);
    }
}

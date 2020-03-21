import * as path from 'path';
import * as fs from 'fs-extra';
import * as fms from '../utils/memory-fs';

const fileSystem = process.env.NODE_ENV === 'development' ? fms : fs;

/** 元素类 */
export class BaseItem {
    /** 该元素在硬盘中的绝对路径 */
    from: string;
    /** 该元素相对于编译后的项目根目录的相对路径 */
    buildto = '';
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

    constructor(path: string) {
        this.from = path;
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
    
    /** 
     * 转换器
     *  - 默认不变更内容
     */
    private transform() {
        return this.origin;
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
        
        if (!this.buildto) {
            throw new Error('未设置输出路径')
        }
        
        await fileSystem.mkdir(path.dirname(this.buildto));
        await fileSystem.writeFile(this.buildto, await this.source);
    }
}

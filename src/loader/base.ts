import * as path from 'path';
import * as fs from 'fs-extra';
import * as fms from '../utils/memory-fs';

import { buildOutput } from 'src/config/project';

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

/** 元素类 */
export class BaseItem {
    /** 该元素在硬盘中的绝对路径 */
    from = '';
    /** 此元素依赖的元素 */
    parents: BaseItem[] = [];
    /** 依赖此元素的元素 */
    children: BaseItem[] = [];
    /** 该元素是否被删除 */
    isDelete = false;
    /** 错误信息 */
    errorMessage = '';

    /** 元素源代码 */
    origin = Buffer.from('');
    /** 转换之后元素内容 */
    source = Buffer.from('');
    /** 相对于根目录的相对路径 */
    buildTo = '';

    static FindSource(from: string) {
        const exist = sources.find((image) => image.from === from);

        if (!exist) {
            return null;
        }

        //  若是被删除的资源，则重新初始化
        if (exist.isDelete) {
            exist.isDelete = false;
            exist.parents = [];
            exist.children = [];
        }

        return exist;
    }

    constructor(path: string) {
        this.from = path;
        sources.push(this);
    }

    /** 初始化 */
    protected async init() {
        return;
    }

    /** 此资源被删除 */
    remove() {
        // 标记资源被删除
        this.isDelete = true;
        // 依赖资源移除当前元素
        this.parents.forEach((dep) => {
            dep.children = dep.children.filter((item) => item === this);
        });
        // 此元素离开资源树
        this.parents = [];
    }

    /** 设置引用 */
    setDep(item: BaseItem) {
        this.isDelete = false;
        this.parents.push(item);
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
        
        if (!this.buildTo) {
            this.errorMessage = '未设置输出路径';
            return;
        }

        const output = path.join(buildOutput, this.buildTo);

        await fileSystem.mkdirp(path.dirname(output));
        await fileSystem.writeFile(output, this.source);
    }
}

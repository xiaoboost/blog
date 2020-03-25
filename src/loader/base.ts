import * as path from 'path';
import * as fs from 'fs-extra';
import * as fms from '../utils/memory-fs';

import { buildOutput } from 'src/config/project';

interface ErrorMessage {
    message: string;
    position: string;
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
    depends: BaseItem[] = [];
    /** 依赖此元素的元素 */
    children: BaseItem[] = [];
    /** 该元素是否被删除 */
    isDelete = false;

    /** 元素源代码 */
    origin = Buffer.from('');
    /** 转换之后元素内容 */
    source = Buffer.from('');
    /** 相对于根目录的相对路径 */
    buildTo = '';

    constructor(path: string) {
        const last = sources.find(({ from }) => from === path);

        // 已经存在，则返回旧的数据
        if (last) {
            return last;
        }

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

    /** 生成错误提示 */
    errorHandler(msg: string) {
        
    }
}

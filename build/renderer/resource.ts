import * as path from 'path';
import * as fs from 'fs-extra';
import * as fms from '../utils/memory-fs';

export const resources: Resource[] = [];

export class Resource {
    /** 是否是静态资源 */
    isStatic = true;
    /** 是否已经被删除 */
    isDelete = false;
    /** 该元素在硬盘中的绝对路径 */
    from: string;
    /** 该元素相对于编译后的项目根目录的相对路径 */
    buildto = '';
    /** 元素源数据 */
    source?: Buffer;
    /** 此元素的引用 */
    quotes: Resource[] = [];
    /** 引用了此元素的元素 */
    cited: Resource[] = [];

    constructor(path: string) {
        this.from = path;
        resources.push(this);
    }

    read() {
        return fs.readFile(this.from).then((data) => this.source = data);
    }

    async write() {
        if (!this.buildto) {
            throw new Error('未设置输出路径')
        }

        if (!this.source) {
            throw new Error('没有读取文件源码')
        }

        if (process.env.NODE_ENV === 'development') {
            // TODO:
            await fms.mkdir(path.dirname(this.buildto));
            await fms.writeFile(this.buildto, this.source);
        }
        else {
            await fs.mkdirp(path.dirname(this.buildto));
            await fs.writeFile(this.buildto, this.source);
        }
    }

    /** 在引用元素的中去除当前元素 */
    removeQuotes() {
        this.quotes.forEach((item) => item.cited = item.cited.filter((v) => v !== this));
        this.quotes = [];
    }

    /** 在被引用元素中去除当前元素的引用 */
    removeCited() {
        this.cited.forEach((item) => item.cited = item.quotes.filter((v) => v !== this));
        this.cited = [];
    }
}

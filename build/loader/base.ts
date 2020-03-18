import * as fs from 'fs-extra';

/** 元素类 */
export class Item {
    /** 该元素在硬盘中的绝对路径 */
    from: string;
    /** 该元素相对于编译后的项目根目录的相对路径 */
    buildto = '';
    /** 元素源代码 */
    source!: Buffer;

    constructor(path: string) {
        this.from = path;
    }

    read() {
        return fs.readFile(this.from).then((data) => (this.source = data));
    }
}

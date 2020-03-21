import { join } from 'path';

/** 指向项目根目录的绝对路径 */
export const resolve = (...dir: (string | number)[]) => {
    return join(__dirname, '../../', ...dir.map(String));
};

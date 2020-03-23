import { join } from 'path';

/** 指向项目根目录的绝对路径 */
export const resolveRoot = (...dir: (string | number)[]) => {
    return join(__dirname, '../../', ...dir.map(String));
};

export const normalize = (base: string, path: string) => {
    if (/^http/.test(path)) {
        return null;
    }
    else if (/^\./.test(path)) {
        return join(base, path);
    }
    else if (/^[\/]/.test(path)) {
        return resolveRoot('src/template/assets', path);
    }
    else {
        return path;
    }
};

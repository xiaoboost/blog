import * as path from 'path';

/** 指向项目根目录的绝对路径 */
export const resolveRoot = (...dir: (string | number)[]) => {
    return path.join(__dirname, '../../', ...dir.map(String));
};

export const normalize = (base: string, input: string) => {
    if (/^http/.test(input)) {
        return null;
    }
    else if (/^\./.test(input)) {
        return path.join(base, input);
    }
    else if (/^[\/]/.test(input)) {
        return resolveRoot('src/template/assets', input);
    }
    else {
        return input;
    }
};

import * as path from 'path';

import { publicPath } from 'src/config/project';
import { isString, isObject } from './assert';

export const normalize = (href: string) => {
    let str = href.replace(/[\\\/]+/g, '/');

    if (str[0] !== '/') {
        str = '/' + str;
    }

    return str;
};

/** 网页模板路径相加 */
export const resolvePublic = (...paths: string[]) => {
    return normalize(path.join(publicPath, ...paths));
};

export type ClassObject = Record<string, boolean>;
export type ClassInput = string | undefined | ClassObject;

/** 解析对象 class */
export function stringifyClass(...opt: ClassInput[]) {
    /** 解析 class 对象 */
    function parseClassObject(classObject: ClassObject) {
        return Object.keys(classObject).filter((key) => classObject[key]);
    }

    const className: string[] = [];

    for (let i = 0; i < opt.length; i++) {
        const item = opt[i];

        if (isObject(item)) {
            className.push(...parseClassObject(item));
        }
        else if (isString(item)) {
            className.push(item.trim());
        }
    }

    return className.join(' ');
}
